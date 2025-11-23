import React, { useEffect, useRef } from 'react';

interface RippleCursorProps {
  rippleSize: number;
  isVisible: boolean;
}

export function RippleCursor({ rippleSize, isVisible }: RippleCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) {
      // Restore default cursor
      document.documentElement.style.cursor = '';
      return;
    }

    // Hide default cursor
    document.documentElement.style.cursor = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Use transform for the smoothest possible movement
        cursorRef.current.style.transform = `translate(${e.clientX - rippleSize}px, ${e.clientY - rippleSize}px)`;
      }
    };

    // Use passive listener for best performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.style.cursor = '';
    };
  }, [isVisible, rippleSize]);

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{
          width: rippleSize * 2,
          height: rippleSize * 2,
        }}
      >
        {/* Main circle */}
        <div
          className="absolute inset-0 rounded-full border-2 border-white/60"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 60%, transparent 80%)',
            backdropFilter: 'blur(0.5px)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
          }}
        />
        
        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/80 rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)',
          }}
        />
        
        {/* Inner ring */}
        <div
          className="absolute top-1/2 left-1/2 rounded-full border border-white/30"
          style={{
            width: rippleSize,
            height: rippleSize,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </>
  );
}