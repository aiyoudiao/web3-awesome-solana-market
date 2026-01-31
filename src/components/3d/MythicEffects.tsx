import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useQualityStore } from '@/stores/useQualityStore';

// === Aurora Shader (极光) ===
const AuroraMaterial = shaderMaterial(
  { time: 0, color1: new THREE.Color("#A78BFA"), color2: new THREE.Color("#14F195") },
  // Vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      float t = time * 0.15;
      float bands = sin(uv.y * 10.0 + t) * 0.5 + 0.5;
      float sweep = sin(uv.x * 6.0 + t * 1.7) * 0.5 + 0.5;
      float shimmer = sin((uv.x + uv.y) * 14.0 + t * 2.0) * 0.5 + 0.5;
      float alpha = smoothstep(0.25, 0.85, bands * 0.55 + sweep * 0.35 + shimmer * 0.25);
      alpha *= smoothstep(0.0, 0.25, uv.y) * (1.0 - uv.y);

      vec3 color = mix(color1, color2, uv.x);
      color = mix(color, vec3(1.0), 0.1 * shimmer);
      gl_FragColor = vec4(color, alpha * 0.55);
    }
  `
);

extend({ AuroraMaterial });

export const Aurora = () => {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (matRef.current) matRef.current.time = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0, 50, -100]} rotation={[0, 0, 0]} scale={[200, 50, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      {/* @ts-ignore */}
      <auroraMaterial ref={matRef} transparent side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

// === Mythic Water Shader ===
const MythicWaterMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color("#006994"),
    gridScale: 40,
    waveAmp: 0.5,
    waveFreq1: 0.2,
    waveFreq2: 0.15,
    pulseStrength: 0.35,
  },
  // Vertex
  `
    varying vec2 vUv;
    uniform float time;
    uniform float waveAmp;
    uniform float waveFreq1;
    uniform float waveFreq2;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * waveFreq1 + time) * waveAmp;
      pos.z += cos(pos.y * waveFreq2 + time * 1.5) * waveAmp;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment
  `
    uniform float time;
    uniform vec3 color;
    uniform float gridScale;
    uniform float pulseStrength;
    varying vec2 vUv;
    
    void main() {
      float gx = step(0.985, fract(vUv.x * gridScale));
      float gy = step(0.985, fract(vUv.y * gridScale));
      float grid = min(gx + gy, 1.0);
      vec3 finalColor = color + vec3(grid * 0.45);

      float dist = length(vUv - 0.5);
      float pulse = sin(time * 1.6 - dist * 10.0) * 0.5 + 0.5;
      finalColor += vec3(0.0, 0.18, 0.38) * (pulse * pulseStrength);

      gl_FragColor = vec4(finalColor, 0.82);
    }
  `
);

extend({ MythicWaterMaterial });

export const MythicWater = () => {
    const level = useQualityStore((s) => s.level);
    const matRef = useRef<any>(null);
    useFrame((state) => {
        if (matRef.current) matRef.current.time = state.clock.elapsedTime;
    });

    const segments = useMemo(() => {
        if (level === 'low') return 24;
        if (level === 'medium') return 40;
        if (level === 'high') return 64;
        return 96;
    }, [level]);

    const waterParams = useMemo(() => {
        if (level === 'low') return { gridScale: 18, waveAmp: 0.22, waveFreq1: 0.12, waveFreq2: 0.1, pulseStrength: 0.12 };
        if (level === 'medium') return { gridScale: 24, waveAmp: 0.32, waveFreq1: 0.16, waveFreq2: 0.13, pulseStrength: 0.2 };
        if (level === 'high') return { gridScale: 32, waveAmp: 0.42, waveFreq1: 0.18, waveFreq2: 0.15, pulseStrength: 0.3 };
        return { gridScale: 40, waveAmp: 0.5, waveFreq1: 0.2, waveFreq2: 0.15, pulseStrength: 0.35 };
    }, [level]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000, segments, segments]} />
            {/* @ts-ignore */}
            <mythicWaterMaterial ref={matRef} transparent {...waterParams} />
        </mesh>
    );
};

// === Digital Rain (Matrix style) ===
// 简化版：使用粒子系统模拟
export const DigitalRain = () => {
    // ... complex implementation omitted for brevity, using simple planes for now
    return null;
};
