# Binary Ring Neural Connection Engine

An intelligent neural connection system that automatically analyzes Binary Ring projects and creates meaningful relationships between them using machine learning and similarity analysis.

## 🧠 Overview

The Binary Ring Neural Connection Engine uses advanced machine learning techniques to understand and connect generative art projects based on:

- **Mathematical Concepts** - Fractals, attractors, chaos theory, complexity
- **Visual Aesthetics** - Color patterns, motion, organic vs geometric forms
- **Technical Implementation** - Algorithm complexity, performance, interactivity
- **User Interaction Patterns** - Contemplative, educational, therapeutic qualities

## ✨ Features

- 🤖 **Neural Network Analysis** - TensorFlow.js autoencoder for feature learning
- 🔍 **Multi-dimensional Similarity** - 64-dimensional feature vectors
- 📊 **Real-time Analytics** - Network insights and project rankings
- 🔗 **Dynamic Collections** - Automatically generated project groupings
- 🌐 **REST API** - Complete API for integration
- 📈 **Learning System** - Improves with user feedback
- 📄 **Multiple Export Formats** - JSON, GraphML, DOT, CSV
- ⚡ **High Performance** - Optimized for large catalogs

## 🚀 Quick Start

### Installation

```bash
cd projects/binary-ring/neural
npm install
```

### Basic Usage

```bash
# Start the full system with API server
npm start

# Analyze all projects
node index.js analyze

# Get recommendations for a specific project
node index.js recommendations "buddhabrot" 5

# Export connection graph
node index.js export json
```

### Programmatic Usage

```javascript
import BinaryRingNeuralSystem from './index.js';

const system = new BinaryRingNeuralSystem({
  apiPort: 3001,
  enableAPI: true,
  enableAutoUpdate: true
});

await system.initialize();

// Get project recommendations
const recommendations = system.getRecommendations('node.garden', 5);

// Get network analytics
const analytics = system.getAnalytics();

// Generate dynamic collections
const collections = system.generateCollections();
```

## 📡 API Endpoints

### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/search?q=term` - Search projects

### Relationships

- `GET /api/projects/:id/related` - Get related projects
- `GET /api/similarity/:id1/:id2` - Calculate similarity
- `POST /api/connections/:id1/:id2/feedback` - Update connection (requires API key)

### Collections

- `GET /api/collections` - List all collections
- `GET /api/collections/:id` - Get collection details
- `POST /api/collections/generate` - Generate new collection (requires API key)

### Analytics

- `GET /api/analytics` - Network analytics
- `GET /api/analytics/project/:id` - Project-specific analytics

### Training

- `POST /api/train` - Retrain neural network (requires API key)
- `GET /api/train/status` - Get training status

### Export

- `GET /api/export/:format` - Export graph (json|graphml|dot|csv)
- `GET /api/export/features/csv` - Export feature matrix

## 🔬 How It Works

### 1. Feature Extraction

The system analyzes each project across four dimensions:

**Mathematical Features (16 dimensions)**
- Attractor detection, fractal analysis, chaos level
- Complexity scores, dimensionality, entropy
- Symmetry, recursion, emergence levels

**Visual Features (16 dimensions)**
- Color complexity, motion intensity
- Organic vs geometric scores
- Texture, rhythm, balance analysis

**Technical Features (16 dimensions)**
- Algorithm complexity, performance scores
- Interactivity levels, optimization
- Code quality metrics

**Interaction Features (16 dimensions)**
- Engagement and contemplative scores
- Accessibility, learning curves
- Emotional connection, therapeutic value

### 2. Neural Network Learning

- **Autoencoder Architecture**: 64 → 128 → 64 → 32 → 64 → 128 → 64
- **Training**: Unsupervised learning on project features
- **Output**: 32-dimensional learned representations
- **Similarity**: Cosine similarity + weighted feature matching

### 3. Connection Generation

- Similarity matrix calculation for all project pairs
- Threshold-based connection filtering (default: 0.3)
- Dynamic clustering for collection generation
- User feedback integration for continuous learning

## 📊 Analytics & Insights

The system provides comprehensive analytics:

