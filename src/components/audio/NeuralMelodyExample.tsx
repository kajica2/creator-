import React, { useState } from 'react';
import NeuralMelodyComponent from './NeuralMelodyComponent';
import { NoteSequence } from './types';

/**
 * Example component showing how to integrate the Neural Melody Player
 * into the existing application. This can be used as a reference or
 * directly imported into other parts of the app.
 */
const NeuralMelodyExample: React.FC = () => {
  const [generatedSequences, setGeneratedSequences] = useState<NoteSequence[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const handleSequenceGenerated = (sequence: NoteSequence) => {
    setGeneratedSequences(prev => [...prev, sequence]);
    console.log('New AI-generated melody:', sequence);

    // You could save this to localStorage, Supabase, or send to analytics
    // Example: Save to content storage
    // contentStorage.addContent({
    //   type: 'neural-melody',
    //   sequence,
    //   timestamp: Date.now()
    // });
  };

  const handleError = (error: Error) => {
    console.error('Neural Melody Error:', error);
    // You could show a toast notification or error dialog here
  };

  const downloadSequenceAsMIDI = (sequence: NoteSequence, index: number) => {
    // This would require a MIDI export library
    // Example implementation would convert the sequence to MIDI format
    console.log(`Exporting sequence ${index} as MIDI`, sequence);

    // For now, just copy to clipboard as JSON
    navigator.clipboard.writeText(JSON.stringify(sequence, null, 2));
    alert('Sequence copied to clipboard as JSON');
  };

  if (!isVisible) {
    return (
      <div className="neural-melody-launcher">
        <button
          onClick={() => setIsVisible(true)}
          className="launch-button"
        >
          🎵 Launch Neural Melody Studio
        </button>

        <style jsx>{`
          .neural-melody-launcher {
            display: flex;
            justify-content: center;
            padding: 2rem;
          }

          .launch-button {
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            background: linear-gradient(45deg, #3b82f6, #8b5cf6);
            border: none;
            border-radius: 12px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }

          .launch-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="neural-melody-container">
      <div className="neural-melody-header">
        <button
          onClick={() => setIsVisible(false)}
          className="close-button"
        >
          ✕ Close
        </button>

        <div className="stats">
          <span>Generated Sequences: {generatedSequences.length}</span>
          <span>
            Total Notes: {generatedSequences.reduce((sum, seq) => sum + seq.notes.length, 0)}
          </span>
        </div>
      </div>

      <NeuralMelodyComponent
        config={{
          temperature: 1.2,
          stepsPerQuarter: 4,
          totalSteps: 64,
          minNote: 48, // C3
          maxNote: 84, // C6
        }}
        onSequenceGenerated={handleSequenceGenerated}
        onError={handleError}
        className="neural-melody-main"
      />

      {generatedSequences.length > 0 && (
        <div className="sequence-export">
          <h3>Export Generated Sequences</h3>
          <div className="export-buttons">
            {generatedSequences.map((sequence, index) => (
              <button
                key={index}
                onClick={() => downloadSequenceAsMIDI(sequence, index)}
                className="export-button"
              >
                📥 Export Sequence {index + 1}
              </button>
            ))}
            <button
              onClick={() => setGeneratedSequences([])}
              className="clear-button"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .neural-melody-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        .neural-melody-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .close-button {
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .stats {
          display: flex;
          gap: 2rem;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .neural-melody-main {
          flex: 1;
          margin: 0 1rem;
        }

        .sequence-export {
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .sequence-export h3 {
          margin-bottom: 1rem;
          color: #e2e8f0;
        }

        .export-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .export-button,
        .clear-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .export-button {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
        }

        .export-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .clear-button {
          background: linear-gradient(45deg, #64748b, #475569);
          color: white;
        }

        .clear-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
        }

        @media (max-width: 768px) {
          .neural-melody-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .stats {
            justify-content: space-around;
          }

          .export-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default NeuralMelodyExample;