import { ServiceUnavailableException } from '@nestjs/common';
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

  afterEach(() => {
    vi.unstubAllGlobals();
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ result: 'not found' }), { status: 200 }),
      ),
    );

    await expect(storage.delete('private/document-key', 'application/pdf')).resolves.toBeUndefined();
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
