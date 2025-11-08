import React, { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M5 21v-4M3 19h4M19 3v4M17 5h4M19 21v-4M17 19h4M12 9v6M9 12h6" /></svg>;
const PersonaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>;
const RocketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const onboardingSteps = [
    {
        icon: <RocketIcon />,
        title: "Welcome to the AV Artist Assistant!",
        content: "This quick tour will show you how to get the most out of your new creative partner. The core workflow is simple: select your context, then generate content."
    },
    {
        icon: <HashIcon />,
        title: "1. Select Hashtags & Themes",
        content: "Start in the 'Hashtag Manager'. Select hashtags that match the theme of the content you want to create. This gives the AI crucial context."
    },
    {
        icon: <SparklesIcon />,
        title: "2. Generate Anything",
        content: "Navigate to any tool in the 'Creation Suite'—from AI Story to Text-to-Image. The AI will use your selected hashtags to generate relevant, on-theme content."
    },
    {
        icon: <PersonaIcon />,
        title: "3. Refine Your Style",
        content: "Use the 'Set Persona' and 'Add Context' buttons in the header to give the AI a deeper understanding of your unique artistic style for even more personalized results."
    },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) {
    return null;
  }

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      onClose(); // Finish on the last step
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = onboardingSteps[step];

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div 
        className="bg-gray-800 border border-purple-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-6 transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3">
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-700/50 border border-gray-600">
            {currentStep.icon}
        </div>
        
        <div className="space-y-2">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{currentStep.title}</h2>
            <p className="text-gray-300">
                {currentStep.content}
            </p>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
            {onboardingSteps.map((_, index) => (
                <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        index === step ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                />
            ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
            {step > 0 ? (
                <button
                    onClick={handlePrev}
                    className="w-1/3 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                    Back
                </button>
            ) : (
                 <button
                    onClick={onClose}
                    className="w-1/3 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                    Skip
                </button>
            )}
            <button
                onClick={handleNext}
                className="w-2/3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all"
            >
                {step === onboardingSteps.length - 1 ? 'Get Started!' : 'Next'}
            </button>
        </div>
      </div>
    </div>
  );
};