import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * 全局状态管理接口
 * @description 定义了应用的核心状态和操作方法。使用 Zustand 进行状态管理。
 */
interface StoreState {
  /** 视图模式 */
  viewMode: "2d" | "3d";

  /** 当前主题模式 */
  theme: "dark" | "light";

  /** 玩家当前坐标 (3D模式) */
  playerPos: { x: number; z: number };

  // 动作 Actions

  /**
   * 切换视图模式
   * @param mode 模式
   */
  setViewMode: (mode: "2d" | "3d") => void;

  /**
   * 设置主题模式
   * @param theme 主题
   */
  setTheme: (theme: "dark" | "light") => void;

  /**
   * 更新玩家坐标
   * @param pos 坐标对象
   */
  setPlayerPos: (pos: { x: number; z: number }) => void;
}

/**
 * Zustand Store 实现
 * @description
 * 包含 UI 相关的全局状态（主题、视图模式）。
 * 使用 persist 中间件自动处理 localStorage 持久化，解决 SSR hydration 问题。
 */
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // 初始默认值（服务端渲染时使用）
      viewMode: "2d",
      theme: "dark",
      playerPos: { x: 0, z: 8 },

      /**
       * 切换视图模式
       */
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      /**
       * 设置主题模式
       */
      setTheme: (theme) => {
        // 副作用：同步 DOM 类名 (客户端逻辑)
        if (typeof document !== 'undefined') {
            if (theme === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
        }
        set({ theme });
      },

      setPlayerPos: (pos) => set({ playerPos: pos }),
    }),
    {
      name: "app-storage", // localStorage key
      storage: createJSONStorage(() => localStorage), // 指定存储引擎
      onRehydrateStorage: () => (state) => {
        // 当状态从 localStorage 恢复后，同步 DOM 主题
        if (state && typeof document !== 'undefined') {
           if (state.theme === "dark") {
             document.documentElement.classList.add("dark");
           } else {
             document.documentElement.classList.remove("dark");
           }
        }
      }
    }
  )
);
