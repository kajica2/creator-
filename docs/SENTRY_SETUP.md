# Sentry MCP Integration Setup Guide

This guide walks you through setting up Sentry with MCP (Model Context Protocol) integration for advanced debugging and monitoring of your viral hashtag & image AI application.

## 🚀 Quick Setup

### 1. Sentry Project Setup

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for "React"
3. Copy your DSN from the project settings
4. Generate an Auth Token from [Account Settings → API → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your Sentry credentials:

```bash
cp .env.example .env.local
```

Update the Sentry variables:
```env
SENTRY_DSN=https://your-dsn@your-org.ingest.sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=viral-hashtag-image-ai
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. MCP Integration with Cursor IDE

#### Option A: UV Installation (Recommended)
```bash
# Install UV if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Sentry MCP server
uvx mcp-server-sentry
```

#### Option B: NPX Installation
```bash
npm install -g @sentry/mcp
```

#### Cursor Configuration

1. Open Cursor IDE
2. Go to `Cursor → Settings → Cursor Settings → MCP`
3. Add the Sentry MCP server configuration from `config/sentry/cursor-mcp-setup.json`

Or manually add to your Cursor settings:
```json
{
  "mcpServers": {
    "sentry": {
      "command": "uvx",
      "args": ["mcp-server-sentry", "--auth-token", "YOUR_SENTRY_TOKEN"]
    }
  }
}
```

4. Restart Cursor IDE

## 🎯 Features Enabled

### Error Tracking & Monitoring

- **Real-time Error Capture**: All JavaScript errors, unhandled promises, and custom errors
- **Performance Monitoring**: Track AI generation response times and database query performance
- **User Context**: Automatic user identification and session tracking
- **Release Tracking**: Source map uploads for better stack traces

### AI-Specific Monitoring

- **Hashtag Generation Errors**: Track OpenAI API failures, quota limits, and response quality
- **Image Generation Monitoring**: Monitor Stability AI timeouts, parameter validation, and generation failures
- **Audio Generation Tracking**: ElevenLabs API monitoring, voice model usage, and quota tracking
- **Supabase Integration**: Database query performance, authentication errors, and connection issues

### MCP-Enhanced Debugging

- **Context-Aware Error Analysis**: AI models get full context of production issues
- **Intelligent Root Cause Analysis**: Sentry + Cursor can trace errors to specific code lines
- **Live Production Investigation**: Query real issues directly from your IDE
- **Performance Pattern Detection**: Automated detection of degradation patterns

## 🔧 Usage Examples

### In Cursor IDE

Once MCP is configured, you can use these commands in Cursor:

```
@sentry show recent errors
@sentry investigate error 12345
@sentry analyze performance issues
@sentry show AI generation failures
@sentry show quota usage patterns
```

### Programmatic Usage

```typescript
import { SentryUtils } from './config/sentry/sentry.config';
import { AIErrorReporter } from './src/utils/monitoring/aiErrorReporting';

// Track AI operations
const transaction = SentryUtils.trackAIGeneration('hashtag', 'gpt-4');
try {
  const result = await generateHashtags(prompt);
  AIErrorReporter.getInstance().reportSuccess(context, responseTime, result);
} catch (error) {
  AIErrorReporter.getInstance().reportError(context, error);
} finally {
  transaction.finish();
}
```

## 📊 Monitoring Dashboard

Access the built-in monitoring dashboard at `/monitoring` (when added to your routes):

- **Real-time Metrics**: Error rates, response times, success rates
- **Performance Insights**: Automated recommendations based on patterns
- **Alert Management**: Configure thresholds and notifications
- **Historical Analysis**: Trends and pattern detection

## 🚨 Alerting Configuration

The system includes intelligent alerting for:

- **Error Rate Spikes**: > 5% error rate
- **Performance Degradation**: > 5s response times
- **Quota Usage**: > 80% of API limits
- **User Impact**: > 10 users affected by same error

Configure alert thresholds in the monitoring dashboard or programmatically:

```typescript
import { AlertManager } from './src/utils/monitoring/alertManager';

const alertManager = AlertManager.getInstance();
alertManager.updateConfig({
  errorRateThreshold: 10, // 10% instead of default 5%
  responseTimeThreshold: 3000, // 3s instead of default 5s
});
```

## 🔍 Advanced Features

### Context Capture

The MCP integration captures rich context for every error:

- **AI Model State**: Current model parameters, recent interactions
- **User Journey**: Navigation flow leading to the error
- **System Performance**: CPU, memory, network conditions
- **API Integration Status**: Rate limits, quota usage, response times

### Pattern Recognition

AI-powered analysis identifies:

- **Cascading Failures**: Related errors across different services
- **Performance Degradation**: Gradual slowdowns before failures
- **User Impact Correlation**: Which user actions trigger most errors
- **Resource Bottlenecks**: API limits, database constraints

### Automated Resolution

- **Smart Suggestions**: AI-recommended fixes based on error patterns
- **Auto-Retry Logic**: Intelligent retry strategies for transient failures
- **Fallback Activation**: Automatic switching to backup services
- **Circuit Breaker**: Prevent cascade failures

## 🛠️ Troubleshooting

### Common Issues

1. **MCP Server Not Connecting**
   - Check auth token validity
   - Verify organization and project names
   - Restart Cursor IDE

2. **Source Maps Not Uploading**
   - Ensure `SENTRY_AUTH_TOKEN` has correct permissions
   - Check that build is running in production mode
   - Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct

3. **Missing Error Context**
   - Verify Sentry initialization in `main.tsx`
   - Check that error boundaries are properly placed
   - Ensure user context is being set

### Debug Mode

Enable debug mode for development:

```env
NODE_ENV=development
VITE_ENABLE_SENTRY_BUILD=true
```

## 📈 Best Practices

### Error Handling

1. **Wrap AI Operations**: Always use try-catch with context reporting
2. **User-Friendly Messages**: Display helpful messages while logging technical details
3. **Graceful Degradation**: Provide fallbacks for AI service failures
4. **Rate Limit Handling**: Implement exponential backoff and user notifications

### Performance Monitoring

1. **Baseline Metrics**: Establish performance baselines for each AI model
2. **Threshold Tuning**: Adjust alert thresholds based on actual usage patterns
3. **Resource Planning**: Use metrics to predict and prevent quota exhaustion
4. **User Experience**: Monitor client-side performance impact

### Security Considerations

1. **Token Security**: Use environment variables for all API keys
2. **Data Sanitization**: Remove sensitive data from error reports
3. **Access Control**: Limit Sentry project access to necessary team members
4. **Compliance**: Ensure error reporting complies with privacy regulations

## 📚 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Cursor IDE MCP Guide](https://docs.cursor.com/mcp)
- [Sentry MCP Server](https://docs.sentry.io/product/sentry-mcp/)

## 🆘 Support

For issues specific to this implementation:
1. Check the monitoring dashboard for system status
2. Review error patterns in Sentry dashboard
3. Use Cursor MCP commands for real-time investigation
4. Check application logs for detailed error context