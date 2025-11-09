#!/usr/bin/env node

/**
 * Binary Ring Development Server
 * Serves the project with live reload and development features
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const projectRoot = path.join(__dirname, '..');

// Middleware for CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files
app.use(express.static(projectRoot));

// API endpoints
app.get('/api/projects', (req, res) => {
    try {
        const catalogPath = path.join(projectRoot, 'apps', 'catalog.json');
        if (fs.existsSync(catalogPath)) {
            const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
            res.json(catalog);
        } else {
            res.json({ apps: [], experiments: [], stats: { totalProjects: 0 } });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/keywords', (req, res) => {
    try {
        // Mock keyword data for development
        const keywords = [
            { id: '1', keyword: 'audio-reactive', category: 'Audio', definition: 'Visual elements that respond to sound' },
            { id: '2', keyword: 'particle-systems', category: 'Visual', definition: 'Simulation of many small objects' },
            { id: '3', keyword: 'generative-art', category: 'Creative', definition: 'Art created through algorithms' },
            { id: '4', keyword: 'real-time', category: 'Interactive', definition: 'Processing without delay' },
            { id: '5', keyword: 'mindfulness', category: 'Wellness', definition: 'Present-moment awareness' }
        ];
        res.json(keywords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
    const indexPath = path.join(projectRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Binary Ring - Dev Server</title>
                <style>
                    body {
                        font-family: system-ui, sans-serif;
                        background: #0a0a0a;
                        color: white;
                        padding: 2rem;
                        text-align: center;
                    }
                    .logo { font-size: 3rem; margin-bottom: 1rem; }
                    .links { margin-top: 2rem; }
                    .links a {
                        color: #4f46e5;
                        text-decoration: none;
                        margin: 0 1rem;
                        padding: 0.5rem 1rem;
                        border: 1px solid #4f46e5;
                        border-radius: 6px;
                        display: inline-block;
                        margin: 0.5rem;
                    }
                    .links a:hover { background: #4f46e5; color: white; }
                </style>
            </head>
            <body>
                <div class="logo">🔮</div>
                <h1>Binary Ring Development Server</h1>
                <p>Server running on port ${PORT}</p>
                <div class="links">
                    <a href="/apps/">Apps</a>
                    <a href="/experiments/">Experiments</a>
                    <a href="/templates/">Templates</a>
                    <a href="/keyword-system/standalone-demo.html">Keyword System</a>
                    <a href="/keyword-system/debug-simple.html">Debug Keywords</a>
                </div>
                <p style="margin-top: 2rem; color: #666;">
                    Available at: <a href="http://localhost:${PORT}" style="color: #4f46e5;">http://localhost:${PORT}</a>
                </p>
            </body>
            </html>
        `);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Binary Ring Dev Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving from: ${projectRoot}`);
    console.log(`🔧 Environment: development`);
    console.log(`\n🎯 Quick Links:`);
    console.log(`   Apps: http://localhost:${PORT}/apps/`);
    console.log(`   Experiments: http://localhost:${PORT}/experiments/`);
    console.log(`   Templates: http://localhost:${PORT}/templates/`);
    console.log(`   Keyword System: http://localhost:${PORT}/keyword-system/standalone-demo.html`);
    console.log(`\n💡 Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dev server...');
    process.exit(0);
});