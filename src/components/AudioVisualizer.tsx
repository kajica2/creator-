'use client'

import { useEffect, useRef, useState } from 'react'

interface VisualizationProps {
  audioData?: Uint8Array
  width?: number
  height?: number
  style?: 'bars' | 'circle' | 'wave' | 'particles'
}

export default function AudioVisualizer({
  audioData,
  width = 800,
  height = 400,
  style = 'bars'
}: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Set canvas size
    canvas.width = width
    canvas.height = height

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      if (audioData) {
        switch (style) {
          case 'bars':
            drawFrequencyBars(ctx, audioData, width, height)
            break
          case 'circle':
            drawCircularVisualizer(ctx, audioData, width, height)
            break
          case 'wave':
            drawWaveform(ctx, audioData, width, height)
            break
          case 'particles':
            drawParticles(ctx, audioData, width, height)
            break
        }
      } else {
        drawPlaceholder(ctx, width, height)
      }

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    setIsAnimating(true)
    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setIsAnimating(false)
    }
  }, [audioData, width, height, style, isAnimating])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg bg-gradient-to-br from-purple-900 via-black to-cyan-900"
        style={{ width: '100%', height: 'auto', maxWidth: width }}
      />

      {/* Style selector */}
      <div className="absolute top-4 right-4 flex gap-2">
        {['bars', 'circle', 'wave', 'particles'].map((visualStyle) => (
          <button
            key={visualStyle}
            onClick={() => {
              // This would need to be passed as a prop or managed by parent
              console.log(`Switch to ${visualStyle} style`)
            }}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              style === visualStyle
                ? 'bg-purple-500 text-white'
                : 'bg-white/20 text-white/70 hover:bg-white/30'
            }`}
          >
            {visualStyle}
          </button>
        ))}
      </div>

      {/* Audio info overlay */}
      <div className="absolute bottom-4 left-4 text-white/80 text-sm">
        <div className="bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Audio</span>
          </div>
          <div className="text-xs text-white/60">
            {audioData ? `${audioData.length} frequency bins` : 'No audio data'}
          </div>
        </div>
      </div>
    </div>
  )
}

function drawFrequencyBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number
) {
  const barWidth = width / data.length

  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * height * 0.8

    // Create gradient for each bar
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
    gradient.addColorStop(0, '#8b5cf6') // Purple
    gradient.addColorStop(0.5, '#06b6d4') // Cyan
    gradient.addColorStop(1, '#f59e0b') // Amber

    ctx.fillStyle = gradient
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
  }
}

function drawCircularVisualizer(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number
) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 4

  ctx.strokeStyle = '#8b5cf6'
  ctx.lineWidth = 2

  for (let i = 0; i < data.length; i++) {
    const angle = (i / data.length) * Math.PI * 2
    const amplitude = (data[i] / 255) * 100

    const x1 = centerX + Math.cos(angle) * radius
    const y1 = centerY + Math.sin(angle) * radius
    const x2 = centerX + Math.cos(angle) * (radius + amplitude)
    const y2 = centerY + Math.sin(angle) * (radius + amplitude)

    // Create gradient for each line
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, '#8b5cf6')
    gradient.addColorStop(1, '#06b6d4')

    ctx.strokeStyle = gradient
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number
) {
  ctx.strokeStyle = '#06b6d4'
  ctx.lineWidth = 3
  ctx.beginPath()

  const sliceWidth = width / data.length
  let x = 0

  for (let i = 0; i < data.length; i++) {
    const v = (data[i] / 255) * height
    const y = height - v

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.stroke()

  // Add glow effect
  ctx.shadowColor = '#06b6d4'
  ctx.shadowBlur = 10
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number
) {
  const particleCount = Math.min(data.length, 100)

  for (let i = 0; i < particleCount; i++) {
    const intensity = data[i] / 255
    const size = intensity * 8 + 2
    const x = (i / particleCount) * width
    const y = height / 2 + (Math.sin(Date.now() / 1000 + i) * intensity * 100)

    // Create radial gradient for particle
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, `rgba(139, 92, 246, ${intensity})`)
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Draw animated placeholder
  const time = Date.now() / 1000

  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])

  for (let i = 0; i < 50; i++) {
    const x = (i / 50) * width
    const y = height / 2 + Math.sin(time + i * 0.1) * 20

    if (i === 0) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()
  ctx.setLineDash([])

  // Add text
  ctx.fillStyle = '#9ca3af'
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('No audio input - Start recording to see visualization', width / 2, height / 2 + 50)
}