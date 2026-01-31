import { useRef, memo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Group, MathUtils } from 'three';
import { Trail, Html } from '@react-three/drei';
// import { CarLightningSystem } from './CarLightningSystem'; // 雷电特效已移除
import { audioManager } from '@/lib/audio/AudioManager';

interface CyberCarProps {
  onPositionChange?: (position: { x: number; z: number }) => void;
  positionRef?: React.MutableRefObject<Vector3>;
  // 接收外部输入，用于虚拟摇杆
  inputRef?: React.MutableRefObject<{ x: number; y: number }>;
  // 暴露朝向，用于第一人称相机
  headingRef?: React.MutableRefObject<number>;
  // 暴露速度，用于仪表盘
  speedRef?: React.MutableRefObject<number>;
}

/**
 * 赛博朋克赛车组件 (CyberCar)
 * @description
 * 替代原有的 Avatar 球体，提供真实的赛车驾驶体验。
 * 包含物理模拟（漂移、惯性）、车轮动画和粒子特效。
 */
export const CyberCar = memo(({ onPositionChange, positionRef, inputRef, headingRef, speedRef: externalSpeedRef }: CyberCarProps) => {
  const groupRef = useRef<Group>(null);
  const chassisRef = useRef<Group>(null);
  const wheelFLRef = useRef<Mesh>(null); // Front Left
  const wheelFRRef = useRef<Mesh>(null); // Front Right
  const wheelBLRef = useRef<Mesh>(null); // Back Left
  const wheelBRRef = useRef<Mesh>(null); // Back Right
  const engineAudioRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  // 物理状态 (使用 Ref 避免重渲染)
  // 如果外部传入了 speedRef，则使用外部的，否则使用内部的
  const internalSpeedRef = useRef(0);
  const speed = externalSpeedRef || internalSpeedRef;
  
  const steering = useRef(0);
  const heading = useRef(0);
  const position = useRef(new Vector3(0, 0.5, 8));
  
  // 键盘输入状态
  const keys = useRef<{ [key: string]: boolean }>({});

  // 物理参数配置
  const config = {
    maxSpeed: 0.48, // 降低物理速度以适配 120km/h 的显示，同时增加可控性 (原 0.8)
    acceleration: 0.012, // 相应调整加速度 (原 0.02)
    deceleration: 0.006, // 相应调整减速度 (原 0.01)
    friction: 0.98,
    turnSpeed: 0.04,
    driftFactor: 0.95, // 漂移因子 (1 = 无漂移, <1 = 像在冰上)
  };

  // 音效初始化
  useEffect(() => {
    // 简单的引擎音效模拟 (使用 AudioManager)
    const ctx = audioManager.getContext();
    if (!ctx) return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // 三角波更接近柔和的引擎声
      osc.frequency.value = 60; // 初始低频
      osc.connect(gain);
      gain.connect(audioManager.getMasterGain()!);
      gain.gain.value = 0; // 初始静音，直到用户移动
      
      osc.start();
      engineAudioRef.current = { osc, gain };
      console.log('[Audio] Engine sound initialized');
    } catch (e) {
      console.error("[Audio] Engine init failed:", e);
    }
    
    return () => {
      if (engineAudioRef.current) {
        try {
          const { osc, gain } = engineAudioRef.current;
          // 平滑停止
          gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
          osc.stop(ctx.currentTime + 0.2);
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
    let targetSteering = 0;

    // 优先读取键盘
    if (keys.current['ArrowUp'] || keys.current['KeyW']) targetSpeed = config.maxSpeed;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) targetSpeed = -config.maxSpeed * 0.5;

    if (keys.current['ArrowLeft'] || keys.current['KeyA']) targetSteering = 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) targetSteering = -1;

    // 如果没有键盘输入，尝试读取虚拟摇杆输入
    if (inputRef && inputRef.current && targetSpeed === 0 && targetSteering === 0) {
        // 摇杆 Y 轴：向上为负，向下为正（屏幕坐标），所以我们要取反
        // 但是通常摇杆组件输出是归一化的。
        // 假设 VirtualJoystick 输出: y < 0 向上, y > 0 向下
        const joyX = inputRef.current.x;
        const joyY = inputRef.current.y;
        
        // 只有当推力足够大时才响应
        if (Math.abs(joyY) > 0.1 || Math.abs(joyX) > 0.1) {
            // Y轴控制速度 (-1 ~ 1) -> (maxSpeed ~ -maxSpeed)
            targetSpeed = -joyY * config.maxSpeed;
            
            // X轴控制转向 (-1 ~ 1) -> (1 ~ -1)
            // 摇杆向左 (x<0) -> 转向 +1 (左转)
            // 摇杆向右 (x>0) -> 转向 -1 (右转)
            targetSteering = -joyX;
        }
    }

    // 更新引擎音效
    if (engineAudioRef.current) {
      const { osc, gain } = engineAudioRef.current;
      const ctx = audioManager.getContext();
      
      if (ctx) {
          const absSpeed = Math.abs(speed.current);
          
          // 降低基础频率，减少刺耳感
          const targetFreq = 60 + absSpeed * 240;
          osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
          
          if (osc.type !== 'triangle') osc.type = 'triangle';

          const targetVol = absSpeed > 0.01 ? 0.05 : 0; // 稍微降低音量
          gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.2);
      }
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
    
    // 扩大边界限制，从 ±400 缩小到 ±200，匹配新的地图尺寸
    position.current.x = Math.max(-200, Math.min(200, newX));
    position.current.z = Math.max(-200, Math.min(200, newZ));

    // 4. 应用变换到模型
    if (groupRef.current) {
      // 优化：仅当位置或旋转发生显著变化时才更新 matrixWorld
      // Three.js 默认每帧更新，但我们可以通过 matrixAutoUpdate=false 手动控制
      // 但对于主角，每帧更新是必须的。
      
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
    // 优化：与 CameraFollower 同步
    // CameraFollower 现在有自己的 lerp 逻辑，这里只需传递准确的物理位置
    // 无需手动插值，避免双重平滑导致的迟滞或振荡
    if (positionRef) {
      positionRef.current.copy(position.current);
    }
    if (headingRef) {
      headingRef.current = heading.current;
    }
    // 限制回调频率，例如每 100ms 更新一次 UI，或仅在停止时更新
    // 这里保持每帧回调给 MiniMap，因为 MiniMap 已经做了 30fps 节流
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
      {/* 挂载雷电特效系统 (已移除) */}
      {/* <CarLightningSystem speedRef={speed} active={true} /> */}

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
