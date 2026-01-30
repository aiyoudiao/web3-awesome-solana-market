import { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (data: { x: number; y: number }) => void;
  onEnd: () => void;
}

/**
 * 虚拟摇杆组件
 * @description
 * 简单的触摸式虚拟摇杆，用于移动端控制。
 * 支持多点触控（只响应第一个触点）。
 */
export const VirtualJoystick = ({ onMove, onEnd }: VirtualJoystickProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });
  const maxRadius = 50; // 摇杆最大活动半径

  // 仅在触摸设备或强制调试时显示
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 简单的触摸设备检测
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setVisible(isTouch);
  }, []);

  const handleStart = (e: React.TouchEvent) => {
    if (touchId.current !== null) return; // 已经有一个触摸点了

    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;

    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        center.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleMove = (e: React.TouchEvent) => {
    if (touchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId.current) {
            updateKnob(touch.clientX, touch.clientY);
            break;
        }
    }
  };

  const handleEnd = (e: React.TouchEvent) => {
    if (touchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
            touchId.current = null;
            resetKnob();
            onEnd();
            break;
        }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    const dx = clientX - center.current.x;
    const dy = clientY - center.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let moveX = dx;
    let moveY = dy;

    // 限制在最大半径内
    if (distance > maxRadius) {
        const angle = Math.atan2(dy, dx);
        moveX = Math.cos(angle) * maxRadius;
        moveY = Math.sin(angle) * maxRadius;
    }

    if (knobRef.current) {
        knobRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    // 归一化输出 (-1 到 1)
    onMove({
        x: moveX / maxRadius,
        y: moveY / maxRadius
    });
  };

  const resetKnob = () => {
    if (knobRef.current) {
        knobRef.current.style.transform = `translate(0px, 0px)`;
    }
  };

  if (!visible) return null;

  return (
    <div className="absolute bottom-12 left-12 z-[300] pointer-events-auto select-none touch-none">
      {/* 摇杆背景 */}
      <div 
        ref={containerRef}
        className="w-32 h-32 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      >
        {/* 摇杆头部 */}
        <div 
            ref={knobRef}
            className="w-12 h-12 rounded-full bg-[#9945FF] shadow-[0_0_15px_#9945FF] border-2 border-white/50"
            style={{ transition: touchId.current === null ? 'transform 0.2s ease-out' : 'none' }}
        />
      </div>
      <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-white/50 font-mono">
        触摸控制
      </div>
    </div>
  );
};
