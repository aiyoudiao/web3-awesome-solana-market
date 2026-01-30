import { useRef, useState, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, useCursor } from '@react-three/drei';
import { Mesh, Group, Vector3 } from 'three';
import { Market } from '@/lib/api';
import { useQualityStore } from '@/stores/useQualityStore';

// ... (interface)

export const MarketArtifact = memo(({ market, position, onSelect }: MarketArtifactProps) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const ringRef1 = useRef<Mesh>(null);
  const ringRef2 = useRef<Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [lodLevel, setLodLevel] = useState<'high' | 'medium' | 'low'>('high');
  
  const { lodDistance } = useQualityStore(); // Get multiplier from store
  
  // Cursor management
  useCursor(hovered);

  // Random offset for animation to avoid sync
  const offset = useMemo(() => Math.random() * 100, []);

  // 动画循环 & LOD 计算
  useFrame((state) => {
    const time = state.clock.elapsedTime + offset;
    
    // 1. LOD Logic (Throttled check could be better, but per-frame simple distance check is okay for <1000 objs)
    if (groupRef.current) {
        const dist = state.camera.position.distanceTo(groupRef.current.getWorldPosition(new Vector3()));
        
        // Base distances: High < 15, Medium < 40, Low > 40
        // Adjusted by quality setting
        if (dist < 15 * lodDistance) {
            if (lodLevel !== 'high') setLodLevel('high');
        } else if (dist < 40 * lodDistance) {
            if (lodLevel !== 'medium') setLodLevel('medium');
        } else {
            if (lodLevel !== 'low') setLodLevel('low');
        }
    }

    // 2. Animations (Only animate if visible/close enough)
    if (lodLevel !== 'low') {
        if (meshRef.current) {
          meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
          meshRef.current.rotation.y += 0.005;
        }
        
        if (lodLevel === 'high') {
            if (ringRef1.current) {
              ringRef1.current.rotation.x = time * 0.2;
              ringRef1.current.rotation.y = time * 0.3;
            }
            if (ringRef2.current) {
              ringRef2.current.rotation.x = -time * 0.3;
              ringRef2.current.rotation.z = time * 0.1;
            }
        }
    }
    
    // Hover scale (always active for interaction feedback)
    if (groupRef.current) {
      const targetScale = hovered ? 1.2 : 1;
      groupRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
    }
  });

  // ... (color logic)
  const getStatusColor = () => '#14F195'; 
  const color = getStatusColor();
  const glowColor = hovered ? '#9945FF' : color;
  const yesPrice = market.odds.yes / 100;

  // 如果是 Low LOD，渲染极简版本 (Billboard Sprite or Simple Mesh)
  if (lodLevel === 'low') {
      return (
        <group position={position} ref={groupRef}>
             <mesh 
                onClick={(e) => { e.stopPropagation(); onSelect(market.marketId); }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
             >
                 <octahedronGeometry args={[0.8, 0]} />
                 <meshBasicMaterial color={hovered ? '#9945FF' : color} wireframe />
             </mesh>
        </group>
      );
  }

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} position={position}>
      <group 
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(market.marketId);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {/* 核心能量水晶 (八面体) - High & Medium */}
        <mesh ref={meshRef} castShadow={lodLevel === 'high'}>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial 
            color={color}
            emissive={glowColor}
            emissiveIntensity={hovered ? 2 : 0.8}
            metalness={0.9}
            roughness={0.1}
            transmission={lodLevel === 'high' ? 0.6 : 0} // Disable expensive transmission on medium
            thickness={2}
            clearcoat={1}
          />
        </mesh>

        {/* 科技装饰环 - Only High */}
        {lodLevel === 'high' && (
            <>
                <mesh ref={ringRef1} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[1.4, 0.02, 16, 32]} /> 
                  <meshBasicMaterial color="#9945FF" transparent opacity={0.4} />
                </mesh>
                <mesh ref={ringRef2} rotation={[0, Math.PI / 2, 0]}>
                  <torusGeometry args={[1.6, 0.02, 16, 32]} />
                  <meshBasicMaterial color="#14F195" transparent opacity={0.4} />
                </mesh>
            </>
        )}

        {/* 选中时的光照效果 */}
        {hovered && <pointLight distance={3} intensity={2} color="#9945FF" />}

        {/* 信息浮窗 - Only High */}
        {lodLevel === 'high' && (
            <Html center transform position={[0, 1.8, 0]} distanceFactor={10} occlude>
              <div className={`
                w-56 p-4 rounded-xl backdrop-blur-xl border transition-all duration-300
                ${hovered 
                  ? 'bg-[#1B1B1F]/90 border-[#9945FF] scale-105 shadow-[0_0_30px_rgba(153,69,255,0.6)]' 
                  : 'bg-[#1B1B1F]/60 border-slate-700/50 opacity-90'
                }
              `}>
                <h3 className="text-sm font-black italic mb-2 line-clamp-2 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
                  {market.title}
                </h3>
                
                <div className="grid grid-cols-[auto_auto] justify-between items-center text-[10px] font-mono mt-3 mb-2">
                  <span className="text-[#14F195] font-bold">YES: {market.odds.yes}%</span>
                  <span className="text-red-400 font-bold">NO: {market.odds.no}%</span>
                </div>
                
                <div className="h-1.5 w-full bg-[#2B2B30] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195]" 
                    style={{ width: `${yesPrice * 100}%` }}
                  />
                </div>
              </div>
            </Html>
        )}
      </group>
    </Float>
  );
});

