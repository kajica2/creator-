# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev              # Start dev server on port 3000
npm run build           # Production build
npm run preview         # Preview production build
npm test               # Run tests with Vitest
npm run test:ui        # Run tests with UI
npm run test:coverage  # Run tests with coverage report
```

### Performance Analysis
```bash
npm run build:analyze     # Build with bundle analysis mode
npm run analyze          # Analyze bundle size (requires dist/ from build)
npm run perf:build       # Build + analyze in sequence
npm run perf:lighthouse  # Run Lighthouse performance audit
```

### Single Test Execution
```bash
npx vitest run <test-file-path>              # Run specific test file
npx vitest run --grep="test description"     # Run tests matching pattern
npx vitest --ui --grep="component name"      # Run specific tests in UI mode
```

## Architecture Overview

This is a **React + Vite + TypeScript** viral hashtag and image AI platform with a sophisticated multi-AI integration system.

### Core Architecture Layers

1. **Frontend**: React 19 with Vite build system, TailwindCSS, Radix UI components
2. **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
3. **AI Layer**: Multi-provider integration (Google Gemini, OpenAI, Stability AI, ElevenLabs)
4. **Agent System**: MetaAgentBuilder framework for dynamic AI agent creation
5. **API Layer**: Serverless functions for external integrations and processing

### Key System Components

#### MetaAgentBuilder System (Advanced AI Agent Framework)
- **Location**: `api/agents/MetaAgentBuilder.ts`, `src/lib/Agent*.ts`
- **Purpose**: Creates, deploys, and manages AI agents dynamically
- **Components**:
  - `MetaAgentBuilder`: Core engine for agent creation and lifecycle management
  - `AgentRegistry`: Discovery, monitoring, and health tracking
  - `AgentSpawner`: Deployment, scaling, and runtime management
  - `AgentAnalyzer`: Performance analysis and optimization
  - `AgentTestFramework`: Automated testing and quality assurance

#### Database Architecture
- **Migrations**: `supabase/migrations/` - Sequential SQL migrations
- **Utilities**: `supabase/utils.ts`, `utils/supabaseClient.ts` - Database helpers and client setup
- **Real-time**: Built-in subscription management via `RealtimeManager`
- **Tables**: hashtags, personas, media_assets, user_authority, tag_similarity, recruiting, social posts

#### AI Integration Layer
- **Gemini Client**: `utils/geminiClient.ts` - Google Gemini API integration
- **Multi-Modal Processing**: Image analysis, text generation, content optimization
- **Batch Processing**: `api/batch-media-import.ts` - ZIP upload and AI analysis pipeline
- **Agent APIs**: Dynamic agent execution via MetaAgentBuilder

#### Media Processing Pipeline
- **Batch Import**: Upload ZIP files → Extract → AI analyze → Store metadata → Generate context
- **Supported Formats**: Images, documents (text extraction), audio/video (metadata only)
- **Storage**: Supabase Storage buckets with public/signed URL generation
- **AI Analysis**: Automatic tagging, object detection, color analysis via Gemini

### Authentication Flow
- **Provider**: Supabase Auth with Google OAuth
- **Flow**: PKCE (more secure than implicit)
- **Storage**: localStorage with `reamp-auth-token` key
- **API Protection**: Bearer token validation in serverless functions
- **Session Management**: Auto-refresh with persistent sessions

### Performance Optimizations
- **Code Splitting**: Vendor chunks (react, audio, AI libs) + dynamic imports
- **Bundle Analysis**: Built-in Vite bundle analyzer with size warnings
- **Lazy Loading**: Audio/AI dependencies excluded from initial bundle
- **Asset Optimization**: Inline assets <4kb, optimized chunk naming
- **Caching**: Custom fetch with timeout/retry logic for Supabase calls

## Environment Setup

### Required Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_STABILITY_API_KEY=your_stability_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# OAuth
GOOGLE_CLIENT_ID=176960048944-j40r4l900qsef8aekqbg28fummvfcvj7.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=176960048944-j40r4l900qsef8aekqbg28fummvfcvj7.apps.googleusercontent.com

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org_name
SENTRY_PROJECT=viral-hashtag-image-ai
SENTRY_AUTH_TOKEN=your_sentry_token
```

