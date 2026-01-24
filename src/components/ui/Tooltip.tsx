import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * 通用 Tooltip 组件 (Portal 版)
 * @description
 * 使用 React Portal 将 Tooltip 渲染到 body 根节点，解决 overflow: hidden 遮挡问题。
 * 支持自动定位计算和 2D/3D 通用样式。
 */
export const Tooltip = ({ content, children, position = 'bottom', className = '' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const gap = 8; // 间距

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - gap;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + gap;
          break;
        case 'left':
          x = rect.left - gap;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + gap;
          y = rect.top + rect.height / 2;
          break;
      }
      setCoords({ x, y });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  // 滚动或调整大小时重新计算位置
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  // 变换样式类
  const transformClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  // 箭头样式类 (相对于 Tooltip 容器)
  // Tooltip 在 Top -> 箭头在底部 (bottom-0)
  // Tooltip 在 Bottom -> 箭头在顶部 (top-0)
  const arrowClasses = {
    top: 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r rotate-45', 
    bottom: 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l rotate-45',
    left: 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r rotate-45',
    right: 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l rotate-45',
  };

  return (
    <>
      <div 
        ref={triggerRef} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={() => setIsVisible(false)} 
        className={`group/tooltip relative grid place-items-center ${className}`}
      >
        {children}
      </div>
      
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div 
          className={`
            fixed z-[9999] pointer-events-none
            px-3 py-1.5
            bg-[#1B1B1F]/95 backdrop-blur-md
            border border-[#9945FF]/30 rounded-lg
            text-xs font-medium text-white whitespace-nowrap
            shadow-[0_0_15px_rgba(153,69,255,0.3)]
            animate-in fade-in zoom-in-95 duration-200
            ${transformClasses[position]}
          `}
          style={{ 
            left: coords.x, 
            top: coords.y 
          }}
        >
          {content}
          {/* Arrow */}
          <div className={`
            absolute w-2.5 h-2.5 bg-[#1B1B1F]
            border-[#9945FF]/30
            ${arrowClasses[position]}
          `} />
        </div>,
        document.body
      )}
    </>
  );
};
