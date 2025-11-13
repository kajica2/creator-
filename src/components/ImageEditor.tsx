import React, { useState, useRef } from 'react';
import { Palette, ArrowLeft, Sparkles, Upload, RotateCw, Crop, Sliders, Filter, Type, Layers, Download, Save, Undo, Redo } from 'lucide-react';

interface ImageEditorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface EditAction {
  id: string;
  name: string;
  timestamp: string;
}

export function ImageEditor({ onBack }: ImageEditorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: 'select', name: 'Select', icon: Sparkles, desc: 'Selection tool' },
    { id: 'crop', name: 'Crop', icon: Crop, desc: 'Crop and resize' },
    { id: 'filters', name: 'Filters', icon: Filter, desc: 'Apply filters' },
    { id: 'adjust', name: 'Adjust', icon: Sliders, desc: 'Color adjustments' },
    { id: 'text', name: 'Text', icon: Type, desc: 'Add text overlays' },
    { id: 'layers', name: 'Layers', icon: Layers, desc: 'Layer management' },
    { id: 'rotate', name: 'Rotate', icon: RotateCw, desc: 'Rotate and flip' }
  ];

  const filters = [
    { name: 'None', value: 'none' },
    { name: 'Sepia', value: 'sepia(1)' },
    { name: 'Grayscale', value: 'grayscale(1)' },
    { name: 'Invert', value: 'invert(1)' },
    { name: 'Vintage', value: 'sepia(0.5) contrast(1.2)' },
    { name: 'Cool', value: 'hue-rotate(180deg)' },
    { name: 'Warm', value: 'hue-rotate(-30deg) saturate(1.2)' },
    { name: 'High Contrast', value: 'contrast(1.8)' }
  ];

  const [selectedFilter, setSelectedFilter] = useState('none');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        addToHistory('Image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const addToHistory = (action: string) => {
    const newAction: EditAction = {
      id: Date.now().toString(),
      name: action,
      timestamp: new Date().toLocaleTimeString()
    };
    setEditHistory(prev => [newAction, ...prev.slice(0, 9)]); // Keep only last 10 actions
  };

  const handleApplyFilter = (filterValue: string) => {
    setSelectedFilter(filterValue);
    addToHistory(`Applied ${filters.find(f => f.value === filterValue)?.name} filter`);
  };

  const handleAdjustmentChange = (type: string, value: number) => {
    switch (type) {
      case 'brightness':
        setBrightness(value);
        break;
      case 'contrast':
        setContrast(value);
        break;
      case 'saturation':
        setSaturation(value);
        break;
      case 'hue':
        setHue(value);
        break;
      case 'blur':
        setBlur(value);
        break;
    }
    addToHistory(`Adjusted ${type}`);
  };

  const getCombinedFilter = () => {
    const adjustments = [
      selectedFilter !== 'none' ? selectedFilter : '',
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
      `hue-rotate(${hue}deg)`,
      blur > 0 ? `blur(${blur}px)` : ''
    ].filter(Boolean);

    return adjustments.join(' ');
  };

  const handleSave = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      addToHistory('Image saved');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!selectedImage) return;

    // Create download link (mock implementation)
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `edited-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToHistory('Image exported');
  };

  const renderToolPanel = () => {
    switch (selectedTool) {
      case 'adjust':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Brightness: {brightness}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contrast: {contrast}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Saturation: {saturation}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hue: {hue}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={hue}
                onChange={(e) => handleAdjustmentChange('hue', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Blur: {blur}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={blur}
                onChange={(e) => handleAdjustmentChange('blur', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'filters':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-300 mb-3">Choose a filter to apply:</p>
            <div className="grid grid-cols-2 gap-2">
              {filters.map((filter, index) => (
                <button
                  key={index}
                  onClick={() => handleApplyFilter(filter.value)}
                  className={`p-2 text-sm border rounded-lg transition-colors ${
                    selectedFilter === filter.value
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center p-6">
            <p className="text-slate-400">Select a tool to start editing</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Image Editor</h1>
              <p className="text-slate-400">Professional image editing tools</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {}}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={() => {}}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Redo"
            >
              <Redo className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedImage || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedImage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Toolbar */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>

            <div className="space-y-2">
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedTool === tool.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs opacity-75">{tool.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Upload Button */}
            <div className="mt-6 pt-6 border-t border-slate-600">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
              >
                <Upload className="w-5 h-5" />
                Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Main Canvas */}
          <div className="xl:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="h-96 md:h-[600px] bg-slate-900/50 border border-slate-600 rounded-lg overflow-hidden">
              {selectedImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Editing canvas"
                    style={{
                      filter: getCombinedFilter(),
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    className="transition-all duration-300"
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No image loaded</p>
                    <p className="text-slate-500">Upload an image to start editing</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="space-y-6">
            {/* Tool Properties */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {tools.find(t => t.id === selectedTool)?.name} Options
              </h3>
              {renderToolPanel()}
            </div>

            {/* Edit History */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">History</h3>

              {editHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editHistory.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-2 bg-slate-900/50 border border-slate-600 rounded">
                      <span className="text-slate-300 text-sm">{action.name}</span>
                      <span className="text-slate-500 text-xs">{action.timestamp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No edits yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

              <div className="space-y-2">
                <button className="w-full p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors text-sm">
                  Auto Enhance
                </button>
                <button className="w-full p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors text-sm">
                  Remove Background
                </button>
                <button className="w-full p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors text-sm">
                  Resize Image
                </button>
                <button className="w-full p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors text-sm">
                  Add Watermark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Coming Soon</h3>
          <p className="text-slate-300">
            Advanced editing features including AI-powered background removal, object detection,
            smart cropping, batch editing, layer support, and integration with professional editing tools.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImageEditor;