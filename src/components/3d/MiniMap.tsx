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
  const mapSize = 120; // 地图像素大小
  // 假设场景活动范围半径约 20
  const mapScale = (mapSize / 2) / 25; 

  return (
    <div className="absolute top-24 right-8 z-[250] pointer-events-auto">
      <div 
        className="relative bg-[#1B1B1F]/80 backdrop-blur-md rounded-full border border-[#9945FF]/30 shadow-[0_0_20px_rgba(153,69,255,0.2)]"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* 雷达扫描线动画 */}
        <div className="absolute inset-0 rounded-full border border-[#14F195]/10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#14F195]/20 to-transparent animate-spin-slow opacity-30" />
        </div>

        {/* 中心十字准星 */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#9945FF]/20 pointer-events-none" />
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-[#9945FF]/20 pointer-events-none" />

        {/* 市场点位 */}
        {markets.map((market, index) => {
          const angle = (index / markets.length) * Math.PI * 2;
          const radius = 10;
          const mx = Math.sin(angle) * radius;
          const mz = Math.cos(angle) * radius;

          // 转换到地图坐标 (中心为 0,0)
          const mapX = (mapSize / 2) + mx * mapScale;
          const mapY = (mapSize / 2) + mz * mapScale;

          return (
            <div
              key={market.id}
              onClick={(e) => {
                e.stopPropagation(); // 防止穿透
                onMarketClick?.(mx, mz);
              }}
              className="absolute w-2 h-2 bg-[#14F195] rounded-full shadow-[0_0_4px_#14F195] cursor-pointer hover:scale-150 transition-transform hover:bg-white z-20"
              style={{
                left: mapX,
                top: mapY,
                transform: 'translate(-50%, -50%)'
              }}
              title={market.title}
            />
          );
        })}

        {/* 玩家点位 */}
        <div
          className="absolute w-2 h-2 bg-[#9945FF] border border-white rounded-full shadow-[0_0_8px_#9945FF] transition-all duration-75 ease-linear pointer-events-none z-10"
          style={{
            left: (mapSize / 2) + playerPos.x * mapScale,
            top: (mapSize / 2) + playerPos.z * mapScale,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* 标签 */}
        <div className="absolute -bottom-5 w-full text-center text-[9px] text-[#9945FF] font-mono tracking-widest opacity-80 pointer-events-none">
          全息雷达
        </div>
      </div>
    </div>
  );
});
