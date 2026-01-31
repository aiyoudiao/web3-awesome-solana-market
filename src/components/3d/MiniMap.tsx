import { memo, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';

// 定义本地 Market 类型，避免引入不存在的模块
type Market = {
  id: string;
  title: string;
  // 可根据需要补充其他字段
};

interface MiniMapProps {
  markets: Market[];
  onMarketClick?: (x: number, z: number) => void;
}

/**
 * 3D 视图小地图 (Mini Map)
 * @description
 * 位于屏幕右上角的雷达图，显示玩家和市场的位置。
 * 玩家用箭头/圆点表示，市场用小亮点表示。
 * 
 * 性能优化：使用 useRef 和 useStore.subscribe 直接操作 DOM，避免每帧 React 重渲染。
 */
export const MiniMap = memo(({ markets, onMarketClick }: MiniMapProps) => {
  const mapSize = 160; 
  // 基础视口半径 (最小缩放) - 扩大 5 倍以匹配新地图
  const baseViewRadius = 150;
  
  // Refs for DOM manipulation
  const playerDotRef = useRef<HTMLDivElement>(null);
  const bgGridRef = useRef<HTMLDivElement>(null);
  const coordTextRef = useRef<HTMLDivElement>(null);
  const scaleTextRef = useRef<HTMLDivElement>(null);
  const marketDotsRef = useRef<HTMLDivElement>(null);

  // Subscribe to store updates transiently
  useEffect(() => {
      let lastTime = 0;
      const throttleMs = 32; // ~30fps throttle

      // 初始设置
      const updateMap = (pos: { x: number, z: number }) => {
          // Throttle check
          const now = performance.now();
          if (now - lastTime < throttleMs) return;
          lastTime = now;

          // 动态缩放逻辑
          const maxPlayerDist = Math.max(Math.abs(pos.x), Math.abs(pos.z));
          const dynamicViewRadius = Math.max(baseViewRadius, maxPlayerDist * 1.2);
          const mapScale = (mapSize / 2) / dynamicViewRadius;

          // 更新玩家点位
          if (playerDotRef.current) {
              const left = (mapSize / 2) + pos.x * mapScale;
              const top = (mapSize / 2) + pos.z * mapScale;
              playerDotRef.current.style.transform = `translate(-50%, -50%) translate(${left}px, ${top}px)`;
              // Use translate for better performance than left/top
              // Actually we need to set left/top to 0 and use translate, OR just use left/top.
              // Let's stick to simple left/top for now but optimized.
              playerDotRef.current.style.left = `${left}px`;
              playerDotRef.current.style.top = `${top}px`;
              playerDotRef.current.style.transform = 'translate(-50%, -50%)';
          }

          // 更新背景网格缩放
          if (bgGridRef.current) {
              bgGridRef.current.style.backgroundSize = `${20 * mapScale}px ${20 * mapScale}px`;
          }

          // 更新坐标文本
          if (coordTextRef.current) {
              coordTextRef.current.textContent = `坐标: ${Math.round(pos.x)}, ${Math.round(pos.z)}`;
          }

          // 更新比例尺文本
          if (scaleTextRef.current) {
              scaleTextRef.current.textContent = `缩放: 1:${(1/mapScale).toFixed(1)}`;
          }
          
          // 更新所有市场点位 (因为 mapScale 变了)
          // 这是一个潜在的性能瓶颈，如果 markets 很多。
          // 但通常 markets 不会很多 (<100)。
          // 我们需要一种方式来更新市场点位。
          // 由于 markets 是通过 React 渲染的，这里无法直接操作 DOM 列表除非我们自己管理 DOM。
          // 妥协：我们可以让 markets 的容器缩放？不行，位置是绝对的。
          // 更好的方法：将 markets 渲染逻辑移出 React，或者接受 mapScale 变化导致的重渲染（如果变化频率低）。
          // mapScale 只有当玩家跑出范围时才变化。
          // 我们可以把 mapScale 存为 state，只有变化时才触发重渲染。
          // 但为了极致性能，我们尽量避免。
          
          // 实际上，如果 mapScale 经常变，那还是会有重渲染。
          // 如果我们假设 mapScale 不经常变（只有玩家跑远了才变），那么我们可以把 mapScale 放在 state 里。
          // 但是这里我们希望 0 重渲染。
          
          // 让我们看看能否用 CSS 变量？
          // --map-scale: ...
          // 所有的点位位置计算用 CSS calc? 
          // left: calc(50% + var(--x) * var(--map-scale))
          if (marketDotsRef.current) {
              marketDotsRef.current.style.setProperty('--map-scale', mapScale.toString());
          }
      };

      // 订阅 Zustand
      const unsub = useStore.subscribe((state) => {
          updateMap(state.playerPos);
      });
      
      // 初始化一次
      updateMap(useStore.getState().playerPos);

      return () => unsub();
  }, [baseViewRadius, mapSize]); // markets 变化不影响订阅逻辑，但影响 DOM 结构

  return (
    <div className="absolute top-24 right-8 z-[250] pointer-events-auto">
      <div 
        className="relative bg-[#1B1B1F]/90 backdrop-blur-md rounded-lg border-2 border-[#9945FF]/50 shadow-[0_0_20px_rgba(153,69,255,0.3)] overflow-hidden"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* 背景网格 */}
        <div 
            ref={bgGridRef}
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#9945FF 1px, transparent 1px), linear-gradient(90deg, #9945FF 1px, transparent 1px)`,
                backgroundPosition: `${(mapSize/2)}px ${(mapSize/2)}px`
            }} 
        />
        
        {/* 世界原点标记 */}
        <div 
            className="absolute w-1 h-1 bg-white/50 rounded-full pointer-events-none"
            style={{
                left: mapSize / 2,
                top: mapSize / 2,
                transform: 'translate(-50%, -50%)'
            }}
        />

        {/* 市场点位容器 - 使用 CSS 变量控制缩放 */}
        <div ref={marketDotsRef} className="absolute inset-0 pointer-events-none" style={{ '--map-scale': '1' } as any}>
            {markets.map((market, index) => {
            // 必须与 MarketList3D 的分布逻辑保持一致
            const count = markets.length;
            const angle = (index / count) * Math.PI * 2 * 3; // 3圈
            const radius = 25 + (index / count) * 100; // 半径 25-125
            
            const worldX = Math.sin(angle) * radius;
            const worldZ = Math.cos(angle) * radius;

            return (
                <div
                key={market.id}
                onClick={(e) => {
                    e.stopPropagation(); 
                    onMarketClick?.(worldX, worldZ);
                }}
                className="absolute w-2 h-2 bg-[#14F195] rounded-full shadow-[0_0_4px_#14F195] cursor-pointer hover:scale-150 transition-transform hover:bg-white z-10 pointer-events-auto"
                style={{
                    left: `calc(${mapSize/2}px + ${worldX}px * var(--map-scale))`,
                    top: `calc(${mapSize/2}px + ${worldZ}px * var(--map-scale))`,
                    transform: 'translate(-50%, -50%)'
                }}
                title={market.title}
                />
            );
            })}
        </div>

        {/* 玩家点位 */}
        <div
          ref={playerDotRef}
          className="absolute z-20"
          style={{
            // 初始位置，后续由 JS 控制
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
             <div className="w-3 h-3 bg-[#9945FF] rounded-full border-2 border-white shadow-[0_0_10px_#9945FF] animate-pulse" />
        </div>
        
        {/* 坐标显示 */}
        <div ref={coordTextRef} className="absolute bottom-1 right-2 text-[9px] text-white/70 font-mono pointer-events-none bg-black/50 px-1 rounded">
          坐标: 0, 0
        </div>
        
        {/* 缩放比例尺显示 */}
        <div ref={scaleTextRef} className="absolute top-1 left-2 text-[9px] text-white/30 font-mono pointer-events-none">
           缩放: 1:1.0
        </div>
      </div>
    </div>
  );
});
