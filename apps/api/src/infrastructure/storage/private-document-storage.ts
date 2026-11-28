import { createHash, randomUUID } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PrivateDocumentUpload = {
  publicId: string;
  assetId: string;
  bytes: number;
  mimeType: string;
};

@Injectable()
export class PrivateDocumentStorage {
  constructor(private readonly config: ConfigService) {}

  async upload(input: {
    employerId: string;
    originalName: string;
    mimeType: string;
    base64Data: string;
  }): Promise<PrivateDocumentUpload> {
    if (this.config.get<string>('CLOUDINARY_VERIFICATION_UPLOADS_ENABLED') !== 'true') {
      throw new ServiceUnavailableException(
        'Verification document uploads are disabled until private storage is validated.',
      );
    }
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Private document storage is not configured. Contact the platform administrator.',
      );
    }

    const bytes = Buffer.from(input.base64Data, 'base64');
    if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) {
      throw new ServiceUnavailableException('The document is empty or exceeds 5 MB.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const isPdf = input.mimeType === 'application/pdf';
    const publicId = `rozgarlocal/employer-verifications/${input.employerId}/${randomUUID()}${isPdf ? '.pdf' : ''}`;
    const signedParams = {
      public_id: publicId,
      timestamp: String(timestamp),
      type: 'authenticated',
    };
    const signature = createHash('sha1')
      .update(
        Object.entries(signedParams)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join('&') + apiSecret,
      )
      .digest('hex');

    const form = new FormData();
    form.set('api_key', apiKey);
    form.set('timestamp', String(timestamp));
    form.set('public_id', publicId);
    form.set('type', 'authenticated');
    form.set('signature', signature);
    form.set(
      'file',
      `data:${input.mimeType};base64,${input.base64Data}`,
    );

    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${isPdf ? 'raw' : 'image'}/upload`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error('Cloudinary upload outcome unknown; inspect this storage ID', publicId, error);
      throw new ServiceUnavailableException('The document upload could not be confirmed.');
    }
    if (!response.ok) {
      console.error('Cloudinary verification upload failed', response.status);
      throw new ServiceUnavailableException('The document could not be stored securely.');
    }

    let result: {
      public_id?: string;
      asset_id?: string;
      resource_type?: string;
      type?: string;
      bytes?: number;
    } | null;
    try {
      result = (await response.json()) as typeof result;
    } catch (error) {
      console.error('Cloudinary upload response invalid; inspect this storage ID', publicId, error);
      throw new ServiceUnavailableException('The document upload could not be confirmed.');
    }
    if (
      !result ||
      result.public_id !== publicId ||
      typeof result.asset_id !== 'string' ||
      !/^[a-zA-Z0-9_-]+$/.test(result.asset_id) ||
      result.type !== 'authenticated' ||
      result.resource_type !== (isPdf ? 'raw' : 'image')
    ) {
      console.error('Cloudinary upload not verified; inspect this storage ID', publicId);
      if (result?.public_id === publicId && result.resource_type === (isPdf ? 'raw' : 'image')) {
        try {
          await this.delete(publicId, input.mimeType, 'authenticated');
          await this.delete(publicId, input.mimeType, 'upload');
        } catch (error) {
          console.error('Cloudinary unverified upload cleanup failed', publicId, error);
        }
      }
      throw new ServiceUnavailableException(
        'The document storage response could not be verified. Contact the platform administrator.',
      );
    }
    return {
      publicId: result.public_id,
      assetId: result.asset_id,
      bytes: result.bytes ?? bytes.length,
      mimeType: input.mimeType,
    };
  }

  privateDownloadUrl(assetId: string): { url: string; expiresAt: string } {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Private document storage is not configured. Contact the platform administrator.',
      );
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) {
      throw new ServiceUnavailableException('The document storage identifier is invalid.');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 60;
    const params = {
      asset_id: assetId,
      attachment: 'true',
      expires_at: String(expiresAt),
      timestamp: String(timestamp),
    };
    const signature = createHash('sha1')
      .update(
        Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join('&') + apiSecret,
      )
      .digest('hex');
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/asset/download`,
    );
    url.search = new URLSearchParams({ ...params, api_key: apiKey, signature }).toString();
    return { url: url.toString(), expiresAt: new Date(expiresAt * 1000).toISOString() };
  }

  async delete(
    publicId: string,
    mimeType = 'image/jpeg',
    deliveryType: 'upload' | 'authenticated' = 'upload',
  ): Promise<void> {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Private document storage is not configured. Contact the platform administrator.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      public_id: publicId,
      timestamp: String(timestamp),
      invalidate: 'true',
      type: deliveryType,
    };
    const signature = createHash('sha1')
      .update(
        Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join('&') + apiSecret,
      )
      .digest('hex');
    const form = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature,
    });
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${mimeType === 'application/pdf' ? 'raw' : 'image'}/destroy`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error('Cloudinary verification deletion request failed', error);
      throw new ServiceUnavailableException('The document could not be deleted securely.');
    }

    if (!response.ok) {
      console.error('Cloudinary verification deletion failed', response.status);
      throw new ServiceUnavailableException('The document could not be deleted securely.');
    }

    let result: { result?: string };
    try {
      result = (await response.json()) as { result?: string };
    } catch (error) {
      console.error('Cloudinary verification deletion returned an invalid response', error);
      throw new ServiceUnavailableException('The document could not be deleted securely.');
    }
    if (result.result !== 'ok' && result.result !== 'not found') {
      console.error('Cloudinary verification deletion returned an unexpected result');
      throw new ServiceUnavailableException('The document could not be deleted securely.');
    }
  }
}
