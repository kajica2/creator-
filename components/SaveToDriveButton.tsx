import React, { useState, useRef } from 'react';
import { User } from '../types';

interface SaveToDriveButtonProps {
    content: string;
    fileName: string;
    mimeType: string;
    user: User | null;
}

const FOLDER_NAME = 'AV Artist Assistant';

const GoogleDriveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="#4CAF50" d="M19.2,8.3H16.4L13.5,3.3c-0.4-0.6-1.2-0.6-1.6,0L9.1,8.3H6.3c-0.8,0-1.4,0.7-1.4,1.4l3.1,10.1c0.4,1.2,1.5,2,2.8,2h4.5c1.3,0,2.4-0.8,2.8-2l3.1-10.1C20.6,9,19.9,8.3,19.2,8.3z"/><path fill="#1E88E5" d="M9,8.5l-3.2,11c-0.2,0.6,0.3,1.2,0.9,1.2H12L9,8.5z"/><path fill="#FFC107" d="M15,8.5l-3.2,11c0.2,0.6-0.3,1.2-0.9,1.2H12L15,8.5z"/></svg>;

const getFolderId = async (accessToken: string, folderIdCache: React.MutableRefObject<string | null>): Promise<string> => {
    if (folderIdCache.current) {
        return folderIdCache.current;
    }

    const query = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to search for folder.');
    
    const data = await response.json();
    if (data.files && data.files.length > 0) {
        folderIdCache.current = data.files[0].id;
        return data.files[0].id;
    }

    // Folder not found, create it
    const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
    };
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderMetadata),
    });
    
    if (!createResponse.ok) throw new Error('Failed to create folder.');
    
    const newFolder = await createResponse.json();
    folderIdCache.current = newFolder.id;
    return newFolder.id;
};

const uploadFile = async (accessToken: string, folderId: string, fileName: string, mimeType: string, content: string) => {
    const fileMetadata = {
        name: fileName,
        parents: [folderId],
        mimeType: mimeType,
    };

    let fileContent: Blob;
    if (mimeType.startsWith('image/')) {
        const fetchRes = await fetch(content); // content is a data URL
        fileContent = await fetchRes.blob();
    } else {
        fileContent = new Blob([content], { type: mimeType });
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', fileContent);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form,
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`File upload failed: ${errorBody.error.message}`);
    }
};

export const SaveToDriveButton: React.FC<SaveToDriveButtonProps> = ({ content, fileName, mimeType, user }) => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [message, setMessage] = useState<string>('Save to Drive');
    const folderIdCache = useRef<string | null>(null);

    const handleSave = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Sign in to save');
            setTimeout(() => setStatus('idle'), 2500);
            return;
        }

        setStatus('saving');
        
        try {
            const folderId = await getFolderId(user.accessToken, folderIdCache);
            await uploadFile(user.accessToken, folderId, fileName, mimeType, content);

            setStatus('saved');
            setMessage(`✅ Saved to '${FOLDER_NAME}' folder`);
        } catch (error) {
            console.error('Google Drive Save Error:', error);
            setStatus('error');
            setMessage(`Save failed: ${(error as Error).message}`);
        } finally {
            setTimeout(() => {
                setStatus('idle');
            }, 3000);
        }
    };

    const getButtonContent = () => {
        switch (status) {
            case 'saving':
                return (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                    </>
                );
            case 'saved':
            case 'error':
                 return message;
            default:
                return (
                    <>
                        <GoogleDriveIcon />
                        Save to Drive
                    </>
                );
        }
    }

    return (
        <button
            onClick={handleSave}
            disabled={status === 'saving' || !content}
            className={`w-full flex items-center justify-center text-sm font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                status === 'saved' ? 'bg-green-600 text-white' : 
                status === 'error' ? 'bg-red-600 text-white' : 
                'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
        >
            {getButtonContent()}
        </button>
    );
};