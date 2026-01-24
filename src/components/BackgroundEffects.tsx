'use client';

/**
 * 背景特效组件
 * @description
 * 渲染应用的动态背景效果。
 */
export const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* 渐变光晕 - 顶部左侧 (Primary Color) */}
      <div 
        className="absolute top-0 left-0 w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-primary/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-blob mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-40"
      />
      
      {/* 渐变光晕 - 顶部右侧 (Secondary Color) */}
      <div 
        className="absolute top-0 right-0 w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-secondary/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 animate-blob mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-40"
        style={{ animationDelay: '2s' }}
      />
      
      {/* 渐变光晕 - 底部左侧 (Secondary Color) */}
      <div 
        className="absolute bottom-0 left-0 w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-secondary/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 animate-blob mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-40"
        style={{ animationDelay: '4s' }}
      />
      
      {/* 渐变光晕 - 底部右侧 (Primary Color) */}
      <div 
        className="absolute bottom-0 right-0 w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-primary/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-blob mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-40"
        style={{ animationDelay: '6s' }}
      />

      {/* 网格纹理 */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
        style={{
          backgroundImage: `linear-gradient(to right, rgb(var(--color-text-secondary)) 1px, transparent 1px),
                          linear-gradient(to bottom, rgb(var(--color-text-secondary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />
    </div>
  );
};
