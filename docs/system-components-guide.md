# System Components Guide

This guide documents the robust system components that handle progress reporting, error recovery, connection management, and offline support.

## Overview

The system includes several critical components designed to provide a reliable, user-friendly experience even when facing network issues, audio permission problems, or service outages.

### System Architecture

```
App.tsx
├── SystemErrorBoundary         # Global error handling and recovery
│   ├── Progress reporting for errors
│   ├── System state diagnosis
│   └── Automatic recovery mechanisms
├── OfflineModeManager         # Network connectivity management
│   ├── Connection monitoring
│   ├── Offline mode support
│   ├── Fallback data handling
│   └── Retry mechanisms
└── ProgressStatusDisplay       # Real-time operation tracking
    ├── Live progress updates
    ├── Multi-step operations
    └── User feedback
```

## Components

### 1. Progress Status Reporter

**File**: `src/shared/system/ProgressStatusReporter.ts`

A comprehensive progress tracking system for long-running operations.

#### Features
- **Multi-step Progress**: Track complex operations with multiple steps
- **Real-time Updates**: Live progress updates with percentages and messages
- **Error Handling**: Graceful handling of failed operations
- **Time Estimates**: Automatic ETA calculations
- **Batch Operations**: Support for processing multiple items

#### Usage Examples

```typescript
import { progressReporter, ProgressUtils } from '../src/shared/system/ProgressStatusReporter';

// Basic usage
const reportId = 'my_operation';
progressReporter.createReport(reportId, 'Processing Images', [
  'Loading images',
  'Applying filters',
  'Optimizing for web',
  'Generating thumbnails'
]);

// Update progress
progressReporter.startStep(reportId, 0, 'Loading 100 images...');
progressReporter.updateStepProgress(reportId, 0, 50, 'Loaded 50 images');
progressReporter.completeStep(reportId, 0, 'All images loaded');

// Using utility wrapper
await ProgressUtils.withProgress(
  'AI Content Generation',
  ['Analyzing prompt', 'Generating content', 'Optimizing output'],
  async (reporter, reportId) => {
    // Your async operation here
    reporter.startStep(reportId, 0);
    // ... do work ...
    reporter.completeStep(reportId, 0);
  }
);
```

#### React Integration

```tsx
import { ProgressStatusDisplay } from '../src/components/system/ProgressStatusDisplay';

// Show all active operations
<ProgressStatusDisplay showAllReports={true} />

// Show specific operation
<ProgressStatusDisplay reportId="my_operation" />

// Compact view
<ProgressStatusDisplay showAllReports={true} compact={true} />
```

### 2. Audio Context Manager

**File**: `src/shared/audio/AudioContextManager.ts`

Handles Web Audio API initialization with proper user gesture requirements.

#### Features
- **User Gesture Handling**: Automatic detection and prompting for user interaction
- **State Management**: Centralized audio context state tracking
- **Error Recovery**: Graceful handling of audio context issues
- **Browser Compatibility**: Support for WebKit-prefixed AudioContext

#### Usage Examples

```typescript
import { audioContextManager, useAudioContext } from '../src/shared/audio/AudioContextManager';

// Direct usage
const context = await audioContextManager.getAudioContext();
const analyser = audioContextManager.createAnalyser();

// React hook usage
function AudioComponent() {
  const { state, getContext, requestGesture, isReady } = useAudioContext();

  const startAudio = async () => {
    if (!isReady) {
      await requestGesture();
    }
    const context = await getContext();
    // Use audio context...
  };

  if (!state.isSupported) {
    return <div>Audio not supported</div>;
  }

  return (
    <button onClick={startAudio} disabled={!isReady}>
      {state.hasUserGesture ? 'Start Audio' : 'Click to Enable Audio'}
    </button>
  );
}
```

### 3. Connection Manager

**File**: `src/shared/system/ConnectionManager.ts`

Monitors network connectivity and Supabase service availability with automatic retry logic.

#### Features
- **Network Monitoring**: Real-time online/offline detection
- **Service Health Checks**: Periodic Supabase connectivity tests
- **Exponential Backoff**: Smart retry mechanism with increasing delays
- **DNS Resolution**: Handles ERR_NAME_NOT_RESOLVED errors gracefully
- **Connection Diagnosis**: Detailed connectivity troubleshooting

#### Usage Examples

```typescript
import { connectionManager, useConnection } from '../src/shared/system/ConnectionManager';

// Direct usage
const state = connectionManager.getState();
await connectionManager.forceRetry();
await connectionManager.diagnoseConnection();

// Wrap Supabase operations
const result = await connectionManager.withConnectionHandling(
  () => supabase.from('table').select('*'),
  () => getFallbackData() // Fallback when offline
);

// React hook usage
function ConnectionStatus() {
  const { state, isOffline, forceRetry, diagnose } = useConnection();

  return (
    <div>
      <p>Status: {isOffline ? 'Offline' : 'Online'}</p>
      {state.error && <p>Error: {state.error}</p>}
      <button onClick={forceRetry}>Retry Connection</button>
      <button onClick={diagnose}>Diagnose Issues</button>
    </div>
  );
}
```

### 4. System Error Boundary

**File**: `src/components/system/SystemErrorBoundary.tsx`

Comprehensive error boundary with automatic recovery and detailed error reporting.

#### Features
- **Error Catching**: Captures React component errors and global errors
- **Smart Recovery**: Automatic retry with progressive backoff
- **Error Classification**: Identifies network, audio, and loading errors
- **User Guidance**: Provides specific suggestions based on error type
- **System Diagnosis**: Automated system state checking and recovery

#### Error Types Handled

