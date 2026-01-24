'use client';

import { useStore } from "@/lib/store";
import { Navbar } from "./Navbar";
import { useEffect, useState } from "react";

export function ViewController({ children }: { children: React.ReactNode }) {
  const { viewMode } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 避免服务端渲染不匹配，初始状态渲染（或者用 CSS 隐藏）
  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="flex-1 container py-6 relative z-10">
          {children}
        </main>
      </>
    );
  }

  // 3D 模式下隐藏 2D 界面
  if (viewMode === '3d') {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-6 relative z-10 animate-in fade-in duration-500">
        {children}
      </main>
    </>
  );
}
