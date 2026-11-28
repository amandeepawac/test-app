import { ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrivateDocumentStorage } from './private-document-storage.js';

describe('PrivateDocumentStorage', () => {
  const config = { get: vi.fn() };
  let settings: Record<string, string | undefined>;
  let storage: PrivateDocumentStorage;

  beforeEach(async () => {
    vi.resetAllMocks();
    settings = {
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
      CLOUDINARY_VERIFICATION_UPLOADS_ENABLED: 'true',
    };
    config.get.mockImplementation((name: string) => settings[name]);
    const module = await Test.createTestingModule({
      providers: [
        PrivateDocumentStorage,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    storage = module.get(PrivateDocumentStorage);
  });

  it('does not send evidence when uploads have not been explicitly enabled', async () => {
    settings.CLOUDINARY_VERIFICATION_UPLOADS_ENABLED = 'false';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(storage.upload({
      employerId: 'employer-id',
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      base64Data: 'dGVzdA==',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uploads raw evidence with authenticated delivery and an explicit file extension', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = init.body as FormData;
      expect(body.get('type')).toBe('authenticated');
      expect(body.get('access_mode')).toBeNull();
      const publicId = body.get('public_id');
      expect(publicId).toMatch(/\.pdf$/);
      return new Response(JSON.stringify({
        public_id: publicId,
        asset_id: 'asset-id',
        resource_type: 'raw',
        type: 'authenticated',
        bytes: 4,
      }));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(storage.upload({
      employerId: 'employer-id',
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      base64Data: 'dGVzdA==',
    })).resolves.toMatchObject({ assetId: 'asset-id', bytes: 4 });
    expect(fetchMock.mock.calls[0][0]).toContain('/raw/upload');
  });

  it('refuses to accept an upload whose delivery type was not authenticated', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/destroy')) {
        return new Response(JSON.stringify({ result: 'ok' }));
      }
      const body = init.body as FormData;
      return new Response(JSON.stringify({
        public_id: body.get('public_id'),
        asset_id: 'asset-id',
        resource_type: 'image',
        type: 'upload',
      }));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(storage.upload({
      employerId: 'employer-id',
      originalName: 'evidence.png',
      mimeType: 'image/png',
      base64Data: 'dGVzdA==',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('signs a 60-second download by asset ID without exposing the secret', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const result = storage.privateDownloadUrl('asset-id');
    const url = new URL(result.url);
    expect(url.origin).toBe('https://api.cloudinary.com');
    expect(url.pathname).toBe('/v1_1/test-cloud/asset/download');
    expect(url.searchParams.get('expires_at')).toBe('1700000060');
    expect(url.searchParams.get('asset_id')).toBe('asset-id');
    expect(url.searchParams.get('attachment')).toBe('true');
    expect(url.searchParams.get('signature')).toBe(
      createHash('sha1')
        .update('asset_id=asset-id&attachment=true&expires_at=1700000060&timestamp=1700000000test-secret')
        .digest('hex'),
    );
    expect(result.url).not.toContain('test-secret');
    expect(result.expiresAt).toBe('2023-11-14T22:14:20.000Z');
  });

  it('fails closed when private storage is not configured', async () => {
    settings = {};
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(storage.delete('private/document-key')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats an already missing private object as deleted', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: 'not found' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      storage.delete('private/document-key', 'application/pdf', 'authenticated'),
    ).resolves.toBeUndefined();
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect((request.body as URLSearchParams).get('type')).toBe('authenticated');
  });

  it('reports provider failures instead of claiming the object was deleted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })),
    );

    await expect(storage.delete('private/document-key')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