1. **Network Errors**: Failed fetch, DNS resolution issues
2. **Audio Errors**: AudioContext initialization problems
3. **Loading Errors**: Chunk loading failures, resource errors
4. **Runtime Errors**: Unexpected JavaScript errors

#### Recovery Mechanisms

```typescript
// Automatic recovery includes:
- Error state reset
- Connection retry
- Audio context restoration
- Cache clearing
- User gesture re-initialization
```

### 5. Offline Mode Manager

**File**: `src/components/system/OfflineModeManager.tsx`

Provides graceful offline experience with local data management.

#### Features
- **Offline Detection**: Real-time connectivity monitoring
- **User Notifications**: Non-intrusive offline status indicators
- **Local Storage**: Automatic data persistence for offline use
- **Feature Availability**: Clear indication of what works offline
- **Recovery UI**: Easy-to-use connection restoration tools

#### Offline Features Available

- ✅ Local storage and settings
- ✅ Audio processing and recording
- ✅ Cached content and history
- ✅ Basic UI operations
- ❌ Cloud sync and backup
- ❌ AI content generation
- ❌ Real-time collaboration

## Integration Guide

### Step 1: Wrap Your App

```tsx
import SystemErrorBoundary from './src/components/system/SystemErrorBoundary';
import OfflineModeManager from './src/components/system/OfflineModeManager';
import { ProgressStatusDisplay } from './src/components/system/ProgressStatusDisplay';

function App() {
  return (
    <SystemErrorBoundary>
      <OfflineModeManager>
        {/* Your app content */}

        {/* Global progress display */}
        <div className="fixed bottom-4 right-4 z-40 max-w-sm">
          <ProgressStatusDisplay showAllReports={true} compact={true} />
        </div>
      </OfflineModeManager>
    </SystemErrorBoundary>
  );
}
```

### Step 2: Use Progress Reporting

```typescript
// In your async operations
import { progressReporter } from '../src/shared/system/ProgressStatusReporter';

async function processUserData() {
  const reportId = 'user_data_processing';

  progressReporter.createReport(reportId, 'Processing User Data', [
    'Validating input',
    'Processing files',
    'Generating output',
    'Saving results'
  ]);

  try {
    progressReporter.startStep(reportId, 0);
    // Validate...
    progressReporter.completeStep(reportId, 0);

    progressReporter.startStep(reportId, 1);
    // Process...
    progressReporter.completeStep(reportId, 1);

    // Continue for other steps...

    progressReporter.completeReport(reportId);
  } catch (error) {
    progressReporter.failReport(reportId, error.message);
    throw error;
  }
}
```

### Step 3: Handle Audio Operations

```typescript
// For any audio functionality
import { audioContextManager } from '../src/shared/audio/AudioContextManager';

async function startAudioFeature() {
  try {
    const context = await audioContextManager.getAudioContext();
    // Audio context is ready and user gesture is confirmed
    const analyser = audioContextManager.createAnalyser();
    // Proceed with audio operations...
  } catch (error) {
    if (error.message.includes('user gesture')) {
      // Show user prompt to click/interact
      await audioContextManager.requestUserGesture();
      // Try again...
    }
  }
}
```

### Step 4: Manage Network Operations

```typescript
// For Supabase or network operations
import { connectionManager } from '../src/shared/system/ConnectionManager';

async function saveUserData(data) {
  return await connectionManager.withConnectionHandling(
    // Primary operation (online)
    () => supabase.from('user_data').insert(data),

    // Fallback operation (offline)
    () => {
      localStorage.setItem('pending_data', JSON.stringify(data));
      return { success: true, offline: true };
    }
  );
}
```

## Error Handling Best Practices

### 1. Graceful Degradation
```typescript
// Always provide fallbacks
const result = await connectionManager.withConnectionHandling(
  () => fetchFromAPI(),
  () => getCachedData()
);
```

### 2. User Feedback
```typescript
// Use progress reporting for long operations
await ProgressUtils.withProgress('Processing', ['Step 1', 'Step 2'],
  async (reporter, reportId) => {
    // Your operation with progress updates
  }
);
```

### 3. Audio Context Handling
```typescript
// Always check for user gesture requirements
const { isReady, requestGesture } = useAudioContext();
if (!isReady) await requestGesture();
```

## Troubleshooting

### Common Issues

1. **"AudioContext was not allowed to start"**
   - Solution: Ensure user has interacted with the page first
   - Use `audioContextManager.requestUserGesture()`

2. **"Failed to fetch" / "ERR_NAME_NOT_RESOLVED"**
   - Solution: ConnectionManager automatically handles this
   - Implement offline fallbacks for better UX

3. **Progress not updating**
   - Ensure you're calling `progressReporter.updateStepProgress()`
   - Check that reportId matches between create and update calls

4. **Error boundary not catching errors**
   - Only catches errors in React component tree
   - Use global error handlers for Promise rejections

### Debug Mode

Enable debug logging for all components:

```typescript
// Add to your app initialization
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_SYSTEM_COMPONENTS = true;
}
```

### Performance Considerations

1. **Progress Updates**: Don't update too frequently (max 60fps)
2. **Connection Checks**: Automatic throttling prevents spam
3. **Audio Context**: Shared singleton prevents multiple contexts
4. **Error Boundaries**: Limit retry attempts to prevent infinite loops

## Browser Support

- **Chrome/Edge 66+**: Full support
- **Firefox 60+**: Full support
- **Safari 11.1+**: Full support with WebKit prefixes
- **Mobile browsers**: Full support with touch gesture handling

This system provides a robust foundation for handling the complexities of modern web applications while maintaining excellent user experience even in challenging network conditions.