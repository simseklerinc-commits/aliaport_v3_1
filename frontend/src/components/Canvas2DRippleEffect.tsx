import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RippleData {
  x: number;
  y: number;
  startTime: number;
  id: number;
}

interface Canvas2DRippleEffectProps {
  imageUrl: string;
  amplitude?: number;
  frequency?: number;
  decay?: number;
  speed?: number;
}

export function Canvas2DRippleEffect({
  imageUrl,
  amplitude = 30,
  frequency = 0.05,
  decay = 0.98,
  speed = 3
}: Canvas2DRippleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [ripples, setRipples] = useState<RippleData[]>([]);
  const animationRef = useRef<number>();

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawRippleEffect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create an off-screen canvas for the distorted image
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;

    // Draw original image
    offscreenCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    const imageData = offscreenCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newImageData = ctx.createImageData(canvas.width, canvas.height);
    const newData = newImageData.data;

    const currentTime = Date.now();

    // Process each pixel
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        let offsetX = 0;
        let offsetY = 0;
        let brightness = 0;

        // Calculate distortion from all active ripples
        ripples.forEach(ripple => {
          const elapsed = (currentTime - ripple.startTime) / 1000;
          if (elapsed < 0 || elapsed > 5) return; // Ripple duration

          const dx = x - ripple.x * canvas.width;
          const dy = y - ripple.y * canvas.height;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Time delay based on distance
          const delay = distance / (speed * 100);
          const rippleTime = Math.max(0, elapsed - delay);

          // Ripple calculation
          const rippleAmount = amplitude * Math.sin(frequency * distance - rippleTime * 10) * Math.pow(decay, rippleTime * 5);

          if (distance > 0) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            offsetX += rippleAmount * normalX * 0.5;
            offsetY += rippleAmount * normalY * 0.5;
            brightness += Math.abs(rippleAmount) * 0.002;
          }
        });

        // Sample from distorted position
        const sourceX = Math.max(0, Math.min(canvas.width - 1, Math.round(x - offsetX)));
        const sourceY = Math.max(0, Math.min(canvas.height - 1, Math.round(y - offsetY)));
        
        const sourceIndex = (sourceY * canvas.width + sourceX) * 4;
        const targetIndex = (y * canvas.width + x) * 4;

        // Copy pixel with brightness adjustment
        newData[targetIndex] = Math.min(255, data[sourceIndex] + brightness * 255);     // R
        newData[targetIndex + 1] = Math.min(255, data[sourceIndex + 1] + brightness * 255); // G
        newData[targetIndex + 2] = Math.min(255, data[sourceIndex + 2] + brightness * 255); // B
        newData[targetIndex + 3] = data[sourceIndex + 3]; // A
      }
    }

    ctx.putImageData(newImageData, 0, 0);

    // Draw ripple circles for visual feedback
    ripples.forEach(ripple => {
      const elapsed = (Date.now() - ripple.startTime) / 1000;
      if (elapsed < 0 || elapsed > 2) return;

      const radius = elapsed * speed * 100;
      const opacity = Math.pow(0.95, elapsed * 10) * 0.3;

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ripple.x * canvas.width, ripple.y * canvas.height, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    animationRef.current = requestAnimationFrame(drawRippleEffect);
  }, [image, ripples, amplitude, frequency, decay, speed]);

  useEffect(() => {
    if (image) {
      drawRippleEffect();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawRippleEffect, image]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newRipple: RippleData = {
      x,
      y,
      startTime: Date.now(),
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    // Clean up old ripples after 5 seconds
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 5000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Restart animation after resize
      if (image) {
        drawRippleEffect();
      }
    };

    // Initial resize
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [image, drawRippleEffect]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      onClick={handleClick}
      style={{ display: 'block' }}
    />
  );
}