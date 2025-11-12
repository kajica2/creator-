import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Music,
  Image,
  Video,
  Brain,
  Palette,
  Mic,
  Heart,
  Star,
  Wand2,
  Search,
  ExternalLink,
  Calendar,
  Hash
} from 'lucide-react';

interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  lastModified: string;
  featured?: boolean;
  url?: string;
  icon: React.ReactNode;
}

const apps: App[] = [
  {
    id: 'dailyscope',
    name: 'DailyScope',
    description: 'An astrology app that generates daily horoscope narratives using Gemini. Users can select their zodiac sign to receive a personalized, mystical, and insightful horoscope for the day.',
    category: 'Lifestyle',
    lastModified: '0 minutes ago',
    featured: true,
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'ai-hashtag-generator',
    name: 'AI Hashtag Generator',
    description: 'Upload a photo and let AI analyze it to generate relevant and engaging hashtags for your social media posts.',
    category: 'AI Tools',
    lastModified: '0 minutes ago',
    featured: true,
    icon: <Hash className="w-5 h-5" />
  },
  {
    id: 'ai-gender-swap',
    name: 'AI Gender Swap',
    description: 'An application that allows users to upload an image and swap the gender of the person in it using a text prompt.',
    category: 'AI Tools',
    lastModified: '2 minutes ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'sonic-sculptor',
    name: 'Sonic Sculptor',
    description: 'A modular creative sandbox to sculpt real-time visuals driven by audio. Upload your own audio or use a microphone to generate mesmerizing particle effects.',
    category: 'Audio Visual',
    lastModified: '2 minutes ago',
    featured: true,
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'spiritual-option',
    name: 'Spiritual Option Landing Page',
    description: 'A modern and professional landing page for the "Spiritual Option" e-workshop, designed to attract and convert users interested in spiritual living.',
    category: 'Web Design',
    lastModified: '2 hours ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'ai-slideshow',
    name: 'AI Slideshow Video Creator',
    description: 'Enter a topic to automatically generate a script, images, and narration for a short slideshow video.',
    category: 'Video',
    lastModified: '6 hours ago',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'lyrical-vision',
    name: 'Lyrical Vision',
    description: 'An application that generates a series of evocative images inspired by the lyrics of a song and a user-defined artistic style.',
    category: 'AI Tools',
    lastModified: '7 hours ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'routine-stack',
    name: 'RoutineStack',
    description: 'A flexible routine-building application that allows users to compose daily and spiritual rituals using modular, reusable skills.',
    category: 'Productivity',
    lastModified: '17 hours ago',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'adhd-strategy',
    name: 'ADHD App Strategy Dashboard',
    description: 'An interactive dashboard to explore and compare 10 potential app store positioning strategies for a routine and habit builder application tailored for individuals with ADHD.',
    category: 'Analytics',
    lastModified: '18 hours ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'audio-orb',
    name: 'Audio Orb',
    description: 'Speak, and the orb responds. An interactive experience powered by the Live Audio API.',
    category: 'Audio',
    lastModified: '1 day ago',
    icon: <Mic className="w-5 h-5" />
  },
  {
    id: 'viral-video-studio',
    name: 'Viral Video AI Studio',
    description: 'An application to generate viral photos and videos. Users can upload or capture a photo, edit it with AI using text prompts.',
    category: 'Video',
    lastModified: '1 day ago',
    featured: true,
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'tensor-mutator',
    name: 'Tensor Mutator',
    description: 'An AI-powered muse for avant-garde artists. Input a simple concept and watch it expand into multiple creative dimensions.',
    category: 'AI Tools',
    lastModified: '2 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'audio-journal',
    name: 'Audio Journal AI',
    description: 'A simple and elegant audio journaling application that uses AI to transcribe your spoken thoughts into text entries in real-time.',
    category: 'Productivity',
    lastModified: '2 days ago',
    icon: <Mic className="w-5 h-5" />
  },
  {
    id: 'rhythm-canvas',
    name: 'Rhythm Canvas: AI Music Visualizer',
    description: 'An interactive, real-time audio visualizer that transforms music into captivating visual art.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'aurasphere',
    name: 'AuraSphere - Generative Music & Visualizer',
    description: 'An advanced music visualizer and generative audio workstation with AI-powered sound synthesis, ambient soundscapes, and healing frequencies.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    featured: true,
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'astro-vysio',
    name: 'Astro-Vysio',
    description: 'An audio-reactive music visualizer influenced by cosmic data. Upload media, configure a generative engine, blend visual effects with AI.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'pattern-tools',
    name: 'Pattern Tools: Your Mental OS',
    description: 'A science-backed mental health toolkit that treats your mind like software that can be debugged, updated, and optimized.',
    category: 'Health',
    lastModified: '2 days ago',
    featured: true,
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'bloom-wellness',
    name: 'Bloom: Your Daily 5-Minute Wellness Garden',
    description: 'A gamified wellness app that helps you build positive micro-habits. Nurture your virtual garden by completing small, daily tasks.',
    category: 'Health',
    lastModified: '2 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'webxr-mind-map',
    name: 'WebXR Mind Map Interface Concept',
    description: 'An application that generates a detailed description of an intuitive WebXR interface for creating deep, multi-layered mind maps using the Gemini API.',
    category: 'AI Tools',
    lastModified: '2 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'kinetic-typography',
    name: 'Copy of Copy of Kinetic Typography Animation math22',
    description: 'An aesthetically pleasing web application that animates words appearing and filling a black canvas with timed easing, creating a kinetic typography effect.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'interactive-creativity-models',
    name: 'Interactive Creativity Models',
    description: 'An interactive web application that allows users to explore the 42 Models of Creativity. Click on any model in the diagram to get a detailed explanation generated by the Gemini API.',
    category: 'AI Tools',
    lastModified: '2 days ago',
    featured: true,
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'self-discovery-ai',
    name: 'Self-Discovery AI Companion',
    description: 'An AI-powered chat application designed to facilitate self-reflection and personal growth. Users can explore various topics like shadow work, self-awareness, and personal development through guided prompts and open conversation with a Gemini-powered AI.',
    category: 'Health',
    lastModified: '2 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'kosmos-mindful',
    name: 'Kosmos - A Mindful Journey',
    description: 'A guided mindfulness and philosophical journaling app that visualizes your personal growth as a journey through historical and metaphysical maps of the cosmos.',
    category: 'Health',
    lastModified: '2 days ago',
    featured: true,
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'aurasonix',
    name: 'AuraSonix - AI Generative Music',
    description: 'An AI-powered music generation tool for creating ambient soundscapes, healing frequencies, and evolutionary audio textures. Features real-time audio processing, deep customization via mutation sliders, and presets for cosmic and generative music.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    featured: true,
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'audio-orb-2',
    name: 'Audio Orb',
    description: 'Speak, and the orb responds. An interactive experience powered by the Live Audio API.',
    category: 'Audio',
    lastModified: '2 days ago',
    featured: true,
    icon: <Mic className="w-5 h-5" />
  },
  {
    id: 'kosmos-mindful-2',
    name: 'Kosmos - A Mindful Journey',
    description: 'A guided mindfulness and philosophical journaling app that visualizes your personal growth as a journey through historical and metaphysical maps of the cosmos.',
    category: 'Health',
    lastModified: '2 days ago',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'frequency-healing',
    name: 'Frequency Healing System',
    description: 'A comprehensive frequency healing platform integrating binaural beats and Solfeggio frequencies using cutting-edge sound therapy technologies via the Web Audio API.',
    category: 'Health',
    lastModified: '2 days ago',
    featured: true,
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'ai-music-visualizer-daw',
    name: 'AI Music Visualizer & DAW',
    description: 'An AI-powered music generation and visualization tool with deep customization for creating ambient, generative, and healing soundscapes. Integrates features like evolutionary sound mutation, classic ambient presets, and cosmic harmony generation.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'generative-music-studio',
    name: 'Generative Music Studio',
    description: 'Create generative music using the Improv RNN model from Google Magenta. Adjust the temperature to control the creativity and randomness of the melody, then play back the results.',
    category: 'Audio Visual',
    lastModified: '2 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'wobbly-stack',
    name: 'Wobbly Stack',
    description: 'A fun and addictive physics-based stacking game. Tap to drop the blocks and build the tallest tower you can. Perfect for a quick game on your mobile device!',
    category: 'Games',
    lastModified: '2 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'gemini-voice-conversation',
    name: 'Gemini Voice Conversation',
    description: 'A web application that allows users to have a real-time voice conversation with the Gemini AI model, featuring live audio streaming and transcription.',
    category: 'AI Tools',
    lastModified: '2 days ago',
    icon: <Mic className="w-5 h-5" />
  },
  {
    id: 'persona-hashtag-generator',
    name: 'Persona Hashtag Generator',
    description: 'Enter a URL containing creative persona templates or descriptions, and this app will use Gemini to generate optimized sets of hashtags for social media discoverability for each identified persona.',
    category: 'AI Tools',
    lastModified: '2 days ago',
    icon: <Hash className="w-5 h-5" />
  },
  {
    id: 'adhd-discipline-forge',
    name: '28-Day ADHD Discipline Forge',
    description: 'A 28-day discipline plan generator designed for men with ADHD, providing structured, daily tasks to build focus, organization, and sustainable habits using the Gemini API.',
    category: 'Productivity',
    lastModified: '2 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'suno-style-builder',
    name: 'Suno Style Builder',
    description: 'A tool to craft detailed and nuanced music style prompts for Suno AI, focusing on generating trippy microhouse and textural electronic music.',
    category: 'AI Tools',
    lastModified: '2 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'ai-instagram-post-generator',
    name: 'AI Instagram Post Generator',
    description: 'An AI-powered tool to help content creators generate engaging Instagram captions and hashtags by analyzing an uploaded image. Supports multiple languages and tones for customized content.',
    category: 'AI Tools',
    lastModified: '3 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'ai-caption-generator',
    name: 'AI Caption Generator',
    description: 'A mobile application UI that uses AI to generate engaging Instagram captions based on selected hashtags and user-defined settings.',
    category: 'AI Tools',
    lastModified: '3 days ago',
    icon: <Hash className="w-5 h-5" />
  },
  {
    id: 'generative-harmony-ai',
    name: 'Generative Harmony AI',
    description: 'An interactive web application that uses Google\'s Magenta.js ImprovRNN model to generate generative music in real-time. Users can control the musical temperature or randomness with a slider, creating unique melodic improvisations based on a chord progression.',
    category: 'Audio Visual',
    lastModified: '3 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'ai-persona-settings',
    name: 'AI Persona Settings',
    description: 'A mobile settings screen to configure an AI persona with a dark, cosmic theme. Users can select from predefined personas and fine-tune settings like formality, emoji use, and sentence length.',
    category: 'AI Tools',
    lastModified: '3 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'gemini-photo-web',
    name: 'Copy of Gemini Photo web',
    description: 'Upload black and white photos to be professionally colorized and enhanced to high-quality, razor-sharp portraits using the Gemini API. Supports batch processing and easy downloads.',
    category: 'AI Tools',
    lastModified: '3 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'momentum-routine-architect',
    name: 'Momentum: The Routine Architect',
    description: 'A comprehensive productivity application designed to help users build routines, manage tasks, track habits, and gain insights into their productivity through a guided, architect-like experience. Integrates AI-powered coaching to help users adapt and improve.',
    category: 'Productivity',
    lastModified: '4 days ago',
    featured: true,
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'veo-studio',
    name: 'Veo Studio',
    description: 'Describe any scene and get a stunning video in seconds. An effortless video generator powered by Veo.',
    category: 'Video',
    lastModified: '5 days ago',
    featured: true,
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'ai-interior-designer',
    name: 'AI Interior Designer',
    description: 'An AI-powered interior design assistant. Users upload a photo of their room, chat with an AI about their design preferences, and receive a visually transformed image of their space.',
    category: 'AI Tools',
    lastModified: '5 days ago',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'startup-valuation-predictor',
    name: 'Startup Valuation Predictor',
    description: 'An advanced UI to predict the valuation of your startup using AI. Input your startup\'s key metrics to receive an estimated valuation and rationale from a simulated venture capitalist.',
    category: 'Analytics',
    lastModified: '5 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'talking-head-video',
    name: 'Talking Head Video Generator',
    description: 'Upload a photo, record your voice, and generate an animated video using Gemini.',
    category: 'Video',
    lastModified: '6 days ago',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'routinestack-2',
    name: 'RoutineStack',
    description: 'A composable routine builder designed for neurodiverse and spiritual users. Build flexible daily rituals with reusable skills, timers, and AI-powered suggestions to foster focus and well-being.',
    category: 'Productivity',
    lastModified: '6 days ago',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'routinestack-3',
    name: 'RoutineStack',
    description: 'A flexible routine-building application that allows users to compose daily and spiritual rituals using modular, reusable skills, designed with neurodiversity in mind.',
    category: 'Productivity',
    lastModified: '6 days ago',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'hdl-page-generator',
    name: 'HDL Page Generator - Multi-Agent Flow',
    description: 'A web application that visualizes a multi-agent workflow for scraping business ideas and generating comprehensive High-Detail Layout (HDL) pages with market analysis and data visualizations.',
    category: 'Web Design',
    lastModified: '6 days ago',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'routinestack-4',
    name: 'RoutineStack',
    description: 'A web application for building flexible, composable daily and spiritual routines using reusable skills, designed with a neurodiverse-first approach.',
    category: 'Productivity',
    lastModified: '6 days ago',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'photorealistic-identity',
    name: 'Photorealistic Identity Preserver',
    description: 'An advanced image generator that preserves the identity, facial features, and natural skin texture of people from a source photo while allowing creative modifications to background, clothing, and style based on a text prompt.',
    category: 'AI Tools',
    lastModified: '6 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'gemini-photo-enhancer',
    name: 'Gemini Photo Enhancer',
    description: 'Upload black and white photos to be professionally colorized and enhanced to high-quality, razor-sharp portraits using the Gemini API. Supports batch processing and easy downloads.',
    category: 'AI Tools',
    lastModified: '6 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'lotus-points-navigator',
    name: 'Lotus Points Navigator',
    description: 'An interactive 3D human anatomy atlas based on Keylontic Science. The app displays a model of the human body, highlighting the 48 Embodied Lotus Points and their corresponding meridian lines.',
    category: 'Health',
    lastModified: '6 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'meridian-systems',
    name: 'Meridian Systems - 48 Lotus Points',
    description: 'An interactive visualization of the 48 Embodied Lotus Points, mapping the density and etheric-ethos control centers of the human meridian system.',
    category: 'Health',
    lastModified: '6 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'momentum-routine-2',
    name: 'Momentum: The Routine Architect',
    description: 'A comprehensive productivity application to help users build routines, manage tasks, track habits, and gain momentum in their daily lives.',
    category: 'Productivity',
    lastModified: '7 days ago',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'kosmos-mindful-3',
    name: 'Kosmos - A Mindful Journey',
    description: 'A guided mindfulness and philosophical journaling app that visualizes your personal growth as a journey through historical and metaphysical maps of the cosmos, framed as an alchemical path of self-discovery.',
    category: 'Health',
    lastModified: '8 days ago',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'soul-map-navigator',
    name: 'Soul Map Navigator',
    description: 'An interactive web application for self-study and exploration based on Zoran Minov\'s Map of the Human Soul. Users can click on different concepts from the map to receive detailed explanations and reflection prompts generated by the Gemini API, facilitating a personal journey of self-discovery.',
    category: 'Health',
    lastModified: '8 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'psychemap',
    name: 'PsycheMap: Your Inner Compass',
    description: 'An interactive, AI-powered journaling app that helps you visualize and understand your inner world based on the Map of the Human Soul. Log your thoughts and feelings to see how they impact your emotions, needs, and identity on a dynamic, personal map.',
    category: 'Health',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'rauch-idea-generator',
    name: 'Rauch Idea Generator',
    description: 'An AI-powered product idea generator that channels the spirit of Guillermo Rauch to spark viral, creative, and developer-centric concepts.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'kilo-code',
    name: 'Kilo Code - Workflow AI',
    description: 'A landing page for Kilo Code, a workflow-native coding assistant that treats every development task as an intelligent, recoverable, long-running workflow, powered by Gemini.',
    category: 'Web Design',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'routine-mastery',
    name: 'Routine Mastery',
    description: 'A comprehensive productivity and well-being application to analyze and master daily and weekly routines, track habits, and leverage cognitive science principles for peak performance.',
    category: 'Productivity',
    lastModified: '8 days ago',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'flowstate-adhd',
    name: 'FlowState - The Gen Z ADHD Productivity App',
    description: 'TikTok meets productivity - ADHD-friendly routines that actually vibe with your brain. A productivity app that celebrates your chaos while gently organizing it, featuring a Dopamine Menu, AI-powered Brain Dump, and a gamified Chaos Score.',
    category: 'Productivity',
    lastModified: '8 days ago',
    featured: true,
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'ai-interaction-system',
    name: 'AI Interaction System',
    description: 'A sophisticated AI interaction framework with multiple persona modules and visual styles. It allows users to switch between analytical, creative, and advisory modes, each with a unique UI/UX, to get tailored AI responses.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'flowstate-ai-coach',
    name: 'FlowState - AI Productivity Coach',
    description: 'An AI productivity coach that uses simulated biometric feedback to help you work with your brain, not against it. It adjusts your task list, suggests breaks, and helps you find your flow, specifically designed for ADHD & neurodivergent minds.',
    category: 'Productivity',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'generative-ui-ideator',
    name: 'Generative UI Ideator',
    description: 'An interactive playground to explore and experiment with prompt engineering strategies for generative UI, inspired by Guillermo Rauch\'s principles. Select a strategy, customize the prompt, and generate AI-powered ideas.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'silverroutine',
    name: 'SilverRoutine - Cognitive Care for Active Seniors',
    description: 'Your trusted daily companion for maintaining independence and mental sharpness. SilverRoutine helps seniors stay on top of daily tasks, manage medications, and keep their minds active with engaging memory exercises and life story recording, all in an accessible, easy-to-use interface.',
    category: 'Health',
    lastModified: '8 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'ai-interaction-system-2',
    name: 'AI Interaction System',
    description: 'A showcase of different AI interaction styles and applications, demonstrating various personas, modes, and content processing capabilities with a sophisticated and modern user interface.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'web3-visual-styles',
    name: 'Web 3.0 Visual Style Showcase',
    description: 'An interactive showcase of five distinct Web 3.0 visual styles: Cyber Luxury, Neon Underground, Organic Flow, Minimal Brutalism, and Cosmic Maximalism. Explore unique UI components and animation languages for each theme.',
    category: 'Web Design',
    lastModified: '8 days ago',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'ai-interaction-system-3',
    name: 'AI Interaction System',
    description: 'A dynamic AI interface with multiple personas and visual modes for different tasks, providing a rich and responsive user experience based on the context of the conversation.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'flowstate-variations',
    name: 'FlowState AI Variations',
    description: 'An AI-powered app that generates 5 different marketing variations for a productivity app called FlowState, showcasing different angles like ADHD focus, peak performance, and burnout prevention.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'echo-chamber-research',
    name: 'Echo Chamber - Research Any Topic',
    description: 'An AI-powered multi-source analysis tool for writers, creators, and researchers to get nuanced, balanced perspectives on any topic, complete with credibility analysis and source citations.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    featured: true,
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'echo-chamber-learn',
    name: 'Echo Chamber - Learn Every Side',
    description: 'An AI-powered debate tool that presents multiple perspectives on any topic to help users escape their echo chambers, identify biases, and foster critical thinking.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'echo-chamber-debate',
    name: 'Echo Chamber - AI Debate Tool',
    description: 'Input any topic and watch AI personas representing different viewpoints debate it in real-time. Understand all sides of complex issues through animated, conversational arguments.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'code-duel',
    name: 'Code Duel',
    description: 'A gamified learning platform to level up your programming skills. Solve coding challenges, battle friends, collect achievements, and get real-time hints and explanations from an AI coach.',
    category: 'Games',
    lastModified: '8 days ago',
    featured: true,
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'persona-studio',
    name: 'Persona Studio',
    description: 'An AI character builder for creators to design, customize, and chat with unique personas for their creative projects like novels, games, and brand identities.',
    category: 'AI Tools',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'vibe-check',
    name: 'Vibe Check - Daily Mood Journal',
    description: 'A beautifully animated, conversational mood tracker that uses AI to understand your emotional patterns and suggest personalized interventions—no clinical jargon, just vibes.',
    category: 'Health',
    lastModified: '8 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'fontcraft-strategy',
    name: 'FontCraft Strategy Explorer',
    description: 'An interactive dashboard to explore and compare 10 potential app store positioning strategies for a handwriting-to-font application. Visualize features, monetization models, and marketing hooks for each concept.',
    category: 'Analytics',
    lastModified: '8 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'aura-recorder',
    name: 'Copy of Aura - recorder loop',
    description: 'A digital canvas for your thoughts. Add, arrange, and reflect on positive affirmations in a serene, interactive space. Get AI-powered suggestions and summaries to explore your mindset.',
    category: 'Health',
    lastModified: '8 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'cognicare-routine',
    name: 'CogniCare Routine Helper',
    description: 'A cognitive routine management app to help users organize and track their daily tasks and routines with a clean, intuitive interface.',
    category: 'Health',
    lastModified: '9 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'adhd-coping-quiz',
    name: 'ADHD Coping Style Quiz',
    description: 'An interactive quiz to help users discover their potential ADHD traits and coping mechanisms, with personalized insights generated by the Gemini API. This is for informational purposes and not a clinical diagnosis.',
    category: 'Health',
    lastModified: '9 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'rankrise',
    name: 'RankRise',
    description: 'A mobile-first SEO Score Optimizer that simplifies complex SEO data into actionable insights, helping users turn their SEO scores into success stories.',
    category: 'Analytics',
    lastModified: '9 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'creative-concept-expander',
    name: 'Creative Concept Expander',
    description: 'An application that takes a creative concept and expands it into a detailed scene, narrative layers, and evocative similes using the Gemini API.',
    category: 'AI Tools',
    lastModified: '9 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'ai-live-avatar',
    name: 'AI Live Avatar Creator',
    description: 'Use your webcam to generate a personalized 2D avatar with AI, and then control it in real-time with your facial expressions.',
    category: 'AI Tools',
    lastModified: '9 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'text-encoding-game',
    name: 'Multi-Level Text Encoding Brainpower Game',
    description: 'An interactive brain-training game where you decode encrypted text challenges generated by an AI. Test and improve your cognitive skills across three difficulty levels.',
    category: 'Games',
    lastModified: '9 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'gemini-encoding-game',
    name: 'Gemini Encoding Game',
    description: 'An interactive game where users decode cryptic phrases generated by AI and speak their answers. The app uses Gemini to transcribe the users voice and scores them based on accuracy and speed.',
    category: 'Games',
    lastModified: '9 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'p5js-playground',
    name: 'p5js playground',
    description: 'Generate, edit, and preview interactive p5.js art and games simply by chatting with Gemini.',
    category: 'AI Tools',
    lastModified: '10 days ago',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'gemini-image-magic',
    name: 'Gemini Image Magic',
    description: 'An application that allows users to edit images using text prompts powered by the Gemini 2.5 Flash Image model. Upload an image, describe your edit, and let AI bring your vision to life.',
    category: 'AI Tools',
    lastModified: '10 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'ai-product-architect',
    name: 'AI Product Architect',
    description: 'An AI-powered tool that recommends a tailored tech stack, architecture, and implementation guides based on your project goals and team skills.',
    category: 'AI Tools',
    lastModified: '10 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'aura-mindful-canvas',
    name: 'Aura - The Mindful Canvas',
    description: 'A digital canvas for your thoughts. Add, arrange, and reflect on positive affirmations in a serene, interactive space. Get AI-powered suggestions and summaries to explore your mindset.',
    category: 'Health',
    lastModified: '10 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'suno-6',
    name: 'Copy of SUNO 6',
    description: 'An interactive tool to craft detailed music generation prompts for Trippy Microhouse in the style of Suno AI, allowing users to customize rhythm, melody, texture, and atmosphere.',
    category: 'AI Tools',
    lastModified: '10 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'product-mockup-studio',
    name: 'Product Mockup Studio',
    description: 'Upload your logo to see it on product mockups, then use text prompts to edit the image with AI or generate new images from scratch.',
    category: 'AI Tools',
    lastModified: '10 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'attention-sequencer',
    name: 'Attention Sequencer',
    description: 'A generative music application that visualizes and sonifies the process of linear attention. Watch as the state matrix evolves and generates a unique audio-visual sequence based on mathematical formulas.',
    category: 'Audio Visual',
    lastModified: '10 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'cognicare-routine-2',
    name: 'CogniCare Routine Helper',
    description: 'An AI-powered, mobile-first web application designed to help users build and maintain healthy daily routines, featuring medication reminders, habit tracking, and cognitive wellness tools like sound healing.',
    category: 'Health',
    lastModified: '11 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'cognicare-routine-3',
    name: 'CogniCare Routine Helper',
    description: 'An application to help individuals create and follow daily routines with step-by-step guidance and audio prompts, designed for low cognitive load and inspired by care for TBI survivors.',
    category: 'Health',
    lastModified: '11 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'angular-drum-machine',
    name: 'Angular Drum Machine',
    description: 'A responsive drum machine built with Angular and Tailwind CSS. Play sounds by clicking the pads or using your keyboard keys (A, S, D, F, G, H, J, K).',
    category: 'Audio',
    lastModified: '12 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'mindful-words',
    name: 'Mindful Words',
    description: 'A simple, calming application that displays a sequence of inspirational words to promote focus and mindfulness, with smooth fade transitions.',
    category: 'Health',
    lastModified: '12 days ago',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'word-weaver-wizardry',
    name: 'Word Weaver Wizardry',
    description: 'An interactive web application that demonstrates and allows users to experiment with different word arrangement and text wrapping algorithms, from simple greedy approaches to advanced, AI-powered content-aware layouts using Gemini.',
    category: 'AI Tools',
    lastModified: '12 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'kinetic-affirmations',
    name: 'Kinetic Affirmations',
    description: 'An immersive kinetic typography animator that brings affirmations to life through organic word movement and layered visual poetry. Customize affirmations, word lists, and animation parameters for a unique mindfulness experience.',
    category: 'Audio Visual',
    lastModified: '12 days ago',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'creative-studio-ai',
    name: 'Creative Studio AI',
    description: 'An AI-powered creative suite for text manipulation and image generation. Inspired by TextFX, this app provides writers, poets, and artists with tools for language experimentation, image creation, and visual editing.',
    category: 'AI Tools',
    lastModified: '12 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'batch-photo-styler',
    name: 'Batch Photo Styler',
    description: 'An application to upload multiple photos and apply a consistent artistic style to all of them using Gemini.',
    category: 'AI Tools',
    lastModified: '12 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'paint-a-place',
    name: 'Paint A Place',
    description: 'Transform any Google Maps location into a stunning watercolor painting with Nano Banana.',
    category: 'AI Tools',
    lastModified: '12 days ago',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'textfx-studio',
    name: 'TextFX Studio',
    description: 'An AI-powered web application inspired by Googles TextFX that empowers users to creatively manipulate text, generate poetry, and explore literary forms using various interactive modules.',
    category: 'AI Tools',
    lastModified: '12 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'media-merger',
    name: 'Media Merger',
    description: 'A powerful and intuitive web application that enables users to seamlessly merge multiple video and audio files with professional-grade controls and a real-time preview.',
    category: 'Video',
    lastModified: '12 days ago',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'batch-photo-equalizer',
    name: 'Copy of Copy of Batch Photo equalizer',
    description: 'Batch photo processing application for equalizing and enhancing multiple images at once.',
    category: 'AI Tools',
    lastModified: '12 days ago',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'consciousness-programming',
    name: 'Consciousness Programming Interface',
    description: 'An immersive web application that combines sacred geometry visualization, Shepard tone sound healing, and AI-generated affirmations to create a unique experience for consciousness exploration and programming.',
    category: 'Health',
    lastModified: '13 days ago',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'suno-style-fusion',
    name: 'Suno Style Fusion Generator',
    description: 'Generate creative music style descriptions for Raga, Bhangra, Trap, and Hip Hop fusion genres. Perfect for crafting prompts for music AI like Suno.',
    category: 'AI Tools',
    lastModified: '13 days ago',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'spiral-word-cloud',
    name: 'Spiral Word Cloud Generator',
    description: 'An Angular application that generates a word cloud by placing words on a canvas using a spiral algorithm to avoid overlaps, creating visually appealing text arrangements.',
    category: 'Web Design',
    lastModified: '13 days ago',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'ai-text-summarizer',
    name: 'AI Text Summarizer',
    description: 'A sleek and efficient tool to summarize long texts into concise, easy-to-read summaries using the Gemini API. Input your text and get a brief summary in seconds.',
    category: 'AI Tools',
    lastModified: '13 days ago',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'gemini-creative-suite',
    name: 'Gemini Creative Suite',
    description: 'An all-in-one creative application leveraging the Gemini API for AI-powered image editing, real-time voice conversations, and text-to-speech functionality.',
    category: 'AI Tools',
    lastModified: '13 days ago',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'ai-rhythm-machine',
    name: 'AI Rhythm Machine',
    description: 'An interactive 16-step drum machine that uses AI to generate beats from text descriptions. Features classic drum sounds, tempo control, and preset patterns.',
    category: 'Audio',
    lastModified: 'Oct 28, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'gemini-image-inpainter',
    name: 'Gemini Image Inpainter',
    description: 'An intuitive web application that leverages the Gemini 2.5 Flash Image API to allow users to edit images with simple text prompts. Upload an image, describe your desired change—like add a retro filter or remove the person in the background—and see the magic happen.',
    category: 'AI Tools',
    lastModified: 'Oct 28, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'gemini-image-editor',
    name: 'Gemini Image Editor',
    description: 'Edit images using natural language prompts powered by the Gemini 2.5 Flash Image model. Remove noise, sharpen details, upscale, apply filters, and more.',
    category: 'AI Tools',
    lastModified: 'Oct 28, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'ai-font-creator',
    name: 'AI Font Creator',
    description: 'An AI-powered tool that allows users to upload an image of handwritten letters, recognizes the characters, and generates a custom font.',
    category: 'AI Tools',
    lastModified: 'Oct 26, 2025',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'quantum-resonance-audio',
    name: 'Quantum Resonance Audio',
    description: 'An advanced audio synthesizer that generates healing frequencies based on quantum-inspired principles like scalar waves, toroidal fields, and sacred geometry harmonics.',
    category: 'Audio',
    lastModified: 'Oct 26, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'sevdah-lyric-weaver',
    name: 'Sevdah Lyric Weaver',
    description: 'An application that generates soulful song lyrics in the style of traditional sevdah and introspective folk, using AI. Provide a style, mood, and descriptive tags to craft your masterpiece.',
    category: 'AI Tools',
    lastModified: 'Oct 26, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'media-merger-2',
    name: 'Media Merger',
    description: 'A web application to seamlessly merge multiple video and audio files with professional-grade controls and a real-time preview. Select your media files, arrange them on the timeline, and simulate an export process.',
    category: 'Video',
    lastModified: 'Oct 26, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'media-merger-3',
    name: 'Media Merger',
    description: 'A web application to seamlessly merge multiple video and audio files with professional-grade controls and a real-time preview. Select your media files, arrange them on the timeline, and simulate an export process.',
    category: 'Video',
    lastModified: 'Oct 26, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'batch-photo-resizer',
    name: 'Copy of Batch Photo resizer',
    description: 'Batch photo resizing application for processing multiple images with custom dimensions.',
    category: 'AI Tools',
    lastModified: 'Oct 25, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'document-strategy-analyzer',
    name: 'Document Strategy Analyzer',
    description: 'An application that analyzes technical and business documents to extract key strategic insights, constraints, recommendations, and technologies using the Gemini API.',
    category: 'Analytics',
    lastModified: 'Oct 25, 2025',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'talking-avatar-generator',
    name: 'Talking Avatar Generator',
    description: 'An application that turns any image into a talking avatar. Upload a photo, provide the text you want it to say, and the AI will generate a video of the avatar speaking.',
    category: 'Video',
    lastModified: 'Oct 19, 2025',
    featured: true,
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'rhythm-canvas',
    name: 'Rhythm Canvas',
    description: 'An intuitive, template-driven platform for creating beautiful sound-reactive visualizations. Upload your audio, select a visual style, customize it in real-time, and watch your music come to life.',
    category: 'Audio Visual',
    lastModified: 'Oct 19, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'multi-agent-swarm',
    name: 'Multi-Agent Swarm System',
    description: 'An application that dynamically creates and coordinates specialized AI agents using the Gemini API to complete complex user-defined tasks.',
    category: 'AI Tools',
    lastModified: 'Oct 19, 2025',
    featured: true,
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'raga-ai-music',
    name: 'Raga AI Music Generator',
    description: 'An AI-powered music generator that creates lofi and ambient tracks based on Indian Ragas. Users can select presets or customize their own compositions, with Gemini translating musical concepts into an audible experience via the Web Audio API.',
    category: 'Audio Visual',
    lastModified: 'Oct 19, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'suno-advanced-prompt',
    name: 'Suno Advanced Prompt Crafter',
    description: 'An expert tool to craft detailed, multi-layered prompts for AI music generation, inspired by advanced techniques. Leverage structured blocks, emotion-led section tagging, and AI-powered suggestions to create intentional and professionally produced tracks.',
    category: 'AI Tools',
    lastModified: 'Oct 17, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'raga-fusion-architect',
    name: 'Raga Fusion Architect',
    description: 'An AI-powered guide for musicians to explore Indian classical ragas and create innovative fusion music. Get suggestions on ragas, genres, instrumentation, and technical details to inspire your next composition.',
    category: 'Audio Visual',
    lastModified: 'Oct 17, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'docusonify',
    name: 'DocuSonify',
    description: 'Pretvorite svoje dokumente u tekstove pesama, poglavlje po poglavlje, koristeći moć veštačke inteligencije. Nalepite svoj tekst i gledajte kako se analizira i kreativno pretvara u niz pesama.',
    category: 'AI Tools',
    lastModified: 'Oct 17, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'celestial-base',
    name: 'Celestial Base',
    description: 'An advanced polyphonic web synthesizer designed for creating deep, atmospheric bass sounds and celestial textures. Features multiple oscillators, ADSR envelope, filter, LFO, and built-in effects, all powered by a high-performance, low-latency Web Audio engine.',
    category: 'Audio',
    lastModified: 'Oct 17, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'angular-groovebox',
    name: 'Angular Groovebox',
    description: 'An interactive drum machine and step sequencer built with Angular and the Web Audio API. Create your own beats with classic drum sounds in this modern, responsive groovebox.',
    category: 'Audio',
    lastModified: 'Oct 17, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'promptdj',
    name: 'PromptDJ',
    description: 'Steer a continuous stream of music with text prompts',
    category: 'Audio Visual',
    lastModified: 'Oct 17, 2025',
    featured: true,
    icon: <Music className="w-5 h-5" />
  },
  {
    id: 'veo-3-gallery',
    name: 'Veo 3 Gallery',
    description: 'Explore a gallery of stunning Veo videos and remix their prompts to create your own.',
    category: 'Video',
    lastModified: 'Oct 17, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'synapse-creative',
    name: 'Synapse Creative Suite',
    description: 'A landing page for Synapse Creative Suite, a revolutionary native macOS application that combines AI-powered creative intelligence with multimodal interaction capabilities.',
    category: 'Web Design',
    lastModified: 'Oct 16, 2025',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'hsf-video-fx',
    name: 'HSF Video FX Engine',
    description: 'A powerful video effects engine for real-time visual parameter automation using a chained envelope system with 30 high-quality smoothing function (HSF) interpolation presets.',
    category: 'Video',
    lastModified: 'Oct 15, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'html-to-plain',
    name: 'HTML to Plain Text Converter',
    description: 'A Chrome extension to strip all styling and scripts from the active web page, extracting the main content into clean, readable plain text.',
    category: 'Productivity',
    lastModified: 'Oct 15, 2025',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'grafiti-extractor',
    name: 'grafiti extractor',
    description: 'An application to upload multiple photos and extract Serbian ethno embroidery-style vector patterns as SVG files.',
    category: 'AI Tools',
    lastModified: 'Oct 14, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'ethno-embroidery',
    name: 'Ethno Embroidery Pattern Extractor',
    description: 'An application to upload multiple photos and extract Serbian ethno embroidery-style vector patterns as SVG files.',
    category: 'AI Tools',
    lastModified: 'Oct 13, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'mediasim',
    name: 'MediaSim',
    description: 'Create and combine AI media, blending Veo and Imagen on a single canvas.',
    category: 'AI Tools',
    lastModified: 'Oct 11, 2025',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'angular-video-fx',
    name: 'Angular Video FX Engine',
    description: 'An advanced, client-side video processing application for applying real-time effects and animations to videos. Features a dark-themed, intuitive UI with a timeline, effect controls, and a high-performance canvas-based rendering engine.',
    category: 'Video',
    lastModified: 'Oct 10, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'ai-tech-stack',
    name: 'AI Tech Stack Comparator',
    description: 'An application that uses AI to analyze, compare, and generate detailed breakdowns of different technology stacks for software development projects.',
    category: 'AI Tools',
    lastModified: 'Oct 10, 2025',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'ai-vibecoding',
    name: 'AI Vibecoding Trend Tracker',
    description: 'An app to track and synthesize the latest trends in AI-assisted coding, prompt engineering, and autonomous workflows. Generate and manage your trend logs with AI-powered insights.',
    category: 'AI Tools',
    lastModified: 'Oct 10, 2025',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'self-correcting-code',
    name: 'Self-Correcting Code Agent',
    description: 'A web application that simulates a self-correcting AI code agent. The agent generates code based on a prompt, analyzes its own work for errors or improvements, and provides a corrected version, showcasing a continuous maintenance cycle.',
    category: 'AI Tools',
    lastModified: 'Oct 10, 2025',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'gdsl-ai-remixer',
    name: 'GDSL AI Image Remixer',
    description: 'Upload an image and use AI to remix it based on your text prompts. This app uses Google Gemini to first analyze your image and prompt to create a new, detailed prompt, and then uses Imagen to generate the final masterpiece.',
    category: 'AI Tools',
    lastModified: 'Oct 10, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'envelope-astro-vysio',
    name: 'envelope Astro-Vysio',
    description: 'A generative art application that creates unique, audio-reactive music videos from user-provided media, with an optional Astrological Engine that uses real-time astronomical data to influence the visuals.',
    category: 'Audio Visual',
    lastModified: 'Oct 9, 2025',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'celestial-symphony',
    name: 'Celestial Symphony',
    description: 'An interactive web application that generates unique musical compositions based on the real-time positions of the planets in our solar system, with creative interpretations powered by the Google Gemini API.',
    category: 'Audio Visual',
    lastModified: 'Oct 9, 2025',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'ai-video-effects',
    name: 'AI Video Effects Studio',
    description: 'An interactive video effects playground powered by Gemini. Upload a video, tweak filters, and use AI to generate unique visual styles.',
    category: 'Video',
    lastModified: 'Oct 8, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'live-vj-studio',
    name: 'Live VJ Studio',
    description: 'A browser-based video mixer for live visual performances. Mix up to 4 video sources, apply audio-reactive visual filters, and connect your MIDI controller. Built for stability and performance.',
    category: 'Audio Visual',
    lastModified: 'Oct 8, 2025',
    featured: true,
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'celestial-symphony-2',
    name: 'Celestial Symphony',
    description: 'An interactive web application that generates unique musical compositions based on the real-time positions of the planets in our solar system, with AI-powered interpretations.',
    category: 'Audio Visual',
    lastModified: 'Oct 8, 2025',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'vibecheck',
    name: 'VibeCheck',
    description: 'Quickly batch test prompts with visual outputs.',
    category: 'AI Tools',
    lastModified: 'Oct 8, 2025',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'fit-check',
    name: 'Fit Check',
    description: 'Upload a photo of yourself and an outfit to see how it looks on you, powered by Nano Banana.',
    category: 'AI Tools',
    lastModified: 'Oct 8, 2025',
    icon: <Image className="w-5 h-5" />
  },
  {
    id: 'webgl-vj-tool',
    name: 'WebGL VJ Tool',
    description: 'A real-time video visualizer that runs entirely in the browser using React, Three.js, and WebGL. Features GPU-accelerated filters and audio-reactive modulation.',
    category: 'Audio Visual',
    lastModified: 'Oct 8, 2025',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'prompt-refiner',
    name: 'Prompt Refiner AI',
    description: 'An AI-powered application that analyzes and refines user-provided prompts to improve clarity, precision, and structure for better AI model performance. Paste your prompt and get an expertly engineered version in seconds.',
    category: 'AI Tools',
    lastModified: 'Oct 8, 2025',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'cosmic-healing',
    name: 'Cosmic Healing Affirmations',
    description: 'An immersive experience to generate healing affirmations. Enter a theme and receive a cloud of bilingual affirmations (English & Serbian) generated by AI to guide you through a cosmic journey of self-discovery and healing.',
    category: 'Health',
    lastModified: 'Oct 8, 2025',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'astro-vysio-basic',
    name: 'Astro-Vysio-basic: Generative Music Visualizer',
    description: 'A generative art application that creates unique, audio-reactive music videos from user-provided media, with an optional Astrological Engine that leverages real-time astronomical data to influence the visual aesthetics.',
    category: 'Audio Visual',
    lastModified: 'Oct 7, 2025',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'audio-reactive-video',
    name: 'Audio Reactive Video Creator',
    description: 'An advanced audio-reactive video creation tool with a chained effects system, dynamic transitions, a keyframe timeline, and professional high-quality video export.',
    category: 'Video',
    lastModified: 'Oct 5, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'audio-reactive-video-2',
    name: 'Audio Reactive Video Creator',
    description: 'An advanced audio-reactive video creation tool with a chained effects system, dynamic transitions, a keyframe timeline, and professional high-quality video export.',
    category: 'Video',
    lastModified: 'Oct 5, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'audio-reactive-video-3',
    name: 'Audio Reactive Video Creator',
    description: 'An advanced audio-reactive video creation tool with a chained effects system, dynamic transitions, a keyframe timeline, and professional high-quality video export.',
    category: 'Video',
    lastModified: 'Oct 5, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'video-fx-engine',
    name: 'Video FX Engine',
    description: 'A real-time video effects engine with HSF interpolation presets and a chained envelope system for smooth parameter automation. Upload a video, apply effects on a timeline, and export the result.',
    category: 'Video',
    lastModified: 'Oct 5, 2025',
    icon: <Video className="w-5 h-5" />
  },
  {
    id: 'vjcode-live',
    name: 'VJCode Live GLSL Editor',
    description: 'A browser-based development environment for live coding with GLSL shaders, inspired by VJCode.dev. Edit fragment and vertex shaders in real-time and see your creations come to life. Supports camera and microphone inputs for interactive visuals.',
    category: 'Audio Visual',
    lastModified: 'Oct 5, 2025',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'music-video-visualizer',
    name: 'Music Video Visualizer Engine',
    description: 'A powerful application that generates stunning, real-time visuals for your music. Upload your audio, provide a creative prompt, and let Geminis VEO model craft a unique music video for you.',
    category: 'Audio Visual',
    lastModified: 'Oct 5, 2025',
    icon: <Music className="w-5 h-5" />
  },
  {
    id: '3d-weather-visualizer',
    name: '3D Weather Visualizer',
    description: 'A stunning real-time 3D weather visualizer that combines data from WeatherAPI.com with dynamic particle systems for rain and snow, day/night cycles, and cinematic lens flare effects using React Three Fiber.',
    category: 'Web Design',
    lastModified: 'Oct 5, 2025',
    featured: true,
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: '3d-weather-visualizer-2',
    name: '3D Weather Visualizer',
    description: 'A stunning real-time 3D weather visualizer that combines data from WeatherAPI.com with dynamic particle systems for rain and snow, day/night cycles, and cinematic lens flare effects using React Three Fiber.',
    category: 'Web Design',
    lastModified: 'Oct 4, 2025',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'realtime-vj',
    name: 'Real-time VJ App',
    description: 'A real-time audio-visualizer application that allows users to create stunning visuals by layering effects that react to microphone input.',
    category: 'Audio Visual',
    lastModified: 'Oct 4, 2025',
    icon: <Music className="w-5 h-5" />
  }
];

