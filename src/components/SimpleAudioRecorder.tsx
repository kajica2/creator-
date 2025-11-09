'use client'

import { useState, useRef } from 'react'

export default function SimpleAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const downloadRecording = () => {
    if (audioURL) {
      const a = document.createElement('a')
      a.href = audioURL
      a.download = 'recording.webm'
      a.click()
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Audio Recorder</h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="px-6 py-3 bg-red-500 text-white rounded-lg disabled:opacity-50"
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>

      {audioURL && (
        <div className="space-y-4">
          <audio controls src={audioURL} className="w-full" />
          <button
            onClick={downloadRecording}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Download Recording
          </button>
        </div>
      )}
    </div>
  )
}