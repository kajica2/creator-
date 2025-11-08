import React, { useState } from 'react';
import { SubscriptionPlan, Plan } from '../types';

const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 001.414 1.414L5 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L5 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L8 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L8 7.586V3a1 1 0 10-2 0v4.586L4.707 6.293a1 1 0 00-1.414-1.414L5 3.586V3a1 1 0 00-1-1zm11 0a1 1 0 00-1 1v2.586l-1.293-1.293a1 1 0 00-1.414 1.414L13 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L13 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L16 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L16 7.586V3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface SubscriptionProps {
  currentPlan: SubscriptionPlan;
  onUpgradePlan: (plan: SubscriptionPlan) => void;
  onAddCredits: (amount: number) => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ currentPlan, onUpgradePlan, onAddCredits }) => {
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemMessage, setRedeemMessage] = useState('');

    const plans: Plan[] = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            priceDescription: 'per month',
            credits: '10 Credits/month',
            features: [
                'Basic AI models',
                'Standard Hashtag Sets',
                'Community Support',
            ],
            isCurrent: currentPlan === 'free',
            cta: 'Current Plan',
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$15',
            priceDescription: 'per month',
            credits: 'Unlimited Credits',
            features: [
                'Advanced AI models (Website & Image)',
                'Google Drive Export',
                'Save Custom Hashtag Sets',
                'Priority Email Support',
            ],
            isCurrent: currentPlan === 'pro',
            cta: 'Upgrade to Pro',
            highlight: true,
        },
        {
            id: 'studio',
            name: 'Studio',
            price: '$45',
            priceDescription: 'per month',
            credits: 'Unlimited Credits',
            features: [
                'All features from Pro',
                'Access to bleeding-edge models',
                'Team collaboration (up to 3 seats)',
                'Dedicated Support Agent',
                'API Access (coming soon)',
            ],
            isCurrent: currentPlan === 'studio',
            cta: 'Upgrade to Studio',
        },
    ];
    
    const handleRedeem = () => {
        if (redeemCode.toUpperCase() === 'PRO_UPGRADE') {
            onUpgradePlan('pro');
            setRedeemMessage('Success! You have been upgraded to the Pro plan.');
            setRedeemCode('');
        } else {
            setRedeemMessage('Invalid code. Please try again.');
        }
        setTimeout(() => setRedeemMessage(''), 4000);
    };

    const PlanCard: React.FC<{ plan: Plan }> = ({ plan }) => (
        <div className={`border rounded-xl p-6 h-full flex flex-col ${plan.highlight ? 'border-purple-500 bg-gray-800/50' : 'border-gray-700 bg-gray-800/70'}`}>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{plan.name}</h3>
            <p className="mt-2">
                <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                <span className="text-base font-medium text-gray-400">{plan.priceDescription}</span>
            </p>
             <p className="mt-4 font-semibold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full text-sm self-start">{plan.credits}</p>
            <ul className="mt-6 space-y-3 text-sm flex-grow">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                        <CheckIcon />
                        <span className="ml-3 text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
             <button
                onClick={() => !plan.isCurrent && onUpgradePlan(plan.id)}
                disabled={plan.isCurrent}
                className={`w-full mt-8 py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    plan.isCurrent
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : plan.highlight
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : 'bg-gray-700 hover:bg-purple-500/50 text-white'
                }`}
            >
                {plan.isCurrent ? 'Current Plan' : plan.cta}
            </button>
        </div>
    );

    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
                    Find a Plan That's Right For You
                </h2>
                <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                    Unlock powerful features to supercharge your creative workflow and expand your reach.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-200 mb-1">Credit Packs</h3>
                    <p className="text-sm text-gray-400 mb-4">Top up your account without a subscription. Perfect for occasional use.</p>
                     <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h4 className="font-semibold text-purple-300">1000 AI Generation Credits</h4>
                            <p className="text-sm text-gray-300 mt-1">Credits never expire.</p>
                        </div>
                        <button onClick={() => onAddCredits(1000)} className="w-full sm:w-auto flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Buy for $10 (Mock)
                        </button>
                     </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-200 mb-1">Redeem a Code</h3>
                    <p className="text-sm text-gray-400 mb-4">Have a special code? Enter it here to upgrade your plan.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                         <input
                            type="text"
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value)}
                            placeholder="e.g., PRO_UPGRADE"
                            className="flex-grow w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                         <button 
                            onClick={handleRedeem}
                            className="w-full sm:w-auto flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                            Redeem
                         </button>
                    </div>
                    {redeemMessage && (
                        <p className={`text-sm mt-2 ${redeemMessage.startsWith('Success') ? 'text-green-400' : 'text-red-400'}`}>
                            {redeemMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};