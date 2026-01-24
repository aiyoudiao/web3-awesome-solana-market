import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { MarketArtifact } from './MarketArtifact';
import { Avatar } from './Avatar';
import { Vector3 } from 'three';
import { CameraFollower } from './CameraFollower';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Html } from '@react-three/drei';

/**
 * 3D 市场列表组件
 * @description 展示所有市场的环形分布，包含玩家 Avatar
 */
export const MarketList3D = () => {
  const { setPlayerPos } = useStore();
  const router = useRouter();
  
  // 使用 React Query 获取实时数据
  const { data: markets, isLoading } = useQuery({
    queryKey: ['trendingMarkets'],
    queryFn: api.getTrendingMarkets
  });

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
      <Avatar onPositionChange={setPlayerPos} positionRef={avatarPosRef} />
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
