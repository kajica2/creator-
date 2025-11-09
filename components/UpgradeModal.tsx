import React from 'react';

const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 001.414 1.414L5 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L5 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L8 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L8 7.586V3a1 1 0 10-2 0v4.586L4.707 6.293a1 1 0 00-1.414-1.414L5 3.586V3a1 1 0 00-1-1zm11 0a1 1 0 00-1 1v2.586l-1.293-1.293a1 1 0 00-1.414 1.414L13 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L13 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L16 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L16 7.586V3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planId?: string) => void;
}

const UPGRADE_PLANS = [
  {
    id: 'creator-pro',
    name: 'Creator Pro',
    price: '$29/mo',
    description: 'Unlock premium content tools and advanced hashtag insights.',
    features: [
      'Unlimited hashtag generations',
      'AI concept + story suite',
      'Batch media upgrades up to 4K',
    ],
    accent: 'from-purple-500 to-pink-500',
  },
  {
    id: 'studio-social',
    name: 'Studio Social',
    price: '$59/mo',
    description: 'Schedule premium media drops with auto-posting workflows.',
    features: [
      'Everything in Creator Pro',
      'Instagram Reels worker (auto thumbnails + captions)',
      'YouTube Shorts worker (auto keywords + cover art)',
      'Media vault with 100GB storage',
    ],
    accent: 'from-blue-500 to-cyan-500',
    recommended: true,
  },
  {
    id: 'agency-syndicate',
    name: 'Agency Syndicate',
    price: '$129/mo',
    description: 'Collaborate with clients using managed pipelines and reporting.',
    features: [
      'Everything in Studio Social',
      'Multi-brand queue with approval flow',
      'Cross-platform analytics dashboard',
      'Priority worker bandwidth & concierge support',
    ],
    accent: 'from-amber-500 to-rose-500',
  },
];

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
        className="bg-gray-900 border border-purple-500/40 rounded-3xl shadow-2xl w-full max-w-3xl p-6 md:p-8 space-y-6 transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <SparklesIcon />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
              Power up your media releases
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl">
              Upgrade to unlock richer media exports, automated social distribution, and worker-backed delivery to Instagram Reels and YouTube Shorts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UPGRADE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gray-900/70 border ${
                plan.recommended ? 'border-yellow-400/60' : 'border-gray-800'
              } rounded-2xl p-5 flex flex-col gap-4`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 right-4 bg-yellow-500 text-black text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
              </div>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r">
                <span className={`bg-gradient-to-r ${plan.accent} bg-clip-text text-transparent`}>
                  {plan.price}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-gray-300 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-purple-300 mt-0.5">✱</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onUpgrade(plan.id)}
                className={`w-full mt-auto bg-gradient-to-r ${plan.accent} text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition`}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-800 rounded-2xl px-5 py-4 bg-gray-900/60">
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <span className="text-purple-300 text-lg">⚙️</span>
            Media workers sync reels & shorts in 90 seconds with auto-captions, tags, and status tracking.
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition"
            >
              Maybe later
            </button>
            <button
              onClick={() => onUpgrade()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white transition"
            >
              Talk to sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};