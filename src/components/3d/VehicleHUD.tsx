import { useStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import { useQualityStore, VisualPreset } from '@/stores/useQualityStore';
import { TRINITY_MODES } from '@/mythic/trinity';

export const VehicleHUD = () => {
  const vehicleMode = useStore((state) => state.vehicleMode);
  const setVehicleMode = useStore((state) => state.setVehicleMode);
  const [active, setActive] = useState(false);
  const visualPreset = useQualityStore((s) => s.visualPreset);
  const setVisualPreset = useQualityStore((s) => s.setVisualPreset);
  const prevVehicleModeRef = useRef(vehicleMode);

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['1', '2', '3'].includes(e.key)) {
            setActive(true);
            setTimeout(() => setActive(false), 2000);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (prevVehicleModeRef.current !== vehicleMode) {
      prevVehicleModeRef.current = vehicleMode;
      setActive(true);
      const t = window.setTimeout(() => setActive(false), 1600);
      return () => window.clearTimeout(t);
    }
  }, [vehicleMode]);

  const modes = [
    { id: 'car', label: TRINITY_MODES.car.totem, icon: TRINITY_MODES.car.icon, color: 'from-purple-500 to-indigo-500' },
    { id: 'yacht', label: TRINITY_MODES.yacht.totem, icon: TRINITY_MODES.yacht.icon, color: 'from-blue-500 to-cyan-500' },
    { id: 'jet', label: TRINITY_MODES.jet.totem, icon: TRINITY_MODES.jet.icon, color: 'from-orange-500 to-red-500' },
  ] as const;

  const presets: { id: VisualPreset; label: string }[] = [
    { id: 'esports', label: '赛事' },
    { id: 'neon', label: '霓虹' },
    { id: 'cinematic', label: '电影' },
  ];

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto z-[250]">
      {/* 顶部状态条 */}
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-1 pr-2 mr-1 border-r border-white/10">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setVisualPreset(preset.id)}
              className={`px-2.5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider transition-colors ${
                visualPreset === preset.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setVehicleMode(mode.id)}
            className={`
              relative px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 overflow-hidden
              ${vehicleMode === mode.id ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}
            `}
          >
            {/* 激活时的背景流光 */}
            {vehicleMode === mode.id && (
                <div className={`absolute inset-0 bg-gradient-to-r ${mode.color} opacity-20`} />
            )}
            
            <span className="text-lg relative z-10">{mode.icon}</span>
            <span className={`text-xs font-bold font-mono uppercase tracking-wider relative z-10 ${vehicleMode === mode.id ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all'}`}>
                {mode.label}
            </span>
            
            {/* 底部指示条 */}
            {vehicleMode === mode.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${mode.color}`} />
            )}
          </button>
        ))}
      </div>

      {/* 变形提示动画 (仅在切换时显示) */}
      <div className={`
        absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-all duration-500
        ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}>
        <div className="text-[#14F195] text-xs font-mono tracking-[0.2em] animate-pulse">
            SYSTEM RECONFIGURING...
        </div>
      </div>
    </div>
  );
};
