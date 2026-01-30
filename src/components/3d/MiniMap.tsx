import { memo } from 'react';
// 定义本地 Market 类型，避免引入不存在的模块
type Market = {
  id: string;
  title: string;
  // 可根据需要补充其他字段
};

interface MiniMapProps {
  markets: Market[];
  playerPos: { x: number; z: number };
  onMarketClick?: (x: number, z: number) => void;
}

/**
 * 3D 视图小地图 (Mini Map)
 * @description
 * 位于屏幕右上角的雷达图，显示玩家和市场的位置。
 * 玩家用箭头/圆点表示，市场用小亮点表示。
 */
export const MiniMap = memo(({ markets, playerPos, onMarketClick }: MiniMapProps) => {
  const mapSize = 160; 
  // 基础视口半径 (最小缩放)
  const baseViewRadius = 30;
  
  // 动态缩放逻辑：
  // 如果玩家跑得太远，自动缩小地图 (加大 viewRadius)，保证玩家始终在地图边缘内 (留 10% 缓冲)
  const maxPlayerDist = Math.max(Math.abs(playerPos.x), Math.abs(playerPos.z));
  const dynamicViewRadius = Math.max(baseViewRadius, maxPlayerDist * 1.2); // 1.2 倍缓冲
  
  const mapScale = (mapSize / 2) / dynamicViewRadius;

  return (
    <div className="absolute top-24 right-8 z-[250] pointer-events-auto">
      <div 
        className="relative bg-[#1B1B1F]/90 backdrop-blur-md rounded-lg border-2 border-[#9945FF]/50 shadow-[0_0_20px_rgba(153,69,255,0.3)] overflow-hidden"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* 背景网格 - 随地图缩放，但不移动（世界坐标系固定） */}
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#9945FF 1px, transparent 1px), linear-gradient(90deg, #9945FF 1px, transparent 1px)`,
                backgroundSize: `${20 * mapScale}px ${20 * mapScale}px`,
                backgroundPosition: `${(mapSize/2)}px ${(mapSize/2)}px` // 网格中心对齐地图中心
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

        {/* 市场点位 - 绝对坐标映射 */}
        {markets.map((market, index) => {
          const angle = (index / markets.length) * Math.PI * 2;
          const radius = 10;
          const worldX = Math.sin(angle) * radius;
          const worldZ = Math.cos(angle) * radius;

          // 转换到地图坐标 (中心为 mapSize/2)
          const mapX = (mapSize / 2) + worldX * mapScale;
          const mapY = (mapSize / 2) + worldZ * mapScale;

          return (
            <div
              key={market.id}
              onClick={(e) => {
                e.stopPropagation(); // 防止穿透
                onMarketClick?.(worldX, worldZ);
              }}
              className="absolute w-2 h-2 bg-[#14F195] rounded-full shadow-[0_0_4px_#14F195] cursor-pointer hover:scale-150 transition-transform hover:bg-white z-10"
              style={{
                left: mapX,
                top: mapY,
                transform: 'translate(-50%, -50%)'
              }}
              title={market.title}
            />
          );
        })}

        {/* 视锥体指示器 (已移除) */}

        {/* 玩家点位 - 在地图上移动 */}
        <div
          className="absolute z-20 transition-all duration-100 ease-linear"
          style={{
            left: (mapSize / 2) + playerPos.x * mapScale,
            top: (mapSize / 2) + playerPos.z * mapScale,
            transform: 'translate(-50%, -50%)'
          }}
        >
             {/* 闪烁的玩家图标 */}
             <div className="w-3 h-3 bg-[#9945FF] rounded-full border-2 border-white shadow-[0_0_10px_#9945FF] animate-pulse" />
        </div>
        
        {/* 坐标显示 */}
        <div className="absolute bottom-1 right-2 text-[9px] text-white/70 font-mono pointer-events-none bg-black/50 px-1 rounded">
          坐标: {Math.round(playerPos.x)}, {Math.round(playerPos.z)}
        </div>
        
        {/* 缩放比例尺显示 */}
        <div className="absolute top-1 left-2 text-[9px] text-white/30 font-mono pointer-events-none">
           缩放: 1:{(1/mapScale).toFixed(1)}
        </div>
      </div>
    </div>
  );
});
