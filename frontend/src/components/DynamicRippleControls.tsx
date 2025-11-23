import React from 'react';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Waves, Zap, Wind, Droplets, Move, Palette, RotateCw, CloudRain } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface DynamicRippleControlsProps {
  nSize: number;
  nStrength: number;
  turbInfluence: number;
  rippleSpeed: number;
  rippleFreq: number;
  size: number;
  dropSpeed: number;
  dropSize: number;
  sampleDistance: number;
  diffusion: number;
  turbulence: number;
  rotSpeed: number;
  onNSizeChange: (value: number) => void;
  onNStrengthChange: (value: number) => void;
  onTurbInfluenceChange: (value: number) => void;
  onRippleSpeedChange: (value: number) => void;
  onRippleFreqChange: (value: number) => void;
  onSizeChange: (value: number) => void;
  onDropSpeedChange: (value: number) => void;
  onDropSizeChange: (value: number) => void;
  onSampleDistanceChange: (value: number) => void;
  onDiffusionChange: (value: number) => void;
  onTurbulenceChange: (value: number) => void;
  onRotSpeedChange: (value: number) => void;
  onImageChange: (url: string) => void;
}

export function DynamicRippleControls({
  nSize,
  nStrength,
  turbInfluence,
  rippleSpeed,
  rippleFreq,
  size,
  dropSpeed,
  dropSize,
  sampleDistance,
  diffusion,
  turbulence,
  rotSpeed,
  onNSizeChange,
  onNStrengthChange,
  onTurbInfluenceChange,
  onRippleSpeedChange,
  onRippleFreqChange,
  onSizeChange,
  onDropSpeedChange,
  onDropSizeChange,
  onSampleDistanceChange,
  onDiffusionChange,
  onTurbulenceChange,
  onRotSpeedChange,
  onImageChange,
}: DynamicRippleControlsProps) {
  const presetImages = [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTgwMDh8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHdhdmVzfGVufDF8fHx8MTc1NTI1NTQ1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTgwMDh8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzU1MjU1NDUwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTgwMDh8MHwxfHNlYXJjaHwxfHxnYWxheHklMjBzcGFjZXxlbnwxfHx8fDE3NTUyNTU0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  ];

  return (
    <TooltipProvider>
      <Card className="absolute top-4 right-4 w-72 bg-background/95 backdrop-blur-xl border-border/50">
        <CardContent className="p-6 space-y-6">
          {/* Image Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Images</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {presetImages.map((url, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onImageChange(url)}
                  className="h-12 p-0 overflow-hidden"
                >
                  <img 
                    src={url} 
                    alt={`Preset ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </Button>
              ))}
            </div>
            <Input
              placeholder="Custom URL..."
              onChange={(e) => onImageChange(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          {/* Rain Drops */}
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <CloudRain className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Rain Speed</span>
                  <span className="text-xs text-muted-foreground ml-auto">{dropSpeed.toFixed(1)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Auto rain drop frequency</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[dropSpeed]}
              onValueChange={([value]) => onDropSpeedChange(value)}
              min={0.1}
              max={3.0}
              step={0.1}
              className="w-full"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Droplets className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Drop Size</span>
                  <span className="text-xs text-muted-foreground ml-auto">{dropSize.toFixed(1)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rain drop impact size</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[dropSize]}
              onValueChange={([value]) => onDropSizeChange(value)}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Wave Properties */}
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Waves className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Wave Speed</span>
                  <span className="text-xs text-muted-foreground ml-auto">{rippleSpeed.toFixed(0)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ripple propagation speed</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[rippleSpeed]}
              onValueChange={([value]) => onRippleSpeedChange(value)}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Frequency</span>
                  <span className="text-xs text-muted-foreground ml-auto">{rippleFreq.toFixed(0)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Wave frequency</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[rippleFreq]}
              onValueChange={([value]) => onRippleFreqChange(value)}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Visual Effects */}
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Move className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Distortion</span>
                  <span className="text-xs text-muted-foreground ml-auto">{nStrength.toFixed(1)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Surface detail strength</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[nStrength]}
              onValueChange={([value]) => onNStrengthChange(value)}
              min={0.1}
              max={5.0}
              step={0.1}
              className="w-full"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Wind className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Turbulence</span>
                  <span className="text-xs text-muted-foreground ml-auto">{turbulence.toFixed(2)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fluid chaos level</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[turbulence]}
              onValueChange={([value]) => onTurbulenceChange(value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <RotateCw className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Light</span>
                  <span className="text-xs text-muted-foreground ml-auto">{(rotSpeed * 1000).toFixed(0)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Light rotation speed</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[rotSpeed]}
              onValueChange={([value]) => onRotSpeedChange(value)}
              min={0}
              max={0.2}
              step={0.005}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}