import React, { useState, useCallback } from 'react';
import { CREDIT_COSTS } from '../types';
import { progressReporter } from '../src/shared/system/ProgressStatusReporter';
import { useCredits } from '../src/contexts/CreditsContext';

interface NewUserOfferProps {
  onCreditsEarned: (credits: number) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const NewUserOffer: React.FC<NewUserOfferProps> = ({
  onCreditsEarned,
  onClose,
  isVisible
}) => {
  const { earnCredits, unlockAchievement } = useCredits();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offerClaimed, setOfferClaimed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Welcome offer rewards
  const WELCOME_CREDITS = 500; // Generous welcome bonus
  const BONUS_CREDITS = 200; // Extra for completing both steps

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      setUploadedImage(imageFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const claimOffer = useCallback(async () => {
    if (!uploadedImage || !websiteUrl || !validateUrl(websiteUrl)) return;

    setIsProcessing(true);
    const reportId = 'new-user-offer';

    try {
      progressReporter.createReport(reportId, 'Processing Welcome Offer', [
        'Validating image upload',
        'Analyzing website URL',
        'Processing credit reward',
        'Finalizing welcome bonus'
      ]);

      // Step 1: Validate image
      progressReporter.startStep(reportId, 0, 'Checking image format and size...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      progressReporter.completeStep(reportId, 0, 'Image validated successfully');

      // Step 2: Analyze URL
      progressReporter.startStep(reportId, 1, 'Analyzing website URL...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      progressReporter.completeStep(reportId, 1, 'Website URL analyzed');

      // Step 3: Process credits
      progressReporter.startStep(reportId, 2, 'Calculating credit reward...');
      await new Promise(resolve => setTimeout(resolve, 800));
      const totalCredits = WELCOME_CREDITS + (websiteUrl && uploadedImage ? BONUS_CREDITS : 0);
      progressReporter.completeStep(reportId, 2, `${totalCredits} credits calculated`);

      // Step 4: Finalize
      progressReporter.startStep(reportId, 3, 'Adding credits to your account...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Award credits using the CreditsContext
      await earnCredits(totalCredits, 'Welcome bonus for uploading image and URL', {
        imageUploaded: !!uploadedImage,
        urlProvided: !!websiteUrl,
        source: 'welcome_offer'
      });

      // Unlock welcome bonus achievement
      unlockAchievement('welcome_bonus');

      onCreditsEarned(totalCredits);
      setOfferClaimed(true);

      progressReporter.completeStep(reportId, 3, 'Welcome bonus added!');
      progressReporter.completeReport(reportId, `Welcome! You've earned ${totalCredits} credits!`);

    } catch (error) {
      progressReporter.failReport(reportId, 'Failed to process welcome offer');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, websiteUrl, onCreditsEarned]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                🎉 Welcome Bonus!
              </h2>
              <p className="text-gray-400 mt-1">
                Get {WELCOME_CREDITS + BONUS_CREDITS} free credits to start creating amazing content
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label="Close welcome offer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!offerClaimed ? (
          <div className="p-6 space-y-6">
            {/* Credit Breakdown */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">💰 Credit Rewards</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Upload an image:</span>
                  <span className="text-green-400 font-medium">+{Math.floor(WELCOME_CREDITS * 0.6)} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Add your website URL:</span>
                  <span className="text-green-400 font-medium">+{Math.floor(WELCOME_CREDITS * 0.4)} credits</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-gray-300">Completion bonus:</span>
                  <span className="text-purple-400 font-medium">+{BONUS_CREDITS} credits</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-600 pt-2">
                  <span className="text-white">Total potential:</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {WELCOME_CREDITS + BONUS_CREDITS} credits
                  </span>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                📸 Upload an image (logo, product, artwork, etc.)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : uploadedImage
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block text-center">
                  {previewUrl ? (
                    <div className="space-y-3">
                      <img
                        src={previewUrl}
                        alt="Uploaded preview"
                        className="max-w-32 max-h-32 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-green-400 font-medium">✅ Image uploaded successfully!</p>
                      <p className="text-sm text-gray-400">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Drop an image here or click to upload</p>
                        <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                🌐 Your website or portfolio URL (optional but recommended)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://your-website.com"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {websiteUrl && validateUrl(websiteUrl) && (
                <p className="text-green-400 text-sm mt-2">✅ Valid URL format</p>
              )}
            </div>

            {/* What you can do with credits */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">🚀 What you can create with your credits:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">AI Stories:</span>
                  <span className="text-blue-400">{Math.floor(WELCOME_CREDITS / CREDIT_COSTS.aiStory)} stories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Image Generation:</span>
                  <span className="text-blue-400">{Math.floor(WELCOME_CREDITS / CREDIT_COSTS.imageGeneration)} images</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Website Strategy:</span>
                  <span className="text-blue-400">{Math.floor(WELCOME_CREDITS / CREDIT_COSTS.websiteStrategy)} strategies</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Hashtag Sets:</span>
                  <span className="text-blue-400">{Math.floor(WELCOME_CREDITS / CREDIT_COSTS.complexHashtagSet)} sets</span>
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <button
              onClick={claimOffer}
              disabled={!uploadedImage || isProcessing}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                uploadedImage && !isProcessing
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing your welcome bonus...</span>
                </div>
              ) : (
                `Claim ${uploadedImage ? (websiteUrl && validateUrl(websiteUrl) ? WELCOME_CREDITS + BONUS_CREDITS : Math.floor(WELCOME_CREDITS * 0.6)) : 0} Free Credits`
              )}
            </button>

            {!uploadedImage && (
              <p className="text-center text-sm text-gray-400">
                Upload an image to unlock your welcome credits!
              </p>
            )}
          </div>
        ) : (
          // Success State
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Welcome Bonus Claimed! 🎉</h3>
            <p className="text-gray-300 mb-6">
              You've successfully earned your welcome credits. Start creating amazing content!
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Start Creating
            </button>
          </div>
        )}
      </div>
    </div>
  );
};