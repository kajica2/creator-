import JSZip from 'jszip';
import { RagSource, RagSourceMetadata } from '../../../types';

export interface BatchImportUploadParams {
  archive: File;
  companyUrl?: string;
  collectionName?: string;
  notes?: string;
  accessToken?: string | null;
  signal?: AbortSignal;
}

export interface BatchImportSource extends RagSource {
  metadata: RagSourceMetadata;
}

export interface BatchImportResponse {
  sources: BatchImportSource[];
  summary: {
    processed: number;
    failed: number;
    ignored: number;
    durationMs: number;
    collectionName?: string;
  };
  errors?: Array<{
    filename: string;
    reason: string;
  }>;
}

const API_ENDPOINT = '/api/batch-media-import';

export const uploadBatchContextArchive = async ({
  archive,
  companyUrl,
  collectionName,
  notes,
  accessToken,
  signal,
}: BatchImportUploadParams): Promise<BatchImportResponse> => {
  if (!archive) {
    throw new Error('An archive file is required');
  }

  const formData = new FormData();
  formData.append('archive', archive);
  if (companyUrl) {
    formData.append('companyUrl', companyUrl);
  }
  if (collectionName) {
    formData.append('collectionName', collectionName);
  }
  if (notes) {
    formData.append('notes', notes);
  }

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    body: formData,
    headers,
    signal,
  });

  if (!response.ok) {
    let message = `Batch import failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.error ?? message;
    } catch {
      // Ignore JSON parsing error, keep default message
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as BatchImportResponse;
  return payload;
};

export default uploadBatchContextArchive;

export interface BatchMediaFilesUploadParams extends Omit<BatchImportUploadParams, 'archive'> {
  files: File[];
  onProgress?: (progress: number) => void;
}

export const uploadMediaFilesAsArchive = async ({
  files,
  companyUrl,
  collectionName,
  notes,
  accessToken,
  signal,
  onProgress,
}: BatchMediaFilesUploadParams): Promise<BatchImportResponse> => {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one media file');
  }

  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file);
  });

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      streamFiles: true,
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.round(metadata.percent)));
      }
    },
  );

  const archiveFile = new File([blob], `media-batch-${Date.now()}.zip`, { type: 'application/zip' });
  return uploadBatchContextArchive({
    archive: archiveFile,
    companyUrl,
    collectionName,
    notes,
    accessToken,
    signal,
  });
};

