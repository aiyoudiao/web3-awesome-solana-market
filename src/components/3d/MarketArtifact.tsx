import { useRef, useState, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import { Mesh, Group } from 'three';
import { Market } from '@/lib/api';

interface MarketArtifactProps {
  market: Market;
  position: [number, number, number];
  onSelect: (id: string) => void;
}

/**
 * 3D 市场神器组件
 * @description 代表一个预测市场事件。使用悬浮的能量方块展示。
 */
export const MarketArtifact = memo(({ market, position, onSelect }: MarketArtifactProps) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const ringRef1 = useRef<Mesh>(null);
  const ringRef2 = useRef<Mesh>(null);
  const [hovered, setHover] = useState(false);

  // 动画循环
  useFrame((state) => {
    if (meshRef.current) {
      // 核心水晶旋转
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
    
    // 环绕光环动画
    if (ringRef1.current) {
      ringRef1.current.rotation.x = state.clock.elapsedTime * 0.2;
      ringRef1.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x = -state.clock.elapsedTime * 0.3;
      ringRef2.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
    
    // 悬停缩放效果
    if (groupRef.current) {
      const targetScale = hovered ? 1.2 : 1;
      groupRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
    }
  });

  // 根据状态决定颜色 (API 暂无 status 字段，默认 active 为绿色)
  const getStatusColor = () => {
     // TODO: 真正的 API 应该包含 status 字段
     return '#14F195'; 
  };

  const color = getStatusColor();
  const glowColor = hovered ? '#9945FF' : color;

  // 适配新的 API 数据结构 (odds 是百分比)
  const yesPrice = market.odds.yes / 100;
  const noPrice = market.odds.no / 100;

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} position={position}>
      <group 
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(market.marketId);
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
          setHover(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          setHover(false);
        }}
      >
        {/* 核心能量水晶 (八面体) */}
        <mesh ref={meshRef} castShadow>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial 
            color={color}
            emissive={glowColor}
            emissiveIntensity={hovered ? 2 : 0.8}
            metalness={0.9}
            roughness={0.1}
            transmission={0.6} // 半透明玻璃质感
            thickness={2}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 科技装饰环 1 */}
        <mesh ref={ringRef1} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.4, 0.02, 16, 100]} />
          <meshBasicMaterial 
            color="#9945FF" 
            transparent 
            opacity={hovered ? 0.8 : 0.4} 
          />
        </mesh>

        {/* 科技装饰环 2 */}
        <mesh ref={ringRef2} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.6, 0.02, 16, 100]} />
          <meshBasicMaterial 
            color="#14F195" 
            transparent 
            opacity={hovered ? 0.8 : 0.4} 
          />
        </mesh>

        {/* 选中时的光照效果 */}
        {hovered && (
          <pointLight distance={3} intensity={2} color="#9945FF" />
        )}

        {/* 信息浮窗 */}
        <Html center transform position={[0, 1.8, 0]} distanceFactor={10}>
          <div className={`
            w-56 p-4 rounded-xl backdrop-blur-xl border transition-all duration-300
            ${hovered 
              ? 'bg-[#1B1B1F]/90 border-[#9945FF] scale-105 shadow-[0_0_30px_rgba(153,69,255,0.6)]' 
              : 'bg-[#1B1B1F]/60 border-slate-700/50 opacity-90'
            }
          `}>
            {/* 炫酷标题样式 */}
            <h3 className="text-sm font-black italic mb-2 line-clamp-2 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195] drop-shadow-[0_0_10px_rgba(153,69,255,0.5)]">
              {market.title}
            </h3>
            
            <div className="grid grid-cols-[auto_auto] justify-between items-center text-[10px] font-mono mt-3 mb-2">
              <span className="text-[#14F195] font-bold bg-[#14F195]/10 px-2 py-0.5 rounded border border-[#14F195]/30">YES: {market.odds.yes}%</span>
              <span className="text-red-400 font-bold bg-red-900/20 px-2 py-0.5 rounded border border-red-500/30">NO: {market.odds.no}%</span>
            </div>
            
            <div className="h-1.5 w-full bg-[#2B2B30] rounded-full overflow-hidden border border-[#4B5563]/30">
              <div 
                className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] shadow-[0_0_10px_rgba(20,241,149,0.5)]" 
                style={{ width: `${yesPrice * 100}%` }}
              />
            </div>
          </div>
        </Html>
      </group>
    </Float>
  );
});
