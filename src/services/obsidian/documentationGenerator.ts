import { AgentDocumentation, DocumentationTemplate } from '../../types/obsidian/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DocumentationGenerator {
  private templates: Map<string, DocumentationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Agent documentation template
    this.templates.set('agent', {
      type: 'agent',
      template: `# {{agentName}} Agent

## Overview
{{description}}

## Capabilities
{{#each capabilities}}
- {{this}}
{{/each}}

## Configuration
\`\`\`json
{{configurationJson}}
\`\`\`

## API Endpoints
{{#each apis}}
### {{method}} {{path}}
{{description}}

**Parameters:**
{{#each parameters}}
- \`{{name}}\` ({{type}}){{#if required}} *required*{{/if}}: {{description}}
{{/each}}

**Responses:**
{{#each responses}}
- {{status}}: {{description}}
{{/each}}

{{/each}}

## Coordination Protocols
{{#each protocols}}
- {{this}}
{{/each}}

## Relationships
{{#each relationships}}
- **{{relationship}}** {{targetAgent}}: {{description}}
{{/each}}

## Performance Metrics
- Average response time: {{avgResponseTime}}ms
- Success rate: {{successRate}}%
- Throughput: {{throughput}} requests/sec

## Troubleshooting
Common issues and solutions:

1. **Agent not responding**: Check if the agent process is running
2. **High latency**: Review resource allocation and scaling settings
3. **Coordination failures**: Verify network connectivity between agents

## Related Documentation
- [[Agent Architecture]]
- [[Coordination Protocols]]
- [[API Reference]]

---
*Last updated: {{lastUpdated}}*
*Auto-generated documentation*
`,
      variables: {}
    });

    // Component documentation template
    this.templates.set('component', {
      type: 'component',
      template: `# {{componentName}} Component

## Overview
{{description}}

## Props Interface
\`\`\`typescript
interface {{componentName}}Props {
{{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};{{#if description}} // {{description}}{{/if}}
{{/each}}
}
\`\`\`

## Usage Example
\`\`\`tsx
import { {{componentName}} } from '{{importPath}}';

function App() {
  return (
    <{{componentName}}
{{#each props}}
      {{name}}={{#if (eq type "string")}}"{{exampleValue}}"{{else}}{{exampleValue}}{{/if}}
{{/each}}
    />
  );
}
\`\`\`

## Features
{{#each features}}
- {{this}}
{{/each}}

## Styling
{{#if hasStyledComponents}}
Uses styled-components for styling. Custom styles can be applied via:
\`\`\`tsx
const StyledComponent = styled({{componentName}})\`
  // Your custom styles
\`;
\`\`\`
{{/if}}

{{#if hasCSS}}
CSS classes available:
{{#each cssClasses}}
- \`.{{this}}\`
{{/each}}
{{/if}}

## Dependencies
{{#each dependencies}}
- {{this}}
{{/each}}

## Testing
Run component tests:
\`\`\`bash
npm test -- {{componentName}}
\`\`\`

## File Location
\`{{filePath}}\`

---
*Last updated: {{lastUpdated}}*
*Auto-generated from source code*
`,
      variables: {}
    });

    // API documentation template
    this.templates.set('api', {
      type: 'api',
      template: `# {{title}} API

## Overview
{{description}}

## Base URL
\`{{baseUrl}}\`

## Authentication
{{authDescription}}

{{#each endpoints}}
## {{method}} {{path}}
{{description}}

### Parameters
{{#if parameters.length}}
{{#each parameters}}
- \`{{name}}\` ({{type}}){{#if required}} *required*{{/if}}: {{description}}
{{/each}}
{{else}}
No parameters required.
{{/if}}

### Request Example
\`\`\`{{requestLanguage}}
{{requestExample}}
\`\`\`

### Response Examples
{{#each responses}}
#### {{status}} - {{description}}
\`\`\`json
{{example}}
\`\`\`
{{/each}}

---
{{/each}}

## Error Handling
All endpoints return standardized error responses:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
\`\`\`

## Rate Limiting
{{rateLimitDescription}}

## SDK Examples
{{#each sdkExamples}}
### {{language}}
\`\`\`{{language}}
{{code}}
\`\`\`
{{/each}}

---
*Last updated: {{lastUpdated}}*
*Auto-generated API documentation*
`,
      variables: {}
    });
  }

  async generateAgentDocumentation(agentConfig: any): Promise<string> {
    const template = this.templates.get('agent');
    if (!template) {
      throw new Error('Agent template not found');
    }

    const variables = {
      agentName: agentConfig.name || 'Unknown Agent',
      description: agentConfig.description || 'No description available',
      capabilities: agentConfig.capabilities || [],
      configurationJson: JSON.stringify(agentConfig.configuration || {}, null, 2),
      apis: agentConfig.apis || [],
      protocols: agentConfig.protocols || ['Claude-Flow coordination', 'SPARC methodology'],
      relationships: agentConfig.relationships || [],
      avgResponseTime: agentConfig.metrics?.avgResponseTime || 'N/A',
      successRate: agentConfig.metrics?.successRate || 'N/A',
      throughput: agentConfig.metrics?.throughput || 'N/A',
      lastUpdated: new Date().toISOString(),
    };

    return this.renderTemplate(template.template, variables);
  }

  async generateComponentDocumentation(componentPath: string): Promise<string> {
    const template = this.templates.get('component');
    if (!template) {
      throw new Error('Component template not found');
    }

    const componentAnalysis = await this.analyzeComponent(componentPath);

    return this.renderTemplate(template.template, componentAnalysis);
  }

  async generateApiDocumentation(apiConfig: any): Promise<string> {
    const template = this.templates.get('api');
    if (!template) {
      throw new Error('API template not found');
    }

    const variables = {
      title: apiConfig.title || 'API',
      description: apiConfig.description || 'API documentation',
      baseUrl: apiConfig.baseUrl || process.env.API_BASE_URL || 'http://localhost:3000',
      authDescription: apiConfig.authDescription || 'Bearer token authentication required',
      endpoints: apiConfig.endpoints || [],
      rateLimitDescription: apiConfig.rateLimitDescription || 'Rate limiting applies',
      sdkExamples: apiConfig.sdkExamples || [],
      requestLanguage: 'bash',
      lastUpdated: new Date().toISOString(),
    };

    return this.renderTemplate(template.template, variables);
  }

  private async analyzeComponent(componentPath: string): Promise<any> {
    try {
      const content = await fs.readFile(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));

      return {
        componentName,
        description: this.extractComponentDescription(content) || `React component for ${componentName}`,
        props: this.extractProps(content),
        features: this.extractFeatures(content),
        hasStyledComponents: content.includes('styled-components'),
        hasCSS: content.includes('className') || content.includes('class='),
        cssClasses: this.extractCssClasses(content),
        dependencies: this.extractDependencies(content),
        importPath: this.getImportPath(componentPath),
        filePath: componentPath,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to analyze component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractComponentDescription(content: string): string | null {
    // Look for JSDoc comments
    const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]*)/);
    if (jsdocMatch) {
      return jsdocMatch[1].trim();
    }

    // Look for component description comment
    const commentMatch = content.match(/\/\/\s*([A-Z][^.\n]*\.?)/);
    if (commentMatch) {
      return commentMatch[1].trim();
    }

    return null;
  }

  private extractProps(content: string): Array<{name: string, type: string, optional: boolean, description?: string}> {
    const props: Array<{name: string, type: string, optional: boolean, description?: string}> = [];

    // Extract interface props
    const interfaceMatch = content.match(/interface\s+\w*Props\s*{([^}]*)}/s);
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propLines = propsContent.split('\n').filter(line => line.trim());

      for (const line of propLines) {
        const propMatch = line.match(/^\s*(\w+)(\?)?:\s*([^;\/]+);?\s*(?:\/\/\s*(.*))?/);
        if (propMatch) {
          props.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: propMatch[3].trim(),
            description: propMatch[4]?.trim(),
          });
        }
      }
    }

    return props;
  }

  private extractFeatures(content: string): string[] {
    const features: string[] = [];

    // Look for common React features
    if (content.includes('useState')) features.push('State management with React hooks');
    if (content.includes('useEffect')) features.push('Side effects with useEffect');
    if (content.includes('useContext')) features.push('Context API integration');
    if (content.includes('memo')) features.push('Performance optimization with React.memo');
    if (content.includes('useCallback')) features.push('Callback memoization');
    if (content.includes('useMemo')) features.push('Value memoization');
    if (content.includes('forwardRef')) features.push('Ref forwarding');
    if (content.includes('Suspense')) features.push('Suspense boundary support');
    if (content.includes('lazy')) features.push('Code splitting with lazy loading');

    // Look for custom features
    if (content.includes('animation')) features.push('Animations');
    if (content.includes('responsive')) features.push('Responsive design');
    if (content.includes('accessibility') || content.includes('aria-')) features.push('Accessibility support');
    if (content.includes('test')) features.push('Unit testing');

    return features;
  }

  private extractCssClasses(content: string): string[] {
    const classes: Set<string> = new Set();

    // Extract className values
    const classMatches = content.matchAll(/className=['"`]([^'"`]+)['"`]/g);
    for (const match of classMatches) {
      const classNames = match[1].split(/\s+/);
      classNames.forEach(cls => classes.add(cls));
    }

    return Array.from(classes);
  }

  private extractDependencies(content: string): string[] {
    const dependencies: Set<string> = new Set();

    // Extract import statements
    const importMatches = content.matchAll(/import.*from\s+['"`]([^'"`]+)['"`]/g);
    for (const match of importMatches) {
      const moduleName = match[1];
      if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        dependencies.add(moduleName);
      }
    }

    return Array.from(dependencies);
  }

  private getImportPath(componentPath: string): string {
    // Convert absolute path to relative import path
    const srcIndex = componentPath.indexOf('/src/');
    if (srcIndex !== -1) {
      return componentPath.substring(srcIndex + 1).replace(/\.(tsx?|jsx?)$/, '');
    }
    return componentPath;
  }

  private renderTemplate(template: string, variables: any): string {
    let rendered = template;

    // Simple template rendering (replace {{variable}} with values)
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Handle arrays with {{#each}} blocks
    rendered = this.renderEachBlocks(rendered, variables);

    // Handle conditionals with {{#if}} blocks
    rendered = this.renderIfBlocks(rendered, variables);

    return rendered;
  }

  private renderEachBlocks(template: string, variables: any): string {
    let rendered = template;

    const eachPattern = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    let match;

    while ((match = eachPattern.exec(template)) !== null) {
      const [fullMatch, arrayName, blockContent] = match;
      const array = variables[arrayName];

      if (Array.isArray(array)) {
        const renderedItems = array.map(item => {
          let itemContent = blockContent;

          if (typeof item === 'object') {
            // Replace object properties
            for (const [key, value] of Object.entries(item)) {
              const regex = new RegExp(`{{${key}}}`, 'g');
              itemContent = itemContent.replace(regex, String(value));
            }
          } else {
            // Replace {{this}} with the item itself
            itemContent = itemContent.replace(/{{this}}/g, String(item));
          }

          return itemContent;
        }).join('');

        rendered = rendered.replace(fullMatch, renderedItems);
      } else {
        rendered = rendered.replace(fullMatch, '');
      }
    }

    return rendered;
  }

  private renderIfBlocks(template: string, variables: any): string {
    let rendered = template;

    const ifPattern = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    let match;

    while ((match = ifPattern.exec(template)) !== null) {
      const [fullMatch, condition, blockContent] = match;
      const value = variables[condition];

      if (value) {
        rendered = rendered.replace(fullMatch, blockContent);
      } else {
        rendered = rendered.replace(fullMatch, '');
      }
    }

    return rendered;
  }

  async generateProjectOverview(): Promise<string> {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let projectInfo: any = {};

    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      projectInfo = JSON.parse(packageContent);
    } catch {
      // Package.json not found or invalid
    }

    return `# ${projectInfo.name || 'Viral Hashtag & Image AI'} Project

## Overview
${projectInfo.description || 'AI-powered viral content generation system with hashtag analysis and multi-agent coordination.'}

## Version
${projectInfo.version || 'Development'}

## Technologies
- React with TypeScript
- Supabase for backend services
- Claude-Flow for agent coordination
- Obsidian for documentation management

## Architecture
The system uses a multi-agent architecture with the following components:

### Agents
- **Video Agent**: Processes and generates video content
- **Audio Agent**: Handles audio processing and generation
- **Live Mixer Agent**: Real-time content mixing and streaming
- **Hashtag Analyzer**: Analyzes trending hashtags and content
- **Content Generator**: Creates viral content based on analysis

### Services
- **Authentication**: Supabase Auth integration
- **Database**: PostgreSQL with Supabase
- **Storage**: File and media storage
- **API**: RESTful API endpoints
- **Documentation**: Obsidian integration for docs

## Quick Start
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Environment Setup
Copy \`.env.example\` to \`.env\` and configure:
- Supabase credentials
- Obsidian API settings
- Agent configuration

## Documentation Structure
- \`/agents/\` - Agent-specific documentation
- \`/components/\` - React component docs
- \`/api/\` - API endpoint documentation
- \`/architecture/\` - System architecture
- \`/deployment/\` - Deployment guides

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes with proper documentation
4. Submit a pull request

## License
${projectInfo.license || 'MIT'}

---
*Last updated: ${new Date().toISOString()}*
*Auto-generated project overview*
`;
  }
}

export const documentationGenerator = new DocumentationGenerator();