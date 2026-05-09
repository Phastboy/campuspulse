import type { Readable } from 'stream';

/**
 * Result returned after a successful file persistence.
 */
export interface UploadResult {
  /** The public-facing URL (Delivery) */
  url: string;
  /** The internal identifier used for management/deletion (Control)  */
  fileId: string;
}

/**
 * Specific arguments required to perform an upload operation.
 * This is a DTO, not a class dependency.
 */
export interface UploadParams {
  /** The logical folder or bucket prefix */
  destination: string;
  /** The unique, sanitized name for the file */
  fileName: string;
  /** The raw file content as a stream */
  fileData: Readable;
}

export interface DeleteResult {
  success: boolean;
  message?: string;
}

/**
 * The Port (Interface) that defines how the application interacts with storage.
 */
export abstract class StorageProvider {
  /**
   * Persists a stream to the infrastructure layer.
   * @param params - The specific data needed for this upload instance.
   */
  abstract upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Removes a file using the fileId returned during upload.
   * @param fileId - The unique management ID (Key or PublicID).
   */
  abstract delete(fileId: string): Promise<DeleteResult>;
}
