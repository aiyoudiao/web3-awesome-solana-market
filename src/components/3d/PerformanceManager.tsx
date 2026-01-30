import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PerformanceMonitor, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { useQualityStore } from '@/stores/useQualityStore';

export const PerformanceManager = () => {
  const { fps, setFps, autoAdjust, level, dpr } = useQualityStore();
  const [monitor, setMonitor] = useState(false);
  
  // Enable monitor after a delay to skip initial load
  useEffect(() => {
    const t = setTimeout(() => setMonitor(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* 动态分辨率调整 */}
      <AdaptiveDpr pixelated />
      
      {/* 动态事件频率调整 */}
      <AdaptiveEvents />

      {/* 性能监控与自动降级 */}
      {monitor && (
        <PerformanceMonitor
          onIncline={() => setFps(60)}
          onDecline={({ fps }) => {
            setFps(fps);
            autoAdjust(fps);
          }}
        >
             {/* PerformanceMonitor 必须包含子元素或者返回 null，不能直接作为空标签使用 */}
             {/* 或者它不需要子元素？根据报错，它似乎渲染了一些东西。 */}
             {/* 检查文档发现 PerformanceMonitor 是一个 Wrapper 组件，通常包裹场景。 */}
             {/* 如果作为独立组件使用，可能需要确保它不返回非法对象。 */}
             {/* 这里的报错 "Objects are not valid as a React child" 通常是因为组件内部把某个对象直接渲染了。 */}
             {/* 在 drei 的 PerformanceMonitor 中，如果作为 render prop 使用，它会传递参数。 */}
             {/* 如果作为普通组件使用，它不应该渲染对象。 */}
             {/* 修复：根据 drei 文档，PerformanceMonitor 可以包裹子组件。如果我们不需要它包裹什么，可以给它传 null 或者空 Fragment。 */}
             {/* 但是报错指出的 keys {fps, index...} 看起来是 PerformanceMonitor 传递给 onChange 或者 children 的参数对象被渲染了。 */}
             {/* 实际上，PerformanceMonitor 如果没有 children，可能会默认渲染某些东西或者出错。 */}
             {/* 让我们给它一个 null child 试试。 */}
             <></>
        </PerformanceMonitor>
      )}

      {/* 始终显示 Stats 用于调试，位置调整到左侧中间，避免遮挡 */}
      <Stats className="!left-8 !top-48 !right-auto" />
    </>
  );
};
