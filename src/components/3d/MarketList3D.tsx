import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { MarketInstancedMesh } from './MarketInstancedMesh';
import { MarketGeometries, MarketMaterials } from './MarketResources';
import { CyberCar } from './CyberCar';
import { Vector3 } from 'three';
import { CameraFollower, CameraMode } from './CameraFollower';
import { Html, Float } from '@react-three/drei';
import { useMarketListViewModel } from '@/hooks/view-models/useMarketListViewModel';
import { NavigationArrow } from './NavigationArrow';
import { CyberpunkLoader } from './CyberpunkLoader';

interface MarketList3DProps {
  inputRef?: React.MutableRefObject<{ x: number; y: number }>;
  speedRef?: React.MutableRefObject<number>;
  cameraMode?: CameraMode;
}

/**
 * 3D 市场列表组件
 * @description 展示所有市场的环形分布，包含玩家 Avatar
 */
export const MarketList3D = ({ inputRef, speedRef, cameraMode = 'follow' }: MarketList3DProps) => {
  const setPlayerPos = useStore(state => state.setPlayerPos); // Selector optimization
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // 使用 ViewModel 获取数据 (与 2D 页面一致)
  const { allMarkets: markets, isLoading } = useMarketListViewModel();

  // 模拟加载进度
  useEffect(() => {
      // 只要 isLoading 变为 false，我们就认为数据加载完成（哪怕是空数据）
      // 或者是如果 markets 已经有数据了，也认为加载完成
      if (!isLoading || (markets && markets.length > 0)) {
          // 数据已加载，开始动画
          let p = 0;
          const timer = setInterval(() => {
              p += 5;
              setLoadProgress(p);
              if (p >= 100) {
                  clearInterval(timer);
                  setTimeout(() => setShowLoader(false), 500);
              }
          }, 20); // Faster animation
          return () => clearInterval(timer);
      }
  }, [isLoading, markets]);

  // 超时保护：如果 5 秒后还在 loading，强制结束
  useEffect(() => {
      const timer = setTimeout(() => {
          setShowLoader(false);
      }, 5000);
      return () => clearTimeout(timer);
  }, []);

  // 用于相机跟随的 Ref (避免频繁重渲染)
  const avatarPosRef = useRef(new Vector3(0, 2, 8));
  const headingRef = useRef(0);

  const handleMarketSelect = useCallback((id: string) => {
    router.push(`/market/${id}`);
  }, [router]);

  // ... (caching logic)
  const marketPositions = useRef<{ id: string; position: Vector3 }[]>([]);
  if (markets && marketPositions.current.length !== markets.length) {
      marketPositions.current = markets.map((market, index) => {
          const angle = (index / markets.length) * Math.PI * 2;
          const radius = 25; // Scaled down to 50% (was 50)
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          return { id: market.marketId, position: new Vector3(x, 2, z) };
      });
  }

  // ... (target logic)
  const activeTarget = useMemo(() => {
    if (targetId) {
        return marketPositions.current.find(m => m.id === targetId)?.position;
    }
    return null; 
  }, [targetId]);

  // ... (collision logic)
  const handleCollision = useCallback((position: Vector3) => {
      // 优化：仅每10帧或距离变化较大时检测，这里简单实现距离阈值优化
      // 实际上 collision 逻辑很快，不需要过度优化，但可以缩小检测半径
      for (const item of marketPositions.current) {
          const dx = position.x - item.position.x;
          const dz = position.z - item.position.z;
          const distSq = dx*dx + dz*dz;
          if (distSq < 4) {
              handleMarketSelect(item.id);
              break; 
          }
      }
  }, [handleMarketSelect]);

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Handle Tab navigation
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
              e.preventDefault();
              if (!markets || markets.length === 0) return;
              
              setFocusedIndex(prev => {
                  const next = (prev + 1) % markets.length;
                  // Auto-focus camera on new target
                  const target = marketPositions.current[next]?.position;
                  if (target) {
                      setHoveredMarket({ market: markets[next], position: target.clone().add(new Vector3(0, 2, 0)) });
                  }
                  return next;
              });
          } else if (e.key === 'Enter' && focusedIndex !== -1) {
              if (markets && markets[focusedIndex]) {
                  handleMarketSelect(markets[focusedIndex].marketId);
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markets, focusedIndex, handleMarketSelect]);

  // State for global tooltip
  const [hoveredMarket, setHoveredMarket] = useState<{ market: any, position: Vector3 } | null>(null);

  // 优化：使用 useCallback 避免每次渲染都创建新函数，导致子组件 MarketInstancedMesh 重渲染
  const handleHover = useCallback((m: any, p: Vector3 | null) => {
      setHoveredMarket(prev => {
          // 只有当 ID 改变或者从 null 变为有值（或反之）时才更新状态
          if (!m && !prev) return prev;
          if (m && prev && m.marketId === prev.market.marketId) return prev;
          if (m && p) return { market: m, position: p };
          return null;
      });
  }, []);

  if (showLoader) {
      return (
        <Html fullscreen>
            <CyberpunkLoader progress={loadProgress} />
        </Html>
      );
  }

  return (
    <>
      <CyberCar 
        onPositionChange={(pos) => {
            setPlayerPos(pos);
            handleCollision(new Vector3(pos.x, 0, pos.z));
        }}
        positionRef={avatarPosRef}
        headingRef={headingRef} 
        inputRef={inputRef} 
        speedRef={speedRef}
      />
      <CameraFollower 
        targetRef={avatarPosRef} 
        headingRef={headingRef}
        mode={cameraMode}
      />
      
      {/* Global Tooltip */}
      {hoveredMarket && hoveredMarket.position && (
          <Html position={hoveredMarket.position} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <div className={`w-56 p-4 rounded-xl backdrop-blur-xl border transition-all duration-300 bg-[#1B1B1F]/90 border-[#9945FF] scale-105 shadow-[0_0_30px_rgba(153,69,255,0.6)]`}>
                  <h3 className="text-sm font-black italic mb-2 line-clamp-2 text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">{hoveredMarket.market.title}</h3>
                  <div className="grid grid-cols-[auto_auto] justify-between text-[10px] font-mono mt-3 mb-2">
                      <span className="text-[#14F195] font-bold">YES: {hoveredMarket.market.odds.yes}%</span>
                      <span className="text-red-400 font-bold">NO: {hoveredMarket.market.odds.no}%</span>
                  </div>
              </div>
          </Html>
      )}

      {/* AR Navigation Arrow */}
      {activeTarget && <NavigationArrow target={activeTarget} />}

      {/* GPU Instanced Markets */}
      {markets && (
          <MarketInstancedMesh 
              markets={markets} 
              positions={marketPositions.current} 
              onSelect={handleMarketSelect} 
              onHover={handleHover}
              hoveredId={hoveredMarket?.market?.marketId || null}
          />
      )}

      {/* Highlight Indicator for Hovered Market (Regular Meshes) */}
      {hoveredMarket && hoveredMarket.position && (
          <group position={hoveredMarket.position}>
             <Float speed={5} rotationIntensity={0.5} floatIntensity={0.2}>
                <mesh geometry={MarketGeometries.ring1} material={MarketMaterials.ringPurple} rotation={[Math.PI/2, 0, 0]} />
                <mesh geometry={MarketGeometries.ring2} material={MarketMaterials.ringGreen} rotation={[0, Math.PI/2, 0]} />
                <pointLight distance={15} intensity={5} color="#9945FF" />
             </Float>
          </group>
      )}
    </>
  );
};
