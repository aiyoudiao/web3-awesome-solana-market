import { useRef, memo, useState, useEffect, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Group, MathUtils, Shape, ExtrudeGeometry, Color, ShaderMaterial, AdditiveBlending, MeshBasicMaterial } from 'three';
import { Trail, Sparkles, Float, useTexture, GradientTexture, Html, shaderMaterial, Edges } from '@react-three/drei';
import { useCarAudio } from '@/hooks/useCarAudio';
import { CarLightningSystem } from './CarLightningSystem';
import { useStore } from '@/lib/store';
import { extend } from '@react-three/fiber';
import { createRuneTexture } from './runes';
import { useQualityStore } from '@/stores/useQualityStore';
import { TRINITY_MODES } from '@/mythic/trinity';

// === Mythic Shield Shader ===
const MythicShieldMaterial = shaderMaterial(
  { time: 0, color1: new Color("#9945FF"), color2: new Color("#14F195") },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // 动态能量波纹
      float wave = sin(vUv.y * 10.0 - time * 2.0) * 0.5 + 0.5;
      
      // 边缘发光 (Fresnel)
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      
      // 混合颜色
      vec3 finalColor = mix(color1, color2, wave);
      
      // 增加全息故障效果
      float glitch = step(0.95, sin(vUv.y * 50.0 + time * 5.0));
      finalColor += glitch * 0.5;

      gl_FragColor = vec4(finalColor, 0.6 + fresnel * 0.4);
    }
  `
);

const EnergyBandMaterial = shaderMaterial(
  { time: 0, color1: new Color("#9945FF"), color2: new Color("#14F195"), opacity: 0.55, flow: 1.0 },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float opacity;
    uniform float flow;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      float scan = sin((vUv.y * 10.0 + time * (2.4 * flow)) * 6.2831) * 0.5 + 0.5;
      float stripe = smoothstep(0.35, 0.85, scan);
      float edge = smoothstep(0.0, 0.06, vUv.x) * (1.0 - smoothstep(0.94, 1.0, vUv.x));
      float noise = (hash(vUv * 64.0 + time) - 0.5) * 0.12;
      float mixv = clamp(vUv.y + noise, 0.0, 1.0);
      vec3 c = mix(color1, color2, mixv);
      float a = opacity * (0.15 + stripe * 0.85) * edge;
      gl_FragColor = vec4(c, a);
    }
  `
);

extend({ MythicShieldMaterial, EnergyBandMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mythicShieldMaterial: any;
      energyBandMaterial: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      mythicShieldMaterial: any;
      energyBandMaterial: any;
    }
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    mythicShieldMaterial: any;
    energyBandMaterial: any;
  }
}

interface MythicVehicleProps {
  onPositionChange?: (position: { x: number; z: number }) => void;
  positionRef?: React.MutableRefObject<Vector3>;
  inputRef?: React.MutableRefObject<{ x: number; y: number }>;
  headingRef?: React.MutableRefObject<number>;
  speedRef?: React.MutableRefObject<number>;
}

/**
 * 神话赛博载具组件 (MythicVehicle)
 * @description
 * 能够变形的三栖载具：
 * 1. Kylin Cruiser (陆地 - 麒麟)
 * 2. Leviathan Yacht (海洋 - 鲲)
 * 3. Phoenix Jet (天空 - 朱雀)
 */