### Database Setup
```bash
# Apply all migrations (in sequence)
supabase db reset                    # Reset and apply all migrations
supabase migration up               # Apply pending migrations
supabase migration new <name>       # Create new migration

# Generate types from database
supabase gen types typescript --local > types/supabase.ts
```

## Code Organization Patterns

### Component Structure
- **Main App**: `App.tsx` - Central state management and page routing
- **Components**: `components/` - Reusable UI components with props interfaces
- **Generators**: AI-powered content generators (Story, Lyrics, Website, etc.)
- **Utilities**: `utils/` - External API integrations, data processing
- **Types**: `types.ts` - Centralized TypeScript definitions

### Agent System Usage
```typescript
// Create new agent from requirements
const metaBuilder = new MetaAgentBuilder();
const result = await metaBuilder.handle({
  action: 'generate-blueprint',
  payload: { requirements: agentSpec },
  userId: 'user-id'
});

// Deploy and use agent
await metaBuilder.handle({
  action: 'deploy',
  payload: { agentName: 'MyAgent' },
  userId: 'user-id'
});
```

### Database Query Patterns
```typescript
// Using utility functions with error handling
import { requireCurrentUserId, handlePostgrestError } from './supabase/utils';

const userId = await requireCurrentUserId();
const { data, error } = await supabase.from('hashtags').select('*');
handlePostgrestError(error, 'Loading hashtags');
```

### Real-time Subscriptions
```typescript
import { realtimeManager } from './utils/supabaseClient';

// Subscribe to table changes
realtimeManager.subscribe('hashtags', (payload) => {
  console.log('Hashtag updated:', payload);
}, 'UPDATE');
```

## Testing Patterns

### Component Testing
- **Framework**: Vitest + React Testing Library
- **Coverage**: Minimum 80% for utilities, 60% for components
- **Location**: `tests/unit/` for unit tests, `tests/integration/` for API tests

### Agent Testing
- **Automated Generation**: `AgentTestFramework.generateTestCases()`
- **Test Types**: Unit, integration, performance, security
- **Continuous Testing**: Built-in continuous test runner for critical agents

### API Testing
- **Integration Tests**: `tests/api-integration.test.ts` - Tests actual API calls
- **Timeout Handling**: 30-second timeouts for external API calls
- **Error Testing**: Network failures, auth failures, rate limits

## Performance Monitoring

### Bundle Analysis
- Monitor chunk sizes (warning at 1000kb)
- Vendor chunks should remain stable between deploys
- Use `npm run analyze` to identify large dependencies

### Database Performance
- Monitor query performance via Supabase dashboard
- Use database indexes for frequently queried fields
- Implement pagination for large result sets

### AI API Monitoring
- Track response times and error rates for each AI provider
- Implement fallback strategies for API failures
- Monitor token usage and rate limits

## AI Integration Specifics

### Multi-Provider Strategy
- **Primary**: Google Gemini for structured generation and image analysis
- **Backup**: OpenAI for text generation fallback
- **Specialized**: Stability AI for image generation, ElevenLabs for voice

### Content Processing Flow
1. **Input**: User content (text, images, URLs)
2. **Analysis**: AI extraction and structured tagging
3. **Enhancement**: Generated hashtags, optimized content
4. **Storage**: Supabase with metadata and context
5. **Real-time Updates**: Live updates via websockets

### Error Handling for AI APIs
- Implement retry logic with exponential backoff
- Graceful degradation when AI services are unavailable
- User feedback for processing status and errors

## Security Considerations

### API Protection
- All serverless functions validate Supabase JWT tokens
- Row Level Security (RLS) enabled on all database tables
- Rate limiting on API endpoints to prevent abuse

### Data Privacy
- No AI API keys in client-side code (use server-side proxy)
- User content encrypted in transit and at rest
- Audit logging for sensitive operations

### Agent Security
- Agent code validation and sandboxing
- Permission-based access control for agent operations
- Security scanning for generated agent code