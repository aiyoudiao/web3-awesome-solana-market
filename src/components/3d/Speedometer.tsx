import { useEffect, useRef } from 'react';

interface SpeedometerProps {
  speedRef: React.MutableRefObject<number>;
  maxSpeed?: number;
}

/**
 * 赛博朋克风格速度仪表盘
 */
export const Speedometer = ({ speedRef, maxSpeed = 0.48 }: SpeedometerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastDisplaySpeed = -1; // Cache to prevent redraw if unchanged

    const draw = () => {
      const currentSpeed = Math.abs(speedRef.current);
      // 将物理速度映射到显示速度 (max 120 km/h)
      const displaySpeed = Math.floor(Math.min(currentSpeed / maxSpeed, 1) * 120);
      
      // Optimization: Only redraw if speed value changed significantly
      // We check displaySpeed (integer) to avoid micro-updates
      if (displaySpeed !== lastDisplaySpeed) {
          lastDisplaySpeed = displaySpeed;
          
          // Clear
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height;
          const radius = width / 2 - 10;
          
          const ratio = Math.min(currentSpeed / maxSpeed, 1);
          
          // Draw Arc Background
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, Math.PI, 0);
          ctx.lineWidth = 10;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.stroke();
          
          // Draw Active Arc
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + ratio * Math.PI);
          ctx.lineWidth = 10;
          
          // Gradient
          const gradient = ctx.createLinearGradient(0, height, width, height);
          gradient.addColorStop(0, '#14F195');
          gradient.addColorStop(1, '#9945FF');
          ctx.strokeStyle = gradient;
          ctx.stroke();
          
          // Draw Text
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          
          // Speed Value
          ctx.font = 'bold 40px "JetBrains Mono", monospace';
          ctx.fillText(displaySpeed.toString(), centerX, centerY - 20);
          
          // Unit
          ctx.font = '12px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillText('KM/H', centerX, centerY - 5);
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [maxSpeed, speedRef]);

  return (
    <div className="relative w-48 h-24">
       <canvas 
         ref={canvasRef} 
         width={192} 
         height={96} 
         className="w-full h-full"
       />
       {/* Glitch Effect Overlay */}
       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};
