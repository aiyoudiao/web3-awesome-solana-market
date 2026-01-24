'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CyberpunkEnvironment } from './CyberpunkEnvironment';
import { MarketList3D } from './MarketList3D';
import { MarketDetail3D } from './MarketDetail3D';
import { CreateMarket3D } from './CreateMarket3D';
import { Challenge3D } from './Challenge3D';
import { useState, useEffect } from 'react';

/**
 * WebGL 上下文监听组件
 * @description
 * 放在 Canvas 内部，负责监听 contextlost/restored 事件。
 * 当组件卸载时自动移除监听器，防止切换视图时报错。
 */
const ContextMonitor = ({ 
  onContextLost, 
  onContextRestored 
}: { 
  onContextLost: () => void, 
  onContextRestored: () => void 
}) => {
  const { gl } = useThree();

  useEffect(() => {
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    
    const handleRestored = () => {
      onContextRestored();
    };

    const domElement = gl.domElement;
    domElement.addEventListener('webglcontextlost', handleLost, false);
    domElement.addEventListener('webglcontextrestored', handleRestored, false);

    return () => {
      domElement.removeEventListener('webglcontextlost', handleLost, false);
      domElement.removeEventListener('webglcontextrestored', handleRestored, false);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
};

/**
 * 3D 场景视图组件
 * @author aiyoudiao
 * @date 2026-01-23
 * @description
 * 3D 模式的主入口组件。
 */
export const SceneView = () => {
  const { viewMode } = useStore();
  const pathname = usePathname();
  const [canvasKey, setCanvasKey] = useState(0);
  const [isContextLost, setIsContextLost] = useState(false);

  // 监听视图模式变化，重置 Canvas
  useEffect(() => {
    if (viewMode === '3d') {
      setCanvasKey(prev => prev + 1);
      setIsContextLost(false);
    }
  }, [viewMode]);

  // 仅在 3D 模式开启时显示
  if (viewMode !== '3d') return null;

  if (isContextLost) {
    return (
      <div className="fixed inset-0 z-[250] bg-[#1B1B1F] flex items-center justify-center text-white flex-col gap-4">
        <div className="text-xl font-bold text-red-500">WebGL 上下文丢失</div>
        <button 
          onClick={() => {
            setIsContextLost(false);
            setCanvasKey(k => k + 1);
          }}
          className="px-4 py-2 bg-[#9945FF] rounded hover:bg-[#8B5CF6]"
        >
          重新加载 3D 场景
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[250] bg-[#1B1B1F]">
      <Canvas 
        key={canvasKey}
        shadows={false}
        dpr={[1, 1]} 
        gl={{ 
          antialias: true, 
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false
        }}
        camera={{ position: [0, 15, 25], fov: 55, near: 0.1, far: 1000 }} 
        style={{ touchAction: 'none' }} 
      >
        <ContextMonitor 
          onContextLost={() => {
            console.warn('检测到 WebGL 上下文丢失');
            setIsContextLost(true);
          }}
          onContextRestored={() => {
            console.log('WebGL 上下文已恢复');
            setIsContextLost(false);
          }}
        />

        <color attach="background" args={['#1B1B1F']} />
        
        {/* 核心环境 - 如果这里崩溃，尝试注释掉它 */}
        <CyberpunkEnvironment />
        
        {/* 根据路由渲染不同的 3D 内容 */}
        {pathname === '/create' ? (
          <CreateMarket3D />
        ) : pathname === '/challenge' ? (
          <Challenge3D />
        ) : pathname.startsWith('/market/') ? (
          <MarketDetail3D />
        ) : (
          <MarketList3D />
        )}

        <OrbitControls 
          makeDefault
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={false}
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.2} 
          minDistance={5}
          maxDistance={100} 
        />
      </Canvas>
    </div>
  );
};
