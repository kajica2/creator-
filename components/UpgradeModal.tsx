import React from 'react';

const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 001.414 1.414L5 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L5 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L8 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L8 7.586V3a1 1 0 10-2 0v4.586L4.707 6.293a1 1 0 00-1.414-1.414L5 3.586V3a1 1 0 00-1-1zm11 0a1 1 0 00-1 1v2.586l-1.293-1.293a1 1 0 00-1.414 1.414L13 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L13 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L16 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L16 7.586V3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-purple-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4 transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-500/20">
            <SparklesIcon />
        </div>
        <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Insufficient Credits</h2>
            <p className="text-sm text-gray-400 mt-1">You don't have enough credits to perform this action.</p>
        </div>
        <p className="text-gray-300">
            Upgrade to a Pro plan for unlimited credits, or visit the Subscription tab to purchase a credit pack.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
                onClick={onClose}
                className="w-full sm:w-1/2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
            >
                Maybe Later
            </button>
            <button
                onClick={onUpgrade}
                className="w-full sm:w-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
                View Plans
            </button>
        </div>
      </div>
    </div>
  );
};