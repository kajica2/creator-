import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import {
  fetchUserMediaAssets,
  MediaAssetRecord,
  MediaAssetCategory,
  setMediaAssetContexts,
  updateMediaAsset,
} from '../supabase/utils';
import { uploadMediaFilesAsArchive } from '../src/services/context/batchImport';
import { mediaLibraryTemplates } from '../data/hashtags';

const contextOptions = [
  { id: 'music-app', label: 'Music Apps' },
  { id: 'video-app', label: 'Video Apps' },
  { id: 'real-time-app', label: 'Real-Time Apps' },
  { id: 'viral-video', label: 'Viral Video Apps' },
];

const categoryLabels: Record<MediaAssetCategory, string> = {
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  document: 'Documents',
  other: 'Other',
};

const allowedMimePrefixes = ['image/', 'video/', 'audio/'];

const formatFileSize = (value?: number | null) => {
  if (!value || value <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** exponent;
  return `${scaled.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const buildTagList = (tags: string[] | null | undefined) => {
  if (!tags || tags.length === 0) {
    return ['add hashtags'];
  }
  return tags;
};

type MediaFilter = 'all' | 'favorites' | MediaAssetCategory;

interface MediaLibraryProps {
  user: User | null;
  onOpenBatchImport?: () => void;
}

interface UploadStatus {
  message: string;
  tone: 'success' | 'error';
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ user, onOpenBatchImport }) => {
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [companyUrl, setCompanyUrl] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [notes, setNotes] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [templateInFlight, setTemplateInFlight] = useState<string | null>(null);

  const canUpload = queuedFiles.length > 0 && user;

  const loadAssets = useCallback(async () => {
    if (!user) {
      setAssets([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserMediaAssets(user.id);
      setAssets(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load media assets.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const handleFilesAdded = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const accepted = incoming.filter((file) => allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix)));
    if (accepted.length === 0) {
      setStatus({
        tone: 'error',
        message: 'Only image, video, or audio files are supported for batch upload.',
      });
      return;
    }

    setQueuedFiles((previous) => {
      const existingNames = new Set(previous.map((file) => `${file.name}-${file.size}`));
      const deduped = accepted.filter((file) => !existingNames.has(`${file.name}-${file.size}`));
      return [...previous, ...deduped];
    });
    setStatus(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    handleFilesAdded(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      handleFilesAdded(event.dataTransfer.files);
    }
  };

  const clearQueue = () => {
    setQueuedFiles([]);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!user) {
      setStatus({ tone: 'error', message: 'Sign in to upload media.' });
      return;
    }
    if (queuedFiles.length === 0) {
      setStatus({ tone: 'error', message: 'Add media files to upload.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatus(null);

    try {
      await uploadMediaFilesAsArchive({
        files: queuedFiles,
        companyUrl: companyUrl || undefined,
        collectionName: collectionName || undefined,
        notes: notes || undefined,
        accessToken: user.accessToken,
        onProgress: (progress) => setUploadProgress(progress),
      });

      setStatus({
        tone: 'success',
        message: `Uploaded ${queuedFiles.length} ${queuedFiles.length === 1 ? 'asset' : 'assets'} successfully.`,
      });
      clearQueue();
      await loadAssets();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Media upload failed. Please try again.';
      setStatus({ tone: 'error', message });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1500);
    }
  };

  const handleToggleFavorite = async (asset: MediaAssetRecord) => {
    try {
      const updated = await updateMediaAsset(asset.id, { isFavorite: !(asset.is_favorite ?? false) });
      if (updated) {
        setAssets((previous) => previous.map((record) => (record.id === asset.id ? updated : record)));
      }
    } catch (favoriteError) {
      const message =
        favoriteError instanceof Error ? favoriteError.message : 'Unable to update favorite status.';
      setStatus({ tone: 'error', message });
    }
  };

  const handleSaveMetadata = async (
    asset: MediaAssetRecord,
    updates: { collectionName?: string | null; notes?: string | null },
  ) => {
    try {
      const updated = await updateMediaAsset(asset.id, updates);
      if (updated) {
        setAssets((previous) => previous.map((record) => (record.id === asset.id ? updated : record)));
        setStatus({ tone: 'success', message: 'Media details updated.' });
      }
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to save details.';
      setStatus({ tone: 'error', message });
    }
  };

  const handleContextChange = async (asset: MediaAssetRecord, contextId: string, enabled: boolean) => {
    const existingContexts = new Set(
      (asset.media_asset_context_links ?? []).map((link) => link.context_type),
    );

    if (enabled) {
      existingContexts.add(contextId);
    } else {
      existingContexts.delete(contextId);
    }

    try {
      await setMediaAssetContexts(asset.id, Array.from(existingContexts));
      await loadAssets();
      setStatus({ tone: 'success', message: 'Context links updated.' });
    } catch (contextError) {
      const message = contextError instanceof Error ? contextError.message : 'Failed to update contexts.';
      setStatus({ tone: 'error', message });
    }
  };

  const handleApplyTemplate = async (asset: MediaAssetRecord, templateId: string) => {
    const template = mediaLibraryTemplates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    const mergedTags = Array.from(
      new Set([
        ...(asset.tags ?? []),
        ...template.primary,
        ...template.secondary,
        ...template.niche,
      ]),
    );

    const existingTemplates = (asset.metadata?.appliedTemplates as Record<string, any> | undefined) ?? {};
    const metadata = {
      ...(asset.metadata ?? {}),
      appliedTemplates: {
        ...existingTemplates,
        [template.id]: {
          title: template.title,
          appliedAt: new Date().toISOString(),
        },
      },
    };

    setTemplateInFlight(`${asset.id}:${template.id}`);
    try {
      const updated = await updateMediaAsset(asset.id, { tags: mergedTags, metadata });
      if (updated) {
        setAssets((previous) => previous.map((record) => (record.id === asset.id ? updated : record)));
        setStatus({ tone: 'success', message: `${template.title} hashtags applied.` });
      }
    } catch (templateError) {
      const message =
        templateError instanceof Error ? templateError.message : 'Failed to apply hashtag template.';
      setStatus({ tone: 'error', message });
    } finally {
      setTemplateInFlight(null);
    }
  };

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filter === 'favorites' && !(asset.is_favorite ?? false)) {
        return false;
      }
      if (filter !== 'all' && filter !== 'favorites' && asset.asset_category !== filter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const searchFields = [
        asset.original_filename,
        asset.collection_name ?? '',
        asset.summary ?? '',
        ...(asset.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return searchFields.includes(normalizedSearch);
    });
  }, [assets, filter, searchTerm]);

  const categoryCounts = useMemo(() => {
    return assets.reduce(
      (acc, asset) => {
        const key = asset.asset_category ?? 'other';
        acc[key] = (acc[key] ?? 0) + 1;
        if (asset.is_favorite) {
          acc.favorites = (acc.favorites ?? 0) + 1;
        }
        return acc;
      },
      { favorites: 0 } as Record<string, number>,
    );
  }, [assets]);

  const filterOptions: { id: MediaFilter; label: string }[] = [
    { id: 'all', label: `All Assets (${assets.length})` },
    { id: 'favorites', label: `Favorites (${categoryCounts.favorites ?? 0})` },
    { id: 'image', label: `Images (${categoryCounts.image ?? 0})` },
    { id: 'video', label: `Videos (${categoryCounts.video ?? 0})` },
    { id: 'audio', label: `Audio (${categoryCounts.audio ?? 0})` },
    { id: 'document', label: `Documents (${categoryCounts.document ?? 0})` },
    { id: 'other', label: `Other (${categoryCounts.other ?? 0})` },
  ];

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-10 text-center text-gray-300 shadow-lg shadow-purple-900/10">
        <h2 className="text-2xl font-semibold text-white">Sign in to access your media library</h2>
        <p className="mt-2 text-sm text-gray-400">
          Log in with Supabase authentication to upload, tag, and organise your campaign assets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-lg shadow-purple-900/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Media Library</h2>
            <p className="mt-1 text-sm text-gray-400">
              Keep every clip, still, and stem in one place. Upload batches, tag them with contexts, and
              route them into campaigns in seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenBatchImport}
              className="inline-flex items-center rounded-lg border border-blue-500/60 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/30 hover:text-white"
            >
              Legacy Zip Import
            </button>
            <button
              onClick={() => void loadAssets()}
              className="inline-flex items-center rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800"
            >
              Refresh Library
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filterOptions.slice(1).map((option) => (
            <div key={option.id} className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {option.label.split('(')[0]}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {option.label.match(/\((\d+)\)/)?.[1] ?? '0'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-lg shadow-purple-900/10">
        <h3 className="text-xl font-semibold text-white">Batch Upload</h3>
        <p className="mt-1 text-sm text-gray-400">
          Drop in images, videos, or stems. We’ll store the originals, keep metadata, and auto-sync hashtags.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                isDragging ? 'border-purple-400 bg-purple-900/20' : 'border-gray-700 bg-gray-900/60 hover:border-purple-400'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-purple-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 15a4 4 0 004 4h10a4 4 0 004-4M7 10l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
              <span className="mt-4 text-sm font-semibold text-white">
                {isDragging ? 'Release to add files' : 'Drag & drop media files'}
              </span>
              <span className="mt-1 text-xs text-gray-400">
                Supports .jpg, .png, .mp4, .mov, .webm, .mp3, .wav, and more
              </span>
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <span className="mt-4 inline-flex items-center rounded-full border border-purple-400/50 bg-purple-500/10 px-4 py-1 text-xs font-semibold text-purple-200">
                {queuedFiles.length ? `${queuedFiles.length} file(s) ready` : 'Click to browse files'}
              </span>
            </label>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-4 lg:col-span-2">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Brand / Company URL</label>
              <input
                value={companyUrl}
                onChange={(event) => setCompanyUrl(event.target.value)}
                placeholder="https://brand.co/"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Collection</label>
              <input
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="Spring campaign rollout"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Audience, tone, featured riders..."
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-purple-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={clearQueue}
                disabled={queuedFiles.length === 0 || isUploading}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={!canUpload || isUploading}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-400 hover:to-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Batch'}
              </button>
            </div>
            {isUploading && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Uploading</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ inlineSize: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {status && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              status.tone === 'success'
                ? 'border-green-500/40 bg-green-500/10 text-green-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {status.message}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-lg shadow-purple-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === option.id
                    ? 'bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/60'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700/80 hover:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 lg:max-w-xs">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search filenames, collections, or tags"
              className="w-full rounded-full border border-gray-700 bg-gray-900 py-2 pl-4 pr-10 text-sm text-gray-200 outline-none transition focus:border-purple-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1016.65 2a7.5 7.5 0 000 14.65z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900/60 py-20 text-gray-400">
            Loading media assets...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900/60 py-16 text-center text-sm text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16"
              />
            </svg>
            <p className="mt-3 font-medium text-gray-300">No media found for this filter.</p>
            <p className="mt-1 text-xs text-gray-500">
              Try switching categories or uploading new assets above.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => {
              const contexts = new Set(
                (asset.media_asset_context_links ?? []).map((link) => link.context_type),
              );

              return (
                <article
                  key={asset.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900/70 p-4 shadow-sm shadow-black/20"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{asset.original_filename}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-800 px-2 py-0.5 capitalize text-gray-300">
                          {categoryLabels[asset.asset_category ?? 'other']}
                        </span>
                        {asset.mime_type && (
                          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-500">
                            {asset.mime_type}
                          </span>
                        )}
                        <span>{formatFileSize(asset.size_bytes)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleToggleFavorite(asset)}
                      className={`rounded-full p-2 transition ${
                        asset.is_favorite
                          ? 'text-yellow-300 hover:bg-yellow-500/10'
                          : 'text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill={asset.is_favorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={asset.is_favorite ? 0 : 1.6}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.194 3.674a1 1 0 00.95.69h3.862c.969 0 1.371 1.24.588 1.81l-3.126 2.269a1 1 0 00-.364 1.118l1.194 3.674c.3.922-.755 1.688-1.538 1.118l-3.126-2.269a1 1 0 00-1.176 0l-3.126 2.269c-.783.57-1.838-.196-1.538-1.118l1.194-3.674a1 1 0 00-.364-1.118L2.457 9.101c-.783-.57-.38-1.81.588-1.81h3.862a1 1 0 00.95-.69l1.192-3.674z" />
                      </svg>
                    </button>
                  </header>

                  {asset.source_url && asset.asset_category === 'image' && (
                    <img
                      src={asset.source_url}
                      alt={asset.original_filename}
                      className="max-h-48 w-full rounded-lg object-cover object-center"
                      loading="lazy"
                    />
                  )}

                  {asset.source_url && asset.asset_category === 'video' && (
                    <video
                      src={asset.source_url}
                      controls
                      className="max-h-48 w-full rounded-lg bg-black"
                    />
                  )}

                  {asset.source_url && asset.asset_category === 'audio' && (
                    <audio controls className="w-full">
                      <source src={asset.source_url} type={asset.mime_type ?? 'audio/mpeg'} />
                      Your browser does not support the audio element.
                    </audio>
                  )}

                  <p className="text-sm text-gray-300">{asset.summary ?? 'No summary available yet.'}</p>

                  <div className="flex flex-wrap gap-2">
                    {buildTagList(asset.tags).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-purple-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase text-gray-500">Collection</label>
                      <input
                        defaultValue={asset.collection_name ?? ''}
                        onBlur={(event) =>
                          event.target.value !== (asset.collection_name ?? '') &&
                          handleSaveMetadata(asset, { collectionName: event.target.value || null })
                        }
                        placeholder="Add collection"
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-gray-500">Context</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {contextOptions.map((option) => {
                          const selected = contexts.has(option.id);
                          return (
                            <button
                              key={option.id}
                              onClick={() => void handleContextChange(asset, option.id, !selected)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                selected
                                  ? 'bg-pink-500/20 text-pink-200 ring-1 ring-pink-400/60'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700/80 hover:text-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-gray-500">Skate Templates</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {mediaLibraryTemplates.map((template) => {
                        const key = `${asset.id}:${template.id}`;
                        const isLoadingTemplate = templateInFlight === key;
                        const title = `${template.description}\nPrimary: ${template.primary.join(', ')}\nSecondary: ${template.secondary.join(', ')}\nNiche: ${template.niche.join(', ')}`;

                        return (
                          <button
                            key={key}
                            title={title}
                            onClick={() => void handleApplyTemplate(asset, template.id)}
                            disabled={isLoadingTemplate}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isLoadingTemplate
                                ? 'bg-purple-500/20 text-purple-200 opacity-60'
                                : 'bg-gray-800 text-gray-300 hover:bg-purple-500/20 hover:text-purple-100'
                            }`}
                          >
                            {isLoadingTemplate ? 'Applying…' : template.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-gray-500">Notes</label>
                    <textarea
                      defaultValue={asset.notes ?? ''}
                      onBlur={(event) =>
                        event.target.value !== (asset.notes ?? '') &&
                        handleSaveMetadata(asset, { notes: event.target.value || null })
                      }
                      rows={2}
                      placeholder="Add spot-specific notes"
                      className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-purple-500"
                    />
                  </div>

                  <footer className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <span>Uploaded </span>
                      <span className="font-medium text-gray-300">{formatDate(asset.created_at)}</span>
                    </div>
                    {asset.source_url && (
                      <a
                        href={asset.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-purple-500 hover:text-purple-300"
                      >
                        View Original
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M14 3h7m0 0v7m0-7L10 14"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M5 5v14h14"
                          />
                        </svg>
                      </a>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MediaLibrary;

