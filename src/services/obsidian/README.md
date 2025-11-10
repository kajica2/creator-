# Obsidian Documentation API Integration

A comprehensive system for integrating your viral hashtag & image AI project with Obsidian for seamless documentation management.

## Features

### 1. Obsidian API Client (`client.ts`)
- **REST API Integration**: Connects to Obsidian's local REST API (default port 27123)
- **Vault Management**: Read, write, and manage files in your Obsidian vault
- **Note Operations**: Create, update, delete, and search notes
- **Frontmatter Support**: Parse and serialize YAML frontmatter
- **Error Handling**: Comprehensive error handling with custom error types

### 2. Documentation Sync Service (`syncService.ts`)
- **Bi-directional Sync**: Sync documentation between project and Obsidian
- **Auto-generation**: Automatically generate documentation for agents, components, and APIs
- **Real-time Updates**: Watch for file changes and sync automatically
- **Structured Documentation**: Organize docs in folders (agents, components, api, etc.)

### 3. Real-time File Watcher (`useObsidianWatcher.ts`)
- **File System Monitoring**: Watch project files for changes using chokidar
- **Auto-sync**: Automatically sync changes when files are modified
- **Event Handling**: React to documentation changes from both sources
- **Performance Optimized**: Efficient watching with configurable intervals

### 4. Configuration Management (`configManager.ts`)
- **Environment Integration**: Load settings from environment variables
- **Validation**: Validate configuration settings
- **Persistence**: Save/load configuration to localStorage
- **Import/Export**: Backup and restore configuration

### 5. Documentation Generator (`documentationGenerator.ts`)
- **Template Engine**: Generate docs from customizable templates
- **Agent Documentation**: Auto-generate agent system documentation
- **Component Analysis**: Extract props, dependencies, and features from React components
- **API Documentation**: Generate comprehensive API docs

### 6. UI Components
- **ObsidianPanel**: Control panel for sync status and configuration
- **DocumentationBrowser**: Browse and view documentation files
- **Real-time Status**: Show connection status and sync progress

## Setup and Configuration

### 1. Environment Variables
Create a `.env` file with the following configuration:

```bash
# Obsidian Integration Configuration
OBSIDIAN_API_URL=http://localhost
OBSIDIAN_API_PORT=27123
OBSIDIAN_VAULT_NAME=viral-hashtag-ai
OBSIDIAN_API_TOKEN=your-api-token-here
OBSIDIAN_AUTO_SYNC=true
OBSIDIAN_SYNC_INTERVAL=300
OBSIDIAN_DOCS_PATH=Projects/Viral-Hashtag-AI
```

### 2. Obsidian Setup
1. Install the Obsidian REST API plugin
2. Enable the plugin and configure the port (default: 27123)
3. Create a vault named `viral-hashtag-ai` (or configure your preferred name)
4. Optionally set up API authentication

### 3. Project Integration
The integration is automatically available in your app through the "Documentation" page in the sidebar.

## Usage

### Basic Operations

```typescript
import { getObsidianSyncService, getObsidianConfig } from './src/services/obsidian';

// Get sync service instance
const syncService = getObsidianSyncService();

// Start automatic synchronization
await syncService.startSync();

// Force sync
await syncService.performSync();

// Get sync status
const status = await syncService.getSyncStatus();
```

### Configuration Management

```typescript
import { updateObsidianConfig, getObsidianConfig } from './src/services/obsidian';

// Update configuration
updateObsidianConfig({
  autoSync: true,
  syncInterval: 300,
  vaultName: 'my-vault'
});

// Get current configuration
const config = getObsidianConfig();
```

### Using the File Watcher Hook

```typescript
import { useObsidianWatcher } from './src/hooks/useObsidianWatcher';

function MyComponent() {
  const {
    syncStatus,
    isWatching,
    lastChanges,
    startWatching,
    stopWatching,
    forceSync
  } = useObsidianWatcher({
    watchLocalFiles: true,
    autoSync: true,
    watchInterval: 5000
  });

  // Start watching when component mounts
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  return (
    <div>
      <p>Status: {syncStatus.status}</p>
      <p>Watching: {isWatching ? 'Yes' : 'No'}</p>
      <button onClick={forceSync}>Force Sync</button>
    </div>
  );
}
```

## Documentation Structure

The system creates and maintains the following structure in your Obsidian vault:

```
Projects/Viral-Hashtag-AI/
├── agents/
│   ├── video-agent.md
│   ├── audio-agent.md
│   ├── live-mixer-agent.md
│   └── hashtag-analyzer.md
├── components/
│   ├── ObsidianPanel.md
│   ├── DocumentationBrowser.md
│   └── [auto-generated component docs]
├── api/
│   └── endpoints.md
├── architecture/
│   └── system-overview.md
└── project-overview.md
```

## Auto-generated Documentation

### Agent Documentation
- Agent capabilities and configuration
- API endpoints and protocols
- Coordination relationships
- Performance metrics
- Troubleshooting guides

### Component Documentation
- Props interfaces and usage examples
- Dependencies and features
- Styling information
- Testing guidelines

### API Documentation
- Endpoint specifications
- Request/response examples
- Authentication requirements
- Rate limiting information

## Advanced Features

### Custom Templates
Create custom documentation templates:

```typescript
import { documentationGenerator } from './src/services/obsidian';

const customDoc = await documentationGenerator.generateAgentDocumentation({
  name: 'My Custom Agent',
  description: 'Custom agent description',
  capabilities: ['Feature 1', 'Feature 2'],
  // ... other configuration
});
```

### Event Handling
Listen to sync events:

```typescript
const syncService = getObsidianSyncService();

syncService.on('syncStarted', () => {
  console.log('Sync started');
});

syncService.on('syncCompleted', (data) => {
  console.log('Sync completed:', data);
});

syncService.on('documentationChanged', (change) => {
  console.log('Documentation changed:', change);
});
```

### Manual File Operations
Direct file operations:

```typescript
const client = new ObsidianClient(config);

// Create a new note
await client.createNote({
  path: 'my-note.md',
  content: 'Note content',
  frontmatter: {
    title: 'My Note',
    tags: ['important']
  }
});

// Search files
const results = await client.searchFiles('agent documentation');
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure Obsidian is running
   - Check if REST API plugin is enabled
   - Verify port configuration (default: 27123)

2. **Authentication Errors**
   - Check API token configuration
   - Ensure token has proper permissions

3. **Sync Failures**
   - Verify vault path configuration
   - Check file permissions
   - Review error logs in sync status

4. **File Watcher Issues**
   - Ensure chokidar dependency is installed
   - Check file system permissions
   - Verify watch path configuration

### Debug Mode
Enable detailed logging:

```typescript
// Set environment variable
process.env.OBSIDIAN_DEBUG = 'true';

// Or configure directly
const config = getObsidianConfig();
config.debug = true;
```

## Contributing

To extend the Obsidian integration:

1. Add new documentation generators in `documentationGenerator.ts`
2. Extend templates for custom documentation types
3. Add new sync strategies in `syncService.ts`
4. Create custom UI components for specialized workflows

## Dependencies

- `chokidar`: File system watching
- `react`: UI components
- `typescript`: Type safety

## License

This integration is part of the viral hashtag & image AI project and follows the same licensing terms.