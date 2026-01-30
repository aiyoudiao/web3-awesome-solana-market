import { useRef, memo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Group, MathUtils } from 'three';
import { Trail, Html } from '@react-three/drei';
import { CarLightningSystem } from './CarLightningSystem';

interface CyberCarProps {
  onPositionChange?: (position: { x: number; z: number }) => void;
  positionRef?: React.MutableRefObject<Vector3>;
}

/**
 * 赛博朋克赛车组件 (CyberCar)
 * @description
 * 替代原有的 Avatar 球体，提供真实的赛车驾驶体验。
 * 包含物理模拟（漂移、惯性）、车轮动画和粒子特效。
 */
export const CyberCar = memo(({ onPositionChange, positionRef }: CyberCarProps) => {
  const groupRef = useRef<Group>(null);
  const chassisRef = useRef<Group>(null);
  const wheelFLRef = useRef<Mesh>(null); // Front Left
  const wheelFRRef = useRef<Mesh>(null); // Front Right
  const wheelBLRef = useRef<Mesh>(null); // Back Left
  const wheelBRRef = useRef<Mesh>(null); // Back Right
  const engineAudioRef = useRef<HTMLAudioElement | null>(null);

  // 物理状态 (使用 Ref 避免重渲染)
  const speed = useRef(0);
  const steering = useRef(0);
  const heading = useRef(0);
  const position = useRef(new Vector3(0, 0.5, 8));
  
  // 键盘输入状态
  const keys = useRef<{ [key: string]: boolean }>({});

  // 物理参数配置
  const config = {
    maxSpeed: 0.8,
    acceleration: 0.02,
    deceleration: 0.01,
    friction: 0.98,
    turnSpeed: 0.04,
    driftFactor: 0.95, // 漂移因子 (1 = 无漂移, <1 = 像在冰上)
  };

  // 音效初始化
  useEffect(() => {
    // 简单的引擎音效模拟 (使用 Web Audio API)
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // 三角波更接近柔和的引擎声
      osc.frequency.value = 60; // 初始低频
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0; // 初始静音，直到用户移动
      
      osc.start();
      engineAudioRef.current = { ctx, osc, gain } as any;
      console.log('[Audio] Engine sound initialized');
    } catch (e) {
      console.error("[Audio] Engine init failed:", e);
    }
    
    return () => {
      if (engineAudioRef.current) {
        try {
          const { ctx, osc } = engineAudioRef.current as any;
          osc.stop();
          ctx.close();
        } catch (e) {
           // ignore
        }
      }
    };
  }, []);

  // 键盘监听
  useEffect(() => {
    // 自动聚焦以捕获键盘事件
    window.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    // 1. 处理输入
    let targetSpeed = 0;
    if (keys.current['ArrowUp'] || keys.current['KeyW']) targetSpeed = config.maxSpeed;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) targetSpeed = -config.maxSpeed * 0.5;

    let targetSteering = 0;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) targetSteering = 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) targetSteering = -1;

    // 更新引擎音效
    if (engineAudioRef.current) {
      const { osc, gain, ctx } = engineAudioRef.current as any;
      if (ctx.state === 'suspended') {
         ctx.resume();
      }
      
      const absSpeed = Math.abs(speed.current);
      
      // 降低基础频率，减少刺耳感
      const targetFreq = 60 + absSpeed * 240;
      osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
      
      if (osc.type !== 'triangle') osc.type = 'triangle';

      const targetVol = absSpeed > 0.01 ? 0.05 : 0.01;
      gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.2);
    }

    // 2. 物理模拟 (速度与转向平滑)
    if (targetSpeed > 0) {
        if (speed.current < targetSpeed) speed.current = Math.min(speed.current + config.acceleration, targetSpeed);
    } else if (targetSpeed < 0) {
        if (speed.current > targetSpeed) speed.current = Math.max(speed.current - config.acceleration, targetSpeed);
    } else {
        // 自然减速
        speed.current = speed.current * config.friction;
    }
    
    // 停止微小移动
    if (Math.abs(speed.current) < 0.001) speed.current = 0;

    // 转向逻辑 (只有在移动时才能转向)
    if (Math.abs(speed.current) > 0.01) {
      steering.current = MathUtils.lerp(steering.current, targetSteering, 0.1);
      // 倒车时反向转向
      const direction = speed.current > 0 ? 1 : -1;
      heading.current = heading.current + steering.current * config.turnSpeed * direction;
    } else {
        steering.current = MathUtils.lerp(steering.current, 0, 0.1);
    }

    // 3. 更新位置 (基于当前朝向)
    const velocityX = Math.sin(heading.current) * speed.current;
    const velocityZ = Math.cos(heading.current) * speed.current;

    // 直接修改 ref 中的位置状态
    const newX = position.current.x + velocityX;
    const newZ = position.current.z + velocityZ;
    
    position.current.x = Math.max(-40, Math.min(40, newX));
    position.current.z = Math.max(-40, Math.min(40, newZ));

    // 4. 应用变换到模型
    if (groupRef.current) {
      groupRef.current.position.set(position.current.x, position.current.y, position.current.z);
      // 这里的 rotation 是车身的实际朝向
      groupRef.current.rotation.y = heading.current;
      
      // 模拟车身侧倾 (Body Roll)
      // 转向越急，速度越快，侧倾越大
      const bodyRoll = steering.current * speed.current * 0.5;
      if (chassisRef.current) {
          chassisRef.current.rotation.z = MathUtils.lerp(chassisRef.current.rotation.z, -bodyRoll, 0.1);
          // 加速抬头/刹车点头
          const pitch = (targetSpeed - speed.current) * 0.2;
          chassisRef.current.rotation.x = MathUtils.lerp(chassisRef.current.rotation.x, -pitch, 0.1);
      }
    }

    // 5. 车轮动画
    const wheelRotationSpeed = speed.current * 10;
    if (wheelFLRef.current && wheelFRRef.current) {
        // 前轮转向
        wheelFLRef.current.rotation.y = steering.current * 0.5;
        wheelFRRef.current.rotation.y = steering.current * 0.5;
        // 车轮滚动
        wheelFLRef.current.rotation.x += wheelRotationSpeed;
        wheelFRRef.current.rotation.x += wheelRotationSpeed;
    }
    if (wheelBLRef.current && wheelBRRef.current) {
        // 后轮只滚动
        wheelBLRef.current.rotation.x += wheelRotationSpeed;
        wheelBRRef.current.rotation.x += wheelRotationSpeed;
    }

    // 6. 同步外部状态
    if (positionRef) {
      // 相机稍微滞后一点，或者直接跟随
      positionRef.current.copy(position.current);
    }
    if (onPositionChange) {
      onPositionChange({ x: position.current.x, z: position.current.z });
    }
  });

  // 赛车配色 - Solana 品牌色 + 赛博朋克
  const colors = {
    body: "#000000", // 纯黑底色
    glass: "#14F195", // Solana Green 玻璃
    neon: "#9945FF", // Solana Purple 霓虹
    neon2: "#14F195", // Solana Green 辅助
    wheel: "#111111",
    rim: "#FFFFFF"
  };

  // 能量核心旋转动画
  useFrame((state) => {
    if (chassisRef.current) {
        // 核心脉冲
        const core = chassisRef.current.getObjectByName("EnergyCore");
        if (core) {
            core.rotation.y += 0.1;
            core.rotation.z += 0.05;
            const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
            core.scale.set(scale, scale, scale);
        }
        
        // 悬浮光环
        const halo = chassisRef.current.getObjectByName("Halo");
        if (halo) {
            halo.rotation.z -= 0.02;
        }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 挂载雷电特效系统 (传递速度 Ref) */}
      <CarLightningSystem speedRef={speed} active={true} />

      {/* 尾气拖尾效果 */}
      <Trail
          width={1.2}
          length={8}
          color={colors.neon} // 紫色拖尾
          attenuation={(t) => t * t}
      >
          <mesh position={[0.5, 0.2, -1.2]} visible={false}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
          </mesh>
      </Trail>
      <Trail
          width={1.2}
          length={8}
          color={colors.neon2} // 绿色拖尾
          attenuation={(t) => t * t}
      >
          <mesh position={[-0.5, 0.2, -1.2]} visible={false}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
          </mesh>
      </Trail>

      {/* 车身组 (包含侧倾动画) */}
      <group ref={chassisRef}>
        {/* === 主体结构 === */}
        
        {/* 1. 楔形底盘 (更具未来感) */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.6, 0.8, 2.4, 6]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.9} 
              roughness={0.2}
              clearcoat={1.0}
            />
        </mesh>

        {/* 2. 驾驶舱罩 (流线型) */}
        <mesh position={[0, 0.5, -0.2]}>
            <capsuleGeometry args={[0.35, 0.8, 4, 8]} />
            <meshPhysicalMaterial 
              color={colors.glass} 
              metalness={1} 
              roughness={0}
              transmission={0.6}
              thickness={2}
              emissive={colors.glass}
              emissiveIntensity={0.2}
            />
        </mesh>

        {/* 3. 侧翼 (Solana 标志性线条) */}
        <mesh position={[0.5, 0.3, 0.2]} rotation={[0, 0, -0.2]}>
             <boxGeometry args={[0.1, 0.05, 1.8]} />
             <meshStandardMaterial color={colors.neon} emissive={colors.neon} emissiveIntensity={5} />
        </mesh>
        <mesh position={[-0.5, 0.3, 0.2]} rotation={[0, 0, 0.2]}>
             <boxGeometry args={[0.1, 0.05, 1.8]} />
             <meshStandardMaterial color={colors.neon} emissive={colors.neon} emissiveIntensity={5} />
        </mesh>

        {/* === 神话核心部件 === */}

        {/* 4. 能量核心 (Solana Reactor) */}
        <mesh name="EnergyCore" position={[0, 0.4, 1.1]}>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial 
                color={colors.neon2} 
                emissive={colors.neon2} 
                emissiveIntensity={8} 
                wireframe={true}
            />
        </mesh>
        <mesh position={[0, 0.4, 1.1]}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={10} />
        </mesh>

        {/* 5. 悬浮光环 (Halo) */}
        <mesh name="Halo" position={[0, 0.4, 1.1]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.4, 0.02, 16, 100]} />
            <meshStandardMaterial color={colors.neon} emissive={colors.neon} emissiveIntensity={5} />
        </mesh>

        {/* 6. 电路板纹理装饰 (简单几何模拟) */}
        {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[0.35, 0.51, -0.5 + i * 0.2]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.02, 0.02, 0.1]} />
                <meshStandardMaterial color={colors.neon2} emissive={colors.neon2} emissiveIntensity={2} />
            </mesh>
        ))}
        {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[-0.35, 0.51, -0.5 + i * 0.2]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[0.02, 0.02, 0.1]} />
                <meshStandardMaterial color={colors.neon2} emissive={colors.neon2} emissiveIntensity={2} />
            </mesh>
        ))}

        {/* === 灯光系统 === */}

        {/* 激光大灯 */}
        <mesh position={[0.25, 0.2, 1.2]} rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[0.1, 0.2, 16]} />
            <meshStandardMaterial color={colors.neon2} emissive={colors.neon2} emissiveIntensity={10} />
        </mesh>
        <mesh position={[-0.25, 0.2, 1.2]} rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[0.1, 0.2, 16]} />
            <meshStandardMaterial color={colors.neon2} emissive={colors.neon2} emissiveIntensity={10} />
        </mesh>
        
        {/* 底部氛围灯 */}
        <pointLight position={[0, -0.5, 0]} distance={4} intensity={5} color={colors.neon} />

        {/* 粒子喷射口 */}
        <mesh position={[0, 0.4, -1.2]}>
             <ringGeometry args={[0.1, 0.15, 32]} />
             <meshStandardMaterial color={colors.neon} emissive={colors.neon} emissiveIntensity={5} side={2} />
        </mesh>
      </group>

      {/* === 磁悬浮车轮系统 === */}
      
      {/* Front Left */}
      <group position={[-0.6, 0.15, 0.8]}>
        <mesh ref={wheelFLRef} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.2, 0.08, 16, 32]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
            {/* 内发光圈 */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 32]} />
                <meshStandardMaterial color={colors.neon2} emissive={colors.neon2} emissiveIntensity={3} />
            </mesh>
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[0.6, 0.15, 0.8]}>
        <mesh ref={wheelFRRef} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.2, 0.08, 16, 32]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 32]} />
                <meshStandardMaterial color={colors.neon2} emissive={colors.neon2} emissiveIntensity={3} />
            </mesh>
        </mesh>
      </group>

      {/* Back Left */}
      <group position={[-0.65, 0.15, -0.8]}>
        <mesh ref={wheelBLRef} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.22, 0.1, 16, 32]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
                <meshStandardMaterial color={colors.neon} emissive={colors.neon} emissiveIntensity={3} />
            </mesh>
        </mesh>
      </group>

      {/* Back Right */}
      <group position={[0.65, 0.15, -0.8]}>
        <mesh ref={wheelBRRef} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.22, 0.1, 16, 32]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
                <meshStandardMaterial color={colors.neon} emissive={colors.neon} emissiveIntensity={3} />
            </mesh>
        </mesh>
      </group>
    </group>
  );
});
