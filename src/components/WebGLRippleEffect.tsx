import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RippleData {
  x: number;
  y: number;
  time: number;
  id: number;
}

interface WebGLRippleEffectProps {
  imageUrl: string;
  amplitude?: number;
  frequency?: number;
  decay?: number;
  speed?: number;
}

export function WebGLRippleEffect({
  imageUrl,
  amplitude = 0.02,
  frequency = 15.0,
  decay = 8.0,
  speed = 1200.0
}: WebGLRippleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gl, setGL] = useState<WebGLRenderingContext | null>(null);
  const [program, setProgram] = useState<WebGLProgram | null>(null);
  const [texture, setTexture] = useState<WebGLTexture | null>(null);
  const [ripples, setRipples] = useState<RippleData[]>([]);
  const animationRef = useRef<number>();

  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    uniform vec2 u_resolution;
    
    varying vec2 v_texCoord;
    varying vec2 v_position;
    
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_texCoord = a_texCoord;
      v_position = zeroToOne;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_ripples[10]; // x, y, time
    uniform int u_rippleCount;
    uniform float u_amplitude;
    uniform float u_frequency;
    uniform float u_decay;
    uniform float u_speed;
    
    varying vec2 v_texCoord;
    varying vec2 v_position;
    
    void main() {
      vec2 uv = v_texCoord;
      vec2 distortion = vec2(0.0);
      
      // Calculate ripple distortions
      for(int i = 0; i < 10; i++) {
        if(i >= u_rippleCount) break;
        
        vec2 ripplePos = u_ripples[i].xy;
        float rippleTime = u_time - u_ripples[i].z;
        
        if(rippleTime < 0.0) continue;
        
        vec2 diff = v_position - ripplePos;
        float distance = length(diff);
        
        // Time delay based on distance
        float delay = distance * u_speed / 100.0;
        rippleTime = max(0.0, rippleTime - delay);
        
        // Ripple calculation
        float rippleAmount = u_amplitude * sin(u_frequency * rippleTime) * exp(-u_decay * rippleTime);
        
        if(distance > 0.0) {
          vec2 normal = normalize(diff);
          distortion += rippleAmount * normal;
        }
      }
      
      // Sample texture with distortion
      vec2 distortedUV = uv + distortion * 0.1;
      vec4 color = texture2D(u_image, distortedUV);
      
      // Add subtle brightness variation based on distortion
      float brightness = length(distortion) * 2.0;
      color.rgb += brightness * 0.3;
      
      // Add sunlight glint effect
      if(length(distortion) > 0.001) {
        vec3 normal = normalize(vec3(-distortion.x, 0.2, -distortion.y));
        vec3 lightDir = normalize(vec3(-0.3, 1.0, 0.3));
        float glint = pow(max(0.0, dot(normal, lightDir)), 60.0);
        color.rgb += glint * 0.5;
      }
      
      gl_FragColor = color;
    }
  `;

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext) => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }, [createShader, vertexShaderSource, fragmentShaderSource]);

  const loadTexture = useCallback((gl: WebGLRenderingContext, url: string) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Fill with a temporary pixel while image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = url;
    
    return texture;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('webgl');
    if (!context) {
      console.error('WebGL not supported');
      return;
    }

    setGL(context);
    const shaderProgram = createProgram(context);
    if (!shaderProgram) return;
    
    setProgram(shaderProgram);
    
    const imageTexture = loadTexture(context, imageUrl);
    setTexture(imageTexture);

    // Set up geometry
    const positions = new Float32Array([
      0, 0,
      canvas.width, 0,
      0, canvas.height,
      0, canvas.height,
      canvas.width, 0,
      canvas.width, canvas.height,
    ]);

    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]);

    const positionBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
    context.bufferData(context.ARRAY_BUFFER, positions, context.STATIC_DRAW);

    const texCoordBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, texCoordBuffer);
    context.bufferData(context.ARRAY_BUFFER, texCoords, context.STATIC_DRAW);

  }, [imageUrl, createProgram, loadTexture]);

  const render = useCallback(() => {
    if (!gl || !program || !texture) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(timeLocation, performance.now() / 1000.0);

    const amplitudeLocation = gl.getUniformLocation(program, 'u_amplitude');
    gl.uniform1f(amplitudeLocation, amplitude);

    const frequencyLocation = gl.getUniformLocation(program, 'u_frequency');
    gl.uniform1f(frequencyLocation, frequency);

    const decayLocation = gl.getUniformLocation(program, 'u_decay');
    gl.uniform1f(decayLocation, decay);

    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    gl.uniform1f(speedLocation, speed);

    // Set ripples
    const ripplesLocation = gl.getUniformLocation(program, 'u_ripples');
    const rippleCountLocation = gl.getUniformLocation(program, 'u_rippleCount');
    
    const rippleData = new Float32Array(30); // 10 ripples * 3 components each
    const activeRipples = ripples.slice(-10); // Keep only last 10 ripples
    
    activeRipples.forEach((ripple, index) => {
      rippleData[index * 3] = ripple.x;
      rippleData[index * 3 + 1] = ripple.y;
      rippleData[index * 3 + 2] = ripple.time;
    });
    
    gl.uniform3fv(ripplesLocation, rippleData);
    gl.uniform1i(rippleCountLocation, activeRipples.length);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(imageLocation, 0);

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(texCoordLocation);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationRef.current = requestAnimationFrame(render);
  }, [gl, program, texture, ripples, amplitude, frequency, decay, speed]);

  useEffect(() => {
    const animate = () => {
      render();
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newRipple: RippleData = {
      x,
      y,
      time: performance.now() / 1000.0,
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
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      onClick={handleClick}
      style={{ display: 'block' }}
    />
  );
}