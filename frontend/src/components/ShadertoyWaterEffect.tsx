import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ShadertoyWaterEffectProps {
  imageUrl: string;
  waveSpeed?: number;
  springStrength?: number;
  velocityDamping?: number;
  pressureDamping?: number;
  distortionStrength?: number;
  rippleSize?: number;
  rippleStrength?: number;
  chromaticAberrationStrength?: number;
  chromaticAberrationDispersal?: number;
}

export function ShadertoyWaterEffect({ 
  imageUrl,
  waveSpeed = 1.0,
  springStrength = 0.005,
  velocityDamping = 0.002,
  pressureDamping = 0.999,
  distortionStrength = 0.2,
  rippleSize = 20.0,
  rippleStrength = 1.0,
  chromaticAberrationStrength = 0.0,
  chromaticAberrationDispersal = 0.005
}: ShadertoyWaterEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, down: false });

  // Shader programs
  const waterProgramRef = useRef<WebGLProgram | null>(null);
  const imageProgramRef = useRef<WebGLProgram | null>(null);
  
  // Framebuffers for ping-pong rendering
  const framebufferARef = useRef<WebGLFramebuffer | null>(null);
  const framebufferBRef = useRef<WebGLFramebuffer | null>(null);
  const textureARef = useRef<WebGLTexture | null>(null);
  const textureBRef = useRef<WebGLTexture | null>(null);
  const imageTextureRef = useRef<WebGLTexture | null>(null);
  const previousImageTextureRef = useRef<WebGLTexture | null>(null);
  
  // Transition state
  const transitionRef = useRef({ active: false, progress: 0, duration: 800 });
  const transitionStartRef = useRef(0);

  // Vertex shader (shared)
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = (a_position + 1.0) * 0.5;
    }
  `;

  // Water simulation fragment shader (first pass)
  const waterFragmentShaderSource = `
    precision highp float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform int u_frame;
    uniform vec3 u_mouse; // x, y, down
    uniform float u_waveSpeed;
    uniform float u_springStrength;
    uniform float u_velocityDamping;
    uniform float u_pressureDamping;
    uniform float u_rippleSize;
    uniform float u_rippleStrength;
    
    varying vec2 v_texCoord;
    
    void main() {
      if (u_frame == 0) {
        gl_FragColor = vec4(0.0);
        return;
      }
      
      vec2 fragCoord = v_texCoord * u_resolution;
      float delta = u_waveSpeed;
      
      float pressure = texture2D(u_texture, v_texCoord).x;
      float pVel = texture2D(u_texture, v_texCoord).y;
      
      vec2 onePixel = 1.0 / u_resolution;
      
      float p_right = texture2D(u_texture, v_texCoord + vec2(onePixel.x, 0.0)).x;
      float p_left = texture2D(u_texture, v_texCoord - vec2(onePixel.x, 0.0)).x;
      float p_up = texture2D(u_texture, v_texCoord + vec2(0.0, onePixel.y)).x;
      float p_down = texture2D(u_texture, v_texCoord - vec2(0.0, onePixel.y)).x;
      
      // Handle boundaries
      if (fragCoord.x <= 0.5) p_left = p_right;
      if (fragCoord.x >= u_resolution.x - 0.5) p_right = p_left;
      if (fragCoord.y <= 0.5) p_down = p_up;
      if (fragCoord.y >= u_resolution.y - 0.5) p_up = p_down;
      
      // Apply wave function
      pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
      pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;
      
      // Update pressure
      pressure += delta * pVel;
      
      // Spring motion for water-like behavior
      pVel -= u_springStrength * delta * pressure;
      
      // Damping
      pVel *= 1.0 - u_velocityDamping * delta;
      pressure *= u_pressureDamping;
      
      // Calculate gradients for lighting
      float gradX = (p_right - p_left) / 2.0;
      float gradY = (p_up - p_down) / 2.0;
      
      gl_FragColor = vec4(pressure, pVel, gradX, gradY);
      
      // Add mouse input
      if (u_mouse.z > 0.5) {
        float dist = distance(fragCoord, u_mouse.xy);
        if (dist <= u_rippleSize) {
          gl_FragColor.x += u_rippleStrength * (1.0 - dist / u_rippleSize);
        }
      }
    }
  `;

  // Enhanced image rendering fragment shader with improved chromatic aberration
  const imageFragmentShaderSource = `
    precision highp float;
    
    uniform sampler2D u_waterTexture;
    uniform sampler2D u_imageTexture;
    uniform vec2 u_resolution;
    uniform float u_distortionStrength;
    uniform float u_chromaticAberrationStrength;
    uniform float u_chromaticAberrationDispersal;
    
    varying vec2 v_texCoord;
    
    void main() {
      vec4 waterData = texture2D(u_waterTexture, v_texCoord);
      
      // Fix texture coordinates - flip Y axis to correct image orientation
      vec2 fixedTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
      
      // Base distortion from water
      vec2 distortion = u_distortionStrength * waterData.zw;
      
      // Chromatic aberration effect
      vec3 color = vec3(0.0);
      
      if (u_chromaticAberrationStrength > 0.0) {
        // Calculate distance from center for radial chromatic aberration
        vec2 center = vec2(0.5, 0.5);
        vec2 offset = fixedTexCoord - center;
        float distanceFromCenter = length(offset);
        
        // Combine distortion with chromatic aberration
        // Use both water distortion AND radial aberration
        float aberrationAmount = u_chromaticAberrationStrength * u_chromaticAberrationDispersal;
        
        // Enhanced water distortion contribution
        float waterDistortionMagnitude = length(distortion);
        float waterContribution = waterDistortionMagnitude * u_chromaticAberrationStrength * 0.5;
        
        // Radial chromatic aberration (stronger at edges)
        float radialContribution = distanceFromCenter * aberrationAmount;
        
        // Total aberration strength
        float totalAberration = waterContribution + radialContribution;
        
        // Create chromatic offsets
        vec2 radialDirection = normalize(offset + vec2(0.001, 0.001)); // Avoid division by zero
        
        // Red channel (contracts inward)
        vec2 redOffset = distortion - radialDirection * totalAberration;
        // Green channel (baseline)
        vec2 greenOffset = distortion;
        // Blue channel (expands outward)
        vec2 blueOffset = distortion + radialDirection * totalAberration;
        
        // Sample each color channel with corrected coordinates
        color.r = texture2D(u_imageTexture, fixedTexCoord + redOffset).r;
        color.g = texture2D(u_imageTexture, fixedTexCoord + greenOffset).g;
        color.b = texture2D(u_imageTexture, fixedTexCoord + blueOffset).b;
        
        // Add additional fringing for stronger effect
        if (totalAberration > 0.001) {
          vec2 strongerRedOffset = distortion - radialDirection * totalAberration * 1.5;
          vec2 strongerBlueOffset = distortion + radialDirection * totalAberration * 1.5;
          
          // Blend in stronger offsets for more visible effect
          color.r = mix(color.r, texture2D(u_imageTexture, fixedTexCoord + strongerRedOffset).r, 0.3);
          color.b = mix(color.b, texture2D(u_imageTexture, fixedTexCoord + strongerBlueOffset).b, 0.3);
        }
        
        // Clamp to prevent over-saturation
        color = clamp(color, 0.0, 1.0);
      } else {
        // Standard sampling without chromatic aberration - use fixed coordinates
        color = texture2D(u_imageTexture, fixedTexCoord + distortion).rgb;
      }
      
      // Add sunlight glint
      vec3 normal = normalize(vec3(-waterData.z, 0.2, -waterData.w));
      vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
      float glint = pow(max(0.0, dot(normal, lightDir)), 60.0);
      
      // Enhanced glint with subtle color tinting
      vec3 glintColor = vec3(1.0, 0.95, 0.9); // Warm white
      
      gl_FragColor = vec4(color + glint * glintColor, 1.0);
    }
  `;

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }, [createShader]);

  const createFramebuffer = useCallback((gl: WebGLRenderingContext, width: number, height: number) => {
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    return { framebuffer, texture };
  }, []);

  const loadImage = useCallback((gl: WebGLRenderingContext, url: string) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Use the first default image as placeholder instead of gradient
    const defaultImageUrl = 'https://images.unsplash.com/photo-1738916218012-4e580beae18e?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
    
    // Create a simple placeholder while loading
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a1a'; // Dark neutral color
    ctx.fillRect(0, 0, 1, 1);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      console.log('Image loaded successfully:', url);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      setIsImageLoading(false);
    };
    image.onerror = (e) => {
      console.error('Failed to load image:', url, e);
      // Load default image on error
      if (url !== defaultImageUrl) {
        image.src = defaultImageUrl;
      } else {
        setIsImageLoading(false);
      }
    };
    
    // Set loading state if this is not the initial load
    if (imageTextureRef.current) {
      setIsImageLoading(true);
    }
    
    image.src = url;
    
    return texture;
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Check for float texture support
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      console.error('Float textures not supported');
      return;
    }

    glRef.current = gl;

    // Create shader programs
    const waterProgram = createProgram(gl, vertexShaderSource, waterFragmentShaderSource);
    const imageProgram = createProgram(gl, vertexShaderSource, imageFragmentShaderSource);
    
    if (!waterProgram || !imageProgram) return;
    
    waterProgramRef.current = waterProgram;
    imageProgramRef.current = imageProgram;

    // Create framebuffers
    const fbA = createFramebuffer(gl, canvas.width, canvas.height);
    const fbB = createFramebuffer(gl, canvas.width, canvas.height);
    
    framebufferARef.current = fbA.framebuffer;
    framebufferBRef.current = fbB.framebuffer;
    textureARef.current = fbA.texture;
    textureBRef.current = fbB.texture;

    // Load image texture
    imageTextureRef.current = loadImage(gl, imageUrl);

    // Create quad geometry
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    setIsInitialized(true);
  }, [createProgram, createFramebuffer, loadImage, imageUrl, vertexShaderSource, waterFragmentShaderSource, imageFragmentShaderSource]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas || !isInitialized) return;

    const waterProgram = waterProgramRef.current;
    const imageProgram = imageProgramRef.current;
    
    if (!waterProgram || !imageProgram) return;

    frameCountRef.current++;

    // Ping-pong between textures
    const readTexture = frameCountRef.current % 2 === 0 ? textureARef.current : textureBRef.current;
    const writeFramebuffer = frameCountRef.current % 2 === 0 ? framebufferBRef.current : framebufferARef.current;
    const writeTexture = frameCountRef.current % 2 === 0 ? textureBRef.current : textureARef.current;

    // First pass: Water simulation
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(waterProgram);

    // Bind previous frame's water data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTexture);
    gl.uniform1i(gl.getUniformLocation(waterProgram, 'u_texture'), 0);

    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(waterProgram, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform1i(gl.getUniformLocation(waterProgram, 'u_frame'), frameCountRef.current);
    gl.uniform3f(gl.getUniformLocation(waterProgram, 'u_mouse'), 
      mouseRef.current.x, mouseRef.current.y, mouseRef.current.down ? 1.0 : 0.0);
    
    // Set water physics parameters
    gl.uniform1f(gl.getUniformLocation(waterProgram, 'u_waveSpeed'), waveSpeed);
    gl.uniform1f(gl.getUniformLocation(waterProgram, 'u_springStrength'), springStrength);
    gl.uniform1f(gl.getUniformLocation(waterProgram, 'u_velocityDamping'), velocityDamping);
    gl.uniform1f(gl.getUniformLocation(waterProgram, 'u_pressureDamping'), pressureDamping);
    gl.uniform1f(gl.getUniformLocation(waterProgram, 'u_rippleSize'), rippleSize);
    gl.uniform1f(gl.getUniformLocation(waterProgram, 'u_rippleStrength'), rippleStrength);

    // Set up position attribute
    const positionLocation = gl.getAttribLocation(waterProgram, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Second pass: Render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(imageProgram);

    // Bind water simulation data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, writeTexture);
    gl.uniform1i(gl.getUniformLocation(imageProgram, 'u_waterTexture'), 0);

    // Bind image texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, imageTextureRef.current);
    gl.uniform1i(gl.getUniformLocation(imageProgram, 'u_imageTexture'), 1);

    gl.uniform2f(gl.getUniformLocation(imageProgram, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(imageProgram, 'u_distortionStrength'), distortionStrength);
    
    // Set chromatic aberration parameters
    gl.uniform1f(gl.getUniformLocation(imageProgram, 'u_chromaticAberrationStrength'), chromaticAberrationStrength);
    gl.uniform1f(gl.getUniformLocation(imageProgram, 'u_chromaticAberrationDispersal'), chromaticAberrationDispersal);

    // Set up position attribute
    const imagePositionLocation = gl.getAttribLocation(imageProgram, 'a_position');
    gl.enableVertexAttribArray(imagePositionLocation);
    gl.vertexAttribPointer(imagePositionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationRef.current = requestAnimationFrame(render);
  }, [isInitialized, waveSpeed, springStrength, velocityDamping, pressureDamping, rippleSize, rippleStrength, distortionStrength, chromaticAberrationStrength, chromaticAberrationDispersal]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = canvas.height - (e.clientY - rect.top); // Flip Y coordinate
  }, []);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.down = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  useEffect(() => {
    initWebGL();
  }, [initWebGL]);

  useEffect(() => {
    if (isInitialized) {
      render();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render, isInitialized]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Reinitialize WebGL context after resize
      if (isInitialized) {
        initWebGL();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initWebGL, isInitialized]);

  // Handle image URL changes with smooth transition
  useEffect(() => {
    if (!isInitialized || !glRef.current || currentImageUrl === imageUrl) return;
    
    console.log('Image URL changed from', currentImageUrl, 'to', imageUrl);
    
    // Store the current texture as previous
    previousImageTextureRef.current = imageTextureRef.current;
    
    // Load the new image
    imageTextureRef.current = loadImage(glRef.current, imageUrl);
    
    // Start transition
    transitionRef.current = { active: true, progress: 0, duration: 600 };
    transitionStartRef.current = Date.now();
    
    setCurrentImageUrl(imageUrl);
  }, [imageUrl, isInitialized, currentImageUrl, loadImage]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ display: 'block' }}
      />
      
      {/* Loading overlay with blur effect */}
      {isImageLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
          <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-white/90 text-sm">Loading image...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}