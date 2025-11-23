import React, { useState } from 'react';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Settings, Eye, EyeOff, MousePointer, Minus, Square, HelpCircle } from 'lucide-react';

interface WaterControlsProps {
  waveSpeed: number;
  springStrength: number;
  velocityDamping: number;
  pressureDamping: number;
  distortionStrength: number;
  rippleSize: number;
  rippleStrength: number;
  chromaticAberrationStrength: number;
  chromaticAberrationDispersal: number;
  showRippleCursor: boolean;
  onWaveSpeedChange: (value: number) => void;
  onSpringStrengthChange: (value: number) => void;
  onVelocityDampingChange: (value: number) => void;
  onPressureDampingChange: (value: number) => void;
  onDistortionStrengthChange: (value: number) => void;
  onRippleSizeChange: (value: number) => void;
  onRippleStrengthChange: (value: number) => void;
  onChromaticAberrationStrengthChange: (value: number) => void;
  onChromaticAberrationDispersalChange: (value: number) => void;
  onShowRippleCursorChange: (value: boolean) => void;
  onImageChange: (url: string) => void;
}

export function WaterControls({
  waveSpeed,
  springStrength,
  velocityDamping,
  pressureDamping,
  distortionStrength,
  rippleSize,
  rippleStrength,
  chromaticAberrationStrength,
  chromaticAberrationDispersal,
  showRippleCursor,
  onWaveSpeedChange,
  onSpringStrengthChange,
  onVelocityDampingChange,
  onPressureDampingChange,
  onDistortionStrengthChange,
  onRippleSizeChange,
  onRippleStrengthChange,
  onChromaticAberrationStrengthChange,
  onChromaticAberrationDispersalChange,
  onShowRippleCursorChange,
  onImageChange,
}: WaterControlsProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const presetImages = [
    'https://images.unsplash.com/photo-1738916218012-4e580beae18e?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1610296669228-602fa827fc1f?q=80&w=3175&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1724748860101-589aa7ee8b29?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1729072593580-f5110376d6ae?q=80&w=2183&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1651488917425-3467011b3d46?q=80&w=2231&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1748168718520-cc19c44d2556?q=80&w=2029&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1748152633352-12d2c837c88b?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1505236732171-72a5b19c4981?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1538248814128-02e1bd877c01?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  return (
    <TooltipProvider>
      {/* Global cursor override for control panel */}
      <style>{`
        .water-controls * {
          cursor: auto !important;
        }
      `}</style>
      
      {/* Floating Modal */}
      <div 
        className={`water-controls fixed top-6 right-6 z-50 bg-black/40 backdrop-blur-3xl border border-white/10 text-white rounded-2xl transition-all duration-300 ease-out shadow-2xl ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[80vh]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 h-16 ${!isMinimized ? 'border-b border-white/10' : ''}`}>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm text-white/95">Water Controls</h2>
            </div>
          </div>
          
          {/* Window Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-colors duration-200"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Square className="w-3 h-3 text-white/70" />
              ) : (
                <Minus className="w-3 h-3 text-white/70" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="space-y-8 p-[16px]">
              {/* Image Selection - Moved to first position */}
              <div>
                <h3 className="text-sm text-white/90 mb-4">Images</h3>
                <div className="grid grid-cols-3 gap-3">
                  {presetImages.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => onImageChange(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-200 hover:scale-105"
                    >
                      <img 
                        src={url} 
                        alt={`Preset ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Ripple Controls - Featured Section */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-5">
                  <MousePointer className="w-4 h-4 text-white/80" />
                  <h3 className="text-sm text-white/90">Click Ripples</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Drop Size</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Size of ripples created when you click the water</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{rippleSize.toFixed(0)}px</span>
                    </div>
                    <Slider
                      value={[rippleSize]}
                      onValueChange={([value]) => onRippleSizeChange(value)}
                      min={5}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Drop Strength</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How strong the water disturbance is</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{rippleStrength.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[rippleStrength]}
                      onValueChange={([value]) => onRippleStrengthChange(value)}
                      min={0.1}
                      max={5.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80">Custom Cursor</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Replaces your cursor with a smooth circle showing the exact drop size. Move your mouse to see it in action!</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      {showRippleCursor ? (
                        <Eye className="w-4 h-4 text-white/60" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-white/60" />
                      )}
                      <Switch 
                        checked={showRippleCursor} 
                        onCheckedChange={onShowRippleCursorChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Wave Physics */}
              <div>
                <h3 className="text-sm text-white/90 mb-5">Wave Physics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Speed</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How fast waves propagate through the water</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{waveSpeed.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[waveSpeed]}
                      onValueChange={([value]) => onWaveSpeedChange(value)}
                      min={0.1}
                      max={1.4}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Spring Force</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Restoring force that pulls water back to rest</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{(springStrength * 1000).toFixed(0)}</span>
                    </div>
                    <Slider
                      value={[springStrength]}
                      onValueChange={([value]) => onSpringStrengthChange(value)}
                      min={0.001}
                      max={0.02}
                      step={0.001}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Damping</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How quickly wave energy dissipates</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{(velocityDamping * 1000).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[velocityDamping]}
                      onValueChange={([value]) => onVelocityDampingChange(value)}
                      min={0.0005}
                      max={0.01}
                      step={0.0005}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Effects */}
              <div>
                <h3 className="text-sm text-white/90 mb-5">Visual Effects</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Distortion</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Strength of image distortion from water movement</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{distortionStrength.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[distortionStrength]}
                      onValueChange={([value]) => onDistortionStrengthChange(value)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Chromatic Aberration */}
              <div className="pb-6">
                <h3 className="text-sm text-white/90 mb-5">Chromatic Aberration</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Intensity</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Overall strength of color separation effect</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{chromaticAberrationStrength.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[chromaticAberrationStrength]}
                      onValueChange={([value]) => onChromaticAberrationStrengthChange(value)}
                      min={0}
                      max={5.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">Dispersal</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Distance between color fringes</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-md">{(chromaticAberrationDispersal * 1000).toFixed(0)}</span>
                    </div>
                    <Slider
                      value={[chromaticAberrationDispersal]}
                      onValueChange={([value]) => onChromaticAberrationDispersalChange(value)}
                      min={0.001}
                      max={0.02}
                      step={0.001}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Credits */}
              <div className="py-[8px] border-t border-white/10 px-[0px]">
                <p className="text-xs text-white/50">
                  Based on{' '}
                  <a
                    href="https://www.shadertoy.com/view/wdtyDH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white/90 underline underline-offset-2 transition-colors duration-200"
                  >
                    original Shadertoy implementation
                  </a>
                </p>
                <p className="text-xs text-white/50 mt-2">
                  Created in Figma Make · Made with love by{' '}
                  <a
                    href="https://danielamuntyan.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white/90 underline underline-offset-2 transition-colors duration-200"
                  >
                    Daniela Muntyan
                  </a>
                </p>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
}