import React, { useState } from 'react';
import { parseBatchHashtagInput } from '../utils/batchHashtagParser';
import { createCustomSet } from '../utils/hashtagStorage';

interface BatchHashtagImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (summary: { personaCount: number; setCount: number }) => void;
}

export const BatchHashtagImportModal: React.FC<BatchHashtagImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetFeedback();
    setRawInput('');
    onClose();
  };

  const handleImport = () => {
    resetFeedback();

    if (!rawInput.trim()) {
      setError('Please paste the persona details and hashtag sets to import.');
      return;
    }

    setIsProcessing(true);

    try {
      const parsedPersonas = parseBatchHashtagInput(rawInput);
      let importedSetCount = 0;

      parsedPersonas.forEach((persona) => {
        persona.sets.forEach((set) => {
          const setName = `${persona.personaName} - ${set.label}`;
          const category = persona.personaName;
          createCustomSet(setName, category, set.hashtags);
          importedSetCount += 1;
        });
      });

      const personaCount = parsedPersonas.length;

      setSuccess(
        `Imported ${importedSetCount} hashtag ${importedSetCount === 1 ? 'set' : 'sets'} for ${personaCount} persona${
          personaCount === 1 ? '' : 's'
        }.`,
      );
      setRawInput('');
      onImportComplete?.({ personaCount, setCount: importedSetCount });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to parse the provided input.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-purple-700/60 bg-gray-900/95 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Batch Import Hashtag Sets</h3>
            <p className="text-sm text-gray-400">
              Paste persona descriptions with Primary, Secondary, and Niche sets. We&apos;ll generate custom collections instantly.
            </p>
          </div>
          <button
            className="text-gray-400 transition-colors hover:text-white text-xl"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="batch-import-input" className="block text-sm font-medium text-gray-300 mb-2">
              Persona text
            </label>
            <textarea
              id="batch-import-input"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder="The Creative Content Strategist&#10;&#10;Focuses on developing and executing content marketing plans that align with brand goals and audience needs.&#10;&#10;Primary Set&#10;#ContentStrategy&#10;..."
              rows={12}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-100 shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600/40"
            />
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400">
            <p className="font-semibold text-gray-300">Example format:</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-900/70 p-3 text-xs text-gray-300">
The Creative Content Strategist

Focuses on developing and executing content marketing plans that align with brand goals and audience needs.

Primary Set
#ContentStrategy
#ContentMarketing

Secondary Set
#ContentCreation
#MarketingTips

Niche Set
#ContentStrategyTips
#BrandStorytelling
            </pre>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700/60 bg-red-900/40 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-700/60 bg-green-900/40 px-4 py-2 text-sm text-green-200">
              {success}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-gray-800 px-6 py-4">
          <button
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800/70 hover:text-white"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleImport}
            disabled={isProcessing}
          >
            {isProcessing ? 'Importing...' : 'Import Hashtag Sets'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchHashtagImportModal;


