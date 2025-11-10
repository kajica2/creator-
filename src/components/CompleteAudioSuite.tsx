'use client'

import { useState, useEffect, useRef } from 'react'
import SimpleAudioRecorder from './SimpleAudioRecorder'
import AudioVisualizer from './AudioVisualizer'
import { audioService } from '../lib/audioService'

export default function CompleteAudioSuite() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioData, setAudioData] = useState<Uint8Array>()
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])
  const [serviceStatus, setServiceStatus] = useState<any>({})
  const [visualizationStyle, setVisualizationStyle] = useState<'bars' | 'circle' | 'wave' | 'particles'>('bars')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Listen for audio data from persistent service
    const handleAudioData = (event: CustomEvent) => {
      setAudioData(event.detail.frequencyData)
    }

    const handleHashtags = (event: any) => {
      if (event.data.type === 'HASHTAGS_GENERATED') {
        setGeneratedHashtags(event.data.data.hashtags)
      }
    }

    const handleServiceHeartbeat = (event: any) => {
      if (event.data.type === 'SERVICE_HEARTBEAT') {
        setServiceStatus(audioService.getServiceStatus())
      }
    }

    window.addEventListener('audioData', handleAudioData as EventListener)
    navigator.serviceWorker?.addEventListener('message', handleHashtags)
    navigator.serviceWorker?.addEventListener('message', handleServiceHeartbeat)

    // Initialize service status
    setServiceStatus(audioService.getServiceStatus())

    return () => {
      window.removeEventListener('audioData', handleAudioData as EventListener)
      navigator.serviceWorker?.removeEventListener('message', handleHashtags)
      navigator.serviceWorker?.removeEventListener('message', handleServiceHeartbeat)
    }
  }, [])

  const startLiveRecording = async () => {
    try {
      const destination = await audioService.startLiveRecording()
      if (destination) {
        setIsRecording(true)

        // Start MediaRecorder for the destination stream
        const mediaRecorder = new MediaRecorder(destination.stream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.start()
        console.log('📹 Started live recording with visualization')
      }
    } catch (error) {
      console.error('Failed to start live recording:', error)
    }
  }

  const stopLiveRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  const generateHashtags = async () => {
    if (audioData) {
      // Convert Uint8Array to Float32Array for processing
      const float32Data = new Float32Array(audioData.length)
      for (let i = 0; i < audioData.length; i++) {
        float32Data[i] = audioData[i] / 255.0
      }

      const hashtags = await audioService.generateViralHashtags(float32Data)
      setGeneratedHashtags(hashtags)

      // Also trigger service worker hashtag generation
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'GENERATE_HASHTAGS',
          data: {
            tempo: 120 + Math.random() * 60,
            frequency: 440 + Math.random() * 1000,
            amplitude: Math.random()
          }
        })
      }
    }
  }

  const playSampleShruti = async () => {
    try {
      const audio = new Audio('/audio/shruti-box-samples/SHRUTI_DRONE_C2.ogg')
      audio.play()
      console.log('🎵 Playing Shruti Box sample')
    } catch (error) {
      console.error('Failed to play sample:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
          Complete Audio Suite
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Record live audio, visualize in real-time, generate viral hashtags, and process your 294 Shruti Box samples
        </p>
      </div>

      {/* Service Status */}
      <div className="bg-gray-900 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Persistent Audio Service Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${serviceStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm">{serviceStatus.isRunning ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Audio Context</div>
            <div className="text-green-400">{serviceStatus.audioContextState || 'suspended'}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Background Tasks</div>
            <div className="text-blue-400">{serviceStatus.backgroundTasks || 0} active</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Service Worker</div>
            <div className="text-purple-400">{serviceStatus.serviceWorkerActive ? 'Active' : 'Inactive'}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Last Update</div>
            <div className="text-cyan-400">{new Date(serviceStatus.timestamp || Date.now()).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Live Recording Controls */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Live Audio Recording</h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={startLiveRecording}
            disabled={isRecording}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <div className={`w-4 h-4 ${isRecording ? 'bg-white animate-pulse' : 'bg-white'} rounded-full`}></div>
            {isRecording ? 'Recording...' : 'Start Live Recording'}
          </button>

          <button
            onClick={stopLiveRecording}
            disabled={!isRecording}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Stop Recording
          </button>

          <button
            onClick={playSampleShruti}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Play Shruti Sample
          </button>
        </div>

        {/* Visualization Style Selector */}
        <div className="flex gap-2 mb-6">
          <span className="text-sm font-medium text-gray-700 self-center mr-3">Visualization:</span>
          {(['bars', 'circle', 'wave', 'particles'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setVisualizationStyle(style)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                visualizationStyle === style
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Real-time Audio Visualization</h2>
        <AudioVisualizer
          audioData={audioData}
          width={800}
          height={400}
          style={visualizationStyle}
        />
      </div>

      {/* Hashtag Generation */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Viral Hashtag Generation</h2>
          <button
            onClick={generateHashtags}
            disabled={!audioData}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Hashtags
          </button>
        </div>

        {generatedHashtags.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {generatedHashtags.map((hashtag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 text-sm rounded-full border border-purple-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(hashtag)}
                >
                  {hashtag}
                </span>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Copy all hashtags:</h3>
              <div className="bg-white p-3 rounded border text-sm text-gray-700 font-mono">
                {generatedHashtags.join(' ')}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedHashtags.join(' '))}
                className="mt-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Copy All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simple Audio Recorder Component */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Simple File Recording</h2>
        <SimpleAudioRecorder />
      </div>

      {/* Audio Sample Library */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Shruti Box Sample Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">Drone Samples</h3>
            <p className="text-sm text-amber-600 mb-3">Continuous drone tones</p>
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors">
              Load Drones
            </button>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Mantra Samples</h3>
            <p className="text-sm text-green-600 mb-3">Sacred chanting sounds</p>
            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors">
              Load Mantras
            </button>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Motoperp Samples</h3>
            <p className="text-sm text-blue-600 mb-3">Rhythmic patterns</p>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
              Load Patterns
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800">Sample Library Stats</h4>
              <p className="text-sm text-gray-600">294 high-quality Shruti Box samples organized and ready</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">294</div>
              <div className="text-sm text-gray-500">Samples</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}