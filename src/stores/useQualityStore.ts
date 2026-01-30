import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QualityLevel = "low" | "medium" | "high" | "ultra";

interface QualitySettings {
  level: QualityLevel;
  dpr: number; // 设备像素比 (Device Pixel Ratio)
  shadows: boolean; // 是否启用实时阴影
  shadowMapSize: number; // 阴影贴图分辨率
  particles: number; // 粒子数量倍率
  bloom: boolean; // 是否启用辉光效果
  bloomIntensity: number; // 辉光强度
  ssr: boolean; // 屏幕空间反射 (Screen Space Reflections)
  aa: boolean; // 抗锯齿 (Antialiasing)
  lodDistance: number; // LOD 视距倍率 (距离越远，模型越简化)
}

const PRESETS: Record<QualityLevel, QualitySettings> = {
  low: {
    level: "low",
    dpr: 1, // 固定 1倍分辨率
    shadows: false,
    shadowMapSize: 512,
    particles: 0.3,
    bloom: false,
    bloomIntensity: 0,
    ssr: false,
    aa: false,
    lodDistance: 0.5,
  },
  medium: {
    level: "medium",
    dpr: 1.5, // 限制在 1.5倍
    shadows: true,
    shadowMapSize: 1024,
    particles: 0.6,
    bloom: true,
    bloomIntensity: 1.0,
    ssr: false,
    aa: true,
    lodDistance: 1.0,
  },
  high: {
    level: "high",
    dpr: 2, // 限制在 2倍 (视网膜屏)
    shadows: true,
    shadowMapSize: 2048,
    particles: 1.0,
    bloom: true,
    bloomIntensity: 1.5,
    ssr: false, // SSR 非常消耗性能，即使是 High 模式默认也不开启，除非 Ultra
    aa: true,
    lodDistance: 1.5,
  },
  ultra: {
    level: "ultra",
    dpr: 2,
    shadows: true,
    shadowMapSize: 4096,
    particles: 1.5,
    bloom: true,
    bloomIntensity: 2.0,
    ssr: true,
    aa: true,
    lodDistance: 2.0,
  },
};

interface QualityState extends QualitySettings {
  setQuality: (level: QualityLevel) => void;
  autoAdjust: (fps: number) => void;
  fps: number;
  setFps: (fps: number) => void;
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set, get) => ({
      ...PRESETS.high, // 默认为高画质
      fps: 60,

      setQuality: (level: QualityLevel) => {
        set({ ...PRESETS[level] });
      },

      setFps: (fps: number) => set({ fps }),

      autoAdjust: (fps: number) => {
        const current = get().level;
        // 简单的滞后逻辑，防止反复横跳 (Hysteresis)
        if (fps < 30 && current !== "low") {
          if (current === "ultra") set({ ...PRESETS.high });
          else if (current === "high") set({ ...PRESETS.medium });
          else if (current === "medium") set({ ...PRESETS.low });
        } else if (fps > 58 && current !== "ultra") {
          // 保守升级策略
          // (我们可能不想自动升级到 Ultra，因为这可能会导致 FPS 再次下降)
        }
      },
    }),
    {
      name: "quality-settings", // 本地存储的 key
    },
  ),
);