const categories = [
  'All',
  'AI Tools',
  'Audio Visual',
  'Audio',
  'Video',
  'Productivity',
  'Health',
  'Lifestyle',
  'Web Design',
  'Analytics',
  'Games'
];

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'AI Tools': <Brain className="w-4 h-4" />,
    'Audio Visual': <Music className="w-4 h-4" />,
    'Audio': <Mic className="w-4 h-4" />,
    'Video': <Video className="w-4 h-4" />,
    'Productivity': <Calendar className="w-4 h-4" />,
    'Health': <Heart className="w-4 h-4" />,
    'Lifestyle': <Star className="w-4 h-4" />,
    'Web Design': <Palette className="w-4 h-4" />,
    'Analytics': <Brain className="w-4 h-4" />
  };
  return icons[category] || <Wand2 className="w-4 h-4" />;
};

export function AppGallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFeatured, setShowFeatured] = useState(false);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      const matchesFeatured = !showFeatured || app.featured;

      return matchesSearch && matchesCategory && matchesFeatured;
    });
  }, [searchTerm, selectedCategory, showFeatured]);

  const featuredApps = apps.filter(app => app.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            App Gallery
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore a collection of innovative AI-powered applications, creative tools, and experimental projects.
          </p>
        </div>

        {/* Featured Apps */}
        {!showFeatured && featuredApps.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Featured Apps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredApps.slice(0, 3).map((app) => (
                <Card key={app.id} className="bg-gray-800/50 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                        {app.icon}
                      </div>
                      <CardTitle className="text-lg text-white group-hover:text-purple-300 transition-colors">
                        {app.name}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="w-fit bg-purple-600/20 text-purple-300">
                      {app.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 line-clamp-3">
                      {app.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{app.lastModified}</span>
                      <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              variant={showFeatured ? "default" : "outline"}
              onClick={() => setShowFeatured(!showFeatured)}
              className={showFeatured ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"}
            >
              <Star className="w-4 h-4 mr-2" />
              Featured Only
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-gray-600 text-gray-300 hover:bg-purple-600/10"
                }`}
              >
                {category !== 'All' && getCategoryIcon(category)}
                <span className={category !== 'All' ? "ml-2" : ""}>{category}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <Card key={app.id} className="bg-gray-800/30 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {app.name}
                    </CardTitle>
                    {app.featured && (
                      <Star className="w-4 h-4 text-yellow-400 mt-1" />
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit bg-gray-700/50 text-gray-300 text-xs">
                  {app.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4 line-clamp-4">
                  {app.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{app.lastModified}</span>
                  <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/10">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xl">No apps found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{apps.length}</div>
              <div className="text-sm text-gray-400">Total Apps</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{featuredApps.length}</div>
              <div className="text-sm text-gray-400">Featured</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{categories.length - 1}</div>
              <div className="text-sm text-gray-400">Categories</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{filteredApps.length}</div>
              <div className="text-sm text-gray-400">Showing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}