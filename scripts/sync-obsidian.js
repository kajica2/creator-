#!/usr/bin/env node

/**
 * Obsidian Vault Sync Script
 * Automatically syncs your project with Obsidian vault
 */

import { ObsidianIntegration } from '../obsidian/ObsidianIntegration.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OBSIDIAN_VAULT_PATH = '/Users/kajicadjuric/Documents/kais_vault';
const PROJECT_NAME = 'Viral Hashtag & Image AI';
const PROJECT_PATH = path.resolve(__dirname, '..');

async function initializeObsidianSync() {
  console.log('🔮 Initializing Obsidian Integration...');

  const config = {
    vaultPath: OBSIDIAN_VAULT_PATH,
    projectName: PROJECT_NAME,
    autoSync: true,
    syncInterval: 5000, // 5 seconds
    folders: {
      projects: 'Projects',
      components: 'Components',
      apis: 'APIs',
      agents: 'Agents',
      documentation: 'Documentation',
      ideas: 'Ideas',
      dailyNotes: 'Daily Notes',
      templates: 'Templates',
      archive: 'Archive',
      media: 'Media',
    },
  };

  try {
    const obsidian = new ObsidianIntegration(config);

    // Initialize vault structure
    console.log('📁 Creating project structure in Obsidian...');
    await obsidian.initializeVault();

    // Sync components
    console.log('🧩 Syncing React components...');
    await obsidian.syncProjectComponents(path.join(PROJECT_PATH, 'components'));

    // Sync APIs
    console.log('🔌 Syncing API documentation...');
    await obsidian.syncAPIs(path.join(PROJECT_PATH, 'api'));

    // Create daily note
    console.log('📝 Creating daily project note...');
    await obsidian.createDailyNote();

    // Export knowledge graph
    const graph = obsidian.exportGraph();
    console.log(`\n📊 Knowledge Graph Statistics:`);
    console.log(`   - Total Notes: ${graph.metrics.totalNodes}`);
    console.log(`   - Total Connections: ${graph.metrics.totalEdges}`);
    console.log(`   - Average Connections: ${graph.metrics.averageConnections.toFixed(2)}`);
    console.log(`   - Orphan Notes: ${graph.metrics.orphanNodes.length}`);

    console.log('\n✅ Obsidian sync complete!');
    console.log(`📍 Vault Location: ${OBSIDIAN_VAULT_PATH}/Projects/${PROJECT_NAME}`);

    // Listen for events
    obsidian.on('note:created', (data) => {
      console.log(`📄 Created note: ${data.note.title}`);
    });

    obsidian.on('sync:complete', (data) => {
      console.log(`🔄 Synced ${data.count} files`);
    });

    // Keep the script running for auto-sync
    console.log('\n🔄 Auto-sync enabled. Press Ctrl+C to stop.');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping Obsidian sync...');
      await obsidian.cleanup();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error initializing Obsidian sync:', error);
    process.exit(1);
  }
}

// Run the sync
initializeObsidianSync();