import React from 'react';

// Icons for different sections
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743Z" /></svg>;
const GoogleDriveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path fill="#4CAF50" d="M19.2,8.3H16.4L13.5,3.3c-0.4-0.6-1.2-0.6-1.6,0L9.1,8.3H6.3c-0.8,0-1.4,0.7-1.4,1.4l3.1,10.1c0.4,1.2,1.5,2,2.8,2h4.5c1.3,0,2.4-0.8,2.8-2l3.1-10.1C20.6,9,19.9,8.3,19.2,8.3z"/><path fill="#1E88E5" d="M9,8.5l-3.2,11c-0.2,0.6,0.3,1.2,0.9,1.2H12L9,8.5z"/><path fill="#FFC107" d="M15,8.5l3.2,11c0.2,0.6-0.3,1.2-0.9,1.2H12L15,8.5z"/></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M5 21v-4M3 19h4M19 3v4M17 5h4M19 21v-4M17 19h4M12 9v6M9 12h6" /></svg>;
const CloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m0 3v-1h-4v1m0 3v-1h4v1m0 3v-1h-4v1M12 9a2 2 0 00-2 2c0 .552.224 1.053.586 1.414" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 0118 0c.001-.245-.022-.49-.063-.728A12.02 12.02 0 0021 12.162v-.172a11.955 11.955 0 00-2.382-7.016z" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;

const roadmapData = [
    {
        phase: 'Phase 1: Foundation (MVP)',
        items: [
            {
                title: 'User Authentication & Google Integration',
                icon: <KeyIcon />,
                points: [
                    'Implement Google OAuth for secure user sign-in.',
                    'Request Google Drive scopes for file creation and management.',
                    'Build core UI for connecting/disconnecting Google account.',
                ],
            },
            {
                title: 'Core Content Generation & Storage',
                icon: <SparklesIcon />,
                points: [
                    'Architect for "infinite" content creation (text, image, website code).',
                    'Integrate Google Drive API to export generated files into organized folders.',
                    'Store user prompt history and content metadata in a lightweight DB or app-specific Drive folder.',
                ],
            },
        ],
    },
    {
        phase: 'Phase 2: Scaling & Monetization',
        items: [
            {
                title: 'Scalability & Cloud Hosting',
                icon: <CloudIcon />,
                points: [
                    'Host the app on a serverless platform (Vercel, Netlify) or Google Cloud Run for scalability.',
                    'Allow advanced users to integrate their own Google Cloud Storage for large files.',
                    'Implement efficient API key management for various AI services.',
                ],
            },
            {
                title: 'Monetization Strategy',
                icon: <DollarIcon />,
                points: [
                    'Introduce a Freemium model with limited free generations per month.',
                    'Create paid tiers (e.g., "Pro", "Studio") for infinite content and advanced features.',
                    'Offer optional add-ons like pay-per-use for high-res images or priority cloud rendering.',
                ],
            },
        ],
    },
    {
        phase: 'Phase 3: Growth & Compliance',
        items: [
            {
                title: 'Privacy, Security & Compliance',
                icon: <ShieldIcon />,
                points: [
                    'Develop a clear Privacy Policy and Terms of Service.',
                    'Provide users with tools to control, download, or delete their data.',
                    'Ensure compliance with Google’s API Terms of Service and fair use policies.',
                ],
            },
        ],
    },
];



export const ProductRoadmap: React.FC = () => {
    return (
        <div className="space-y-12 max-w-4xl mx-auto animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
                    Commercial App Roadmap
                </h2>
                <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                    A strategic plan to evolve this tool into a commercial product, empowering users with infinite content generation and personal cloud storage via Google Drive.
                </p>
            </div>

            {roadmapData.map((phaseData) => (
                <div key={phaseData.phase} className="space-y-6">
                    <h3 className="text-2xl font-semibold text-gray-200 border-b-2 border-gray-700 pb-2">{phaseData.phase}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {phaseData.items.map((item) => (
                            <div key={item.title} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4 h-full flex flex-col">
                                <div className="flex items-center space-x-3 text-purple-300">
                                    {item.icon}
                                    <h4 className="text-lg font-bold">{item.title}</h4>
                                </div>
                                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 flex-grow">
                                    {item.points.map((point, i) => <li key={i}>{point}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