export const CyberCar = memo(({ onPositionChange, positionRef, inputRef, headingRef, speedRef: externalSpeedRef }: MythicVehicleProps) => {
  const groupRef = useRef<Group>(null);
  const chassisRef = useRef<Group>(null);
  const shieldMatRefs = useRef<any[]>([]);
  const bandMatRefs = useRef<any[]>([]);
  const runeMatRef = useRef<MeshBasicMaterial>(null);
  
  // 车轮 Refs (仅 Car 模式使用)
  const wheelFLRef = useRef<Group>(null);
  const wheelFRRef = useRef<Group>(null);
  const wheelBLRef = useRef<Group>(null);
  const wheelBRRef = useRef<Group>(null);

  const driftAnchorRef = useRef<Group>(null);
  const tailAnchorRef = useRef<Group>(null);

  const tailSparklesRef = useRef<Group>(null);
  const driftSparksRef = useRef<Group>(null);
  const sonarRingRef = useRef<Mesh>(null);
  const sonicRingRef = useRef<Mesh>(null);
  const wingTrailLRef = useRef<Group>(null);
  const wingTrailRRef = useRef<Group>(null);
  const wakeTrailRef = useRef<Group>(null);
  const afterburnerMeshRef = useRef<Mesh>(null);
  const afterburnerMatRef = useRef<MeshBasicMaterial>(null);
  const sonicProgress = useRef(0);
  const sonicCooldown = useRef(0);
  const prevSpeedRatioRef = useRef(0);

  // 全局状态
  const vehicleMode = useStore(state => state.vehicleMode);
  const setVehicleMode = useStore(state => state.setVehicleMode);

  const { visualPreset, level } = useQualityStore();
  
  // 音效系统
  const { update: updateAudio } = useCarAudio();

  // 物理状态
  const internalSpeedRef = useRef(0);
  const speed = externalSpeedRef || internalSpeedRef;
  const steering = useRef(0);
  const heading = useRef(0);
  const position = useRef(new Vector3(0, 0.5, 8));
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // 飞行高度 (Jet 模式)
  const altitude = useRef(0.5);
  
  // 变形特效状态
  const [transforming, setTransforming] = useState(false);
  
  // 监听模式变化触发特效
  useEffect(() => {
    setTransforming(true);
    const timer = setTimeout(() => setTransforming(false), 1000);
    return () => clearTimeout(timer);
  }, [vehicleMode]);

  useEffect(() => {
    prevSpeedRatioRef.current = 0;
    sonicProgress.current = 0;
    sonicCooldown.current = 0;
  }, [vehicleMode]);

  // 物理配置 (根据模式动态调整)
  const config = useMemo(() => {
    switch (vehicleMode) {
        case 'jet':
            return { maxSpeed: 2.0, acceleration: 0.04, friction: 0.99, turnSpeed: 0.03, driftFactor: 1.0 };
        case 'yacht':
            return { maxSpeed: 0.8, acceleration: 0.01, friction: 0.96, turnSpeed: 0.02, driftFactor: 0.99 }; // 惯性大
        case 'car':
        default:
            return { maxSpeed: 1.2, acceleration: 0.03, friction: 0.98, turnSpeed: 0.05, driftFactor: 0.92 };
    }
  }, [vehicleMode]);

  // 键盘监听
  useEffect(() => {
    window.focus();
    const handleKeyDown = (e: KeyboardEvent) => { 
        keys.current[e.code] = true; 
        // 模式切换快捷键
        if (e.key === '1') setVehicleMode('car');
        if (e.key === '2') setVehicleMode('yacht');
        if (e.key === '3') setVehicleMode('jet');
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setVehicleMode]);

  useFrame((state, delta) => {
    // 1. 输入处理
    let targetSpeed = 0;
    let targetSteering = 0;

    if (keys.current['ArrowUp'] || keys.current['KeyW']) targetSpeed = config.maxSpeed;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) targetSpeed = -config.maxSpeed * 0.5;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) targetSteering = 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) targetSteering = -1;

    // 虚拟摇杆
    if (inputRef && inputRef.current && targetSpeed === 0 && targetSteering === 0) {
        const joyX = inputRef.current.x;
        const joyY = inputRef.current.y;
        if (Math.abs(joyY) > 0.1 || Math.abs(joyX) > 0.1) {
            targetSpeed = -joyY * config.maxSpeed;
            targetSteering = -joyX;
        }
    }

    // === Gamepad Support (E-sports Level) ===
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads[0]) {
        const gp = gamepads[0];
        // Left Stick for Steering (Axis 0)
        if (Math.abs(gp.axes[0]) > 0.1) {
            targetSteering = -gp.axes[0]; // Invert for natural feel
        }
        // Triggers for Gas/Brake (Button 7 / Button 6)
        // Or Right Trigger (Button 7) for Gas, Left Trigger (Button 6) for Brake
        const gas = gp.buttons[7].value;
        const brake = gp.buttons[6].value;
        
        if (gas > 0.1) {
            targetSpeed = gas * config.maxSpeed;
        } else if (brake > 0.1) {
            targetSpeed = -brake * config.maxSpeed * 0.5;
        }
        
        // Mode Switch via Face Buttons
        if (gp.buttons[0].pressed) setVehicleMode('car');   // A / Cross
        if (gp.buttons[1].pressed) setVehicleMode('yacht'); // B / Circle
        if (gp.buttons[3].pressed) setVehicleMode('jet');   // Y / Triangle
    }

    const isDrifting = Math.abs(steering.current) > 0.5 && Math.abs(speed.current) > 0.4;
    const speedAbs = Math.abs(speed.current);
    const speedRatio = Math.min(speedAbs / config.maxSpeed, 1);
    const allowVfx = visualPreset !== 'esports' && level !== 'low';
    const allowHeavyVfx = visualPreset !== 'esports' && (level === 'high' || level === 'ultra');
    
    // 传递 vehicleMode 参数给音效系统
    updateAudio(speed.current, isDrifting, position.current, vehicleMode);

    // 2. 物理更新
    // 速度平滑
    if (targetSpeed > 0) {
        if (speed.current < targetSpeed) speed.current = Math.min(speed.current + config.acceleration, targetSpeed);
    } else if (targetSpeed < 0) {
        if (speed.current > targetSpeed) speed.current = Math.max(speed.current - config.acceleration, targetSpeed);
    } else {
        speed.current *= config.friction;
    }
    if (Math.abs(speed.current) < 0.001) speed.current = 0;

    // 转向
    if (Math.abs(speed.current) > 0.01) {
      steering.current = MathUtils.lerp(steering.current, targetSteering, 0.1);
      const direction = speed.current > 0 ? 1 : -1;
      heading.current += steering.current * config.turnSpeed * direction;
    } else {
        steering.current = MathUtils.lerp(steering.current, 0, 0.1);
    }

    // 飞行高度逻辑
    let targetAltitude = 0.5; // Car/Yacht 默认高度
    if (vehicleMode === 'jet') {
        targetAltitude = 15.0; // 飞行高度
        // 简单的起飞/降落平滑
        altitude.current = MathUtils.lerp(altitude.current, targetAltitude, 0.02);
    } else if (vehicleMode === 'yacht') {
        targetAltitude = 0.2; // 浮在水面
        // 浮力模拟
        altitude.current = MathUtils.lerp(altitude.current, targetAltitude + Math.sin(state.clock.elapsedTime) * 0.1, 0.1);
    } else {
        // Car
        altitude.current = MathUtils.lerp(altitude.current, 0.35, 0.1);
    }

    const velocityX = Math.sin(heading.current) * speed.current;
    const velocityZ = Math.cos(heading.current) * speed.current;
    
    const newX = position.current.x + velocityX;
    const newZ = position.current.z + velocityZ;
    
    position.current.x = Math.max(-200, Math.min(200, newX));
    position.current.z = Math.max(-200, Math.min(200, newZ));
    position.current.y = altitude.current;

    // 3. 模型变换
    if (groupRef.current) {
      groupRef.current.position.set(position.current.x, position.current.y, position.current.z);
      
      // 飞行模式下的倾斜 (Banking)
      let bankAngle = 0;
      if (vehicleMode === 'jet') {
          bankAngle = -steering.current * 0.5; // 飞机转向侧倾明显
      }
      
      groupRef.current.rotation.set(0, heading.current, bankAngle);
      
      // 车身微动作
      if (chassisRef.current) {
          // 加速抬头/刹车点头
          const pitch = (targetSpeed - speed.current) * 0.2;
          // 叠加 bank
          chassisRef.current.rotation.x = MathUtils.lerp(chassisRef.current.rotation.x, -pitch, 0.1);
          
          if (vehicleMode === 'car') {
             const bodyRoll = steering.current * speed.current * 0.3;
             chassisRef.current.rotation.z = MathUtils.lerp(chassisRef.current.rotation.z, -bodyRoll, 0.1);
          }
      }
    }

    // 4. 车轮动画 (仅 Car)
    if (vehicleMode === 'car') {
        const wheelRotationSpeed = speed.current * 15;
        if (wheelFLRef.current && wheelFRRef.current) {
            wheelFLRef.current.rotation.y = steering.current * 0.5;
            wheelFRRef.current.rotation.y = steering.current * 0.5;
            wheelFLRef.current.children[0].rotation.x += wheelRotationSpeed;
            wheelFRRef.current.children[0].rotation.x += wheelRotationSpeed;
        }
        if (wheelBLRef.current && wheelBRRef.current) {
            wheelBLRef.current.children[0].rotation.x += wheelRotationSpeed;
            wheelBRRef.current.children[0].rotation.x += wheelRotationSpeed;
        }
    }

    // 5. 状态同步
    if (positionRef) positionRef.current.copy(position.current);
    if (headingRef) headingRef.current = heading.current;
    if (onPositionChange) onPositionChange({ x: position.current.x, z: position.current.z });

    // 6. Shader Time Update
    for (const mat of shieldMatRefs.current) {
        if (mat) mat.time = state.clock.elapsedTime;
    }
    for (const mat of bandMatRefs.current) {
        if (mat) mat.time = state.clock.elapsedTime;
    }
    if (runeMatRef.current) {
        const base = vehicleMode === 'jet' ? 0.13 : vehicleMode === 'yacht' ? 0.09 : 0.11;
        const boost = transforming ? 0.22 : 0;
        const flicker = 0.03 * (Math.sin(state.clock.elapsedTime * 3.0) * 0.5 + 0.5);
        runeMatRef.current.opacity = Math.min(base + speedRatio * 0.08 + boost + flicker, 0.5);
    }

    if (tailSparklesRef.current) {
        tailSparklesRef.current.visible = allowVfx && speedAbs > 0.5;
        if (tailAnchorRef.current) tailSparklesRef.current.position.copy(tailAnchorRef.current.position);
    }

    if (driftSparksRef.current) {
        const enabled = vehicleMode === 'car' && isDrifting && allowVfx;
        driftSparksRef.current.visible = enabled;
        if (enabled && driftAnchorRef.current) {
            driftSparksRef.current.position.copy(driftAnchorRef.current.position);
        }
    }

    if (sonarRingRef.current) {
        const enabled = vehicleMode === 'yacht' && allowVfx && speedAbs > 0.15;
        sonarRingRef.current.visible = enabled;
        if (enabled) {
            const period = 1.6;
            const p = (state.clock.elapsedTime % period) / period;
            const scale = 0.6 + p * 4.2;
            sonarRingRef.current.scale.set(scale, scale, scale);
            const mat = sonarRingRef.current.material as any;
            if (mat) mat.opacity = (1 - p) * 0.35;
        }
    }

    if (sonicCooldown.current > 0) sonicCooldown.current = Math.max(0, sonicCooldown.current - delta);
    if (vehicleMode === 'jet' && sonicCooldown.current === 0) {
        if (prevSpeedRatioRef.current <= 0.95 && speedRatio > 0.95 && allowVfx) {
            sonicProgress.current = 0.0001;
            sonicCooldown.current = 1.2;
        }
    }
    prevSpeedRatioRef.current = speedRatio;

    if (sonicRingRef.current) {
        const enabled = vehicleMode === 'jet' && allowVfx;
        if (!enabled) {
            sonicRingRef.current.visible = false;
            sonicProgress.current = 0;
        } else {
            sonicRingRef.current.visible = sonicProgress.current > 0;
            if (sonicProgress.current > 0) {
                sonicProgress.current = Math.min(sonicProgress.current + delta * 1.25, 1);
                const s = 1 + sonicProgress.current * 10;
                sonicRingRef.current.scale.set(s, s, s);
                const mat = sonicRingRef.current.material as any;
                if (mat) mat.opacity = (1 - sonicProgress.current) * 0.45;
                if (sonicProgress.current >= 1) sonicProgress.current = 0;
            }
        }
    }

    if (afterburnerMeshRef.current && afterburnerMatRef.current) {
        const enabled = vehicleMode === 'jet' && allowVfx;
        if (!enabled) {
            afterburnerMeshRef.current.visible = false;
        } else {
            afterburnerMeshRef.current.visible = speedRatio > 0.62;
            const heat = Math.max(0, (speedRatio - 0.62) / 0.38);
            const flicker = 0.06 * (Math.sin(state.clock.elapsedTime * 20.0) * 0.5 + 0.5);
            afterburnerMatRef.current.opacity = 0.1 + heat * 0.75 + flicker;
            const s = 0.75 + heat * 0.65;
            afterburnerMeshRef.current.scale.set(s, s, 1);
        }
    }
  });

  // === 几何体构建 ===
  
  // 1. Car Shape (Wedge)
  const carShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, -0.2);
    shape.lineTo(1.1, 0.0);
    shape.quadraticCurveTo(1.45, 1.2, 1.18, 2.2);
    shape.lineTo(0.92, 3.95);
    shape.lineTo(0.28, 5.35);
    shape.lineTo(0.0, 5.55);
    shape.lineTo(-0.28, 5.35);
    shape.lineTo(-0.92, 3.95);
    shape.lineTo(-1.18, 2.2);
    shape.quadraticCurveTo(-1.45, 1.2, -1.1, 0.0);
    return shape;
  }, []);

  // 2. Jet Shape (Wings)
  const jetShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, -0.4);
    shape.lineTo(3.2, -1.6);
    shape.lineTo(1.55, 1.65);
    shape.lineTo(0.55, 4.6);
    shape.lineTo(0.0, 5.7);
    shape.lineTo(-0.55, 4.6);
    shape.lineTo(-1.55, 1.65);
    shape.lineTo(-3.2, -1.6);
    return shape;
  }, []);

  // 3. Yacht Shape (Boat)
  const yachtShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, -1.3);
    shape.quadraticCurveTo(1.9, -0.4, 1.65, 3.3);
    shape.lineTo(0.95, 5.15);
    shape.lineTo(0.0, 6.05);
    shape.lineTo(-0.95, 5.15);
    shape.lineTo(-1.65, 3.3);
    shape.quadraticCurveTo(-1.9, -0.4, 0, -1.3);
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({ steps: 1, depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }), []);

  const palette = TRINITY_MODES[vehicleMode].environment.palette;
  const colors = useMemo(() => {
    if (vehicleMode === 'jet') {
      return {
        bodyMain: "#050505",
        bodyAccent: palette.accent,
        glass: "#111111",
        rim: "#222",
        tire: "#080808",
        glow: palette.accent,
        engine: "#FF5A1F",
      };
    }
    if (vehicleMode === 'yacht') {
      return {
        bodyMain: "#050505",
        bodyAccent: palette.primary,
        glass: "#0A1220",
        rim: "#222",
        tire: "#080808",
        glow: palette.primary,
        engine: palette.primary,
      };
    }
    return {
      bodyMain: "#050505",
      bodyAccent: palette.primary,
      glass: "#111111",
      rim: "#222",
      tire: "#080808",
      glow: palette.accent,
      engine: palette.accent,
    };
  }, [palette.accent, palette.primary, vehicleMode]);

  const runeMap = useMemo(() => {
    return createRuneTexture({
      size: 512,
      seed: 1337,
      tile: 4,
      stroke: 'rgba(255,255,255,0.85)',
      glow: 'rgba(20,241,149,0.22)',
    });
  }, []);

  const cyberMap = useMemo(() => {
    const tex = createRuneTexture({
      size: 512,
      seed: vehicleMode === 'jet' ? 4207 : vehicleMode === 'yacht' ? 917 : 2222,
      tile: 10,
      stroke: `rgba(0,240,255,0.55)`,
      glow: `rgba(153,69,255,0.18)`,
      background: 'rgba(0,0,0,0)',
    });
    tex.repeat.set(10, 10);
    return tex;
  }, [vehicleMode]);

  // Solana 渐变色配置
  const solanaGradient = useMemo(() => {
    return {
      stops: [0, 0.5, 1],
      colors: [palette.primary, palette.accent, palette.primary],
    };
  }, [palette.accent, palette.primary]);

  const showHudTip = visualPreset !== 'esports' && level !== 'low';
  const allowVfx = visualPreset !== 'esports' && level !== 'low';
  const allowHeavyVfx = visualPreset !== 'esports' && (level === 'high' || level === 'ultra');
  const skinGlowIntensity = useMemo(() => {
    if (visualPreset === 'esports' || level === 'low') return 0.08;
    if (visualPreset === 'neon') return level === 'ultra' ? 1.15 : level === 'high' ? 0.95 : 0.75;
    return level === 'ultra' ? 0.65 : level === 'high' ? 0.5 : 0.38;
  }, [level, visualPreset]);
  const underglowIntensity = useMemo(() => {
    if (visualPreset === 'esports' || level === 'low') return 1.4;
    if (visualPreset === 'neon') return level === 'ultra' ? 6.2 : level === 'high' ? 5.2 : 4.2;
    return level === 'ultra' ? 4.2 : level === 'high' ? 3.6 : 3.0;
  }, [level, visualPreset]);
  const cyberDecalOpacity = useMemo(() => {
    if (visualPreset === 'esports' || level === 'low') return 0;
    if (visualPreset === 'neon') return level === 'ultra' ? 0.18 : level === 'high' ? 0.15 : 0.12;
    return level === 'ultra' ? 0.12 : level === 'high' ? 0.1 : 0.08;
  }, [level, visualPreset]);

  return (
    <group ref={groupRef}>
      {/* HUD 提示 (跟随车辆) */}
      {showHudTip ? (
        <Html position={[0, 2, 0]} center distanceFactor={10}>
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs whitespace-nowrap backdrop-blur-sm border border-white/20">
            {TRINITY_MODES[vehicleMode].zhName} (1/2/3)
          </div>
        </Html>
      ) : null}

      {vehicleMode === 'car' && allowHeavyVfx ? <CarLightningSystem speedRef={speed} active={true} /> : null}

      {vehicleMode === 'car' && allowVfx ? (
        <group ref={driftSparksRef} visible={false}>
          <group position={[0, 0.25, 0]}>
            <Sparkles count={level === 'ultra' ? 56 : level === 'high' ? 40 : 24} scale={2.2} size={6} speed={2.6} opacity={0.55} color={colors.engine} />
          </group>
          <group position={[0, 0.22, -0.5]}>
            <Sparkles count={level === 'ultra' ? 40 : level === 'high' ? 28 : 18} scale={2.8} size={5} speed={2.2} opacity={0.35} color={colors.glow} />
          </group>
        </group>
      ) : null}

      {vehicleMode === 'yacht' && allowVfx ? (
        <mesh ref={sonarRingRef} position={[0, -0.25, -0.5]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.9, 0.98, 64]} />
          <meshBasicMaterial color={palette.primary} transparent opacity={0.2} depthWrite={false} blending={AdditiveBlending} side={2} toneMapped={false} />
        </mesh>
      ) : null}

      {vehicleMode === 'jet' && allowVfx ? (
        <mesh ref={sonicRingRef} position={[0, 0.65, 0.2]} visible={false}>
          <ringGeometry args={[1.2, 1.35, 64]} />
          <meshBasicMaterial color={colors.engine} transparent opacity={0.3} depthWrite={false} blending={AdditiveBlending} side={2} toneMapped={false} />
        </mesh>
      ) : null}

      {allowVfx ? (
        <group ref={tailSparklesRef} position={[0, 0, 0]} visible={false}>
          <Sparkles
            count={
              vehicleMode === 'jet'
                ? level === 'ultra'
                  ? 56
                  : level === 'high'
                    ? 44
                    : 30
                : level === 'ultra'
                  ? 26
                  : level === 'high'
                    ? 20
                    : 14
            }
            scale={vehicleMode === 'jet' ? 4 : 2}
            size={4}
            speed={2}
            opacity={0.5}
            color={colors.engine}
          />
        </group>
      ) : null}

      {/* 能量拖尾 */}
      {allowVfx && vehicleMode !== 'yacht' ? (
        <>
          <Trail width={vehicleMode === 'jet' ? 3 : 1.5} length={8} color={colors.glow} attenuation={(t) => t * t}>
              <mesh position={[0.8, 0.2, -1.8]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
          <Trail width={vehicleMode === 'jet' ? 3 : 1.5} length={8} color={colors.glow} attenuation={(t) => t * t}>
              <mesh position={[-0.8, 0.2, -1.8]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
        </>
      ) : allowVfx && vehicleMode === 'yacht' ? (
        <>
          <Trail width={2.6} length={10} color={palette.primary} attenuation={(t) => t * t}>
              <mesh ref={wakeTrailRef} position={[0, 0.05, -2.4]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
          <Trail width={1.2} length={7} color={palette.accent} attenuation={(t) => t * t}>
              <mesh position={[0, 0.05, -2.1]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
        </>
      ) : null}

      {vehicleMode === 'jet' && allowHeavyVfx ? (
        <>
          <Trail width={1.2} length={12} color={palette.accent} attenuation={(t) => t * t}>
              <mesh ref={wingTrailLRef} position={[3.35, 0.25, 0.85]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
          <Trail width={1.2} length={12} color={palette.accent} attenuation={(t) => t * t}>
              <mesh ref={wingTrailRRef} position={[-3.35, 0.25, 0.85]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
        </>
      ) : null}

      {/* === 变形特效 (Transformation VFX) === */}
      {transforming && (
        <group position={[0, 0.5, 0]}>
            {/* 爆发粒子 */}
            <Sparkles count={50} scale={4} size={6} speed={5} color="#FFFFFF" opacity={1} />
            {/* 扫描环 */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <ringGeometry args={[2, 2.2, 32]} />
                <meshBasicMaterial color={colors.glow} transparent opacity={0.5} side={2} />
            </mesh>
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <ringGeometry args={[1.5, 1.6, 32]} />
                <meshBasicMaterial color={colors.bodyAccent} transparent opacity={0.8} side={2} />
            </mesh>
        </group>
      )}

      <group ref={chassisRef}>
        {vehicleMode === 'car' ? (
          <group>
            <group ref={tailAnchorRef} position={[0, 0.22, -2.85]} />
            <group ref={driftAnchorRef} position={[0, 0.18, -2.25]} />

            <mesh position={[0, 0.35, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <capsuleGeometry args={[0.46, 4.9, 10, 18]} />
              <meshStandardMaterial color={colors.bodyMain} metalness={0.95} roughness={0.22} emissive={palette.accent} emissiveIntensity={skinGlowIntensity * 0.6} toneMapped={false} />
              {visualPreset !== 'esports' && level !== 'low' ? <Edges threshold={14} color={palette.accent} /> : null}
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                <mesh position={[0.92, 0.34, 0.18]}>
                  <boxGeometry args={[0.06, 0.02, 5.15]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[0] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.85} flow={1.15} color1={palette.primary} color2={palette.accent} />
                </mesh>
                <mesh position={[-0.92, 0.34, 0.18]}>
                  <boxGeometry args={[0.06, 0.02, 5.15]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[1] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.85} flow={1.15} color1={palette.primary} color2={palette.accent} />
                </mesh>
                <mesh position={[0, 0.48, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[1.05, 0.025, 12, 64]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[2] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.9} flow={1.0} color1={palette.accent} color2={palette.primary} />
                </mesh>
              </group>
            ) : null}

            <mesh position={[0, 0.62, 1.35]} rotation={[0, 0, 0]}>
              <sphereGeometry args={[0.42, 18, 18]} />
              <meshPhysicalMaterial color={colors.glass} metalness={0.15} roughness={0.06} transmission={0.65} thickness={0.22} clearcoat={1} />
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                <mesh position={[0.28, 0.92, 1.95]} rotation={[0.65, 0.25, 0.15]}>
                  <coneGeometry args={[0.07, 0.85, 12]} />
                  <meshStandardMaterial color="#0B1220" metalness={0.9} roughness={0.25} emissive={palette.accent} emissiveIntensity={0.35} toneMapped={false} />
                </mesh>
                <mesh position={[-0.28, 0.92, 1.95]} rotation={[0.65, -0.25, -0.15]}>
                  <coneGeometry args={[0.07, 0.85, 12]} />
                  <meshStandardMaterial color="#0B1220" metalness={0.9} roughness={0.25} emissive={palette.accent} emissiveIntensity={0.35} toneMapped={false} />
                </mesh>
                <mesh position={[0.38, 0.86, 1.85]} rotation={[0.4, 0.25, 0]}>
                  <boxGeometry args={[0.03, 0.22, 0.03]} />
                  <meshBasicMaterial color={palette.primary} transparent opacity={0.8} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                </mesh>
                <mesh position={[-0.38, 0.86, 1.85]} rotation={[0.4, -0.25, 0]}>
                  <boxGeometry args={[0.03, 0.22, 0.03]} />
                  <meshBasicMaterial color={palette.primary} transparent opacity={0.8} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                </mesh>
              </group>
            ) : null}

            <mesh position={[0, 0.18, 0.25]}>
              <boxGeometry args={[1.65, 0.18, 4.7]} />
              <meshStandardMaterial color="#06070B" metalness={0.9} roughness={0.35} />
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <mesh position={[0, 0.28, 0.2]}>
                <boxGeometry args={[0.08, 0.04, 4.9]} />
                <meshPhysicalMaterial emissiveIntensity={1.8} toneMapped={false}>
                  <GradientTexture stops={[0, 0.5, 1]} colors={[palette.primary, palette.accent, palette.primary]} size={512} />
                </meshPhysicalMaterial>
              </mesh>
            ) : null}

            <mesh position={[0, 0.48, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.05, 0.04, 12, 64]} />
              {/* @ts-ignore */}
              <mythicShieldMaterial ref={(mat: any) => { if (mat) shieldMatRefs.current[0] = mat; }} transparent side={2} depthWrite={false} blending={AdditiveBlending} />
            </mesh>

            <group>
              {([
                [0.95, 0.08, 1.9],
                [-0.95, 0.08, 1.9],
                [0.95, 0.08, -2.05],
                [-0.95, 0.08, -2.05],
              ] as const).map(([x, y, z], i) => (
                <group key={i} position={[x, y, z]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.24, 0.06, 12, 24]} />
                    <meshStandardMaterial color="#050505" metalness={0.95} roughness={0.25} emissive={palette.primary} emissiveIntensity={level === 'ultra' ? 0.35 : 0.25} toneMapped={false} />
                  </mesh>
                  {visualPreset !== 'esports' && level !== 'low' ? (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[0.18, 0.03, 12, 24]} />
                      <meshBasicMaterial color={palette.accent} transparent opacity={0.75} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                    </mesh>
                  ) : null}
                </group>
              ))}
            </group>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <Float speed={1.2} floatIntensity={0.25} rotationIntensity={0.25}>
                <group position={[0, 1.18, 0.8]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.22, 0.28, 48]} />
                    <meshBasicMaterial color={palette.accent} transparent opacity={0.7} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
                    <circleGeometry args={[0.18, 32]} />
                    <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[3] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.85} flow={0.8} color1={palette.primary} color2={palette.accent} />
                  </mesh>
                </group>
              </Float>
            ) : null}
          </group>
        ) : vehicleMode === 'yacht' ? (
          <group>
            <group ref={tailAnchorRef} position={[0, 0.12, -3.05]} />

            <mesh position={[0, 0.24, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <capsuleGeometry args={[0.55, 6.2, 10, 18]} />
              <meshStandardMaterial color={colors.bodyMain} metalness={0.92} roughness={0.26} emissive={palette.primary} emissiveIntensity={skinGlowIntensity * 0.35} toneMapped={false} />
              {visualPreset !== 'esports' && level !== 'low' ? <Edges threshold={14} color={palette.primary} /> : null}
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                <mesh position={[1.65, 0.55, 0.5]} rotation={[0, 0.15, 0]}>
                  <planeGeometry args={[1.2, 3.8]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[4] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.75} flow={0.75} color1={palette.primary} color2={palette.accent} side={2} />
                </mesh>
                <mesh position={[-1.65, 0.55, 0.5]} rotation={[0, -0.15, 0]}>
                  <planeGeometry args={[1.2, 3.8]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[5] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.75} flow={0.75} color1={palette.primary} color2={palette.accent} side={2} />
                </mesh>
                <mesh position={[0, 0.62, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[1.35, 0.02, 12, 64]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[6] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.8} flow={0.9} color1={palette.accent} color2={palette.primary} />
                </mesh>
              </group>
            ) : null}

            <mesh position={[0, 0.42, 1.55]}>
              <boxGeometry args={[1.4, 0.12, 2.2]} />
              <meshStandardMaterial color="#06070B" metalness={0.9} roughness={0.35} />
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                {([-2.1, -1.1, 0, 1.1, 2.1] as const).map((z, i) => (
                  <mesh key={i} position={[0, 0.78, z]} rotation={[0.15, 0, 0]}>
                    <coneGeometry args={[0.08, 0.5, 10]} />
                    <meshStandardMaterial color="#0B1220" metalness={0.9} roughness={0.25} emissive={palette.primary} emissiveIntensity={0.28} toneMapped={false} />
                  </mesh>
                ))}
              </group>
            ) : null}

            <mesh position={[0, 0.62, 2.15]}>
              <capsuleGeometry args={[0.26, 0.85, 6, 14]} />
              <meshPhysicalMaterial color={colors.glass} metalness={0.15} roughness={0.08} transmission={0.55} thickness={0.2} clearcoat={1} />
            </mesh>

            <mesh position={[0, 0.06, 0.2]}>
              <boxGeometry args={[3.8, 0.05, 3.2]} />
              <meshStandardMaterial color="#030307" metalness={0.8} roughness={0.55} />
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                <mesh position={[1.45, 0.12, 0.1]}>
                  <boxGeometry args={[0.08, 0.04, 6.0]} />
                  <meshBasicMaterial color={palette.primary} transparent opacity={0.55} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                </mesh>
                <mesh position={[-1.45, 0.12, 0.1]}>
                  <boxGeometry args={[0.08, 0.04, 6.0]} />
                  <meshBasicMaterial color={palette.primary} transparent opacity={0.55} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                </mesh>
              </group>
            ) : null}

            <mesh position={[0, 0.55, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.35, 0.04, 12, 64]} />
              {/* @ts-ignore */}
              <mythicShieldMaterial ref={(mat: any) => { if (mat) shieldMatRefs.current[1] = mat; }} transparent side={2} depthWrite={false} blending={AdditiveBlending} />
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <Float speed={0.9} floatIntensity={0.25} rotationIntensity={0.2}>
                <group position={[0, 1.15, 1.6]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.26, 0.34, 48]} />
                    <meshBasicMaterial color={palette.primary} transparent opacity={0.6} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
                    <circleGeometry args={[0.22, 32]} />
                    <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[7] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.75} flow={0.6} color1={palette.primary} color2={palette.accent} />
                  </mesh>
                </group>
              </Float>
            ) : null}
          </group>
        ) : (
          <group>
            <group ref={tailAnchorRef} position={[0, 0.28, -2.95]} />

            <mesh position={[0, 0.35, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.38, 6.2, 18]} />
              <meshStandardMaterial color={colors.bodyMain} metalness={0.95} roughness={0.22} emissive={palette.primary} emissiveIntensity={skinGlowIntensity * 0.25} toneMapped={false} />
              {visualPreset !== 'esports' && level !== 'low' ? <Edges threshold={14} color={palette.accent} /> : null}
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                <mesh position={[3.45, 0.35, 0.95]} rotation={[0, -0.18, 0]}>
                  <planeGeometry args={[1.1, 3.3]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[8] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.8} flow={1.25} color1={palette.accent} color2={palette.primary} side={2} />
                </mesh>
                <mesh position={[-3.45, 0.35, 0.95]} rotation={[0, 0.18, 0]}>
                  <planeGeometry args={[1.1, 3.3]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[9] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.8} flow={1.25} color1={palette.accent} color2={palette.primary} side={2} />
                </mesh>
                <mesh position={[0, 0.6, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[1.25, 0.018, 12, 64]} />
                  <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[10] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.85} flow={1.0} color1={palette.primary} color2={palette.accent} />
                </mesh>
              </group>
            ) : null}

            <mesh position={[0, 0.45, 2.65]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.42, 1.35, 18]} />
              <meshStandardMaterial color="#0B1220" metalness={0.95} roughness={0.22} />
            </mesh>

            <mesh position={[0, 0.72, 1.95]}>
              <sphereGeometry args={[0.42, 18, 18]} />
              <meshPhysicalMaterial color={colors.glass} metalness={0.15} roughness={0.06} transmission={0.65} thickness={0.22} clearcoat={1} />
            </mesh>

            <group>
              <mesh position={[3.25, 0.22, 0.65]} rotation={[0, -0.2, 0]}>
                <boxGeometry args={[2.6, 0.08, 1.2]} />
                <meshStandardMaterial color="#05050B" metalness={0.85} roughness={0.32} emissive={palette.accent} emissiveIntensity={level === 'ultra' ? 0.22 : 0.14} toneMapped={false} />
              </mesh>
              <mesh position={[-3.25, 0.22, 0.65]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[2.6, 0.08, 1.2]} />
                <meshStandardMaterial color="#05050B" metalness={0.85} roughness={0.32} emissive={palette.accent} emissiveIntensity={level === 'ultra' ? 0.22 : 0.14} toneMapped={false} />
              </mesh>
            </group>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <group>
                {([0, 1, 2, 3] as const).map((i) => (
                  <group key={i} position={[0, 0.36, -0.25 - i * 0.55]}>
                    <mesh position={[2.95, 0.12, 0.9]} rotation={[0.05, -0.35, 0]}>
                      <planeGeometry args={[0.85, 0.95]} />
                      <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[12 + i * 2] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.65} flow={1.1} color1={palette.accent} color2={palette.primary} side={2} />
                    </mesh>
                    <mesh position={[-2.95, 0.12, 0.9]} rotation={[0.05, 0.35, 0]}>
                      <planeGeometry args={[0.85, 0.95]} />
                      <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[13 + i * 2] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.65} flow={1.1} color1={palette.accent} color2={palette.primary} side={2} />
                    </mesh>
                  </group>
                ))}
              </group>
            ) : null}

            <group position={[0, 0.35, -2.25]}>
              <mesh position={[0.95, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.26, 0.36, 2.4, 18]} />
                <meshStandardMaterial color="#0B1220" metalness={0.95} roughness={0.2} emissive={palette.accent} emissiveIntensity={level === 'ultra' ? 0.28 : 0.18} toneMapped={false} />
              </mesh>
              <mesh position={[-0.95, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.26, 0.36, 2.4, 18]} />
                <meshStandardMaterial color="#0B1220" metalness={0.95} roughness={0.2} emissive={palette.accent} emissiveIntensity={level === 'ultra' ? 0.28 : 0.18} toneMapped={false} />
              </mesh>
              <mesh ref={afterburnerMeshRef} position={[0, -0.6, -0.15]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
                <coneGeometry args={[0.7, 2.0, 20]} />
                <meshBasicMaterial ref={afterburnerMatRef} color={colors.engine} transparent opacity={0.2} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
              </mesh>
            </group>

            <mesh position={[0, 0.6, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.25, 0.035, 12, 64]} />
              {/* @ts-ignore */}
              <mythicShieldMaterial ref={(mat: any) => { if (mat) shieldMatRefs.current[2] = mat; }} transparent side={2} depthWrite={false} blending={AdditiveBlending} />
            </mesh>

            {visualPreset !== 'esports' && level !== 'low' ? (
              <Float speed={1.1} floatIntensity={0.3} rotationIntensity={0.25}>
                <group position={[0, 1.25, 1.55]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.24, 0.32, 48]} />
                    <meshBasicMaterial color={palette.accent} transparent opacity={0.65} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
                    <circleGeometry args={[0.2, 32]} />
                    <energyBandMaterial ref={(mat: any) => { if (mat) bandMatRefs.current[11] = mat; }} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} opacity={0.82} flow={0.9} color1={palette.accent} color2={palette.primary} />
                  </mesh>
                </group>
              </Float>
            ) : null}
          </group>
        )}

        <pointLight position={[0, -0.2, 0]} distance={7} intensity={underglowIntensity} color={colors.glow} />
      </group>
    </group>
  );
});
