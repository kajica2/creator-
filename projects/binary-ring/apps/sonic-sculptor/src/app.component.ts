
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, inject, signal, OnDestroy } from '@angular/core';
import { AudioService } from './services/audio.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('visualizerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  audioService = inject(AudioService);

  fileName = signal<string>('');
  errorMessage = signal<string>('');
  
  particleCount = signal(300);
  bassSensitivity = signal(100);
  midSensitivity = signal(100);
  trebleSensitivity = signal(100);

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private canvasWidth = 0;
  private canvasHeight = 0;

  ngAfterViewInit(): void {
    const canvasEl = this.canvasRef.nativeElement;
    const context = canvasEl.getContext('2d');
    if (!context) {
      this.errorMessage.set('Could not get 2D rendering context for the canvas.');
      return;
    }
    this.ctx = context;
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }
  
  ngOnDestroy(): void {
      if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
      }
      window.removeEventListener('resize', this.handleResize);
      this.audioService.stop();
  }

  private handleResize = () => {
    this.canvasWidth = this.canvasRef.nativeElement.offsetWidth;
    this.canvasHeight = this.canvasRef.nativeElement.offsetHeight;
    this.canvasRef.nativeElement.width = this.canvasWidth;
    this.canvasRef.nativeElement.height = this.canvasHeight;
    this.particles = []; // Reset particles on resize
    this.createParticles();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName.set(file.name);
      try {
        await this.audioService.loadAudioFile(file);
        this.audioService.play();
      } catch (error) {
        this.errorMessage.set(`Error loading audio file: ${error}`);
        console.error(error);
      }
    }
  }

  async useMicrophone(): Promise<void> {
    try {
      await this.audioService.startMicrophone();
      this.fileName.set('Microphone Input');
      this.audioService.play();
    } catch (error) {
      this.errorMessage.set(`Error accessing microphone: ${error}`);
      console.error(error);
    }
  }

  togglePlay(): void {
    if (this.audioService.isPlaying()) {
      this.audioService.pause();
    } else {
      this.audioService.play();
    }
  }

  private createParticles(): void {
    const requiredParticles = this.particleCount();
    if (this.particles.length >= requiredParticles) {
        this.particles.length = requiredParticles;
        return;
    }
    for (let i = this.particles.length; i < requiredParticles; i++) {
        const x = this.canvasWidth / 2;
        const y = this.canvasHeight / 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const radius = Math.random() * 3 + 1;
        const life = Math.random() * 100 + 50;
        this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius,
            baseRadius: radius,
            color: 'rgba(255, 255, 255, 0.8)',
            life,
            maxLife: life,
        });
    }
  }

  private startRenderLoop(): void {
    const render = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  private draw(): void {
    if (this.particles.length !== this.particleCount()) {
        this.createParticles();
    }
    
    this.ctx.fillStyle = 'rgba(17, 24, 39, 0.2)'; // Fading effect
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const bass = this.audioService.bass() / 100;
    const mids = this.audioService.mids() / 100;
    const treble = this.audioService.treble() / 100;

    const bassSens = this.bassSensitivity() / 100;
    const midSens = this.midSensitivity() / 100;
    const trebleSens = this.trebleSensitivity() / 100;
    
    this.particles.forEach(p => {
        // Update velocity based on audio
        const bassEffect = bass * bassSens;
        const midEffect = mids * midSens;
        const trebleEffect = treble * trebleSens;
        
        const angle = Math.atan2(p.y - this.canvasHeight / 2, p.x - this.canvasWidth / 2);
        const force = (bassEffect * 2 + midEffect * 1) * 0.1;

        p.vx += Math.cos(angle) * force + (Math.random() - 0.5) * 0.2;
        p.vy += Math.sin(angle) * force + (Math.random() - 0.5) * 0.2;

        // Damping
        p.vx *= 0.97;
        p.vy *= 0.97;
        
        p.x += p.vx;
        p.y += p.vy;

        p.life--;

        if (p.life <= 0 || p.x < 0 || p.x > this.canvasWidth || p.y < 0 || p.y > this.canvasHeight) {
            this.resetParticle(p);
        }

        const r = Math.floor(255 * bassEffect);
        const g = Math.floor(255 * midEffect);
        const b = Math.floor(255 * trebleEffect * 1.5 + 50);
        const alpha = Math.min(0.9, p.life / p.maxLife * 2);

        p.color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        p.radius = p.baseRadius + bassEffect * 8 + midEffect * 3;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        
        // Add glow
        const glowRadius = p.radius * 2;
        const gradient = this.ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, glowRadius);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        
        this.ctx.fill();
    });
  }

  private resetParticle(p: Particle) {
    p.x = this.canvasWidth / 2;
    p.y = this.canvasHeight / 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1 + this.audioService.mids() / 100 * 3;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = Math.random() * 100 + 50;
    p.maxLife = p.life;
  }
}
