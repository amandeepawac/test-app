import { createHash, randomUUID } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PrivateDocumentUpload = {
  publicId: string;
  secureUrl: string | null;
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
    const publicId = `rozgarlocal/employer-verifications/${input.employerId}/${randomUUID()}`;
    const signedParams = {
      access_mode: 'authenticated',
      folder: `rozgarlocal/employer-verifications/${input.employerId}`,
      public_id: publicId,
      timestamp: String(timestamp),
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
    form.set('folder', signedParams.folder);
    form.set('access_mode', 'authenticated');
    form.set('signature', signature);
    form.set(
      'file',
      `data:${input.mimeType};base64,${input.base64Data}`,
    );

    const isPdf = input.mimeType === 'application/pdf';
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${isPdf ? 'raw' : 'image'}/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: form });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Cloudinary verification upload failed', response.status, detail);
      throw new ServiceUnavailableException('The document could not be stored securely.');
    }

    const result = (await response.json()) as {
      public_id?: string;
      secure_url?: string;
      bytes?: number;
    };
    if (!result.public_id) {
      throw new ServiceUnavailableException('The document storage response was invalid.');
    }
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url ?? null,
      bytes: result.bytes ?? bytes.length,
      mimeType: input.mimeType,
    };
  }

  async delete(publicId: string, mimeType = 'image/jpeg'): Promise<void> {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const params = { public_id: publicId, timestamp: String(timestamp), invalidate: 'true' };
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
    await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${mimeType === 'application/pdf' ? 'raw' : 'image'}/destroy`,
      { method: 'POST', body: form },
    ).catch((error) => console.error('Cloudinary verification deletion failed', error));
  }
}
