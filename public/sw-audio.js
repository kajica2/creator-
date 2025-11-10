// Service Worker for Audio Processing
// Runs in background even when main app is closed

const CACHE_NAME = 'audio-service-v1'
const AUDIO_CACHE = 'audio-samples-v1'

// Cache audio samples for offline use
const AUDIO_FILES = [
  '/audio/shruti-box-samples/SHRUTI_DRONE_C2.ogg',
  '/audio/shruti-box-samples/SHRUTI_MANTRA_A2.ogg',
  '/audio/shruti-box-samples/SHRUTI_MOTOPERP_G2_DYN1_RR1.ogg'
]

self.addEventListener('install', (event) => {
  console.log('🔧 Audio Service Worker installing...')

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/src/lib/audioService.js',
          '/src/components/SimpleAudioRecorder.js'
        ])
      }),
      caches.open(AUDIO_CACHE).then((cache) => {
        return cache.addAll(AUDIO_FILES)
      })
    ])
  )
})

self.addEventListener('activate', (event) => {
  console.log('✅ Audio Service Worker activated')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

self.addEventListener('fetch', (event) => {
  // Handle audio file requests
  if (event.request.url.includes('/audio/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
    return
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})

// Background audio processing
self.addEventListener('message', (event) => {
  const { type, data } = event.data

  switch (type) {
    case 'PROCESS_AUDIO':
      processAudioInBackground(data)
      break

    case 'GENERATE_HASHTAGS':
      generateHashtagsInBackground(data)
      break

    case 'ANALYZE_FREQUENCY':
      analyzeFrequencyInBackground(data)
      break

    default:
      console.log('Unknown message type:', type)
  }
})

function processAudioInBackground(audioData) {
  console.log('🎵 Processing audio in background...')

  // Simulate audio processing
  setTimeout(() => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'AUDIO_PROCESSED',
          data: {
            processed: true,
            timestamp: Date.now(),
            features: {
              amplitude: Math.random(),
              frequency: 440 + Math.random() * 1000,
              tempo: 120 + Math.random() * 60
            }
          }
        })
      })
    })
  }, 1000)
}

function generateHashtagsInBackground(audioFeatures) {
  console.log('🏷️ Generating hashtags in background...')

  const baseHashtags = [
    '#ViralAudio', '#AIMusic', '#AudioArt', '#SoundDesign',
    '#MusicProduction', '#AudioVisualization', '#DigitalArt'
  ]

  const contextualHashtags = []

  if (audioFeatures.tempo > 120) {
    contextualHashtags.push('#HighEnergy', '#Dance', '#Upbeat')
  } else {
    contextualHashtags.push('#Chill', '#Ambient', '#Relaxing')
  }

  if (audioFeatures.frequency > 1000) {
    contextualHashtags.push('#HighFreq', '#Bright', '#Crisp')
  } else {
    contextualHashtags.push('#Deep', '#Bass', '#LowEnd')
  }

  const hashtags = [...baseHashtags, ...contextualHashtags].slice(0, 15)

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'HASHTAGS_GENERATED',
        data: {
          hashtags,
          timestamp: Date.now()
        }
      })
    })
  })
}

function analyzeFrequencyInBackground(frequencyData) {
  console.log('📊 Analyzing frequency data in background...')

  // Simple frequency analysis
  let bass = 0
  let mid = 0
  let treble = 0

  const dataLength = frequencyData.length
  const bassEnd = Math.floor(dataLength * 0.1)
  const midEnd = Math.floor(dataLength * 0.6)

  for (let i = 0; i < bassEnd; i++) {
    bass += frequencyData[i]
  }

  for (let i = bassEnd; i < midEnd; i++) {
    mid += frequencyData[i]
  }

  for (let i = midEnd; i < dataLength; i++) {
    treble += frequencyData[i]
  }

  bass /= bassEnd
  mid /= (midEnd - bassEnd)
  treble /= (dataLength - midEnd)

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'FREQUENCY_ANALYZED',
        data: {
          bass,
          mid,
          treble,
          timestamp: Date.now()
        }
      })
    })
  })
}

// Periodic background tasks
setInterval(() => {
  console.log('🔄 Audio Service Worker heartbeat')

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SERVICE_HEARTBEAT',
        data: {
          timestamp: Date.now(),
          status: 'active'
        }
      })
    })
  })
}, 30000) // Every 30 seconds