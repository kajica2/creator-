import React, { useState } from 'react';

const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743Z" /></svg>;
const CloudStorageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
const VercelIcon = () => <svg height="20" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64 128L128 0H0L64 128Z" fill="#FFF"/></svg>;
const NetlifyIcon = () => <svg height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.314 15.11L12.215 2.112c-.15-.225-.479-.225-.629 0L1.488 15.11c-.15.225.075.562.314.562H6.87c.15 0 .225-.15.15-.315l-1.426-2.176a.32.32 0 01.075-.465l6.3-4.275c.15-.075.375-.075.525 0l6.3 4.275c.15.15.15.39.075.465l-1.426 2.176c-.075.165 0 .315.15.315h5.062c.24 0 .465-.337.315-.562z" fill="#FFF"/></svg>;
const GCloudIcon = () => <svg height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.1 14.2c-1.6-1-1.6-2.6-1.6-3.2 0-1.2.7-2.8 3.1-2.8s3.1 1.5 3.1 2.8c0 .6 0 2.2-1.6 3.2-1.5 1-3.1.5-4.6 0zm-1.6 4.3c-2.4-1.5-2.4-4-2.4-4.9s1-4.2 4.7-4.2 4.7 2.3 4.7 4.2c0 .9 0 3.4-2.4 4.9-2.2 1.4-4.7.7-7 0zm8.3-9.9c0-1-1.3-3.6-2.3-4.5-1.1-.9-3.3-1.6-4.4-1.6-1.1 0-3.3.7-4.4 1.6C6.7 5.1 5.3 7.7 5.3 8.7c0 .9 2.2 4.2 2.2 4.2l.2.3s-2.5-1.5-2.5-4.2c0-3.1 2.3-5.9 5.8-5.9s5.8 2.8 5.8 5.9c0 2.7-2.5 4.2-2.5 4.2l.2-.3s2.2-3.3 2.2-4.2zM21.5 16c-1.8-1.1-2.2-3-2.2-3.8 0-1.2 1-3.9 1-3.9s-1.8 2.3-1.8 3.9c0 .7.4 2.1 1.7 3 .7.5 1.4.6 1.4.6s-.1-.2-.1-.6zm-19 0c1.8-1.1 2.2-3 2.2-3.8 0-1.2-1-3.9-1-3.9S1.8 11 1.8 12.5c0 .7-.4 2.1-1.7 3-.7.5-1.4.6-1.4.6s.1-.2.1-.6z" fill="#FFF"/></svg>;
const GoogleSheetsIcon = () => <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM10.5 17.5L9 16L11.5 13.5L9 11L10.5 9.5L13 12L15.5 9.5L17 11L14.5 13.5L17 16L15.5 17.5L13 15L10.5 17.5Z" fill="#34A853"/></svg>;
const NotionIcon = () => <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13.88 3H5.5C4.67 3 4 3.67 4 4.5V19.5C4 20.33 4.67 21 5.5 21H18.5C19.33 21 20 20.33 20 19.5V10.12L13.88 3ZM12.94 18H8.38V7.55L12.94 12.1V18ZM18 18H14.06V11L18 7V18Z"/></svg>;


type ApiKeyStatus = 'not_set' | 'validating' | 'saved' | 'error';
type GCSStatus = 'disconnected' | 'connecting' | 'connected';
type ServiceStatus = 'disconnected' | 'connecting' | 'connected';