```json
{
  "totalProjects": 36,
  "totalConnections": 847,
  "averageSimilarity": 0.423,
  "clusterCount": 8,
  "mostConnected": {
    "projectId": "node.garden",
    "connectionCount": 12,
    "project": { "title": "Node Garden" }
  },
  "categoryDistribution": {
    "fractals": 8,
    "networks": 4,
    "organic": 6,
    "attractors": 5,
    "emotional": 3,
    "particles": 4
  },
  "neuralNetworkStatus": {
    "isTrained": true,
    "architecture": "Autoencoder (64->32->64)"
  }
}
```

## 🎯 Example Analysis

For project "buddhabrot":

```json
{
  "related": [
    {
      "id": "deep.lorenz",
      "similarity": 0.847,
      "reason": "Both explore mathematical attractors; Similar complexity scores",
      "project": {
        "title": "Deep Lorenz",
        "category": "attractors"
      }
    },
    {
      "id": "henon.phase.deep",
      "similarity": 0.732,
      "reason": "Both feature fractal mathematics; Similar computational intensity",
      "project": {
        "title": "Henon Phase Deep",
        "category": "attractors"
      }
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables

```bash
PORT=3001                    # API server port
BINARY_RING_API_KEY=secret   # API key for protected endpoints
NODE_ENV=development         # Environment mode
```

### System Options

```javascript
const options = {
  catalogPath: '../catalog/artist-catalog.json',
  apiPort: 3001,
  enableAPI: true,
  enableAutoUpdate: true,
  updateInterval: 30 * 60 * 1000, // 30 minutes
  corsOrigins: ['http://localhost:3000'],
  minSimilarityThreshold: 0.3,
  maxConnections: 10,
  neuralNetworkEpochs: 100
};
```

## 📈 Performance

- **Initialization**: ~2-5 seconds for 36 projects
- **Neural Training**: ~30-60 seconds (100 epochs)
- **Similarity Calculation**: ~10ms per project pair
- **API Response Time**: <100ms for most endpoints
- **Memory Usage**: ~200-500MB depending on catalog size

## 🔮 Advanced Features

### Dynamic Collection Generation

The system automatically creates collections by clustering similar projects:

```javascript
const collections = system.generateCollections();
// Returns auto-generated collections like:
// "Contemplative Fractals", "Interactive Networks", "Complex Mathematical"
```

### User Feedback Learning

Improve recommendations with user feedback:

```javascript
// User indicates projects are related
system.addFeedback('project1', 'project2', 'very_relevant');

// System learns and adjusts future recommendations
```

### Multi-format Export

Export connection graphs for external analysis:

```bash
# JSON for web applications
node index.js export json

# GraphML for Gephi, Cytoscape
node index.js export graphml

# DOT for Graphviz visualization
node index.js export dot

# CSV for Excel, R, Python analysis
node index.js export csv
```

## 🧪 Testing & Development

### Run Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev  # Starts with debugging enabled
```

### Code Formatting

```bash
npm run format
npm run lint
```

## 📚 Integration Examples

### React Component

```jsx
import { useEffect, useState } from 'react';

function ProjectRecommendations({ projectId }) {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/related`)
      .then(res => res.json())
      .then(data => setRecommendations(data.related));
  }, [projectId]);

  return (
    <div>
      <h3>Related Projects</h3>
      {recommendations.map(rec => (
        <div key={rec.id}>
          <h4>{rec.project.title}</h4>
          <p>Similarity: {(rec.similarity * 100).toFixed(1)}%</p>
          <p>{rec.reason}</p>
        </div>
      ))}
    </div>
  );
}
```

### Python Analysis

```python
import requests
import json

# Get network analytics
response = requests.get('http://localhost:3001/api/analytics')
analytics = response.json()

# Export connection graph for NetworkX analysis
response = requests.get('http://localhost:3001/api/export/json')
graph_data = response.json()

# Analyze with NetworkX
import networkx as nx
G = nx.from_dict_of_dicts(graph_data)
centrality = nx.betweenness_centrality(G)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: This README and inline code comments
- **Issues**: Report bugs and feature requests on GitHub
- **Examples**: See `/examples` directory for usage patterns

---

**Binary Ring Collective** - Exploring the intersection of mathematics, computation, and visual aesthetics through algorithmic art.