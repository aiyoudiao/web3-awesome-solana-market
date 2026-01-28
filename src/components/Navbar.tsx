'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { CoolWalletButton } from "./CoolWalletButton";
import { useStore } from "@/lib/store";
import { Box, LayoutTemplate, Coins, Loader2 } from "lucide-react";
import { Tooltip } from "./ui/Tooltip";
import { clsx } from "clsx";
import { useSoldoraProgram } from "@/hooks/useSoldoraProgram";

/**
 * 导航栏组件
 * @description
 * 集成了路由导航、钱包连接、主题切换和 2D/3D 视图切换功能。
 * 采用响应式设计和玻璃拟态风格。
 */
export function Navbar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const { isAuthenticated, login } = useAuth();
  const { viewMode, setViewMode } = useStore();
  const { requestAirdrop, loading: programLoading } = useSoldoraProgram();

  const navItems = [
    { name: '市场', path: '/' },
    { name: '排行榜', path: '/leaderboard' },
    { name: '个人中心', path: '/profile' },
  ];

  // 在 3D 模式下隐藏此导航栏 (改用 Navbar3D)
  if (viewMode === '3d') return null;

  return (
    <nav className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(var(--color-primary),0.5)] group-hover:scale-110 transition-transform">
            P
          </div>
          <span className="text-xl font-black italic tracking-tighter text-text-primary">
            POLY<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">SCORE</span>
          </span>
        </Link>

        {connected && (
           <Button 
               variant="ghost" 
               size="sm" 
               onClick={requestAirdrop} 
               disabled={programLoading}
               className="ml-4 hidden md:flex items-center gap-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
           >
               {programLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
               空投 10 SOL
           </Button>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-surface/50 border border-border/50">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--color-primary),0.2)]" 
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-3">
           {/* View Mode Toggle */}
           <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-surface/50 border border-border/50 mr-2">
              <Tooltip content="2D 极简模式">
                <button
                  onClick={() => setViewMode('2d')}
                  className={clsx(
                    "p-2 rounded-full transition-all duration-300",
                    "bg-primary text-white shadow-md"
                  )}
                >
                  <LayoutTemplate size={18} />
                </button>
              </Tooltip>
              <Tooltip content="3D 沉浸模式">
                <button
                  onClick={() => setViewMode('3d')}
                  className={clsx(
                    "p-2 rounded-full transition-all duration-300",
                    "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <Box size={18} />
                </button>
              </Tooltip>
           </div>

           <ThemeToggle />

           {/* Wallet & Auth */}
           <div className="flex items-center gap-3 pl-3 border-l border-border/50">
              {!connected ? (
                 <CoolWalletButton />
              ) : !isAuthenticated ? (
                 <Button onClick={login} variant="secondary" className="font-bold animate-pulse shadow-[0_0_15px_rgba(var(--color-secondary),0.4)]">
                    签名登录
                 </Button>
              ) : (
                 <CoolWalletButton />
              )}
           </div>
        </div>
      </div>
    </nav>
  );
}
