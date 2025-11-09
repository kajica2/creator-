import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SphereData, NasaApodData, SoundMood } from './types';
import { SPHERES_DATA, NASA_API_URL, NASA_API_KEY } from './constants';
import { SPHERE_SYNTH_PRESETS } from './synth-presets';
import Sphere from './components/Sphere';
import SphereModal from './components/SphereModal';

// Tone.js is loaded from a script tag in index.html, so we declare it for TypeScript
declare const Tone: any;

const SOUND_MOODS: SoundMood[] = ['Cosmic Drone', 'Celestial Harmony', 'Starlight Serenade', 'Silent Voyage'];

const NasaApodFooter: React.FC<{ data: NasaApodData | null }> = ({ data }) => {
  if (!data) return null;
  return (
    <footer className="w-full bg-black/30 backdrop-blur-sm p-4 mt-20 text-center text-gray-400">
      <h4 className="font-bold text-lg text-white">{data.title}</h4>
      <p className="text-sm max-w-3xl mx-auto my-2">{data.explanation}</p>
      {data.copyright && <p className="text-xs">&copy; {data.copyright}</p>}
    </footer>
  );
};

const App: React.FC = () => {
  const [selectedSphere, setSelectedSphere] = useState<SphereData | null>(null);
  const [apodData, setApodData] = useState<NasaApodData | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [soundMood, setSoundMood] = useState<SoundMood>('Cosmic Drone');
  
  const audioInitializedRef = useRef(false);

  // Refs for Tone.js components
  const clickSynthRef = useRef<any>(null);
  const ambientSynthsRef = useRef<{ [key: string]: any }>({});


  const setSoundscape = useCallback((mood: SoundMood) => {
    if (!audioInitializedRef.current) return;
    
    // Stop all ongoing ambient sounds before setting up the new mood
    // FIX: Explicitly type `synth` as `any` to resolve errors with accessing properties on an `unknown` type.
    Object.values(ambientSynthsRef.current).forEach((synth: any) => {
      if (synth.state === 'started') {
        if (synth instanceof Tone.Loop || synth instanceof Tone.Sequence) {
           synth.stop(0);
        } else if (synth.triggerRelease) {
          synth.triggerRelease();
        }
      }
    });

    const { drone1, drone2, arpSeq, shimmerLoop } = ambientSynthsRef.current;
    
    switch (mood) {
      case 'Cosmic Drone':
        drone1.triggerAttack("C2");
        drone2.triggerAttack("G2");
        arpSeq.probability = 0.2;
        arpSeq.start(0);
        break;
      
      case 'Celestial Harmony':
        drone1.triggerAttack("C3");
        drone2.triggerAttack("E3");
        arpSeq.probability = 0.1;
        arpSeq.start(0);
        break;

      case 'Starlight Serenade':
        shimmerLoop.start(0);
        break;

      case 'Silent Voyage':
        // All sounds already stopped
        break;
    }
  }, []);

  const initializeAudio = useCallback(async () => {
    if (audioInitializedRef.current || typeof Tone === 'undefined') return;
    audioInitializedRef.current = true;
    
    await Tone.start();
    
    const reverb = new Tone.Reverb({ decay: 15, wet: 0.6, preDelay: 0.2 }).toDestination();
    const delay = new Tone.FeedbackDelay("8n.", 0.6).connect(reverb);
    
    // Initialize a generic synth that can be reconfigured on the fly
    clickSynthRef.current = new Tone.Synth().connect(delay);

    const filter = new Tone.AutoFilter("2m").start();
    const lfo = new Tone.LFO("8m", 400, 2500).start();
    lfo.connect(filter.frequency);

    const drone1 = new Tone.AMSynth({
      harmonicity: 1.5,
      envelope: { attack: 4, release: 4 },
      modulationEnvelope: { attack: 6, release: 4 }
    }).connect(filter);
    drone1.volume.value = -12;
    
    const drone2 = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 10,
      envelope: { attack: 4, release: 4 },
      modulationEnvelope: { attack: 6, release: 4 }
    }).connect(filter);
    drone2.volume.value = -12;

    const arpNotes = ["C4", "E4", "G4", "A4", "C5", "D5", "E5"];
    const arpSeq = new Tone.Sequence((time, note) => {
      // Use a separate synth for the arp to not interfere with click synth presets
      const arpSynth = new Tone.Synth({
        oscillator: { type: 'fatsine' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.8 },
      }).connect(delay);
      arpSynth.triggerAttackRelease(note, "16n", time);
      // Clean up synth after it's done playing to avoid memory leaks
      setTimeout(() => arpSynth.dispose(), 1000);
    }, arpNotes, "4n");
    arpSeq.humanize = true;

    const shimmerSynth = new Tone.PluckSynth({
      attackNoise: 0.5,
      dampening: 8000,
      resonance: 0.95
    }).connect(delay);
    shimmerSynth.volume.value = -6;
    
    const shimmerLoop = new Tone.Loop(time => {
      shimmerSynth.triggerAttack(arpNotes[Math.floor(Math.random() * arpNotes.length)], time);
    }, "2n");
    shimmerLoop.humanize = true;

    ambientSynthsRef.current = { drone1, drone2, arpSeq, shimmerLoop };

    setSoundscape(soundMood);

    Tone.Transport.start();
    setIsAudioInitialized(true);
  }, [soundMood, setSoundscape]);

  useEffect(() => {
    const fetchWithRetry = async (url: string, retries = 3, delay = 2000): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url);

          // If response is OK, return it and exit.
          if (response.ok) {
            return response;
          }

          // If it's a server error (5xx), it's potentially temporary, so we should retry.
          if (response.status >= 500 && response.status < 600) {
            throw new Error(`Server error: ${response.status}`);
          }

          // For any other non-ok status (e.g., 4xx client errors), it's likely not a temporary issue.
          // We'll throw a specific error to stop retrying immediately.
          const error = new Error(`Client error: ${response.status}`);
          (error as any).isFinal = true; // Mark error as non-retriable
          throw error;

        } catch (error: any) {
          console.warn(`Attempt ${attempt} of ${retries} failed: ${error.message}`);

          // If we've reached the last attempt or it's a non-retriable error, rethrow to fail.
          if (attempt === retries || error.isFinal) {
            console.error("Fetch failed after multiple attempts or due to a non-retriable error.");
            throw error;
          }

          // Wait before the next attempt, with exponential backoff.
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
      // This line should not be reachable if the loop always throws on the last attempt.
      // It's here for type safety and as a fallback.
      throw new Error('Failed to fetch from NASA API after all retries.');
    };

    const fetchNasaImage = async () => {
      try {
        const response = await fetchWithRetry(`${NASA_API_URL}?api_key=${NASA_API_KEY}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON response from NASA API, but received ${contentType}`);
        }

        const data: NasaApodData = await response.json();
        
        if (data.media_type === 'image') {
          setApodData(data);
        } else {
          console.log("Today's APOD is a video, not an image. Skipping background update.");
        }
      } catch (error) {
        // The final error from fetchWithRetry is caught here.
        // We log it but don't crash the app, allowing it to run with the default background.
        console.error("Could not load background image from NASA:", (error as Error).message);
      }
    };
    fetchNasaImage();
  }, []);

  const handleSphereClick = (data: SphereData) => {
    if (!isAudioInitialized) {
        console.log("Audio not ready, please start the experience first.");
        setSelectedSphere(data);
        return;
    }
    
    const frequency = data.frequency;
    const preset = SPHERE_SYNTH_PRESETS[data.id];

    if (clickSynthRef.current && frequency) {
      if(preset) {
        clickSynthRef.current.set(preset);
      }
      clickSynthRef.current.triggerAttackRelease(frequency, '4n');
    }

    setSelectedSphere(data);
  };

  const handleCloseModal = () => {
    setSelectedSphere(null);
  };
  
  const handleMoodChange = (mood: SoundMood) => {
    setSoundMood(mood);
    setSoundscape(mood);
  }

  const backgroundStyle = apodData ? { backgroundImage: `url(${apodData.url})` } : {};

  return (
    <main 
      className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-indigo-950 text-white font-sans overflow-y-auto overflow-x-hidden bg-cover bg-center bg-fixed transition-background-image duration-1000 ease-in-out"
      style={backgroundStyle}
    >
      <div className="min-h-screen w-full bg-black/40 backdrop-blur-[2px]">

        {!isAudioInitialized && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <button
              onClick={initializeAudio}
              className="px-8 py-4 text-xl font-bold font-serif text-black bg-gradient-to-r from-slate-200 to-purple-300 rounded-lg shadow-lg shadow-white/20 hover:scale-105 transition-transform duration-300"
            >
              Enter the Cosmos
            </button>
          </div>
        )}

        <div className="container mx-auto px-4 py-12 md:py-20">
          <header className="text-center mb-12 md:mb-20">
            <h1 className="text-4xl md:text-6xl font-serif font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-purple-300 drop-shadow-lg">
              The Path of Spheres
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-200 drop-shadow-md">
              An interactive journey through Dante's Cosmos, mapping personal growth and self-reflection.
            </p>
            {isAudioInitialized && (
              <div className="mt-6 flex justify-center gap-2 flex-wrap" role="toolbar" aria-label="Sound Moods">
                {SOUND_MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => handleMoodChange(mood)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white/70 ${
                      soundMood === mood
                        ? 'bg-white/20 border-white/80 text-white shadow-md'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/40'
                    }`}
                    aria-pressed={soundMood === mood}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="relative flex flex-col items-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-sky-400/50 to-transparent hidden md:block" aria-hidden="true"></div>

            {SPHERES_DATA.map((sphere, index) => (
              <Sphere
                key={sphere.id}
                data={sphere}
                onClick={handleSphereClick}
                isEven={index % 2 === 0}
                isSelected={selectedSphere?.id === sphere.id}
                isAnimating={isAudioInitialized}
                animationDelay={index * 150}
              />
            ))}
          </div>
        </div>
        <SphereModal data={selectedSphere} onClose={handleCloseModal} />
        <NasaApodFooter data={apodData} />
      </div>
    </main>
  );
};

export default App;
