import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import {
  personaTemplates,
  getTemplatesByCategory,
  getCategories,
  categoryLabels,
  categoryIcons,
  PersonaTemplate,
  UserTemplate,
  createUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
  personaToTemplate
} from '../utils/personaTemplates';
import { getPersonaStats, getPersonaInsights, PersonaStats, PersonaInsights } from '../utils/personaAnalytics';

interface ContextModifierProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: string;
  onSetContext: (context: string) => void;
  personas: Persona[];
  currentPersona: { id: string; name: string };
  onPersonaChange: (persona: { id: string; name: string }) => void;
  onCreatePersona: (name: string, context: string) => void;
  onDeletePersona: (personaId: string) => void;
}

export const ContextModifier: React.FC<ContextModifierProps> = ({
  isOpen,
  onClose,
  currentContext,
  onSetContext,
  personas,
  currentPersona,
  onPersonaChange,
  onCreatePersona,
  onDeletePersona
}) => {
  const [contextInput, setContextInput] = useState(currentContext);
  const [showPersonaCreator, setShowPersonaCreator] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true); // Set to true by default
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'contentCount' | 'createdAt'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['creative_writer', 'visual_artist']));
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedPersonaForStats, setSelectedPersonaForStats] = useState<Persona | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PersonaTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'custom' as PersonaTemplate['category'],
    description: '',
    context: '',
    icon: '👤',
    tags: [] as string[]
  });
  const [showTemplateDeleteConfirm, setShowTemplateDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PersonaTemplate | null>(null);

  useEffect(() => {
    setContextInput(currentContext);
  }, [currentContext, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSetContext(contextInput);
  };
  
  const handleClear = () => {
    setContextInput('');
    onSetContext('');
  };

  const handleCreatePersona = () => {
    if (newPersonaName.trim()) {
      onCreatePersona(newPersonaName, contextInput);
      setNewPersonaName('');
      setShowPersonaCreator(false);
    }
  };

  const handlePersonaSelect = (persona: Persona) => {
    onPersonaChange({ id: persona.id, name: persona.name });
    setContextInput(persona.context);
  };

  const handleDeletePersona = (persona: Persona) => {
    setPersonaToDelete(persona);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePersona = () => {
    if (personaToDelete) {
      onDeletePersona(personaToDelete.id);
      setShowDeleteConfirm(false);
      setPersonaToDelete(null);
    }
  };

  const cancelDeletePersona = () => {
    setShowDeleteConfirm(false);
    setPersonaToDelete(null);
  };

  const handleUseTemplate = (template: PersonaTemplate) => {
    setNewPersonaName(template.name);
    setContextInput(template.context);
    setShowTemplateSelector(false);
    setShowPersonaCreator(true);
  };

  const handleViewStats = (persona: Persona) => {
    setSelectedPersonaForStats(persona);
    setShowStatsModal(true);
  };

  const handleEditTemplate = (template: PersonaTemplate) => {
    if (template.type === 'system') {
      // For system templates, create a user copy for editing
      setTemplateForm({
        name: `${template.name} (Copy)`,
        category: template.category,
        description: template.description,
        context: template.context,
        icon: template.icon,
        tags: [...template.tags]
      });
      setEditingTemplate(null);
    } else {
      // For user templates, edit directly
      setTemplateForm({
        name: template.name,
        category: template.category,
        description: template.description,
        context: template.context,
        icon: template.icon,
        tags: [...template.tags]
      });
      setEditingTemplate(template);
    }
    setShowTemplateEditor(true);
  };

  const handleCreateTemplate = () => {
    setTemplateForm({
      name: '',
      category: 'custom',
      description: '',
      context: contextInput,
      icon: '👤',
      tags: []
    });
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;

    if (editingTemplate) {
      // Update existing template
      updateUserTemplate(editingTemplate.id, templateForm);
    } else {
      // Create new template
      createUserTemplate(templateForm);
    }

    setShowTemplateEditor(false);
    setTemplateForm({
      name: '',
      category: 'custom',
      description: '',
      context: '',
      icon: '👤',
      tags: []
    });
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (template: PersonaTemplate) => {
    if (template.type === 'system') return; // Cannot delete system templates
    
    setTemplateToDelete(template);
    setShowTemplateDeleteConfirm(true);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete && templateToDelete.type === 'user') {
      deleteUserTemplate(templateToDelete.id);
      setShowTemplateDeleteConfirm(false);
      setTemplateToDelete(null);
    }
  };

  const cancelDeleteTemplate = () => {
    setShowTemplateDeleteConfirm(false);
    setTemplateToDelete(null);
  };

  const handleCreateTemplateFromPersona = (persona: Persona) => {
    const templateData = personaToTemplate(persona);
    setTemplateForm({
      ...templateData,
      name: `${persona.name} Template`
    });
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleAllCategories = () => {
    if (expandedCategories.size === getCategories().length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(getCategories()));
    }
  };

  // Group templates by category
  const templatesByCategory = getCategories().reduce((acc, category) => {
    acc[category] = filteredTemplates.filter(template => template.category === category);
    return acc;
  }, {} as Record<string, PersonaTemplate[]>);

  const filteredTemplates = selectedCategory === 'all'
    ? personaTemplates
    : getTemplatesByCategory(selectedCategory);

  // Filter and sort personas
  const filteredAndSortedPersonas = personas
    .filter(persona =>
      persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.context.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'contentCount':
          return b.contentCount - a.contentCount;
        case 'createdAt':
          return b.createdAt - a.createdAt;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 transform animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Set AI Persona / Context</h2>
              <p className="text-sm text-gray-400 mt-1">Define your artistic style. This will influence all AI-generated content.</p>
          </div>

          {/* Persona Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-300">
                Select Persona
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Use Template
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Save as Template
                </button>
                <button
                  onClick={() => setShowPersonaCreator(true)}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
                >
                  + New Persona
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <select
                value={currentPersona.id}
                onChange={(e) => {
                  const selectedPersona = personas.find(p => p.id === e.target.value);
                  if (selectedPersona) {
                    handlePersonaSelect(selectedPersona);
                  }
                }}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
              >
                {personas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} ({persona.contentCount} items)
                  </option>
                ))}
              </select>
              
              {/* Persona list controls */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search personas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white text-sm"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white text-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="contentCount">Sort by Content</option>
                  <option value="createdAt">Sort by Recent</option>
                </select>
              </div>

              {/* Persona list with delete buttons */}
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredAndSortedPersonas.filter(p => p.id !== 'default').map(persona => (
                  <div
                    key={persona.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      currentPersona.id === persona.id
                        ? 'bg-purple-900/30 border border-purple-500/50'
                        : 'bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-white truncate">
                          {persona.name}
                          {currentPersona.id === persona.id && (
                            <span className="ml-1 text-xs text-purple-300">(active)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>{persona.contentCount} items</span>
                        <span>•</span>
                        <span>Created {new Date(persona.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePersona(persona)}
                      className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                      title="Delete persona"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleViewStats(persona)}
                      className="ml-2 p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
                      title="View statistics"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleCreateTemplateFromPersona(persona)}
                      className="ml-2 p-1 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded transition-colors"
                      title="Save as template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </button>
                  </div>
                ))}
                {filteredAndSortedPersonas.filter(p => p.id !== 'default').length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {searchQuery ? 'No personas match your search' : 'No personas created yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder="e.g., A minimalist artist from Berlin who focuses on themes of urban isolation and digital ghosts. The style is often described as 'glitchy' and 'ethereal'."
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow h-32"
              rows={5}
          />

          <div className="flex flex-col sm:flex-row gap-2">
              <button
                  onClick={handleClear}
                  className="w-full sm:w-1/3 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                  Clear
              </button>
              <button
                  onClick={handleSave}
                  className="w-full sm:w-2/3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
              >
                  Save Context
              </button>
          </div>
        </div>
      </div>

      {/* Persona Creator Modal */}
      {showPersonaCreator && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-purple-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 transform animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Create New Persona</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Persona Name
              </label>
              <input
                type="text"
                value={newPersonaName}
                onChange={(e) => setNewPersonaName(e.target.value)}
                placeholder="e.g., Cyberpunk Storyteller"
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPersonaCreator(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePersona}
                disabled={!newPersonaName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Create Persona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-blue-500/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] p-6 space-y-4 transform animate-slide-up overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Choose a Persona Template</h3>
            <p className="text-sm text-gray-400">Select a template to quickly create a new persona with pre-defined context</p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Templates
              </button>
              {getCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {categoryIcons[category]} {categoryLabels[category]}
                </button>
              ))}
            </div>

            {/* Expand/Collapse All Button */}
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-300">
                {filteredTemplates.length} templates available
              </h4>
              <button
                onClick={toggleAllCategories}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
              >
                {expandedCategories.size === getCategories().length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>

            {/* Nested Template Sections */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {getCategories().map(category => {
                const categoryTemplates = templatesByCategory[category];
                if (categoryTemplates.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="bg-gray-700/30 border border-gray-600 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{categoryIcons[category]}</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-white">{categoryLabels[category]}</h4>
                          <p className="text-xs text-gray-400">
                            {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Category Content */}
                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-gray-800/30">
                        {categoryTemplates.map(template => (
                          <div
                            key={template.id}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 hover:border-blue-500/50 hover:bg-gray-700 transition-all group relative"
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() => handleUseTemplate(template)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{template.icon}</span>
                                  <h5 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                                    {template.name}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-1">
                                  {template.type === 'system' && (
                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                      System
                                    </span>
                                  )}
                                  {template.type === 'user' && (
                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                      Custom
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-xs bg-gray-600/50 text-gray-400 px-2 py-0.5 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Template Actions */}
                            <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-600">
                              {template.type === 'user' && (
                                <>
                                  <button
                                    onClick={() => handleEditTemplate(template)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTemplate(template)}
                                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              {template.type === 'system' && (
                                <button
                                  onClick={() => handleEditTemplate(template)}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                                >
                                  Copy & Edit
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTemplateSelector(false);
                  setShowPersonaCreator(true);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Create Custom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && personaToDelete && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-red-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 transform animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Delete Persona</h3>
            
            <div className="space-y-2">
              <p className="text-gray-300">
                Are you sure you want to delete <strong className="text-white">{personaToDelete.name}</strong>?
              </p>
              <p className="text-sm text-red-400">
                This will permanently delete {personaToDelete.contentCount} content items associated with this persona.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={cancelDeletePersona}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePersona}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Delete Persona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && selectedPersonaForStats && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-blue-500/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] p-6 space-y-4 transform animate-slide-up overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">
              Statistics for {selectedPersonaForStats.name}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-sm text-gray-400 mb-1">Total Content</div>
                  <div className="text-2xl font-bold text-white">{selectedPersonaForStats.contentCount}</div>
                  <div className="text-xs text-gray-400 mt-1">content items</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-sm text-gray-400 mb-1">Productivity Score</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round((selectedPersonaForStats.contentCount / Math.max(1, (Date.now() - selectedPersonaForStats.createdAt) / (1000 * 60 * 60 * 24))) * 10) / 10}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">items per day</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-sm text-gray-400 mb-1">Active Since</div>
                  <div className="text-lg font-bold text-white">
                    {new Date(selectedPersonaForStats.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.ceil((Date.now() - selectedPersonaForStats.createdAt) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </div>
              </div>

              {/* Context Summary */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Context Summary</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {selectedPersonaForStats.context.length > 200
                    ? selectedPersonaForStats.context.substring(0, 200) + '...'
                    : selectedPersonaForStats.context
                  }
                </p>
              </div>

              {/* Activity Indicators */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Activity Level</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Content Generation</span>
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (selectedPersonaForStats.contentCount / 50) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {Math.min(100, Math.round((selectedPersonaForStats.contentCount / 50) * 100))}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Activity Duration</span>
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((Date.now() - selectedPersonaForStats.createdAt) / (1000 * 60 * 60 * 24 * 30)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {Math.min(100, Math.round(((Date.now() - selectedPersonaForStats.createdAt) / (1000 * 60 * 60 * 24 * 30)) * 100))}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Comparison</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Rank Among Personas</div>
                    <div className="text-white font-semibold">
                      #{personas.filter(p => p.contentCount > selectedPersonaForStats.contentCount).length + 1} of {personas.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Above Average</div>
                    <div className="text-white font-semibold">
                      {selectedPersonaForStats.contentCount > (personas.reduce((sum, p) => sum + p.contentCount, 0) / personas.length) ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowStatsModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-green-500/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] p-6 space-y-4 transform animate-slide-up overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="Enter template name"
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({...templateForm, category: e.target.value as PersonaTemplate['category']})}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  >
                    <option value="creative_writer">Creative Writer</option>
                    <option value="visual_artist">Visual Artist</option>
                    <option value="content_creator">Content Creator</option>
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  placeholder="Brief description of the template"
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Context
                </label>
                <textarea
                  value={templateForm.context}
                  onChange={(e) => setTemplateForm({...templateForm, context: e.target.value})}
                  placeholder="Detailed context for the persona..."
                  rows={6}
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={templateForm.icon}
                    onChange={(e) => setTemplateForm({...templateForm, icon: e.target.value})}
                    placeholder="Emoji icon"
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={templateForm.tags.join(', ')}
                    onChange={(e) => setTemplateForm({...templateForm, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                    placeholder="tag1, tag2, tag3"
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setTemplateForm({
                    name: '',
                    category: 'custom',
                    description: '',
                    context: '',
                    icon: '👤',
                    tags: []
                  });
                  setEditingTemplate(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateForm.name.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Delete Confirmation Modal */}
      {showTemplateDeleteConfirm && templateToDelete && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-red-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 transform animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Delete Template</h3>
            
            <div className="space-y-2">
              <p className="text-gray-300">
                Are you sure you want to delete the template <strong className="text-white">{templateToDelete.name}</strong>?
              </p>
              <p className="text-sm text-red-400">
                This action cannot be undone. The template will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={cancelDeleteTemplate}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTemplate}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};