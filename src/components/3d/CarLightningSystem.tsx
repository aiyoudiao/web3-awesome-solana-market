import { useRef, useState, useMemo, useEffect, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3 } from 'three';
import { Line } from '@react-three/drei';
import { audioManager } from '@/lib/audio/AudioManager';

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
    // 性能优化：减少细分段数
    const segments = 4; // 原为 8
    const pts = [start];
    const direction = end.clone().sub(start);
    const length = direction.length();
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const point = start.clone().lerp(end, t);
      // 减少随机计算量
      const offsetAmount = length * 0.2; 
      point.x += (Math.random() - 0.5) * offsetAmount;
      point.y += (Math.random() - 0.5) * offsetAmount;
      point.z += (Math.random() - 0.5) * offsetAmount;
      pts.push(point);
    }
    pts.push(end);
    // 降低曲线平滑采样数
    return new CatmullRomCurve3(pts).getPoints(8); // 原为 20
  }, [start, end]);

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

interface Arc {
  id: number;
  start: Vector3;
  end: Vector3;
  color: string;
  life: number;
}

/**
 * 赛车雷电特效系统
 * @description
 * 附着在车身上的动态闪电，随速度增强，包含实时音效。
 */
export const CarLightningSystem = ({ speedRef, active }: CarLightningSystemProps) => {
  const [arcs, setArcs] = useState<Arc[]>([]);
  const nextId = useRef(0);
  const timer = useRef(0);
  
  // 初始化音频管理器
  useEffect(() => {
    // 确保音频上下文已创建
    // 注意：真正的初始化通常需要用户交互，这里假设在 SceneView 入口已处理或稍后处理
    // audioManager.init(); // 可以在这里尝试 init，但最好是在顶层
  }, []);

  const playZapSound = (intensity: number) => {
      const ctx = audioManager.getContext();
      if (!ctx || ctx.state === 'suspended') return;
      
      const buffer = audioManager.getBuffer('noise');
      if (!buffer) return;

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      
      // 随机音调
      src.playbackRate.value = 0.8 + Math.random() * 0.4;
      
      // 局部 Gain 控制音量
      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(intensity * 0.1, ctx.currentTime);
      localGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1 + Math.random() * 0.1);
      
      src.connect(localGain);
      localGain.connect(audioManager.getMasterGain()!); // Connect to master instead of destination
      
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
      const newArcs: Arc[] = [];
      
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
