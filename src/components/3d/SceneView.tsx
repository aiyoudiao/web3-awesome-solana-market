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
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SolanaLightning } from './SolanaLightning';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { PerformanceManager } from './PerformanceManager';
import { useQualityStore, QualityLevel } from '@/stores/useQualityStore';
import { VirtualJoystick } from './VirtualJoystick';
import { Speedometer } from './Speedometer';
import { CameraMode } from './CameraFollower';

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
 * 新手引导遮罩
 */
const TutorialOverlay = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 检查是否首次进入
    const hasSeen = localStorage.getItem('has_seen_3d_tutorial');
    if (!hasSeen) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('has_seen_3d_tutorial', 'true');
  };

  if (!visible) return null;

  return (
    <div 
        className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in"
        onClick={handleClose}
    >
      <div className="max-w-md w-full bg-[#1B1B1F] border border-[#9945FF] rounded-2xl p-6 shadow-[0_0_50px_rgba(153,69,255,0.3)] relative" onClick={e => e.stopPropagation()}>
         <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
         >
            ✕
         </button>
         
         <h2 className="text-2xl font-black italic mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
            欢迎来到 POLY SCORE
         </h2>
         
         <div className="space-y-4 text-sm text-gray-300">
            <p>这里是去中心化预测市场的 3D 可视化空间。驾驶您的 Solana 赛车探索各类市场。</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="text-[#14F195] font-bold mb-1">💻 桌面端操作</div>
                    <ul className="list-disc list-inside text-xs text-gray-400">
                        <li>WASD 或 方向键移动</li>
                        <li>鼠标拖拽旋转视角</li>
                        <li>撞击水晶进入市场</li>
                    </ul>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="text-[#9945FF] font-bold mb-1">📱 移动端操作</div>
                    <ul className="list-disc list-inside text-xs text-gray-400">
                        <li>左下角虚拟摇杆控制</li>
                        <li>双指缩放视角</li>
                        <li>点击小地图导航</li>
                    </ul>
                </div>
            </div>
         </div>
         
         <button 
            onClick={handleClose}
            className="w-full mt-6 py-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-bold text-lg rounded-xl hover:opacity-90 transition-opacity"
         >
            开始探索 🚀
         </button>
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
  // OPTIMIZATION: Only select what we need. Do NOT select playerPos here to prevent re-renders on every frame.
  const viewMode = useStore(state => state.viewMode);
  const setPlayerPos = useStore(state => state.setPlayerPos);
  // We don't need playerPos in this component anymore, MiniMap subscribes to it directly.
  
  const { dpr, shadows, bloom, bloomIntensity } = useQualityStore();
  const pathname = usePathname();
  const [canvasKey, setCanvasKey] = useState(0);
  const [isContextLost, setIsContextLost] = useState(false);
  
  // 虚拟摇杆状态
  const joystickRef = useRef({ x: 0, y: 0 });
  // 用于速度同步
  const speedRef = useRef(0);
  
  // 相机模式状态
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');

  const cameraModeLabels: Record<CameraMode, string> = {
    follow: '跟随',
    top: '俯视',
    driver: '驾驶'
  };

  const cycleCameraMode = () => {
      setCameraMode(prev => {
          if (prev === 'follow') return 'top';
          if (prev === 'top') return 'driver';
          return 'follow';
      });
  };

  // ... (existing market logic)
  const { allMarkets } = useMarketListViewModel();
  // Optimize: Memoize miniMapMarkets to prevent MiniMap re-renders
  const miniMapMarkets = useMemo(() => 
      (allMarkets || []).map(m => ({ id: m.marketId, title: m.title })),
  [allMarkets]);

  // Optimize: Memoize callback
  const handleMiniMapClick = useCallback((x: number, z: number) => { 
      setPlayerPos({ x, z }); 
  }, [setPlayerPos]);

  useEffect(() => {
    if (viewMode === '3d') {
      setCanvasKey(prev => prev + 1);
      setIsContextLost(false);
    }
  }, [viewMode]);

  if (viewMode !== '3d') return null;

  if (isContextLost) {
      // ... (existing error UI)
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
        // Only focus if clicking the background container directly or the canvas
        // Prevent stealing focus if clicking UI elements (though UI elements usually stop propagation)
        // 优化：防止 focus 导致的滚动抖动
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
            e.currentTarget.focus({ preventScroll: true }); 
            // window.focus(); // 移除 window.focus()，通常不必要且可能导致不可预期的滚动
        }
      }}
      onKeyDown={(e) => {
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
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
        <ContextMonitor onContextLost={() => setIsContextLost(true)} onContextRestored={() => setIsContextLost(false)} />
        <PerformanceManager />
        <color attach="background" args={['#1B1B1F']} />
        
        {bloom && (
            <EffectComposer enableNormalPass={false}>
                <Bloom luminanceThreshold={1.5} intensity={bloomIntensity} radius={0.8} mipmapBlur />
            </EffectComposer>
        )}

        <CyberpunkEnvironment />
        <SolanaLightning />
        
        {pathname === '/create' ? (
          <CreateMarket3D />
        ) : pathname === '/challenge' ? (
          <Challenge3D />
        ) : pathname.startsWith('/market/') ? (
          <MarketDetail3D />
        ) : (
          <MarketList3D inputRef={joystickRef} speedRef={speedRef} cameraMode={cameraMode} />
        )}

        <OrbitControls makeDefault enablePan={true} enableDamping={true} dampingFactor={0.05} screenSpacePanning={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={100} />
      </Canvas>
      
      {/* HUD: Camera Switcher (Moved outside Canvas for fixed positioning) */}
      {!pathname.startsWith('/market/') && pathname !== '/create' && pathname !== '/challenge' && (
        <div className="absolute top-24 left-8 z-[260] pointer-events-auto flex flex-col gap-2">
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Prevent focusing the container/canvas
                    cycleCameraMode();
                }}
                className="bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer select-none active:scale-95"
            >
                <span>📷</span>
                <span className="uppercase">{cameraModeLabels[cameraMode]}</span>
                <span className="opacity-50 text-[10px]">(C)</span>
            </button>
        </div>
      )}

      <VirtualJoystick 
        onMove={(data) => { joystickRef.current = data; }}
        onEnd={() => { joystickRef.current = { x: 0, y: 0 }; }}
      />

      <QualitySwitcher />
      <MiniMap markets={miniMapMarkets} onMarketClick={handleMiniMapClick} />
      
      {/* 新手引导 (仅首次显示) */}
      <TutorialOverlay />

      {/* 仪表盘区域 (底部中央) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-2 z-[200]">
         {/* 速度表 (仅在列表页显示) */}
         {!pathname.startsWith('/market/') && pathname !== '/create' && pathname !== '/challenge' && (
             <Speedometer speedRef={speedRef} />
         )}
         
         <div className="text-white/50 text-xs font-mono bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            点击屏幕激活控制 | WASD 或 方向键移动
         </div>
      </div>
    </div>
  );
};