export const Settings: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('not_set');
    const [gcsStatus, setGcsStatus] = useState<GCSStatus>('disconnected');
    const [sheetsStatus, setSheetsStatus] = useState<ServiceStatus>('disconnected');
    const [notionStatus, setNotionStatus] = useState<ServiceStatus>('disconnected');

    const handleSaveKey = () => {
        setApiKeyStatus('validating');
        setTimeout(() => {
            if (apiKey.startsWith('AIza') && apiKey.length > 30) {
                setApiKeyStatus('saved');
            } else {
                setApiKeyStatus('error');
            }
        }, 1500);
    };

    const handleConnectGCS = () => {
        setGcsStatus('connecting');
        setTimeout(() => setGcsStatus('connected'), 2000);
    };
    
    const handleDisconnectGCS = () => setGcsStatus('disconnected');

    const handleConnectSheets = () => {
        setSheetsStatus('connecting');
        setTimeout(() => setSheetsStatus('connected'), 2000);
    };
    const handleDisconnectSheets = () => setSheetsStatus('disconnected');

    const handleConnectNotion = () => {
        setNotionStatus('connecting');
        setTimeout(() => setNotionStatus('connected'), 2000);
    };
    const handleDisconnectNotion = () => setNotionStatus('disconnected');

    const getApiKeyStatusIndicator = () => {
        switch (apiKeyStatus) {
            case 'validating': return <span className="text-xs text-yellow-400">Validating...</span>;
            case 'saved': return <span className="text-xs text-green-400">Key Saved</span>;
            case 'error': return <span className="text-xs text-red-400">Invalid Key</span>;
            case 'not_set': default: return <span className="text-xs text-gray-400">Not Set</span>;
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
             <div className="text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
                    Settings & Configuration
                </h2>
                <p className="text-gray-400 mt-2">
                    Manage API keys, integrations, and hosting settings for your application.
                </p>
            </div>
            
            {/* API Key Management */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-200 mb-1">API Key Management</h3>
                <p className="text-sm text-gray-400 mb-4">Provide your own API keys for greater control and to use your own quotas.</p>
                <div className="space-y-3">
                    <label htmlFor="gemini-key" className="font-semibold text-gray-300">Google Gemini API Key</label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                            id="gemini-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API Key"
                            className="flex-grow w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                         <button 
                            onClick={handleSaveKey}
                            disabled={apiKeyStatus === 'validating'}
                            className="w-full sm:w-auto flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
                             {apiKeyStatus === 'validating' ? (
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                             ) : (
                                <KeyIcon />
                             )}
                            Save Key
                         </button>
                    </div>
                    <div className="text-right">
                        {getApiKeyStatusIndicator()}
                    </div>
                </div>
            </div>

            {/* Cloud Storage Integration */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-200 mb-1">Cloud Storage Integration</h3>
                <p className="text-sm text-gray-400 mb-4">For advanced users, connect your own Google Cloud Storage bucket to store large files like images, audio, and video.</p>
                {gcsStatus === 'connected' ? (
                    <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center">
                        <div>
                            <p className="text-green-400 font-semibold">Status: Connected</p>
                            <p className="text-sm text-gray-300 font-mono">gcs://user-project-media-bucket</p>
                        </div>
                        <button onClick={handleDisconnectGCS} className="mt-2 sm:mt-0 bg-red-600/50 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleConnectGCS} 
                        disabled={gcsStatus === 'connecting'}
                        className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
                        {gcsStatus === 'connecting' ? (
                            <>
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                               Connecting...
                            </>
                        ) : (
                            <>
                               <CloudStorageIcon />
                               Connect Google Cloud Storage
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Connect Services */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-200 mb-1">Connect Services</h3>
                <p className="text-sm text-gray-400 mb-4">Integrate with other applications to sync content and streamline your workflow.</p>
                <div className="space-y-4">
                    {/* Google Sheets */}
                    {sheetsStatus === 'connected' ? (
                        <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <GoogleSheetsIcon />
                                <div>
                                    <p className="text-green-400 font-semibold">Google Sheets Connected</p>
                                    <p className="text-sm text-gray-300">Account: {`user@example.com`}</p>
                                </div>
                            </div>
                            <button onClick={handleDisconnectSheets} className="mt-2 sm:mt-0 bg-red-600/50 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleConnectSheets} disabled={sheetsStatus === 'connecting'} className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
                            {sheetsStatus === 'connecting' ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Connecting...</> : <><GoogleSheetsIcon />Connect Google Sheets</>}
                        </button>
                    )}
                     {/* Notion */}
                    {notionStatus === 'connected' ? (
                        <div className="bg-gray-900/50 border border-gray-500/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center">
                             <div className="flex items-center space-x-2">
                                <NotionIcon />
                                <div>
                                    <p className="text-gray-300 font-semibold">Notion Connected</p>
                                    <p className="text-sm text-gray-400">Workspace: AV Artist Studio</p>
                                </div>
                            </div>
                            <button onClick={handleDisconnectNotion} className="mt-2 sm:mt-0 bg-red-600/50 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                         <button onClick={handleConnectNotion} disabled={notionStatus === 'connecting'} className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
                            {notionStatus === 'connecting' ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Connecting...</> : <><NotionIcon />Connect Notion</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Hosting & Deployment */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-200 mb-1">Hosting & Deployment</h3>
                <p className="text-sm text-gray-400 mb-4">This application is designed for modern, scalable deployment on serverless platforms.</p>
                <div className="flex flex-col sm:flex-row justify-around items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <VercelIcon />
                        <span className="font-semibold text-gray-300">Vercel</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <NetlifyIcon />
                        <span className="font-semibold text-gray-300">Netlify</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <GCloudIcon />
                        <span className="font-semibold text-gray-300">Google Cloud Run</span>
                    </div>
                </div>
            </div>

        </div>
    );
};