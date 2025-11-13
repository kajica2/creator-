/**
 * Synaptic Symphony - A neural-inspired music and media generation project
 * Features floating hashtag visualization with interactive neural network aesthetics
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgentOrchestrator from '../../api/core/AgentOrchestrator';
import AstrologyAgent from '../../api/agents/AstrologyAgent';
import KaraokeAgent from '../../api/agents/KaraokeAgent';

interface NeuralNode {
  id: string;
  x: number;
  y: number;
  z: number;
  connections: string[];
  value: number;
  label: string;
  color: string;
  size: number;
  velocity: { x: number; y: number; z: number };
  type: 'hashtag' | 'neural' | 'media' | 'sound';
}

interface SynapticConnection {
  source: string;
  target: string;
  strength: number;
  active: boolean;
  pulsePhase: number;
}

export const SynapticSymphony: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);

  const [nodes, setNodes] = useState<NeuralNode[]>([]);
  const [connections, setConnections] = useState<SynapticConnection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set());
  const [neuralActivity, setNeuralActivity] = useState(0);
  const [generatedMedia, setGeneratedMedia] = useState<any>(null);

  // Initialize neural network and floating hashtags
  useEffect(() => {
    initializeNeuralNetwork();
    initializeAudioContext();
    startAnimation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeNeuralNetwork = () => {
    const synapticHashtags = [
      '#SynapticSymphony',
      '#NeuralBeats',
      '#AIComposer',
      '#BrainwaveMusic',
      '#QuantumHarmony',
      '#CognitiveRhythm',
      '#MindMelody',
      '#SynapseSound',
      '#NeuronNotes',
      '#ConsciousnessCode',
    ];

    const mediaNodes = [
      'Astrology',
      'Sound',
      'Song',
      'Image',
      'Karaoke',
      'Mixer',
      'Video',
      'Stream',
    ];

    const neuralNodes: NeuralNode[] = [];
    const synapticConnections: SynapticConnection[] = [];

    // Create hashtag nodes (floating in 3D space)
    synapticHashtags.forEach((tag, i) => {
      const angle = (i / synapticHashtags.length) * Math.PI * 2;
      const radius = 200 + Math.random() * 100;
      const node: NeuralNode = {
        id: `hashtag-${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 100,
        connections: [],
        value: Math.random(),
        label: tag,
        color: `hsl(${280 + i * 20}, 70%, 60%)`,
        size: 15 + Math.random() * 10,
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.2,
        },
        type: 'hashtag',
      };
      neuralNodes.push(node);
    });

    // Create media processing nodes
    mediaNodes.forEach((label, i) => {
      const angle = (i / mediaNodes.length) * Math.PI * 2;
      const radius = 100;
      const node: NeuralNode = {
        id: `media-${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0,
        connections: [],
        value: 0.5,
        label,
        color: `hsl(${180 + i * 30}, 60%, 50%)`,
        size: 20,
        velocity: { x: 0, y: 0, z: 0 },
        type: 'media',
      };
      neuralNodes.push(node);
    });

    // Create neural processing nodes
    for (let i = 0; i < 20; i++) {
      const node: NeuralNode = {
        id: `neural-${i}`,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 200,
        connections: [],
        value: Math.random(),
        label: '',
        color: `hsla(${260}, 50%, 70%, 0.5)`,
        size: 5 + Math.random() * 5,
        velocity: {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.3,
          z: (Math.random() - 0.5) * 0.1,
        },
        type: 'neural',
      };
      neuralNodes.push(node);
    }

    // Create synaptic connections
    neuralNodes.forEach((node, i) => {
      // Connect to 2-4 nearby nodes
      const connectionCount = 2 + Math.floor(Math.random() * 3);
      const nearbyNodes = neuralNodes
        .filter(n => n.id !== node.id)
        .sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(a.x - node.x, 2) +
            Math.pow(a.y - node.y, 2) +
            Math.pow(a.z - node.z, 2)
          );
          const distB = Math.sqrt(
            Math.pow(b.x - node.x, 2) +
            Math.pow(b.y - node.y, 2) +
            Math.pow(b.z - node.z, 2)
          );
          return distA - distB;
        })
        .slice(0, connectionCount);

      nearbyNodes.forEach(target => {
        node.connections.push(target.id);
        synapticConnections.push({
          source: node.id,
          target: target.id,
          strength: Math.random(),
          active: Math.random() > 0.7,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      });
    });

    setNodes(neuralNodes);
    setConnections(synapticConnections);
  };

  const initializeAudioContext = async () => {
    // Lazy load Tone.js only when needed
    const Tone = await import('tone');
    audioContextRef.current = new AudioContext();
    await Tone.start();
  };

  const startAnimation = () => {
    const animate = () => {
      updateNodes();
      renderNeuralNetwork();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const updateNodes = () => {
    setNodes(prevNodes =>
      prevNodes.map(node => {
        if (node.type === 'hashtag' || node.type === 'neural') {
          // Float and drift
          const newX = node.x + node.velocity.x;
          const newY = node.y + node.velocity.y;
          const newZ = node.z + node.velocity.z;

          // Boundary bounce
          const boundary = 300;
          if (Math.abs(newX) > boundary) node.velocity.x *= -1;
          if (Math.abs(newY) > boundary) node.velocity.y *= -1;
          if (Math.abs(newZ) > 150) node.velocity.z *= -1;

          // Neural activation pulse
          const newValue = node.type === 'neural'
            ? 0.5 + 0.5 * Math.sin(Date.now() * 0.001 + node.id.charCodeAt(0))
            : node.value + (Math.random() - 0.5) * 0.1;

          return {
            ...node,
            x: newX,
            y: newY,
            z: newZ,
            value: Math.max(0, Math.min(1, newValue)),
          };
        }
        return node;
      })
    );

    // Update synaptic connections
    setConnections(prevConnections =>
      prevConnections.map(conn => ({
        ...conn,
        active: Math.random() > 0.8 ? !conn.active : conn.active,
        pulsePhase: (conn.pulsePhase + 0.1) % (Math.PI * 2),
        strength: conn.active ? Math.min(1, conn.strength + 0.1) : Math.max(0, conn.strength - 0.05),
      }))
    );

    // Update neural activity level
    setNeuralActivity(prev => {
      const targetActivity = connections.filter(c => c.active).length / connections.length;
      return prev + (targetActivity - prev) * 0.1;
    });
  };

  const renderNeuralNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Sort nodes by Z for depth rendering
    const sortedNodes = [...nodes].sort((a, b) => a.z - b.z);

    // Draw connections
    connections.forEach(conn => {
      const source = nodes.find(n => n.id === conn.source);
      const target = nodes.find(n => n.id === conn.target);
      if (!source || !target) return;

      const perspective = 500;
      const sourceScale = perspective / (perspective - source.z);
      const targetScale = perspective / (perspective - target.z);

      const x1 = centerX + source.x * sourceScale;
      const y1 = centerY + source.y * sourceScale;
      const x2 = centerX + target.x * targetScale;
      const y2 = centerY + target.y * targetScale;

      ctx.beginPath();
      ctx.moveTo(x1, y1);

      // Create curved synaptic connection
      const cpx = (x1 + x2) / 2 + Math.sin(conn.pulsePhase) * 20;
      const cpy = (y1 + y2) / 2 + Math.cos(conn.pulsePhase) * 20;
      ctx.quadraticCurveTo(cpx, cpy, x2, y2);

      // Synaptic pulse effect
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      const pulsePosition = (Math.sin(conn.pulsePhase) + 1) / 2;

      if (conn.active) {
        gradient.addColorStop(0, `hsla(280, 100%, 60%, 0)`);
        gradient.addColorStop(pulsePosition, `hsla(280, 100%, 70%, ${conn.strength})`);
        gradient.addColorStop(1, `hsla(200, 100%, 60%, 0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = conn.strength * 3;
      } else {
        ctx.strokeStyle = `hsla(260, 50%, 40%, 0.1)`;
        ctx.lineWidth = 0.5;
      }

      ctx.stroke();
    });

    // Draw nodes
    sortedNodes.forEach(node => {
      const perspective = 500;
      const scale = perspective / (perspective - node.z);
      const x = centerX + node.x * scale;
      const y = centerY + node.y * scale;
      const size = node.size * scale;

      // Node glow effect
      if (node.type === 'hashtag' || node.type === 'media') {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        glowGradient.addColorStop(0, `${node.color}40`);
        glowGradient.addColorStop(1, `${node.color}00`);
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);

      if (node.type === 'neural') {
        // Neural nodes pulse with activity
        ctx.fillStyle = `hsla(260, 70%, ${50 + node.value * 30}%, ${0.3 + node.value * 0.5})`;
      } else {
        ctx.fillStyle = node.color;
      }

      ctx.fill();

      // Hover effect
      if (hoveredNode === node.id) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw labels for hashtags and media nodes
      if (node.label && (node.type === 'hashtag' || node.type === 'media')) {
        ctx.fillStyle = '#fff';
        ctx.font = `${12 * scale}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.type === 'hashtag') {
          // Floating hashtag effect
          const floatY = y + Math.sin(Date.now() * 0.001 + node.id.charCodeAt(0)) * 5;
          ctx.fillText(node.label, x, floatY - size - 10);
        } else {
          ctx.fillText(node.label, x, y);
        }
      }
    });

    // Draw neural activity indicator
    const activityBarWidth = 200;
    const activityBarHeight = 10;
    const activityX = canvas.width - activityBarWidth - 20;
    const activityY = 20;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(activityX, activityY, activityBarWidth, activityBarHeight);

    const gradient = ctx.createLinearGradient(activityX, 0, activityX + activityBarWidth * neuralActivity, 0);
    gradient.addColorStop(0, 'hsl(280, 100%, 50%)');
    gradient.addColorStop(1, 'hsl(200, 100%, 50%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(activityX, activityY, activityBarWidth * neuralActivity, activityBarHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText('Neural Activity', activityX, activityY - 5);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Check if click is on a node
    nodes.forEach(node => {
      const perspective = 500;
      const scale = perspective / (perspective - node.z);
      const nodeX = centerX + node.x * scale;
      const nodeY = centerY + node.y * scale;
      const nodeSize = node.size * scale;

      const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
      if (distance <= nodeSize) {
        if (node.type === 'hashtag') {
          handleHashtagClick(node);
        } else if (node.type === 'media') {
          handleMediaNodeClick(node);
        }
      }
    });
  };

  const handleHashtagClick = (node: NeuralNode) => {
    setSelectedHashtags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.label)) {
        newSet.delete(node.label);
      } else {
        newSet.add(node.label);
      }
      return newSet;
    });

    // Create neural pulse effect
    createNeuralPulse(node.id);

    // Play sound
    playNodeSound(node);
  };

  const handleMediaNodeClick = async (node: NeuralNode) => {
    if (isGenerating) return;

    setIsGenerating(true);
    createNeuralPulse(node.id);

    try {
      // Trigger media generation pipeline
      const orchestrator = AgentOrchestrator.getInstance();
      const result = await orchestrator.executePipeline(
        'media-generation',
        {
          hashtags: Array.from(selectedHashtags),
          mediaType: node.label.toLowerCase(),
          neuralActivity,
        }
      );

      setGeneratedMedia(result);

      // Create success pulse
      createSuccessPulse();
    } catch (error) {
      console.error('Media generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const createNeuralPulse = (nodeId: string) => {
    // Activate connections from this node
    setConnections(prev =>
      prev.map(conn => {
        if (conn.source === nodeId || conn.target === nodeId) {
          return { ...conn, active: true, strength: 1 };
        }
        return conn;
      })
    );

    // Deactivate after delay
    setTimeout(() => {
      setConnections(prev =>
        prev.map(conn => {
          if (conn.source === nodeId || conn.target === nodeId) {
            return { ...conn, active: false };
          }
          return conn;
        })
      );
    }, 1000);
  };

  const createSuccessPulse = () => {
    // Activate all connections briefly
    setConnections(prev =>
      prev.map(conn => ({ ...conn, active: true, strength: 1 }))
    );

    setTimeout(() => {
      setConnections(prev =>
        prev.map(conn => ({ ...conn, active: false, strength: 0.5 }))
      );
    }, 500);
  };

  const playNodeSound = async (node: NeuralNode) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    // Different sounds for different node types
    if (node.type === 'hashtag') {
      oscillator.frequency.value = 440 + node.id.charCodeAt(7) * 10;
      oscillator.type = 'sine';
    } else if (node.type === 'media') {
      oscillator.frequency.value = 220 + node.id.charCodeAt(6) * 20;
      oscillator.type = 'triangle';
    } else {
      oscillator.frequency.value = 880;
      oscillator.type = 'square';
    }

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let foundHover = false;
    nodes.forEach(node => {
      if (node.type !== 'hashtag' && node.type !== 'media') return;

      const perspective = 500;
      const scale = perspective / (perspective - node.z);
      const nodeX = centerX + node.x * scale;
      const nodeY = centerY + node.y * scale;
      const nodeSize = node.size * scale;

      const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
      if (distance <= nodeSize) {
        setHoveredNode(node.id);
        foundHover = true;
      }
    });

    if (!foundHover) {
      setHoveredNode(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-gray-950 overflow-hidden">
      {/* Neural Network Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />

      {/* Floating UI Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md rounded-lg p-4 max-w-sm">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          Synaptic Symphony
        </h2>
        <p className="text-gray-300 text-sm mb-4">
          Click hashtags to select, then click media nodes to generate content
        </p>

        {/* Selected Hashtags */}
        <div className="mb-4">
          <h3 className="text-white text-sm font-semibold mb-2">Selected Hashtags:</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedHashtags).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {selectedHashtags.size === 0 && (
              <span className="text-gray-500 text-xs italic">None selected</span>
            )}
          </div>
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2" />
              <span className="text-blue-300 text-sm">Generating media...</span>
            </div>
          </div>
        )}

        {/* Generated Media Preview */}
        {generatedMedia && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
            <h3 className="text-green-300 text-sm font-semibold mb-2">Generated Content</h3>
            <p className="text-gray-300 text-xs">
              {generatedMedia.length} items created
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => initializeNeuralNetwork()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Reset Network
        </button>
        <button
          onClick={() => createSuccessPulse()}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          Neural Pulse
        </button>
      </div>

      {/* Project Badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-0.5 rounded-full">
          <div className="bg-gray-900 px-4 py-2 rounded-full">
            <span className="text-white font-bold">Project: Synaptic Symphony</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynapticSymphony;