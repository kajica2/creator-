import React, { useState, useEffect } from 'react';
import { PersonaTemplate } from '../utils/personaTemplates';
import {
  getUserTemplates,
  systemTemplates as systemTemplatesData,
  saveUserTemplates,
  createUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
  personaToTemplate
} from '../utils/personaTemplates';
import { useGamification } from '../hooks/useGamification';
import { XP_REWARDS } from '../data/gamification';

const PersonaTemplatesPage: React.FC = () => {
  const [userTemplates, setUserTemplates] = useState<PersonaTemplate[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<PersonaTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PersonaTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    context: '',
    description: ''
  });
  const { recordGeneration } = useGamification();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setUserTemplates(getUserTemplates());
    setSystemTemplates(systemTemplatesData);
  };

  const handleEditTemplate = (template: PersonaTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      context: template.context,
      description: template.description || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedTemplate && selectedTemplate.id) {
      // Check if this is an existing user template that needs updating
      const existingUserTemplate = userTemplates.find(t => t.id === selectedTemplate.id);
      
      if (existingUserTemplate) {
        // Update existing user template
        updateUserTemplate(selectedTemplate.id, {
          name: editForm.name,
          context: editForm.context,
          description: editForm.description
        });
      } else {
        // Create new template
        createUserTemplate({
          name: editForm.name,
          context: editForm.context,
          description: editForm.description,
          category: 'custom',
          icon: '👤',
          tags: ['custom']
        });
      }
      
      loadTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
      
      // Award XP for template management
      recordGeneration('Persona Templates');
    }
  };

  const handleDeleteTemplate = (template: PersonaTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      deleteUserTemplate(template.id);
      loadTemplates();
      
      // Award XP for template management
      recordGeneration('Persona Templates');
    }
  };

  const handleCreateFromSystem = (systemTemplate: PersonaTemplate) => {
    createUserTemplate({
      name: systemTemplate.name,
      context: systemTemplate.context,
      description: systemTemplate.description,
      category: systemTemplate.category,
      icon: systemTemplate.icon,
      tags: systemTemplate.tags
    });
    
    loadTemplates();
    
    // Award XP for template creation
    recordGeneration('Persona Templates');
  };

  const handleCreateNew = () => {
    const newTemplate: PersonaTemplate = {
      id: `user_${Date.now()}`,
      name: 'New Template',
      context: 'Enter your persona context here...',
      description: 'Describe this template...',
      type: 'user',
      category: 'custom',
      icon: '👤',
      tags: ['custom']
    };
    
    setSelectedTemplate(newTemplate);
    setEditForm({
      name: newTemplate.name,
      context: newTemplate.context,
      description: newTemplate.description || ''
    });
    setIsEditing(true);
  };

  return (
    <div className="persona-templates-page">
      <div className="page-header">
        <h1>Persona Templates</h1>
        <p>Manage your AI persona templates for quick character creation</p>
      </div>

      <div className="templates-section">
        <div className="section-header">
          <h2>Your Templates ({userTemplates.length})</h2>
          <button 
            className="btn btn-primary"
            onClick={handleCreateNew}
          >
            + Create New Template
          </button>
        </div>

        {userTemplates.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any templates yet.</p>
            <p>Create templates to quickly set up personas for different creative contexts.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {userTemplates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <div className="template-actions">
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => handleEditTemplate(template)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {template.description && (
                  <p className="template-description">{template.description}</p>
                )}
                <div className="template-context-preview">
                  {template.context.length > 100 
                    ? `${template.context.substring(0, 100)}...`
                    : template.context
                  }
                </div>
                <div className="template-meta">
                  <span className="template-type user">Your Template</span>
                  <span className="template-date">
                    {template.updatedAt && `Updated: ${new Date(template.updatedAt).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="templates-section">
        <h2>System Templates</h2>
        <div className="templates-grid">
          {systemTemplates.map(template => (
            <div key={template.id} className="template-card system">
              <div className="template-header">
                <h3>{template.name}</h3>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleCreateFromSystem(template)}
                >
                  Copy to My Templates
                </button>
              </div>
              {template.description && (
                <p className="template-description">{template.description}</p>
              )}
              <div className="template-context-preview">
                {template.context.length > 100 
                  ? `${template.context.substring(0, 100)}...`
                  : template.context
                }
              </div>
              <div className="template-meta">
                <span className="template-type system">System Template</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Template</h3>
              <button 
                className="btn btn-sm btn-close"
                onClick={() => setIsEditing(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono"
                />
              </div>
              <div className="form-group mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono"
                  placeholder="Describe this template..."
                />
              </div>
              <div className="form-group mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Persona Context</label>
                <textarea
                  value={editForm.context}
                  onChange={(e) => setEditForm({...editForm, context: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono resize-vertical"
                  rows={6}
                  placeholder="Enter the AI context for this persona..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .persona-templates-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .page-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .templates-section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.5rem;
          color: #333;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .template-card {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .template-card.system {
          border-left: 4px solid #007bff;
        }

        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .template-header h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #333;
          flex: 1;
        }

        .template-actions {
          display: flex;
          gap: 0.5rem;
        }

        .template-description {
          color: #666;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .template-context-preview {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.9rem;
          color: #555;
          margin-bottom: 1rem;
          border-left: 3px solid #007bff;
        }

        .template-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: #888;
        }

        .template-type {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .template-type.user {
          background: #e8f5e8;
          color: #2d5a2d;
        }

        .template-type.system {
          background: #e3f2fd;
          color: #1565c0;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 8px;
          padding: 0;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e1e5e9;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        textarea.form-control {
          resize: vertical;
          min-height: 120px;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #007bff;
          color: #007bff;
        }

        .btn-outline:hover {
          background: #007bff;
          color: white;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #666;
          cursor: pointer;
        }

        .btn-close:hover {
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default PersonaTemplatesPage;