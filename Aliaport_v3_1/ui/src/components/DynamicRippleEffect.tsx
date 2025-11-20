import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DynamicRippleEffectProps {
  imageUrl: string;
  nSize?: number;
  nStrength?: number;
  turbInfluence?: number;
  rippleSpeed?: number;
  rippleFreq?: number;
  size?: number;
  dropSpeed?: number;
  dropSize?: number;
  sampleDistance?: number;
  diffusion?: number;
  turbulence?: number;
  rotSpeed?: number;
}

export function DynamicRippleEffect({ 
  imageUrl,
  nSize = 5.0,
  nStrength = 1.0,
  turbInfluence = 0.025,
  rippleSpeed = 10.0,
  rippleFreq = 20.0,
  size = 0.8,
  dropSpeed = 1.0,
  dropSize = 0.7,
  sampleDistance = 10.0,
  diffusion = -1.0,
  turbulence = 0.3,
  rotSpeed = 0.05
}: DynamicRippleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, down: false });

  // Shader programs for each buffer
  const bufferAProgramRef = useRef<WebGLProgram | null>(null);
  const bufferBProgramRef = useRef<WebGLProgram | null>(null);
  const bufferCProgramRef = useRef<WebGLProgram | null>(null);
  const finalProgramRef = useRef<WebGLProgram | null>(null);
  
  // Framebuffers for multi-pass rendering
  const framebufferARef = useRef<{ current: WebGLFramebuffer | null, prev: WebGLFramebuffer | null }>({ current: null, prev: null });
  const framebufferBRef = useRef<{ current: WebGLFramebuffer | null, prev: WebGLFramebuffer | null }>({ current: null, prev: null });
  const framebufferCRef = useRef<WebGLFramebuffer | null>(null);
  
  // Textures
  const textureARef = useRef<{ current: WebGLTexture | null, prev: WebGLTexture | null }>({ current: null, prev: null });
  const textureBRef = useRef<{ current: WebGLTexture | null, prev: WebGLTexture | null }>({ current: null, prev: null });
  const textureCRef = useRef<WebGLTexture | null>(null);
  const imageTextureRef = useRef<WebGLTexture | null>(null);

  // Vertex shader (shared)
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = (a_position + 1.0) * 0.5;
    }
  `;

  // Buffer A - Generate water ripple and normal
  const bufferAFragmentShader = `
    precision highp float;
    
    uniform sampler2D iChannel0; // Previous frame
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec3 iMouse;
    uniform int iFrame;
    uniform float nSize;
    uniform float nStrength;
    uniform float turbInfluence;
    uniform float rippleSpeed;
    uniform float rippleFreq;
    uniform float size;
    uniform float dropSpeed;
    uniform float dropSize;
    
    varying vec2 v_texCoord;
    
    float pi = 3.14159265359;
    
    float hash(float n) {
       return fract(sin(dot(vec2(n,n), vec2(12.9898,78.233))) * 43758.5453);  
    } 

    float brush(vec2 uv, float tile) {            
        uv *= tile;
        float mouseRipple;

        if(iMouse.z > 0.5) {     
            vec2 mPos = iMouse.xy/iResolution.xy;
            mPos.x *= iResolution.x/iResolution.y; 
            mPos *= tile;
            
            float l = 1.0 - length(uv - mPos);
            mouseRipple = smoothstep(size, 1.0, l);
        } else {
            mouseRipple = 0.0; 
        }
         
        float dropRipple = 0.0;
        
        for (int i = 0; i < 10; i++) {
            float ifloat = float(i)+1.0;
            float phase = (ifloat/10.0)*dropSpeed;
            float t = iTime*dropSpeed + phase;
            float rX = hash(floor(t)+ifloat);
            float rY = hash(floor(t)*0.5+ifloat);
            
            vec2 rPos = vec2(rX,rY)*tile; 
            rPos.x *= iResolution.x/iResolution.y; 
            float rl = 1.0 - length(uv - rPos);
            float fTime = fract(t);
            float rRipple = sin(rl*rippleFreq + fTime*rippleSpeed)*0.5+0.5;
            float rB = smoothstep((1.0 - fTime)*dropSize, 1.0, rl);
            dropRipple += rB*rRipple*(1.0 - fTime);
        }
        
        return dropRipple + mouseRipple;
    }
        
    vec3 calculateNormals(vec2 uv, float tile) {
        float offsetX = nSize/iResolution.x;
        float offsetY = nSize/iResolution.y;
        vec2 ovX = vec2(offsetX, 0.0);
        vec2 ovY = vec2(0.0, offsetY);
        
        float X = (brush(uv - ovX, tile) - brush(uv + ovX, tile)) * nStrength;
        float Y = (brush(uv - ovY, tile) - brush(uv + ovY, tile)) * nStrength;
        float Z = brush(uv, tile);
        
        return vec3(X,Y,Z);
    }

    void main() {
        float ratio = iResolution.x/iResolution.y;
        vec2 uv = v_texCoord;
        
        vec2 uvR = uv;
        uvR.x *= ratio;
        
        vec4 tex = vec4(0.0, 0.0, 1.0, 0.0);
        if (iFrame > 0) {
            tex = mix(vec4(0.0,0.0,1.0,0.0), texture2D(iChannel0, uv)*2.0-1.0, turbInfluence);
        }
        
        // Mask border to avoid artefacts
        float maskX = sin(uv.x*pi);
        float maskY = sin(uv.y*pi);
        float mask = smoothstep(0.3, 0.0, maskX*maskY);
        
        vec3 n = calculateNormals(uvR, 2.0); 
        
        gl_FragColor = mix(vec4(vec3(tex.x + n.x,tex.y + n.y,0.0)*0.5+0.5, n.z), vec4(0.5,0.5,1.0,0.0), mask);
    }
  `;

  // Buffer B - Fluid Effect Buffer
  const bufferBFragmentShader = `
    precision highp float;
    
    uniform sampler2D iChannel0; // Buffer A current
    uniform sampler2D iChannel1; // Buffer B previous
    uniform sampler2D iChannel2; // Reset texture (not used)
    uniform sampler2D iChannel3; // Buffer C (turbulence)
    uniform vec2 iResolution;
    uniform float iTimeDelta;
    uniform int iFrame;
    uniform float sampleDistance;
    uniform float diffusion;
    uniform float turbulence;
    
    varying vec2 v_texCoord;

    void main() {
        vec2 uv = v_texCoord;
        
        vec4 baseColor = texture2D(iChannel0, uv)*2.0-1.0;
        
        vec2 sDist = sampleDistance/iResolution.xy;
        
        vec4 newColor = texture2D(iChannel1, uv);
        vec2 turb = (texture2D(iChannel3, uv).xy*2.0-1.0)*turbulence;

        vec4 newColor1 = texture2D(iChannel1, uv + vec2(1.0,0.0)*sDist);
        vec4 newColor2 = texture2D(iChannel1, uv + vec2(-1.0,0.0)*sDist);
        vec4 newColor3 = texture2D(iChannel1, uv + vec2(0.0,1.0)*sDist);
        vec4 newColor4 = texture2D(iChannel1, uv + vec2(0.0,-1.0)*sDist);
        
        vec4 newColor5 = texture2D(iChannel1, uv + vec2(1.0,1.0)*sDist);
        vec4 newColor6 = texture2D(iChannel1, uv + vec2(-1.0,1.0)*sDist);
        vec4 newColor7 = texture2D(iChannel1, uv + vec2(1.0,-1.0)*sDist);
        vec4 newColor8 = texture2D(iChannel1, uv + vec2(-1.0,-1.0)*sDist);
         
        vec2 t = newColor1.xy * 2.0 - 1.0;
        t += newColor2.xy * 2.0 - 1.0;
        t += newColor3.xy * 2.0 - 1.0;
        t += newColor4.xy * 2.0 - 1.0;
        
        t += newColor5.xy * 2.0 - 1.0;
        t += newColor6.xy * 2.0 - 1.0;
        t += newColor7.xy * 2.0 - 1.0;
        t += newColor8.xy * 2.0 - 1.0;
        
        t /= 8.0;

        vec2 dir = vec2(t+turb)*diffusion*iTimeDelta;
        
        vec4 res = texture2D(iChannel1, uv + dir);
        
        baseColor = baseColor*0.5+0.5;
        
        if(iFrame < 10) {
            gl_FragColor = baseColor;
        } else {
            gl_FragColor = mix(res, baseColor, baseColor.a);
        }
    }
  `;

  // Buffer C - Turbulence Buffer
  const bufferCFragmentShader = `
    precision highp float;
    
    uniform sampler2D iChannel0; // Buffer A
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float turbulence;
    
    varying vec2 v_texCoord;
    
    vec2 speed = vec2(5.0,-2.0);
    float v = 30.0;
    float dist = 0.3;
    float random1 = 1.0;
    float random2 = 2.0;

    float hash(float n) {
       return fract(sin(dot(vec2(n,n), vec2(12.9898,78.233))) * 43758.5453);  
    }  

    vec2 turbulenceFunc(vec2 uv) {
        vec2 turb;
        turb.x = sin(uv.x);
        turb.y = cos(uv.y);
        
        for(int i = 0; i < 10; i++) {
            float ifloat = 1.0 + float(i);
            float ifloat1 = ifloat + random1;
            float ifloat2 = ifloat + random2; 
            
            float r1 = hash(ifloat1)*2.0-1.0;
            float r2 = hash(ifloat2)*2.0-1.0;
            
            vec2 turb2;
            turb2.x = sin(uv.x*(1.0 + r1*v) + turb.y*dist*ifloat + iTime*speed.x*r2);
            turb2.y = cos(uv.y*(1.0 + r1*v) + turb.x*dist*ifloat + iTime*speed.y*r2);
            
            turb.x = mix(turb.x, turb2.x, 0.5);
            turb.y = mix(turb.y, turb2.y, 0.5);
        }
        
        return turb;
    }

    void main() {
        float ratio = iResolution.x/iResolution.y;
        vec2 uv = v_texCoord;
        uv.x *= ratio;
        
        vec4 buff = texture2D(iChannel0, v_texCoord)*2.0-1.0;
        vec2 turb = turbulenceFunc(uv+buff.xy*0.1)*0.5+0.5;
        
        gl_FragColor = vec4(turb.x, turb.y, 0.0, 0.0);
    }
  `;

  // Final render shader
  const finalFragmentShader = `
    precision highp float;
    
    uniform sampler2D iChannel0; // Buffer A (normals)
    uniform sampler2D iChannel1; // Image texture
    uniform sampler2D iChannel2; // Buffer B (fluid)
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float rotSpeed;
    
    varying vec2 v_texCoord;

    void main() {
        vec2 uv = v_texCoord;
        
        vec4 buff = texture2D(iChannel0, uv)*2.0-1.0;
        float z = sqrt(1.0 - clamp(dot(vec2(buff.x,buff.y), vec2(buff.x,buff.y)), 0.0, 1.0));
        vec3 n = normalize(vec3(buff.x, buff.y, z));
        
        vec3 lightDir = normalize(vec3(sin(iTime*rotSpeed), cos(iTime*rotSpeed), 0.5));
        
        float l = max(0.0, dot(n, lightDir));
        float fresnel = 1.0 - dot(vec3(0.0,0.0,1.0), n);
        
        // Simple reflection calculation instead of reflect()
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 reflectDir = viewDir - 2.0 * dot(viewDir, n) * n;
        vec2 reflectUV = uv + reflectDir.xy * 0.1;
        vec4 refl = texture2D(iChannel2, clamp(reflectUV, 0.0, 1.0));
        
        vec2 distortedUV = vec2(uv.x*(iResolution.x/iResolution.y), uv.y) + n.xy * 0.05;
        vec4 tex = texture2D(iChannel1, clamp(distortedUV, 0.0, 1.0));
        
        gl_FragColor = tex * 0.7 + vec4(vec3(fresnel + l), 1.0) * refl * 0.3;
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    return { framebuffer, texture };
  }, []);

  const loadImage = useCallback((gl: WebGLRenderingContext, url: string) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Create a test pattern placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create a nice gradient pattern
    for (let x = 0; x < 256; x++) {
      for (let y = 0; y < 256; y++) {
        const r = Math.sin(x * 0.02) * 127 + 128;
        const g = Math.sin(y * 0.02) * 127 + 128;
        const b = Math.sin((x + y) * 0.01) * 127 + 128;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.onerror = () => console.error('Failed to load image:', url);
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

    glRef.current = gl;

    // Create shader programs
    const bufferAProgram = createProgram(gl, vertexShaderSource, bufferAFragmentShader);
    const bufferBProgram = createProgram(gl, vertexShaderSource, bufferBFragmentShader);
    const bufferCProgram = createProgram(gl, vertexShaderSource, bufferCFragmentShader);
    const finalProgram = createProgram(gl, vertexShaderSource, finalFragmentShader);
    
    if (!bufferAProgram || !bufferBProgram || !bufferCProgram || !finalProgram) return;
    
    bufferAProgramRef.current = bufferAProgram;
    bufferBProgramRef.current = bufferBProgram;
    bufferCProgramRef.current = bufferCProgram;
    finalProgramRef.current = finalProgram;

    // Create framebuffers and textures
    const fbA1 = createFramebuffer(gl, canvas.width, canvas.height);
    const fbA2 = createFramebuffer(gl, canvas.width, canvas.height);
    const fbB1 = createFramebuffer(gl, canvas.width, canvas.height);
    const fbB2 = createFramebuffer(gl, canvas.width, canvas.height);
    const fbC = createFramebuffer(gl, canvas.width, canvas.height);
    
    framebufferARef.current = { current: fbA1.framebuffer, prev: fbA2.framebuffer };
    framebufferBRef.current = { current: fbB1.framebuffer, prev: fbB2.framebuffer };
    framebufferCRef.current = fbC.framebuffer;
    
    textureARef.current = { current: fbA1.texture, prev: fbA2.texture };
    textureBRef.current = { current: fbB1.texture, prev: fbB2.texture };
    textureCRef.current = fbC.texture;

    // Load image texture
    imageTextureRef.current = loadImage(gl, imageUrl);

    // Create quad geometry
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    setIsInitialized(true);
  }, [createProgram, createFramebuffer, loadImage, imageUrl]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas || !isInitialized) return;

    frameCountRef.current++;
    timeRef.current += 0.016; // ~60fps

    const timeDelta = 0.016;

    // Ping-pong textures
    const useFirst = frameCountRef.current % 2 === 0;
    const fbA = useFirst ? framebufferARef.current.current : framebufferARef.current.prev;
    const fbAPrev = useFirst ? framebufferARef.current.prev : framebufferARef.current.current;
    const texA = useFirst ? textureARef.current.current : textureARef.current.prev;
    const texAPrev = useFirst ? textureARef.current.prev : textureARef.current.current;
    
    const fbB = useFirst ? framebufferBRef.current.current : framebufferBRef.current.prev;
    const fbBPrev = useFirst ? framebufferBRef.current.prev : framebufferBRef.current.current;
    const texB = useFirst ? textureBRef.current.current : textureBRef.current.prev;
    const texBPrev = useFirst ? textureBRef.current.prev : textureBRef.current.current;

    // Render Buffer A (ripples and normals)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(bufferAProgramRef.current);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texAPrev);
    gl.uniform1i(gl.getUniformLocation(bufferAProgramRef.current!, 'iChannel0'), 0);

    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(bufferAProgramRef.current!, 'iResolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'iTime'), timeRef.current);
    gl.uniform3f(gl.getUniformLocation(bufferAProgramRef.current!, 'iMouse'), 
      mouseRef.current.x, canvas.height - mouseRef.current.y, mouseRef.current.down ? 1.0 : 0.0);
    gl.uniform1i(gl.getUniformLocation(bufferAProgramRef.current!, 'iFrame'), frameCountRef.current);
    
    // Set parameters
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'nSize'), nSize);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'nStrength'), nStrength);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'turbInfluence'), turbInfluence);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'rippleSpeed'), rippleSpeed);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'rippleFreq'), rippleFreq);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'size'), size);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'dropSpeed'), dropSpeed);
    gl.uniform1f(gl.getUniformLocation(bufferAProgramRef.current!, 'dropSize'), dropSize);

    const positionLocation = gl.getAttribLocation(bufferAProgramRef.current!, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Render Buffer C (turbulence)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferCRef.current);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(bufferCProgramRef.current);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(gl.getUniformLocation(bufferCProgramRef.current!, 'iChannel0'), 0);

    gl.uniform2f(gl.getUniformLocation(bufferCProgramRef.current!, 'iResolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(bufferCProgramRef.current!, 'iTime'), timeRef.current);
    gl.uniform1f(gl.getUniformLocation(bufferCProgramRef.current!, 'turbulence'), turbulence);

    const positionLocationC = gl.getAttribLocation(bufferCProgramRef.current!, 'a_position');
    gl.enableVertexAttribArray(positionLocationC);
    gl.vertexAttribPointer(positionLocationC, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Render Buffer B (fluid diffusion)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(bufferBProgramRef.current);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(gl.getUniformLocation(bufferBProgramRef.current!, 'iChannel0'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texBPrev);
    gl.uniform1i(gl.getUniformLocation(bufferBProgramRef.current!, 'iChannel1'), 1);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, textureCRef.current);
    gl.uniform1i(gl.getUniformLocation(bufferBProgramRef.current!, 'iChannel3'), 3);

    gl.uniform2f(gl.getUniformLocation(bufferBProgramRef.current!, 'iResolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(bufferBProgramRef.current!, 'iTimeDelta'), timeDelta);
    gl.uniform1i(gl.getUniformLocation(bufferBProgramRef.current!, 'iFrame'), frameCountRef.current);
    gl.uniform1f(gl.getUniformLocation(bufferBProgramRef.current!, 'sampleDistance'), sampleDistance);
    gl.uniform1f(gl.getUniformLocation(bufferBProgramRef.current!, 'diffusion'), diffusion);
    gl.uniform1f(gl.getUniformLocation(bufferBProgramRef.current!, 'turbulence'), turbulence);

    const positionLocationB = gl.getAttribLocation(bufferBProgramRef.current!, 'a_position');
    gl.enableVertexAttribArray(positionLocationB);
    gl.vertexAttribPointer(positionLocationB, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Final render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(finalProgramRef.current);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(gl.getUniformLocation(finalProgramRef.current!, 'iChannel0'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, imageTextureRef.current);
    gl.uniform1i(gl.getUniformLocation(finalProgramRef.current!, 'iChannel1'), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.uniform1i(gl.getUniformLocation(finalProgramRef.current!, 'iChannel2'), 2);

    gl.uniform2f(gl.getUniformLocation(finalProgramRef.current!, 'iResolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(finalProgramRef.current!, 'iTime'), timeRef.current);
    gl.uniform1f(gl.getUniformLocation(finalProgramRef.current!, 'rotSpeed'), rotSpeed);

    const finalPositionLocation = gl.getAttribLocation(finalProgramRef.current!, 'a_position');
    gl.enableVertexAttribArray(finalPositionLocation);
    gl.vertexAttribPointer(finalPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationRef.current = requestAnimationFrame(render);
  }, [isInitialized, nSize, nStrength, turbInfluence, rippleSpeed, rippleFreq, size, dropSpeed, dropSize, sampleDistance, diffusion, turbulence, rotSpeed]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
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
      
      if (isInitialized) {
        initWebGL();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [initWebGL, isInitialized]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ display: 'block' }}
    />
  );
}