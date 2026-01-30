import { useEffect, useState } from 'react';

/**
 * 赛博朋克加载屏幕
 * @description
 * 包含故障艺术效果 (Glitch Effect) 和进度条的加载画面。
 */
export const CyberpunkLoader = ({ progress = 0 }: { progress?: number }) => {
  const [glitch, setGlitch] = useState(false);
  const [text, setText] = useState('INITIALIZING');

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 2000);

    const textInterval = setInterval(() => {
        const phases = ['INITIALIZING', 'LOADING ASSETS', 'CONNECTING TO SOLANA', 'ESTABLISHING LINK'];
        setText(phases[Math.floor(Math.random() * phases.length)]);
    }, 1500);

    return () => {
        clearInterval(interval);
        clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[500] bg-[#050505] flex flex-col items-center justify-center font-mono">
      {/* 故障文字 */}
      <h1 className={`text-4xl font-black text-white mb-8 tracking-widest relative ${glitch ? 'animate-pulse' : ''}`}>
        <span className="absolute -left-1 top-0 text-[#9945FF] opacity-70 mix-blend-screen" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: glitch ? 'translate(-2px, 0)' : 'none' }}>
            POLY_SCORE
        </span>
        <span className="absolute -right-1 top-0 text-[#14F195] opacity-70 mix-blend-screen" style={{ clipPath: 'polygon(0 80%, 100% 20%, 100% 100%, 0 100%)', transform: glitch ? 'translate(2px, 0)' : 'none' }}>
            POLY_SCORE
        </span>
        POLY_SCORE
      </h1>

      {/* 状态文字 */}
      <div className="text-[#14F195] text-xs mb-2 animate-pulse">
          {'>'} {text}...
      </div>

      {/* 进度条容器 */}
      <div className="w-64 h-2 bg-[#1B1B1F] border border-[#333] relative overflow-hidden">
        {/* 进度条 */}
        <div 
            className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
        />
        {/* 扫描线效果 */}
        <div className="absolute inset-0 bg-white/10 w-full h-full animate-[scan_2s_linear_infinite]" />
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-8 text-[10px] text-white/30 flex gap-4">
         <span>SYS_VER: 3.0.1</span>
         <span>MEM: OK</span>
         <span>NET: OK</span>
      </div>
    </div>
  );
};
