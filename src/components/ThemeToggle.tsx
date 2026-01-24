'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Tooltip } from './ui/Tooltip';

/**
 * 主题切换组件
 * @description
 * 负责应用明暗主题的切换和持久化存储。
 */
export const ThemeToggle = () => {
  const { theme, setTheme } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 初始化 DOM 类名
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  /**
   * 切换主题模式
   */
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;

  return (
    <Tooltip content={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
        aria-label="切换主题"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </Tooltip>
  );
};
