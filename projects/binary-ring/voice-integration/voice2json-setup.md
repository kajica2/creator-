# Voice2JSON Integration for Binary Ring

## 🎤 Voice Recognition Setup

You're working with voice2json for speech recognition! Here's how to integrate it with the Binary Ring ecosystem:

### Installation

```bash
# Install voice2json
pip install voice2json

# Or via Docker
docker pull voice2json/voice2json

# Download language profile (English)
voice2json download-profile en
```

### Basic Usage

```bash
# Train the profile (what you ran)
voice2json train-profile

# Start transcription stream (what you ran)
voice2json transcribe-stream --open
```

## 🔗 Integration with Sonic Sculptor

Since Sonic Sculptor uses microphone input, we can add voice commands:

### Voice-Controlled Audio Visualizer

```typescript
// voice-integration.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoiceIntegrationService {
  private recognition: any;
  private voiceCommands$ = new Subject<string>();

  constructor() {
    this.initializeVoiceRecognition();
  }

  private initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        this.processVoiceCommand(transcript);
      };
    }
  }

  private processVoiceCommand(transcript: string) {
    const command = transcript.toLowerCase();

    // Audio visualization commands
    if (command.includes('increase particles')) {
      this.voiceCommands$.next('increase_particles');
    } else if (command.includes('decrease particles')) {
      this.voiceCommands$.next('decrease_particles');
    } else if (command.includes('change color')) {
      this.voiceCommands$.next('change_color');
    } else if (command.includes('bass boost')) {
      this.voiceCommands$.next('bass_boost');
    } else if (command.includes('treble boost')) {
      this.voiceCommands$.next('treble_boost');
    } else if (command.includes('start recording')) {
      this.voiceCommands$.next('start_recording');
    } else if (command.includes('stop recording')) {
      this.voiceCommands$.next('stop_recording');
    }
  }

  startListening(): void {
    if (this.recognition) {
      this.recognition.start();
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  getVoiceCommands(): Observable<string> {
    return this.voiceCommands$.asObservable();
  }
}
```

### Enhanced Sonic Sculptor with Voice Commands

```typescript
// Updated app.component.ts
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('visualizerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  audioService = inject(AudioService);
  voiceService = inject(VoiceIntegrationService);

  // Voice command subscription
  private voiceSubscription?: Subscription;

  ngAfterViewInit() {
    this.setupCanvas();
    this.setupVoiceCommands();
    this.animate();
  }

  private setupVoiceCommands() {
    this.voiceSubscription = this.voiceService.getVoiceCommands().subscribe(command => {
      this.handleVoiceCommand(command);
    });
  }

  private handleVoiceCommand(command: string) {
    switch (command) {
      case 'increase_particles':
        this.particleCount.update(count => Math.min(count + 50, 1000));
        break;
      case 'decrease_particles':
        this.particleCount.update(count => Math.max(count - 50, 50));
        break;
      case 'change_color':
        this.randomizeColors();
        break;
      case 'bass_boost':
        this.bassSensitivity.update(val => Math.min(val + 20, 200));
        break;
      case 'treble_boost':
        this.midSensitivity.update(val => Math.min(val + 20, 200));
        break;
      case 'start_recording':
        this.startMicInput();
        break;
      case 'stop_recording':
        this.stopMicInput();
        break;
    }
  }

  toggleVoiceControl() {
    if (this.isVoiceEnabled()) {
      this.voiceService.startListening();
    } else {
      this.voiceService.stopListening();
    }
  }
}
```

## 🎨 Voice Commands for Creative Control

### Supported Commands

| Command | Action |
|---------|--------|
| "Increase particles" | Add more particles to visualization |
| "Decrease particles" | Reduce particle count |
| "Change color" | Randomize color palette |
| "Bass boost" | Increase bass sensitivity |
| "Treble boost" | Increase treble sensitivity |
| "Start recording" | Begin microphone input |
| "Stop recording" | End microphone input |
| "Save visualization" | Export current state |
| "Reset settings" | Return to defaults |

### Binary Ring Ecosystem Integration

```javascript
// voice-ecosystem.js
export class VoiceEcosystemController {
  constructor() {
    this.activeApps = new Map();
    this.globalCommands = [
      'open sonic sculptor',
      'open celestial harmonies',
      'open kosmos journey',
      'switch to music composer',
      'export to video director'
    ];
  }

  processEcosystemCommand(command) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('open sonic sculptor')) {
      window.location.href = '/apps/sonic-sculptor/';
    } else if (lowerCommand.includes('open celestial')) {
      window.location.href = '/apps/celestial-harmonies/';
    } else if (lowerCommand.includes('export to video')) {
      this.exportToVideoDirector();
    }
  }

  exportToVideoDirector() {
    // Capture current audio/visual state
    const visualState = {
      timestamp: Date.now(),
      particleConfig: this.getCurrentParticleConfig(),
      audioData: this.getCurrentAudioData()
    };

    // Send to AI Music Video Director
    const videoDirectorURL = `/apps/ai-music-video-director/?import=${encodeURIComponent(JSON.stringify(visualState))}`;
    window.open(videoDirectorURL, '_blank');
  }
}
```

## 🔧 Alternative: Voice2JSON Integration

If you prefer voice2json over Web Speech API:

```bash
# Create profile directory
mkdir -p voice-profiles/sonic-sculptor

# Create sentences.ini for custom commands
cat > voice-profiles/sonic-sculptor/sentences.ini << 'EOF'
[Commands]
increase particles = increase particles
decrease particles = decrease particles
change color = change color
bass boost = bass boost
treble boost = treble boost
start recording = start recording
stop recording = stop recording
save visualization = save visualization
EOF

# Train the profile
voice2json train-profile --profile voice-profiles/sonic-sculptor

# Use in real-time
voice2json transcribe-stream --profile voice-profiles/sonic-sculptor --open | node voice-processor.js
```

### Voice Processor Script

```javascript
// voice-processor.js
const readline = require('readline');
const WebSocket = require('ws');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to Sonic Sculptor WebSocket
const ws = new WebSocket('ws://localhost:4200/voice-commands');

rl.on('line', (input) => {
  try {
    const transcription = JSON.parse(input);
    if (transcription.text) {
      console.log('Voice command:', transcription.text);

      // Send to Sonic Sculptor
      ws.send(JSON.stringify({
        type: 'voice_command',
        command: transcription.text
      }));
    }
  } catch (error) {
    // Handle non-JSON input
    console.log('Raw input:', input);
  }
});
```

This integration adds powerful voice control to your audio-visual ecosystem!