import * as Minio from 'minio';
import { Readable } from 'stream';

export interface StorageConfig {
  endPoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
}

export interface UploadResult {
  bucket: string;
  objectKey: string;
  etag: string;
  size: number;
}

export class ObjectStorageService {
  private client: Minio.Client;

  constructor(config: StorageConfig) {
    this.client = new Minio.Client({
      endPoint: config.endPoint,
      port: config.port || 9000,
      useSSL: config.useSSL || false,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
  }

  /**
   * Ensures an enterprise document bucket exists with encryption/versioning readiness.
   */
  public async ensureBucket(bucketName: string): Promise<void> {
    const exists = await this.client.bucketExists(bucketName);
    if (!exists) {
      await this.client.makeBucket(bucketName);
    }
  }

  /**
   * Uploads an enterprise document (Invoice PDF, Receipt, Bill of Lading, Contract).
   */
  public async uploadDocument(
    bucket: string,
    objectKey: string,
    stream: Readable | Buffer,
    size: number,
    metaData?: Record<string, string>
  ): Promise<UploadResult> {
    await this.ensureBucket(bucket);
    const result = await this.client.putObject(bucket, objectKey, stream, size, metaData);

    return {
      bucket,
      objectKey,
      etag: result.etag,
      size,
    };
  }

  /**
   * Generates a pre-signed URL for secure, temporary document download.
   */
  public async getPresignedDownloadUrl(
    bucket: string,
    objectKey: string,
    expirySeconds = 3600
  ): Promise<string> {
    return this.client.presignedGetObject(bucket, objectKey, expirySeconds);
  }
}
