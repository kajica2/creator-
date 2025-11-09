import React, { useState, useEffect } from 'react';
import { SphereData } from '../types';

interface SphereModalProps {
  data: SphereData | null;
  onClose: () => void;
}

const SphereModal: React.FC<SphereModalProps> = ({ data, onClose }) => {
  const [journalText, setJournalText] = useState('');

  // Effect to load and save journal entries from localStorage
  useEffect(() => {
    if (data) {
      // Load existing journal entry when modal opens
      const savedJournal = localStorage.getItem(`kosmos_journal_${data.id}`);
      setJournalText(savedJournal || '');

      // Cleanup function to save the journal entry when the modal closes
      return () => {
        localStorage.setItem(`kosmos_journal_${data.id}`, journalText);
      };
    }
  }, [data, journalText]); // Rerun effect if data changes, save current text on close

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`relative m-4 p-6 md:p-8 max-w-lg w-full rounded-2xl shadow-2xl ${data.shadowColor} ${data.color} bg-opacity-20 border border-white/20 text-white flex flex-col gap-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">{data.name}</h2>
          <p className="text-base md:text-lg leading-relaxed">{data.details}</p>
        </div>
        
        {data.planetaryData && (
          <div className="border-t border-white/20 pt-4">
            <h3 className="text-xl font-serif font-bold mb-2">Planetary Data</h3>
            <div className="font-mono text-sm bg-black/30 p-4 rounded-md">
              <ul>
                {Object.entries(data.planetaryData).map(([key, value]) => (
                   <li key={key} className="flex justify-between">
                     <span>{key}:</span>
                     <span>{value}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-white/20 pt-4">
          <h3 className="text-xl font-serif font-bold mb-2">My Journal</h3>
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Record your reflections here..."
            className="w-full h-32 p-3 bg-black/40 rounded-md border border-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none transition-colors text-base"
            aria-label={`Journal for ${data.name}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SphereModal;
