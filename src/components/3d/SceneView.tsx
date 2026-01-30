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
import { MiniMap } from './MiniMap';
import { useMarketListViewModel } from '@/hooks/view-models/useMarketListViewModel';
import { useState, useEffect } from 'react';
import { SolanaLightning } from './SolanaLightning';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { PerformanceManager } from './PerformanceManager';
import { useQualityStore, QualityLevel } from '@/stores/useQualityStore';

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
 * 质量切换器组件
 */
const QualitySwitcher = () => {
  // Use selector to avoid re-rendering entire component on FPS updates
  // But for now, we just destructure safely
  const level = useQualityStore(s => s.level);
  const setQuality = useQualityStore(s => s.setQuality);
  const fps = useQualityStore(s => s.fps);
  
  const labels: Record<QualityLevel, string> = {
    low: '低',
    medium: '中',
    high: '高',
    ultra: '超高'
  };

  return (
    <div className="absolute bottom-8 right-8 z-[260] flex flex-col gap-2 items-end pointer-events-auto">
      <div className="text-xs font-mono text-white/50 mb-1">FPS: {typeof fps === 'number' ? fps : 0}</div>
      <div className="flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
        {(['low', 'medium', 'high', 'ultra'] as QualityLevel[]).map((q) => (
            <button
                key={q}
                onClick={() => setQuality(q)}
                className={`
                    px-3 py-1 text-[10px] uppercase font-bold rounded transition-colors
                    ${level === q ? 'bg-[#9945FF] text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}
                `}
            >
                {labels[q]}
            </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 3D 场景视图组件
 * @author aiyoudiao
 * @date 2026-01-23
 * @description
 * 3D 模式的主入口组件。
 */
export const SceneView = () => {
  const { viewMode, playerPos, setPlayerPos } = useStore();
  const { dpr, shadows, bloom, bloomIntensity } = useQualityStore();
  const pathname = usePathname();
  const [canvasKey, setCanvasKey] = useState(0);
  const [isContextLost, setIsContextLost] = useState(false);

  // 获取市场数据用于 MiniMap
  const { allMarkets } = useMarketListViewModel();

  // 转换市场数据格式
  const miniMapMarkets = (allMarkets || []).map(m => ({
    id: m.marketId,
    title: m.title
  }));

  // 处理 MiniMap 点击跳转
  const handleMiniMapClick = (x: number, z: number) => {
    setPlayerPos({ x, z });
  };

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
    <div 
      className="fixed inset-0 z-[250] bg-[#1B1B1F] outline-none" 
      tabIndex={0}
      onClick={(e) => {
        // 确保点击时获取焦点，以便接收键盘事件
        e.currentTarget.focus();
        window.focus();
      }}
      onKeyDown={(e) => {
        // 防止按键滚动页面
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }}
    >
      <Canvas 
        key={canvasKey}
        shadows={shadows}
        dpr={[1, dpr]} 
        gl={{ 
          antialias: true, 
          alpha: false, 
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
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
        
        <PerformanceManager />

        <color attach="background" args={['#1B1B1F']} />
        
        {/* PostProcessing Effects */}
        {bloom && (
            <EffectComposer enableNormalPass={false}>
                <Bloom 
                    luminanceThreshold={1.5} 
                    intensity={bloomIntensity} 
                    radius={0.8}
                    mipmapBlur 
                />
            </EffectComposer>
        )}

        {/* 核心环境 - 如果这里崩溃，尝试注释掉它 */}
        <CyberpunkEnvironment />
        
        {/* 闪电特效系统 */}
        <SolanaLightning />
        
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
      
      <QualitySwitcher />

      {/* MiniMap Overlay - Always visible in 3D mode */}
      <MiniMap 
        markets={miniMapMarkets} 
        playerPos={playerPos} 
        onMarketClick={handleMiniMapClick}
      />

      {/* 操作提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none text-white/50 text-xs font-mono bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
         点击屏幕激活控制 | WASD 或 方向键移动
      </div>
    </div>
  );
};
