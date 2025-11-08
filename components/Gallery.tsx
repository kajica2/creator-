import React, { useState } from 'react';

const galleryItems = [
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Hashtag+Selection',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Hashtag+Selection',
        alt: 'Mobile view of the hashtag selection screen, showing categories like "Core Artform" and "Aesthetic & Style" with colorful tags.',
        description: 'Main hashtag selection interface on a mobile device.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=AI+Story+Output',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=AI+Story+Output',
        alt: 'Desktop view displaying a generated AI story with a title and a paragraph of text, alongside tweak and regenerate options.',
        description: 'AI-generated Instagram caption based on selected hashtags.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Image+Generator',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Image+Generator',
        alt: 'The Text-to-Image generator UI with a prompt input, aspect ratio selectors, and a generated image of abstract art.',
        description: 'AI Text-to-Image generator with prompt and settings.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Image+Editor',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Image+Editor',
        alt: 'The Image Editor interface showing an original image and a newly generated edited version based on a user prompt.',
        description: 'Editing an existing image with an AI-powered prompt.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=AI+Website+Preview',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=AI+Website+Preview',
        alt: 'Desktop view showing a live preview of a generated single-page portfolio website with a hero section and portfolio images.',
        description: 'Live preview of a fully generated portfolio website.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Ready+Sets',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Ready+Sets',
        alt: 'Mobile view of the "Ready Sets" tab, showcasing pre-made hashtag collections for different purposes like "Cyberpunk VJ Loop".',
        description: 'Quick-start hashtag sets for common use cases.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Persona+Modal',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Persona+Modal',
        alt: 'The "Set AI Persona" modal open on a desktop, allowing the user to input their artistic style to guide AI generation.',
        description: 'Setting a global AI persona to influence content style.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Context+Manager',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Context+Manager',
        alt: 'The RAG Context Source Manager modal, showing options to upload files or add URLs to provide context for the AI.',
        description: 'Managing RAG sources to provide extra context to the AI.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Tensor+Mutator',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Tensor+Mutator',
        alt: 'The Tensor Mutator tool showing a concept expanded into dimensions like "Visual Cortex" and "Sonic Spectrum".',
        description: 'AI-powered brainstorming with the Tensor Mutator.'
    },
    {
        src: 'https://placehold.co/600x400/1C1C2E/FFFFFF/png?text=Selected+Tray',
        thumb: 'https://placehold.co/300x200/1C1C2E/FFFFFF/png?text=Selected+Tray',
        alt: 'The selected hashtags tray at the bottom of the screen, showing currently selected tags with options to copy or clear.',
        description: 'The persistent tray for managing selected hashtags.'
    },
];

interface GalleryItem {
    src: string;
    thumb: string;
    alt: string;
    description: string;
}

export const GalleryComponent: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    const openModal = (item: GalleryItem) => {
        setSelectedImage(item);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">App Showcase</h2>
                <p className="text-gray-400 mt-2">A visual tour of the AV Artist Assistant's key features.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {galleryItems.map((item, index) => (
                    <div
                        key={index}
                        className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg border border-gray-700/50 aspect-w-1 aspect-h-1"
                        onClick={() => openModal(item)}
                    >
                        <img src={item.thumb} alt={item.alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
                            <p className="text-white text-xs text-center font-semibold">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={closeModal}
                >
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl p-4 space-y-3 transform animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage.src} alt={selectedImage.alt} className="w-full max-h-[70vh] object-contain rounded-md" />
                        <p className="text-gray-300 text-center">{selectedImage.description}</p>
                        <button onClick={closeModal} className="absolute top-3 right-3 text-white bg-gray-900/50 rounded-full p-1.5 hover:bg-gray-700 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};