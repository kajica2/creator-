import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, InitialInputs, VisualTreatmentInputs } from './types';
import { generateProductionBrief } from './services/geminiService';
import { BotIcon, UserIcon, SendIcon, UploadIcon } from './components/icons';

const initialMessage: Message = {
  role: 'model',
  content: "Hello! I'm your AI Music Video Director. To get started, please provide your song details below (an MP3 is optional but helpful). Then, tell me what you need using one of the commands, like `/video_concept`.",
};

// --- Helper Components ---

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isModel = message.role === 'model';
  return (
    <div className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}>
      {isModel && <div className="flex-shrink-0">{<BotIcon />}</div>}
      <div
        className={`max-w-xl rounded-lg p-4 text-white ${
          isModel ? 'bg-slate-700' : 'bg-indigo-600'
        }`}
      >
        <div className="prose prose-invert whitespace-pre-wrap">{message.content}</div>
      </div>
      {!isModel && <div className="flex-shrink-0">{<UserIcon />}</div>}
    </div>
  );
};

const LoadingIndicator: React.FC = () => (
  <div className="flex items-start gap-4 my-4">
    <div className="flex-shrink-0">{<BotIcon />}</div>
    <div className="max-w-xl rounded-lg p-4 bg-slate-700 text-white flex items-center space-x-2">
      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
      <span className="text-sm text-gray-300">Generating ideas...</span>
    </div>
  </div>
);

const CommandButton: React.FC<{ command: string; onClick: (command: string) => void }> = ({ command, onClick }) => (
  <button
    onClick={() => onClick(command)}
    className="w-full text-left px-3 py-2 bg-slate-700 rounded-md hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    {command}
  </button>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [command, setCommand] = useState<string>('');
  const [initialInputs, setInitialInputs] = useState<InitialInputs>({
    lyricalThemes: '',
    mood: '',
    targetPlatform: '',
    budget: '',
  });
  const [visualTreatmentInputs, setVisualTreatmentInputs] = useState<VisualTreatmentInputs>({
    colorPalette: '',
    cameraStyle: '',
    setDesign: '',
  });
  const [songFile, setSongFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInitialInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleVisualInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVisualTreatmentInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSongFile(e.target.files[0]);
    }
  };

  const handleCommandClick = (cmd: string) => {
    setCommand(cmd);
    commandInputRef.current?.focus();
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: command };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setCommand('');

    try {
      const response = await generateProductionBrief(command, initialInputs, songFile, visualTreatmentInputs);
      const modelMessage: Message = { role: 'model', content: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [command, initialInputs, songFile, visualTreatmentInputs, isLoading]);
  
  const colorPaletteSuggestions = ["Vibrant & Saturated", "Monochromatic", "Pastel Hues", "Earthy & Natural", "Neon & Cyberpunk"];

  return (
    <div className="flex h-screen font-sans bg-slate-900 text-gray-200">
      {/* Left Panel: Inputs & Controls */}
      <div className="w-1/3 min-w-[350px] max-w-[450px] bg-slate-800 p-6 flex flex-col border-r border-slate-700">
        <h1 className="text-2xl font-bold text-indigo-400 mb-2">AI Music Video Director</h1>
        <p className="text-sm text-gray-400 mb-6">Your creative partner for visual storytelling.</p>
        
        <div className="space-y-4 flex-grow overflow-y-auto pr-2 pb-4">
          <h2 className="text-lg font-semibold text-gray-300 border-b border-slate-600 pb-2">Project Details</h2>
          
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="songFile" className="block text-sm font-medium text-gray-400 mb-1">Song File (MP3)</label>
              <label className="w-full flex items-center justify-center px-4 py-2 bg-slate-700 text-gray-300 rounded-md shadow-sm tracking-wide cursor-pointer hover:bg-slate-600 transition-colors">
                <UploadIcon />
                <span>{songFile ? songFile.name : 'Upload Audio'}</span>
                <input id="songFile" type="file" className="hidden" onChange={handleFileChange} accept=".mp3,audio/*" />
              </label>
            </div>
            <Input a="lyricalThemes" label="Lyrical Themes" value={initialInputs.lyricalThemes} onChange={handleInputChange} placeholder="e.g., love, loss, rebellion" />
            <Input a="mood" label="Desired Mood/Aesthetic" value={initialInputs.mood} onChange={handleInputChange} placeholder="e.g., retro, futuristic, minimalist" />
            <Select a="targetPlatform" label="Target Platform" value={initialInputs.targetPlatform} onChange={handleInputChange} options={["YouTube", "TikTok", "Instagram Reels", "Vimeo"]} />
            <Input a="budget" label="Budget Constraints" value={initialInputs.budget} onChange={handleInputChange} placeholder="e.g., $5,000, Low Budget" />
          </div>

          <h2 className="text-lg font-semibold text-gray-300 border-b border-slate-600 pb-2 pt-4">Visual Treatment Options</h2>
          <div className="space-y-4 pt-2">
              <div>
                <label htmlFor="colorPalette" className="block text-sm font-medium text-gray-400 mb-1">Color Palette</label>
                <input type="text" name="colorPalette" id="colorPalette" value={visualTreatmentInputs.colorPalette} onChange={handleVisualInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Neon cyberpunk, warm vintage" />
                <div className="flex flex-wrap gap-2 mt-2">
                    {colorPaletteSuggestions.map(suggestion => (
                        <button key={suggestion} type="button" onClick={() => setVisualTreatmentInputs(prev => ({ ...prev, colorPalette: suggestion }))} className="px-2 py-1 bg-slate-600 text-xs rounded hover:bg-indigo-500 transition-colors">{suggestion}</button>
                    ))}
                </div>
              </div>
              <Select a="cameraStyle" label="Camera Style" value={visualTreatmentInputs.cameraStyle} onChange={handleVisualInputChange} options={["Handheld & Raw", "Cinematic & Smooth", "Static & Tripod", "Drone & Aerial"]} />
              <Input a="setDesign" label="Set Design / Location" value={visualTreatmentInputs.setDesign} onChange={handleVisualInputChange} placeholder="e.g., Abandoned warehouse, lush forest" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-300 border-b border-slate-600 pb-2">Quick Commands</h2>
          <div className="grid grid-cols-1 gap-2 text-sm pt-4">
              <CommandButton command="/video_concept" onClick={handleCommandClick} />
              <CommandButton command="/storyboard_breakdown" onClick={handleCommandClick} />
              <CommandButton command="/visual_treatment" onClick={handleCommandClick} />
              <CommandButton command="/editing_brief" onClick={handleCommandClick} />
              <CommandButton command="/platform_optimization" onClick={handleCommandClick} />
          </div>
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="flex-1 flex flex-col h-screen">
        <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto">
          {messages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
          {isLoading && <LoadingIndicator />}
          {error && <div className="text-red-400 text-center my-4">{error}</div>}
        </div>
        <div className="border-t border-slate-700 p-4 bg-slate-800">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <input
              ref={commandInputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Type your command, e.g., /video_concept"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-full py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
              disabled={isLoading || !command.trim()}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Form Field Components ---
const Input: React.FC<{a: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string}> = ({ a, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={a} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input type="text" name={a} id={a} value={value} onChange={onChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder={placeholder} />
    </div>
);

const Select: React.FC<{a: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]}> = ({ a, label, value, onChange, options }) => (
    <div>
        <label htmlFor={a} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select name={a} id={a} value={value} onChange={onChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select Option</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


export default App;
