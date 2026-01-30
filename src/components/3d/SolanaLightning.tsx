import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, Color } from 'three';
import { Line, Trail } from '@react-three/drei';

interface LightningBoltProps {
  start: Vector3;
  end: Vector3;
  color: string;
  width: number;
  life: number;
}

/**
 * 单个闪电束组件
 */
const LightningBolt = ({ start, end, color, width, life }: LightningBoltProps) => {
  const points = useMemo(() => {
    // 简单的分形/随机偏移算法生成闪电路径
    const segments = 12;
    const pts = [];
    const direction = end.clone().sub(start);
    const length = direction.length();
    
    pts.push(start);
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      // 基础线性插值
      const point = start.clone().lerp(end, t);
      
      // 添加随机偏移 (垂直于主方向)
      const offsetAmount = length * 0.15; // 偏移幅度
      const randomOffset = new Vector3(
        (Math.random() - 0.5) * offsetAmount,
        (Math.random() - 0.5) * offsetAmount,
        (Math.random() - 0.5) * offsetAmount
      );
      
      point.add(randomOffset);
      pts.push(point);
    }
    
    pts.push(end);
    
    // 使用样条曲线平滑一点点，或者直接用折线
    return new CatmullRomCurve3(pts).getPoints(50);
  }, [start, end]);

  const [opacity, setOpacity] = useState(1);

  useFrame((state, delta) => {
    if (opacity > 0) {
      setOpacity(prev => Math.max(0, prev - delta * (1 / life) * 3)); // 快速淡出
    }
  });

  if (opacity <= 0) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={width * opacity}
      transparent
      opacity={opacity}
      toneMapped={false} // 允许 HDR 发光
    />
  );
};

/**
 * Solana 风格闪电特效控制器
 * @description
 * 周期性生成紫色/绿色的赛博闪电，伴随光效
 */
export const SolanaLightning = () => {
  const [bolts, setBolts] = useState<{ id: number; start: Vector3; end: Vector3; color: string }[]>([]);
  const nextId = useRef(0);
  const timer = useRef(0);
  const nextTriggerTime = useRef(5); // 初始 5秒后触发
  
  // 音效
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
     // 初始化音频上下文 (懒加载)
     const initAudio = () => {
        if (!audioCtxRef.current && typeof window !== 'undefined') {
             const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
             if (AudioContext) audioCtxRef.current = new AudioContext();
        }
     };
     window.addEventListener('click', initAudio, { once: true });
     return () => {
         audioCtxRef.current?.close();
     };
  }, []);

  const playThunderSound = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') return;
      
      const ctx = audioCtxRef.current;
      
      // 使用白噪声 + 低通滤波器模拟真实雷声
      const bufferSize = ctx.sampleRate * 2.5; // 2.5秒
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.5);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1); // 快速起音 (Impact)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0); // 慢速衰减 (Rumble)
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      console.log('[Audio] Playing thunder sound'); // 添加日志追踪
  };

  useFrame((state, delta) => {
    timer.current += delta;

    if (timer.current > nextTriggerTime.current) {
      // 触发闪电
      timer.current = 0;
      nextTriggerTime.current = 15 + Math.random() * 15; // 15-30秒随机间隔

      const color = Math.random() > 0.5 ? '#9945FF' : '#14F195'; // Solana Purple or Green
      
      // 随机生成位置 (在天空上方)
      const startX = (Math.random() - 0.5) * 100;
      const startZ = (Math.random() - 0.5) * 100;
      const start = new Vector3(startX, 40, startZ);
      
      // 落地位置
      const end = new Vector3(startX + (Math.random() - 0.5) * 20, 0, startZ + (Math.random() - 0.5) * 20);

      // 添加主闪电
      const id = nextId.current++;
      setBolts(prev => [...prev, { id, start, end, color }]);
      
      // 播放声音
      playThunderSound();
      
      // 简单的清理逻辑 (实际应该在 Bolt 组件内部生命周期结束后回调清理，这里简化处理)
      setTimeout(() => {
        setBolts(prev => prev.filter(b => b.id !== id));
      }, 500);
    }
  });

  return (
    <group>
      {bolts.map(bolt => (
        <LightningBolt
          key={bolt.id}
          start={bolt.start}
          end={bolt.end}
          color={bolt.color}
          width={5} // 线宽
          life={0.3} // 存活时间
        />
      ))}
      
      {/* 简单的环境光闪烁，模拟闪电照亮 */}
      {bolts.length > 0 && (
         <pointLight 
            position={[0, 30, 0]} 
            intensity={5} 
            distance={200} 
            color={bolts[bolts.length - 1].color} 
            decay={2}
         />
      )}
    </group>
  );
};
