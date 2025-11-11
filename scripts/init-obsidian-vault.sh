#!/bin/bash

# Obsidian Vault Initialization Script
# Sets up project structure in your Obsidian vault

VAULT_PATH="/Users/kajicadjuric/Documents/kais_vault"
PROJECT_NAME="Viral Hashtag & Image AI"
PROJECT_PATH="$VAULT_PATH/Projects/$PROJECT_NAME"

echo "🔮 Initializing Obsidian Vault Structure..."

# Create main project directory
mkdir -p "$PROJECT_PATH"

# Create subdirectories
echo "📁 Creating project folders..."
mkdir -p "$PROJECT_PATH/Components"
mkdir -p "$PROJECT_PATH/APIs"
mkdir -p "$PROJECT_PATH/Agents"
mkdir -p "$PROJECT_PATH/Documentation"
mkdir -p "$PROJECT_PATH/Ideas"
mkdir -p "$PROJECT_PATH/Daily Notes"
mkdir -p "$PROJECT_PATH/Templates"
mkdir -p "$PROJECT_PATH/Archive"
mkdir -p "$PROJECT_PATH/Media"

# Create index file
echo "📝 Creating index note..."
cat > "$PROJECT_PATH/Index.md" << 'EOL'
# Viral Hashtag & Image AI

## Quick Links
- [[Map of Content]]
- [[Architecture]]
- [[API Documentation]]
- [[Components Overview]]
- [[Agent Pipeline]]

## Project Overview
A comprehensive AI-powered content creation platform featuring:
- Multi-tool AI Generators (Story, Lyrics, Website, Skills, Concepts, Images)
- Hashtag Management System
- Neural-inspired music generation (Synaptic Symphony)
- Agent orchestration pipeline
- Karaoke track generation

## Tech Stack
- Frontend: React 19.2 + TypeScript + Vite
- Backend: Supabase (Auth + Database + Storage)
- AI: Google Generative AI, Tone.js for audio
- State: React hooks with local storage

## Project Structure
```
Viral Hashtag & Image AI/
├── Components/        # React components
├── APIs/             # API documentation
├── Agents/           # Agent implementations
├── Documentation/    # Project docs
├── Ideas/           # Feature ideas and TODOs
├── Daily Notes/     # Daily progress logs
└── Media/           # Images and assets
```

## Recent Updates
`$= dv.list(dv.pages('"Projects/Viral Hashtag & Image AI"').sort(f => f.file.mtime, 'desc').limit(10).map(p => p.file.link))`

## Statistics
- Components: `$= dv.pages('"Projects/Viral Hashtag & Image AI/Components"').length`
- APIs: `$= dv.pages('"Projects/Viral Hashtag & Image AI/APIs"').length`
- Agents: `$= dv.pages('"Projects/Viral Hashtag & Image AI/Agents"').length`

---
Created: 2024-11-09
Tags: #project #ai #react #typescript
EOL

# Create Map of Content
echo "🗺️ Creating Map of Content..."
cat > "$PROJECT_PATH/Map of Content.md" << 'EOL'
# Map of Content - Viral Hashtag & Image AI

## 🏗️ Architecture
- [[System Architecture]]
- [[Component Hierarchy]]
- [[Data Flow]]
- [[Agent Pipeline Architecture]]

## 🤖 Agents
- [[Astrology Agent]] - Converts birth charts to sound
- [[Karaoke Agent]] - Generates synchronized karaoke tracks
- [[Sound Agent]] - Sound synthesis and processing
- [[Song Agent]] - Song structure generation
- [[Image Agent]] - Visual content generation

## 🧩 Core Components
- [[Synaptic Symphony]] - Neural network visualization
- [[Agent Orchestrator]] - Pipeline management
- [[Hashtag Manager]] - Tag organization
- [[AI Generators]] - Content creation tools
- [[Obsidian Integration]] - Knowledge base sync

## 🔌 APIs
- [[Pipeline API]] - Agent orchestration
- [[Content API]] - CRUD operations
- [[Real-time API]] - WebSocket connections
- [[Storage API]] - Supabase integration

## 📝 Documentation
- [[Getting Started]]
- [[Development Guide]]
- [[API Reference]]
- [[Testing Strategy]]
- [[Deployment Guide]]

## 💡 Features
- [[Media Pipeline]] - Astrology → Sound → Song → Image → Karaoke
- [[Neural Visualization]] - 3D interactive network
- [[Hashtag System]] - Smart tag management
- [[AI Content Generation]] - Multi-modal creation

## 📊 Progress Tracking
- [[Roadmap]]
- [[Sprint Notes]]
- [[Bug Tracker]]
- [[Feature Requests]]

---
Tags: #moc #index #project-structure
EOL

# Create Architecture documentation
echo "📐 Creating architecture documentation..."
cat > "$PROJECT_PATH/Documentation/Architecture.md" << 'EOL'
# System Architecture

## Overview
The Viral Hashtag & Image AI platform uses a modular architecture with React frontend and Supabase backend.

## Component Architecture
```mermaid
graph TD
    UI[React UI] --> AC[Agent Controller]
    AC --> AO[Agent Orchestrator]
    AO --> AA[Astrology Agent]
    AO --> SA[Sound Agent]
    AO --> SG[Song Agent]
    AO --> IA[Image Agent]
    AO --> KA[Karaoke Agent]

    UI --> SB[Supabase]
    SB --> AUTH[Authentication]
    SB --> DB[Database]
    SB --> STORE[Storage]
```

## Data Flow
1. User interaction in React component
2. Agent orchestrator receives request
3. Pipeline execution through agents
4. Results stored in Supabase
5. Real-time updates via WebSocket
6. UI updates with new content

## Key Design Patterns
- **Observer Pattern**: Event-driven agent communication
- **Pipeline Pattern**: Sequential agent processing
- **Factory Pattern**: Dynamic agent creation
- **Singleton Pattern**: Orchestrator instance

## Technologies
- **Frontend**: React, TypeScript, Vite, Tailwind
- **Backend**: Supabase, PostgreSQL
- **AI/ML**: Google Generative AI, Tone.js
- **Real-time**: WebSockets, Server-Sent Events

---
Tags: #architecture #technical #system-design
EOL

# Create daily note template
echo "📅 Creating daily note template..."
cat > "$PROJECT_PATH/Templates/Daily Note Template.md" << 'EOL'
# {{date:YYYY-MM-DD}} - Viral Hashtag AI Daily

## 📅 Date
{{date:dddd, MMMM Do YYYY}}

## 🎯 Goals for Today
- [ ]

## 📝 Development Notes
### Morning

### Afternoon

### Evening

## 💻 Code Changes
- Component:
- Feature:
- Bug Fix:

## 🔗 Links Created
-

## 💡 Ideas
-

## 🐛 Issues Encountered
-

## ✅ Completed
-

## 📊 Progress
- Lines of Code:
- Components Created:
- Tests Written:
- Commits:

## 🔮 Tomorrow's Plan
- [ ]

---
Tags: #daily-note #progress #development
EOL

echo "✅ Obsidian vault structure created successfully!"
echo "📍 Location: $PROJECT_PATH"
echo ""
echo "🎯 Next Steps:"
echo "1. Open Obsidian and navigate to: $VAULT_PATH"
echo "2. Install recommended plugins:"
echo "   - Dataview (for dynamic content)"
echo "   - Templater (for templates)"
echo "   - Graph View (for visualizations)"
echo "3. Run 'npm run sync:obsidian' to sync your components"