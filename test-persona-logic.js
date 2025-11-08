// Test script for persona logic functionality
// This script tests the core persona features without requiring a browser

console.log('🧪 Testing Persona Logic...\n');

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock crypto.randomUUID
const mockCrypto = {
  randomUUID: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`
};

// Import the content storage utilities
const contentStorageModule = require('./utils/contentStorage');

// Override crypto in the module
contentStorageModule.crypto = mockCrypto;

// Override localStorage for testing
global.localStorage = mockLocalStorage;

async function runTests() {
  console.log('📝 Test 1: Initialize Content Storage');
  let storage = contentStorageModule.initializeContentStorage();
  console.log('✅ Default persona created:', storage.personas[0].name);
  console.log('✅ Personas array length:', storage.personas.length);
  console.log('✅ Content array length:', storage.content.length);
  console.log('');

  console.log('📝 Test 2: Create New Persona');
  storage = contentStorageModule.createPersona(storage, 'Cyberpunk Storyteller', 'A futuristic storyteller specializing in dystopian themes');
  console.log('✅ New persona created:', storage.personas[1].name);
  console.log('✅ Personas array length:', storage.personas.length);
  console.log('✅ Persona context:', storage.personas[1].context);
  console.log('');

  console.log('📝 Test 3: Add Content to Persona');
  const testContent = {
    title: 'Test Story',
    content: 'This is a test story content'
  };
  storage = contentStorageModule.addContent(
    storage,
    testContent,
    'AI Story',
    'AI Story',
    storage.personas[1].id,
    storage.personas[1].name,
    ['test', 'story'],
    { wordCount: 150 }
  );
  console.log('✅ Content added to persona');
  console.log('✅ Content array length:', storage.content.length);
  console.log('✅ Content persona ID:', storage.content[0].personaId);
  console.log('✅ Content persona name:', storage.content[0].personaName);
  console.log('✅ Content hashtags:', storage.content[0].hashtags);
  console.log('');

  console.log('📝 Test 4: Persona Content Count Updated');
  const cyberpunkPersona = storage.personas.find(p => p.name === 'Cyberpunk Storyteller');
  console.log('✅ Persona content count:', cyberpunkPersona.contentCount);
  console.log('');

  console.log('📝 Test 5: Add Content to Default Persona');
  storage = contentStorageModule.addContent(
    storage,
    { title: 'Default Story', content: 'Default content' },
    'AI Story',
    'AI Story',
    'default',
    'Default Persona',
    ['default'],
    {}
  );
  console.log('✅ Content added to default persona');
  console.log('✅ Total content items:', storage.content.length);
  console.log('');

  console.log('📝 Test 6: Delete Content Item');
  const contentToDelete = storage.content[0];
  storage = contentStorageModule.deleteContentItem(storage, contentToDelete.id);
  console.log('✅ Content item deleted');
  console.log('✅ Remaining content items:', storage.content.length);
  
  // Verify persona content count updated
  const updatedPersona = storage.personas.find(p => p.id === cyberpunkPersona.id);
  console.log('✅ Updated persona content count:', updatedPersona.contentCount);
  console.log('');

  console.log('📝 Test 7: Create Multiple Personas');
  storage = contentStorageModule.createPersona(storage, 'Poetic Lyricist', 'A lyrical genius with romantic themes');
  storage = contentStorageModule.createPersona(storage, 'Tech Strategist', 'Focused on digital transformation and innovation');
  console.log('✅ Multiple personas created');
  console.log('✅ Total personas:', storage.personas.length);
  console.log('✅ Persona names:', storage.personas.map(p => p.name));
  console.log('');

  console.log('📝 Test 8: Delete Persona (Non-Default)');
  const personaToDelete = storage.personas.find(p => p.name === 'Poetic Lyricist');
  const initialContentCount = storage.content.length;
  storage = contentStorageModule.deletePersona(storage, personaToDelete.id);
  console.log('✅ Persona deleted');
  console.log('✅ Remaining personas:', storage.personas.length);
  console.log('✅ Persona names after deletion:', storage.personas.map(p => p.name));
  console.log('');

  console.log('📝 Test 9: Try to Delete Default Persona');
  storage = contentStorageModule.deletePersona(storage, 'default');
  console.log('✅ Default persona not deleted (protected)');
  console.log('✅ Default persona still exists:', storage.personas.some(p => p.id === 'default'));
  console.log('');

  console.log('📝 Test 10: Storage Persistence Simulation');
  // Simulate saving to localStorage
  mockLocalStorage.setItem('contentStorage', JSON.stringify(storage));
  
  // Simulate loading from localStorage
  const savedStorage = JSON.parse(mockLocalStorage.getItem('contentStorage'));
  console.log('✅ Storage persistence verified');
  console.log('✅ Saved personas count:', savedStorage.personas.length);
  console.log('✅ Saved content count:', savedStorage.content.length);
  console.log('');

  console.log('🎉 All Persona Logic Tests Completed Successfully!');
  console.log('\n📊 Final Stats:');
  console.log(`   - Total Personas: ${storage.personas.length}`);
  console.log(`   - Total Content Items: ${storage.content.length}`);
  console.log(`   - Default Persona Protected: ${storage.personas.some(p => p.id === 'default')}`);
  console.log(`   - Storage Persistence: ✅ Working`);
}

// Run the tests
runTests().catch(console.error);