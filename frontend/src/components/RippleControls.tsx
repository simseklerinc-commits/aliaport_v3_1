import React from 'react';
import { Slider } from './ui/slider';
import { Card } from './ui/card';

interface RippleControlsProps {
  amplitude: number;
  frequency: number;
  decay: number;
  speed: number;
  onAmplitudeChange: (value: number) => void;
  onFrequencyChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
}

export function RippleControls({
  amplitude,
  frequency,
  decay,
  speed,
  onAmplitudeChange,
  onFrequencyChange,
  onDecayChange,
  onSpeedChange
}: RippleControlsProps) {
  return (
    <Card className="absolute top-4 left-4 p-4 bg-black/20 backdrop-blur-sm border-white/10 text-white min-w-64">
      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm">Amplitude: {amplitude}</label>
          <Slider
            value={[amplitude]}
            onValueChange={(value) => onAmplitudeChange(value[0])}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm">Frequency: {frequency.toFixed(3)}</label>
          <Slider
            value={[frequency * 1000]}
            onValueChange={(value) => onFrequencyChange(value[0] / 1000)}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm">Decay: {decay.toFixed(2)}</label>
          <Slider
            value={[decay * 100]}
            onValueChange={(value) => onDecayChange(value[0] / 100)}
            max={99}
            min={90}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm">Speed: {speed}</label>
          <Slider
            value={[speed]}
            onValueChange={(value) => onSpeedChange(value[0])}
            max={8}
            min={1}
            step={0.5}
            className="w-full"
          />
        </div>
      </div>
      
      <p className="text-xs mt-4 opacity-70">Click anywhere on the image to create water ripples</p>
    </Card>
  );
}