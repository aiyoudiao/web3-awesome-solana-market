import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { MarketArtifact } from './MarketArtifact';
import { CyberCar } from './CyberCar';
import { Vector3 } from 'three';
import { CameraFollower } from './CameraFollower';
import { Html } from '@react-three/drei';
import { useMarketListViewModel } from '@/hooks/view-models/useMarketListViewModel';

/**
 * 3D 市场列表组件
 * @description 展示所有市场的环形分布，包含玩家 Avatar
 */
export const MarketList3D = () => {
  const { setPlayerPos } = useStore();
  const router = useRouter();
  
  // 使用 ViewModel 获取数据 (与 2D 页面一致)
  const { allMarkets: markets, isLoading } = useMarketListViewModel();

  // 用于相机跟随的 Ref (避免频繁重渲染)
  const avatarPosRef = useRef(new Vector3(0, 2, 8));

  const handleMarketSelect = useCallback((id: string) => {
    router.push(`/market/${id}`);
  }, [router]);

  if (isLoading || !markets) {
      return (
        <Html center>
            <div className="text-white text-xl animate-pulse">正在加载市场数据...</div>
        </Html>
      );
  }

  return (
    <>
      <CyberCar onPositionChange={setPlayerPos} positionRef={avatarPosRef} />
      <CameraFollower targetRef={avatarPosRef} />
      
      {markets.map((market, index) => {
        const angle = (index / markets.length) * Math.PI * 2;
        const radius = 10; 
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <MarketArtifact
            key={market.marketId}
            market={market}
            position={[x, 2, z]}
            onSelect={handleMarketSelect}
          />
        );
      })}
    </>
  );
};
