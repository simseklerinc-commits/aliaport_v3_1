import React, { useState, useEffect, useRef } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

interface RippleEffectProps {
  imageUrl: string;
  amplitude?: number;
  frequency?: number;
  decay?: number;
  speed?: number;
  duration?: number;
}

export function RippleEffect({
  imageUrl,
  amplitude = 50,
  frequency = 0.02,
  decay = 0.98,
  speed = 2,
  duration = 3000
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setCurrentTime(Date.now());
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
      startTime: currentTime
    };

    setRipples(prev => [...prev, newRipple]);

    // Clean up old ripples
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  const getRippleStyle = (ripple: Ripple) => {
    const elapsed = (currentTime - ripple.startTime) / 1000;
    const progress = Math.min(elapsed / (duration / 1000), 1);
    
    if (progress <= 0) return {};

    const radius = progress * 100 * speed;
    const opacity = Math.pow(decay, elapsed * 10);
    const intensity = amplitude * Math.sin(frequency * elapsed * 100) * opacity;

    return {
      position: 'absolute' as const,
      left: `${ripple.x}%`,
      top: `${ripple.y}%`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      transform: `translate(-50%, -50%)`,
      background: `radial-gradient(circle, rgba(255,255,255,${opacity * 0.3}) 0%, transparent 70%)`,
      borderRadius: '50%',
      pointerEvents: 'none' as const,
      filter: `blur(${Math.abs(intensity * 0.1)}px)`,
      zIndex: 10
    };
  };

  const getImageStyle = () => {
    let transform = '';
    
    ripples.forEach(ripple => {
      const elapsed = (currentTime - ripple.startTime) / 1000;
      const progress = Math.min(elapsed / (duration / 1000), 1);
      
      if (progress > 0) {
        const opacity = Math.pow(decay, elapsed * 10);
        const intensity = amplitude * Math.sin(frequency * elapsed * 100) * opacity * 0.01;
        
        // Create a subtle distortion effect
        transform += `perspective(1000px) rotateX(${intensity * Math.sin(ripple.y * 0.01)}deg) rotateY(${intensity * Math.cos(ripple.x * 0.01)}deg) `;
      }
    });

    return {
      transform: transform || 'none',
      transition: 'transform 0.1s ease-out'
    };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt="Ripple Effect Background"
        className="w-full h-full object-cover"
        style={getImageStyle()}
        draggable={false}
      />
      
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          style={getRippleStyle(ripple)}
        />
      ))}
    </div>
  );
}