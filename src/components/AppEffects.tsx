'use client';

import { BackgroundEffects } from './BackgroundEffects';
import { CursorEffect } from './CursorEffect';
import { useStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { Navbar3D } from './3d/Navbar3D';
import { useEffect, useState } from 'react';

// 动态导入 3D 场景，禁用 SSR
const SceneView = dynamic(() => import('./3d/SceneView').then(mod => mod.SceneView), { ssr: false });

export function AppEffects() {
  const { viewMode } = useStore();
  const [mounted, setMounted] = useState(false);

  // 解决 Hydration Mismatch: 仅在客户端挂载后渲染 3D 内容
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <>
      {/* 全局特效 */}
      <BackgroundEffects />
      <CursorEffect />

      {/* 3D 模式专用层 - 仅在客户端渲染且 viewMode 为 3d 时显示 */}
      {mounted && viewMode === '3d' && (
        <>
          <Navbar3D />
          <div className="fixed inset-0 z-0">
             <SceneView />
          </div>
        </>
      )}
    </>
  );
}
