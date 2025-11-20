import { useCallback, useRef, useEffect } from 'react';

interface WaterSoundsProps {
  volume?: number;
  enabled?: boolean;
}

export function useWaterSounds({ volume = 0.1, enabled = true }: WaterSoundsProps = {}) {
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && enabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported');
      }
    }
    return audioContextRef.current;
  }, [enabled]);

  // Create multiple high-quality synthetic water drop sounds with different characteristics
  const createWaterDropVariations = useCallback((audioContext: AudioContext): AudioBuffer[] => {
    const variations: AudioBuffer[] = [];
    
    // Variation 1: Small, crisp water drop (high pitch, quick decay)
    const createSmallDrop = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 0.4;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 15);
        
        // High frequency components for crisp sound
        const primary = Math.sin(2 * Math.PI * 350 * t) * envelope;
        const harmonic = Math.sin(2 * Math.PI * 700 * t) * envelope * 0.3;
        const splash = Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 30) * 0.1;
        
        data[i] = (primary + harmonic + splash) * 0.4;
      }
      return buffer;
    };

    // Variation 2: Medium water drop (balanced frequency, natural decay)
    const createMediumDrop = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 0.6;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 10);
        
        // Balanced frequency components
        const primary = Math.sin(2 * Math.PI * 220 * t) * envelope;
        const sub = Math.sin(2 * Math.PI * 110 * t) * envelope * 0.4;
        const harmonic = Math.sin(2 * Math.PI * 440 * t) * envelope * 0.25;
        const bubble = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 5) * 0.3;
        
        // Add subtle noise for texture
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.05;
        
        data[i] = (primary + sub + harmonic + bubble + noise) * 0.35;
      }
      return buffer;
    };

    // Variation 3: Large, deep water drop (low frequency, long decay)
    const createLargeDrop = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 0.8;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 6);
        
        // Lower frequency components for deeper sound
        const primary = Math.sin(2 * Math.PI * 150 * t) * envelope;
        const sub = Math.sin(2 * Math.PI * 75 * t) * envelope * 0.6;
        const resonance = Math.sin(2 * Math.PI * 300 * t) * envelope * 0.2;
        const bubble = Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 3) * 0.4;
        
        // Longer splash tail
        const splash = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 12) * 0.08;
        
        data[i] = (primary + sub + resonance + bubble + splash) * 0.3;
      }
      return buffer;
    };

    // Variation 4: Splash-heavy water drop (more high-frequency content)
    const createSplashyDrop = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 0.5;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 12);
        
        // Emphasis on splash frequencies
        const primary = Math.sin(2 * Math.PI * 280 * t) * envelope;
        const splash1 = Math.sin(2 * Math.PI * 560 * t) * envelope * 0.4;
        const splash2 = Math.sin(2 * Math.PI * 1120 * t) * Math.exp(-t * 25) * 0.2;
        const splash3 = Math.sin(2 * Math.PI * 1680 * t) * Math.exp(-t * 40) * 0.1;
        
        // Granular texture
        const grain = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.03;
        
        data[i] = (primary + splash1 + splash2 + splash3 + grain) * 0.38;
      }
      return buffer;
    };

    // Variation 5: Resonant water drop (emphasizes resonant frequencies)
    const createResonantDrop = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 0.7;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 8);
        
        // Resonant cavity modeling
        const fundamental = Math.sin(2 * Math.PI * 180 * t) * envelope;
        const resonance1 = Math.sin(2 * Math.PI * 360 * t) * envelope * 0.35;
        const resonance2 = Math.sin(2 * Math.PI * 540 * t) * envelope * 0.15;
        const subResonance = Math.sin(2 * Math.PI * 90 * t) * envelope * 0.25;
        
        // Ring modulation for metallic quality
        const modulator = 1 + Math.sin(2 * Math.PI * 12 * t) * 0.1 * Math.exp(-t * 4);
        
        data[i] = (fundamental + resonance1 + resonance2 + subResonance) * modulator * 0.32;
      }
      return buffer;
    };

    variations.push(createSmallDrop());
    variations.push(createMediumDrop());
    variations.push(createLargeDrop());
    variations.push(createSplashyDrop());
    variations.push(createResonantDrop());

    return variations;
  }, []);

  // Initialize audio buffers when component mounts
  useEffect(() => {
    if (enabled && audioBuffersRef.current.length === 0) {
      const audioContext = initAudioContext();
      if (audioContext) {
        audioBuffersRef.current = createWaterDropVariations(audioContext);
      }
    }
  }, [enabled, initAudioContext, createWaterDropVariations]);

  const playWaterDropSound = useCallback((intensity: number = 1.0) => {
    if (!enabled) return;

    const audioContext = initAudioContext();
    if (!audioContext) return;

    try {
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Initialize buffers if not already done
      if (audioBuffersRef.current.length === 0) {
        audioBuffersRef.current = createWaterDropVariations(audioContext);
      }

      // Select sound variation based on intensity
      const variationIndex = Math.min(
        Math.floor(intensity * audioBuffersRef.current.length),
        audioBuffersRef.current.length - 1
      );
      
      const selectedBuffer = audioBuffersRef.current[variationIndex];
      playAudioBuffer(audioContext, selectedBuffer, intensity);

    } catch (error) {
      console.warn('Error playing water sound:', error);
    }
  }, [enabled, initAudioContext, createWaterDropVariations]);

  const playAudioBuffer = useCallback((audioContext: AudioContext, buffer: AudioBuffer, intensity: number) => {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    // Connect audio nodes
    source.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set up the audio buffer
    source.buffer = buffer;

    // Dynamic EQ based on intensity
    filterNode.type = 'peaking';
    filterNode.frequency.setValueAtTime(400 + (intensity * 800), audioContext.currentTime);
    filterNode.Q.setValueAtTime(1.2, audioContext.currentTime);
    filterNode.gain.setValueAtTime(2 + (intensity * 4), audioContext.currentTime);

    // Volume control with natural envelope
    const targetVolume = volume * (0.4 + intensity * 0.6);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, audioContext.currentTime + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(targetVolume * 0.2, audioContext.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);

    // Natural pitch variation (±3%)
    const pitchVariation = 0.97 + (Math.random() * 0.06);
    source.playbackRate.value = pitchVariation;

    // Play the sound
    const now = audioContext.currentTime;
    source.start(now);
    source.stop(now + buffer.duration);
  }, [volume]);

  const playRippleSound = useCallback((size: number, strength: number) => {
    // Map ripple parameters to audio intensity with natural curve
    const normalizedSize = Math.min(1.0, size / 100);
    const normalizedStrength = Math.min(1.0, strength / 3);
    
    // Use power curve for more natural intensity mapping
    const intensity = Math.pow(normalizedSize * normalizedStrength, 0.75) * 0.95;
    
    playWaterDropSound(intensity);
  }, [playWaterDropSound]);

  return {
    playWaterDropSound,
    playRippleSound,
  };
}