import { useRef, useState, useMemo, useEffect, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, AudioListener, Audio, AudioLoader } from 'three';
import { Line } from '@react-three/drei';

interface LightningArcProps {
  start: Vector3;
  end: Vector3;
  color: string;
  width: number;
  opacity: number;
}

/**
 * 单个电弧组件
 */
const LightningArc = ({ start, end, color, width, opacity }: LightningArcProps) => {
  const points = useMemo(() => {
    const segments = 8;
    const pts = [start];
    const direction = end.clone().sub(start);
    const length = direction.length();
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const point = start.clone().lerp(end, t);
      // 更加狂暴的随机偏移
      const offsetAmount = length * 0.3; 
      point.add(new Vector3(
        (Math.random() - 0.5) * offsetAmount,
        (Math.random() - 0.5) * offsetAmount,
        (Math.random() - 0.5) * offsetAmount
      ));
      pts.push(point);
    }
    pts.push(end);
    return new CatmullRomCurve3(pts).getPoints(20);
  }, [start, end]); // 每次 start/end 变化都会重新生成形状，这对于跟随小车来说可能太频繁，需要优化

  return (
    <Line
      points={points}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      toneMapped={false}
    />
  );
};

interface CarLightningSystemProps {
  speedRef: MutableRefObject<number>;
  active: boolean; // 开关
}

/**
 * 赛车雷电特效系统
 * @description
 * 附着在车身上的动态闪电，随速度增强，包含实时音效。
 */
export const CarLightningSystem = ({ speedRef, active }: CarLightningSystemProps) => {
  const [arcs, setArcs] = useState<{ id: number; start: Vector3; end: Vector3; color: string; life: number }[]>([]);
  const nextId = useRef(0);
  const timer = useRef(0);
  
  // 音频相关
  const soundRef = useRef<Audio | null>(null);
  const listenerRef = useRef<AudioListener | null>(null);

  // 初始化音频
  useEffect(() => {
    // 这里我们使用合成声音而不是加载文件，以保证无需外部依赖
    // 实际项目中可以替换为 AudioLoader 加载真实素材
    if (typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        
        // 简单的白噪声生成器
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // 存储上下文供后续播放使用
        (window as any)._carLightningCtx = { ctx, buffer, gain };
    }
  }, []);

  const playZapSound = (intensity: number) => {
      const audioSys = (window as any)._carLightningCtx;
      if (!audioSys || audioSys.ctx.state === 'suspended') return;
      
      const { ctx, buffer, gain } = audioSys;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      
      // 随机音调
      src.playbackRate.value = 0.8 + Math.random() * 0.4;
      
      // 局部 Gain 控制音量
      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(intensity * 0.1, ctx.currentTime);
      localGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1 + Math.random() * 0.1);
      
      src.connect(localGain);
      localGain.connect(gain);
      
      src.start();
  };

  useFrame((state, delta) => {
    if (!active) return;

    const speed = speedRef.current;
    // 速度越快，闪电越频繁
    const intensity = Math.min(Math.abs(speed) * 2, 1); // 0 ~ 1
    if (intensity < 0.1) {
        setArcs([]); // 速度慢时没有闪电
        return;
    }

    const spawnRate = 0.1 / intensity; // 间隔
    timer.current += delta;

    // 生成新电弧
    if (timer.current > spawnRate) {
      timer.current = 0;
      
      // 生成 1-3 条电弧
      const count = Math.floor(1 + Math.random() * 2);
      const newArcs = [];
      
      for (let i = 0; i < count; i++) {
        // 在车身周围随机生成
        // 假设车身长约 2，宽约 1
        const start = new Vector3(
            (Math.random() - 0.5) * 0.8,
            0.2 + Math.random() * 0.3,
            (Math.random() - 0.5) * 1.5
        );
        
        // 终点向外延伸，模拟放电
        const end = start.clone().add(new Vector3(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.0,
            (Math.random() - 0.5) * 1.5
        ));

        newArcs.push({
            id: nextId.current++,
            start,
            end,
            color: Math.random() > 0.5 ? '#9945FF' : '#14F195',
            life: 0.1 + Math.random() * 0.1 // 存活时间短
        });
      }
      
      setArcs(prev => [...prev, ...newArcs]);
      
      // 播放音效
      if (Math.random() > 0.5) { // 不是每次都响，避免太吵
          playZapSound(intensity);
      }
    }

    // 清理和更新电弧
    setArcs(prev => prev.filter(arc => {
        arc.life -= delta;
        return arc.life > 0;
    }));
  });

  return (
    <group>
      {arcs.map(arc => (
        <LightningArc
          key={arc.id}
          start={arc.start}
          end={arc.end}
          color={arc.color}
          width={2}
          opacity={arc.life * 5} // 随生命周期淡出
        />
      ))}
      
      {/* 核心发光 */}
      {arcs.length > 0 && (
         <pointLight 
            position={[0, 0.5, 0]} 
            intensity={2} 
            distance={3} 
            color="#9945FF" 
            decay={2}
         />
      )}
    </group>
  );
};
