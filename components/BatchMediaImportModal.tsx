import React, { useMemo, useState } from 'react';
import { RagSource, User } from '../types';
import { uploadBatchContextArchive, BatchImportResponse } from '../src/services/context/batchImport';

interface BatchMediaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (addedSources: RagSource[]) => void;
  user: User | null;
}

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-4 4m4-4l4 4M12 3v9m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l7-7z" clipRule="evenodd" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm.25-7a.75.75 0 011.5 0l-.35 5a.4.4 0 01-.8 0l-.35-5z" clipRule="evenodd" />
  </svg>
);

export const BatchMediaImportModal: React.FC<BatchMediaImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  user,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyUrl, setCompanyUrl] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchImportResponse | null>(null);

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return 'No file selected';
    const sizeInMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${selectedFile.name} (${sizeInMb} MB)`;
  }, [selectedFile]);

  const resetState = () => {
    setSelectedFile(null);
    setCompanyUrl('');
    setCollectionName('');
    setNotes('');
    setIsSubmitting(false);
    setSubmitError(null);
    setResults(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }
    const file = files[0];
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setSubmitError('Please select a .zip archive to import.');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setSubmitError('The selected file is not a .zip archive.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await uploadBatchContextArchive({
        archive: selectedFile,
        companyUrl: companyUrl || undefined,
        collectionName: collectionName || undefined,
        notes: notes || undefined,
        accessToken: user?.accessToken ?? undefined,
      });

      setResults(response);
      onImportComplete?.(response.sources);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Batch import failed. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={handleClose}>
      <div className="w-full max-w-4xl rounded-2xl border border-purple-700/60 bg-gray-900/95 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Batch Import Media Context</h3>
            <p className="text-sm text-gray-400">
              Upload a .zip containing images, videos, audio, or documents. We&apos;ll extract metadata, tags, and summaries for RAG context.
            </p>
          </div>
          <button className="text-gray-400 transition-colors hover:text-white text-xl" onClick={handleClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Archive (.zip)</label>
                <label className="flex items-center justify-center px-4 py-3 border border-dashed border-purple-600 rounded-xl text-sm text-gray-300 cursor-pointer hover:bg-gray-800/40 transition-colors">
                  <UploadIcon />
                  <span>{selectedFileLabel}</span>
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company / Brand URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={companyUrl}
                  onChange={(event) => setCompanyUrl(event.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Collection Name</label>
                <input
                  type="text"
                  placeholder="Spring 2025 ad library"
                  value={collectionName}
                  onChange={(event) => setCollectionName(event.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add optional notes for AI context (e.g. campaign goals, audience details)."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-200">What happens during import?</h4>
              <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
                <li>Files are extracted from the archive and categorized.</li>
                <li>Images are analyzed for logos, text, colors, and key objects.</li>
                <li>AI generates concise summaries, tags, and campaign-ready context.</li>
                <li>Metadata is stored securely and returned as RAG-ready sources.</li>
              </ul>
              <div className="text-xs text-gray-500">
                Tip: Include supporting documents (PDF, TXT, CSV) in the archive to enrich the knowledge base. Audio/video assets will be summarized based on metadata and available transcripts.
              </div>

              {results && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-200">
                    <span className="font-semibold text-green-300">Processed Files</span>
                    <span>{results.summary.processed}</span>
                  </div>
                  {results.summary.failed > 0 && (
                    <div className="flex items-center justify-between text-sm text-red-300">
                      <span>Failed</span>
                      <span>{results.summary.failed}</span>
                    </div>
                  )}
                  {results.summary.ignored > 0 && (
                    <div className="flex items-center justify-between text-sm text-yellow-300">
                      <span>Ignored</span>
                      <span>{results.summary.ignored}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Duration: {(results.summary.durationMs / 1000).toFixed(1)}s
                    {results.summary.collectionName ? ` · Collection: ${results.summary.collectionName}` : ''}
                  </div>
                </div>
              )}

              {results?.sources && results.sources.length > 0 && (
                <div className="max-h-52 overflow-y-auto bg-gray-900/70 border border-gray-800 rounded-lg p-3 space-y-2">
                  {results.sources.slice(0, 8).map((source) => (
                    <div key={source.id} className="flex items-start justify-between text-xs text-gray-300 bg-gray-800/60 border border-gray-700/60 rounded-md px-3 py-2">
                      <div className="mr-3">
                        <div className="font-semibold text-gray-100 truncate">{source.name}</div>
                        {source.metadata?.tags && source.metadata.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {source.metadata.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="rounded-full bg-purple-600/20 border border-purple-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-purple-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 border border-green-500/30 text-green-200">
                          <SuccessIcon />
                          <span className="ml-1">Ready</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  {results.sources.length > 8 && (
                    <div className="text-center text-[11px] text-gray-500">
                      +{results.sources.length - 8} more sources imported
                    </div>
                  )}
                </div>
              )}

              {results?.errors && results.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-red-900/20 border border-red-700/60 rounded-lg p-3 space-y-2">
                  {results.errors.map((error) => (
                    <div key={error.filename} className="flex items-center text-xs text-red-200">
                      <ErrorIcon />
                      <span className="ml-2 font-medium">{error.filename}</span>
                      <span className="ml-2 text-red-300/80">{error.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-700/60 bg-red-900/30 px-4 py-2 text-sm text-red-200">
              {submitError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-gray-800 px-6 py-4">
          <button
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </button>
          <button
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleImport}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchMediaImportModal;

