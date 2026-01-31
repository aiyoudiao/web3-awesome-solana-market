import { useRef, memo, useState, useEffect, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Group, MathUtils, Shape, ExtrudeGeometry, Color, ShaderMaterial, AdditiveBlending, MeshBasicMaterial } from 'three';
import { Trail, Sparkles, Float, useTexture, GradientTexture, Html, shaderMaterial } from '@react-three/drei';
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

extend({ MythicShieldMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mythicShieldMaterial: any;
    }
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
  const shieldMatRef = useRef<any>(null);
  const runeMatRef = useRef<MeshBasicMaterial>(null);
  
  // 车轮 Refs (仅 Car 模式使用)
  const wheelFLRef = useRef<Group>(null);
  const wheelFRRef = useRef<Group>(null);
  const wheelBLRef = useRef<Group>(null);
  const wheelBRRef = useRef<Group>(null);

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
    if (shieldMatRef.current) {
        shieldMatRef.current.time = state.clock.elapsedTime;
    }
    if (runeMatRef.current) {
        const base = vehicleMode === 'jet' ? 0.13 : vehicleMode === 'yacht' ? 0.09 : 0.11;
        const boost = transforming ? 0.22 : 0;
        const flicker = 0.03 * (Math.sin(state.clock.elapsedTime * 3.0) * 0.5 + 0.5);
        runeMatRef.current.opacity = Math.min(base + speedRatio * 0.08 + boost + flicker, 0.5);
    }

    if (tailSparklesRef.current) {
        tailSparklesRef.current.visible = allowVfx && speedAbs > 0.5;
    }

    if (driftSparksRef.current) {
        const enabled = vehicleMode === 'car' && isDrifting && allowVfx;
        driftSparksRef.current.visible = enabled;
        if (enabled && wheelBLRef.current && wheelBRRef.current) {
            const x = (wheelBLRef.current.position.x + wheelBRRef.current.position.x) * 0.5;
            const z = (wheelBLRef.current.position.z + wheelBRRef.current.position.z) * 0.5;
            driftSparksRef.current.position.set(x, 0.2, z);
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
    shape.moveTo(0, 0);
    shape.lineTo(0.8, 0); shape.lineTo(0.9, 1.5); shape.lineTo(0.4, 3.5);
    shape.lineTo(0.1, 4.2); shape.lineTo(-0.1, 4.2); shape.lineTo(-0.4, 3.5);
    shape.lineTo(-0.9, 1.5); shape.lineTo(-0.8, 0);
    return shape;
  }, []);

  // 2. Jet Shape (Wings)
  const jetShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(2.5, -1.0); // 翼展
    shape.lineTo(1.0, 2.0);
    shape.lineTo(0.2, 5.0); // 机头
    shape.lineTo(-0.2, 5.0);
    shape.lineTo(-1.0, 2.0);
    shape.lineTo(-2.5, -1.0);
    return shape;
  }, []);

  // 3. Yacht Shape (Boat)
  const yachtShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, -1);
    shape.quadraticCurveTo(1.2, 0, 1.0, 3.0);
    shape.lineTo(0, 5.0); // 船头
    shape.lineTo(-1.0, 3.0);
    shape.quadraticCurveTo(-1.2, 0, 0, -1);
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
        <group ref={tailSparklesRef} position={[0, 0.3, -2.2]} visible={false}>
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
              <mesh ref={wingTrailLRef} position={[2.2, 0.35, 0.2]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
          </Trail>
          <Trail width={1.2} length={12} color={palette.accent} attenuation={(t) => t * t}>
              <mesh ref={wingTrailRRef} position={[-2.2, 0.35, 0.2]} visible={false}><boxGeometry args={[0.1,0.1,0.1]} /></mesh>
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
        {/* === 形态切换 === */}
        {/* 能量护盾层 (略大) */}
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0.3, -1.5]}>
            <extrudeGeometry args={[
                vehicleMode === 'car' ? carShape : 
                vehicleMode === 'jet' ? jetShape : 
                yachtShape, 
                { ...extrudeSettings, depth: 0.55, bevelSize: 0.12 }
            ]} />
            {/* @ts-ignore */}
            <mythicShieldMaterial ref={shieldMatRef} transparent side={2} depthWrite={false} blending={AdditiveBlending} />
        </mesh>

        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0.3, -1.5]} castShadow receiveShadow>
            <extrudeGeometry args={[
                vehicleMode === 'car' ? carShape : 
                vehicleMode === 'jet' ? jetShape : 
                yachtShape, 
                extrudeSettings
            ]} />
            <meshPhysicalMaterial 
                metalness={0.8}
                roughness={0.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
            >
                <GradientTexture stops={solanaGradient.stops} colors={solanaGradient.colors} size={1024} />
            </meshPhysicalMaterial>
        </mesh>

        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0.301, -1.5]}>
            <extrudeGeometry args={[
                vehicleMode === 'car' ? carShape : 
                vehicleMode === 'jet' ? jetShape : 
                yachtShape, 
                extrudeSettings
            ]} />
            <meshBasicMaterial
              ref={runeMatRef}
              map={runeMap}
              transparent
              opacity={0.12}
              blending={AdditiveBlending}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              toneMapped={false}
              color={colors.glow}
              side={2}
            />
        </mesh>

        {/* === 驾驶舱 === */}
        <mesh position={[0, 0.65, 0.2]}>
            <coneGeometry args={[0.35, 1.8, 4]} />
            <meshPhysicalMaterial 
                color={colors.glass}
                metalness={1}
                roughness={0}
                transmission={0.2}
                clearcoat={1}
            />
        </mesh>

        {/* === 装饰部件 === */}
        {/* 只有 Jet 模式显示机翼光效 */}
        {vehicleMode === 'jet' && (
             <mesh position={[0, 0.1, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                <planeGeometry args={[5, 2]} />
                <meshBasicMaterial color={colors.glow} transparent opacity={0.2} side={2} />
             </mesh>
        )}

        {vehicleMode === 'yacht' && (
          <group position={[0, 0.15, -1.4]}>
            <mesh position={[1.15, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 4.2, 16]} />
              <meshStandardMaterial color={palette.accent} metalness={0.7} roughness={0.25} emissive={palette.primary} emissiveIntensity={0.35} toneMapped={false} />
            </mesh>
            <mesh position={[-1.15, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 4.2, 16]} />
              <meshStandardMaterial color={palette.accent} metalness={0.7} roughness={0.25} emissive={palette.primary} emissiveIntensity={0.35} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.55, 1.6]}>
              <boxGeometry args={[2.4, 0.05, 0.6]} />
              <meshStandardMaterial color={palette.primary} metalness={0.6} roughness={0.35} emissive={palette.primary} emissiveIntensity={0.2} toneMapped={false} />
            </mesh>
          </group>
        )}
        
        {/* === 底部霓虹 (Underglow) === */}
        <pointLight position={[0, -0.2, 0]} distance={5} intensity={3} color={colors.glow} />
      </group>

      {/* === 轮毂系统 (仅 Car 模式) === */}
      {vehicleMode === 'car' && (
          <>
            <BladeWheel ref={wheelFLRef} position={[-0.9, 0.35, 1.4]} side="left" colors={colors} />
            <BladeWheel ref={wheelFRRef} position={[0.9, 0.35, 1.4]} side="right" colors={colors} />
            <BladeWheel ref={wheelBLRef} position={[-0.95, 0.38, -1.2]} side="left" colors={colors} isRear />
            <BladeWheel ref={wheelBRRef} position={[0.95, 0.38, -1.2]} side="right" colors={colors} isRear />
          </>
      )}
      
      {/* === 喷射引擎 (Jet 模式) === */}
      {vehicleMode === 'jet' && (
           <group position={[0, 0.5, -2.5]}>
                <mesh rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.4, 0.6, 1.0, 16]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0, -0.6, 0]} rotation={[Math.PI/2, 0, 0]}>
                     <coneGeometry args={[0.35, 0.8, 16]} />
                     <meshBasicMaterial color={colors.engine} />
                </mesh>
                <mesh ref={afterburnerMeshRef} position={[0, -1.2, 0]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
                     <coneGeometry args={[0.55, 1.6, 20]} />
                     <meshBasicMaterial ref={afterburnerMatRef} color={colors.engine} transparent opacity={0.2} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
                </mesh>
           </group>
      )}
    </group>
  );
});

// 子组件：刀片式轮毂
const BladeWheel = memo(forwardRef(({ position, side, colors, isRear }: any, ref: any) => {
    const width = isRear ? 0.5 : 0.4;
    const radius = isRear ? 0.38 : 0.35;
    
    return (
        <group ref={ref} position={position}>
            <group rotation={[0, 0, Math.PI / 2]}>
                <mesh rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[radius, radius, width, 24]} />
                    <meshStandardMaterial color={colors.tire} roughness={0.9} />
                </mesh>
                <mesh rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[radius * 0.7, radius * 0.7, width + 0.02, 16]} />
                    <meshStandardMaterial color={colors.rim} metalness={0.9} roughness={0.2} />
                </mesh>
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <mesh key={i} rotation={[0, angle * Math.PI/180, 0]}>
                        <boxGeometry args={[width + 0.04, 0.05, radius * 1.2]} />
                        <meshPhysicalMaterial emissiveIntensity={2} toneMapped={false}>
                            <GradientTexture stops={[0, 1]} colors={["#9945FF", "#14F195"]} />
                        </meshPhysicalMaterial>
                    </mesh>
                ))}
            </group>
        </group>
    );
}));
