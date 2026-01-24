'use client';

import { useEffect, useState, useRef } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * 鼠标光标特效组件
 * @description
 * 实现跟随鼠标的光晕效果和点击时的波纹特效。
 */
export const CursorEffect = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  
  // 使用 ref 追踪鼠标位置，避免触发重渲染
  const mousePos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // 优化的鼠标移动处理，使用 requestAnimationFrame
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          if (cursorRef.current) {
            cursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
          }
          rafId.current = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // 点击波纹处理逻辑
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev, newRipple]);
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  /**
   * 移除已完成动画的波纹
   * @param id 波纹 ID
   */
  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
  };

  return (
    <>
      {/* 大范围光晕效果 */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-96 h-96 pointer-events-none z-0 transition-colors duration-300 mix-blend-multiply dark:mix-blend-screen opacity-60 dark:opacity-40"
        style={{
          marginTop: '-12rem',
          marginLeft: '-12rem',
          background: 'radial-gradient(circle, rgba(var(--color-primary), 0.3) 0%, rgba(var(--color-primary), 0) 60%)',
          willChange: 'transform', // 硬件加速提示
        }}
      />
      
      {/* 点击波纹 - 增强的冲击波效果 */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
          onAnimationEnd={() => removeRipple(ripple.id)}
        >
          {/* 外圈紫色环 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--color-primary))] animate-ripple-outer shadow-[0_0_15px_rgba(var(--color-primary),0.6)]" />
          
          {/* 内圈绿色环 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--color-secondary))] animate-ripple-inner shadow-[0_0_15px_rgba(var(--color-secondary),0.6)]" />
        </div>
      ))}

      <style>{`
        @keyframes ripple-outer {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
            border-width: 4px;
          }
          100% {
            width: 140px;
            height: 140px;
            opacity: 0;
            border-width: 0px;
          }
        }
        @keyframes ripple-inner {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
            border-width: 3px;
          }
          100% {
            width: 80px;
            height: 80px;
            opacity: 0;
            border-width: 0px;
          }
        }
        .animate-ripple-outer {
          animation: ripple-outer 0.7s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
        .animate-ripple-inner {
          animation: ripple-inner 0.5s cubic-bezier(0, 0, 0.2, 1) 0.05s forwards;
        }
      `}</style>
    </>
  );
};
