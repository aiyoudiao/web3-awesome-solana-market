'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useWallet } from '@solana/wallet-adapter-react';
import { PlusCircle, LayoutGrid, Cpu, Activity, Zap, Monitor } from 'lucide-react';
import { CoolWalletButton } from '../CoolWalletButton';
import { Tooltip } from '../ui/Tooltip';
import { useEffect, useState } from 'react';

/**
 * 3D 模式下的全息导航栏 (2D 黑暗模式一致性版)
 * @description
 * 保持全息 HUD 风格，但配色严格遵循 2D 黑暗模式 (Solana Purple & Green)。
 * 背景: #1B1B1F, 主色: #9945FF (Purple), 辅色: #14F195 (Green)
 */
export const Navbar3D = () => {
  const { setViewMode } = useStore();
  const pathname = usePathname();
  const { connected } = useWallet();
  const [balance, setBalance] = useState(0); // Mock balance

  // Mock balance update
  useEffect(() => {
    if (connected) {
        setBalance(Math.floor(Math.random() * 1000) + 500);
    }
  }, [connected]);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 z-[290] grid place-items-center pointer-events-none">
      {/* 顶部装饰线 - 使用 Solana 渐变 */}
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#9945FF]/50 to-transparent" />
      
      {/* 主 HUD 容器 */}
      <div className="relative mt-0 pointer-events-auto perspective-[1000px] group">
        {/* 背景光效 - 紫色氛围 */}
        <div className="absolute inset-0 bg-[#9945FF]/5 blur-[50px] rounded-full" />

        {/* 核心控制台造型 - 匹配 dark 模式背景 #1B1B1F */}
        <div className="relative grid place-items-center">
          {/* 背景层 - 负责形状裁剪 */}
          <div 
            className="
              absolute inset-0
              bg-[#1B1B1F]/90 backdrop-blur-2xl 
              border-b border-x border-[#9945FF]/30 
              shadow-[0_10px_50px_rgba(153,69,255,0.15)]
              clip-path-trapezoid
            "
            style={{
              clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)',
              borderImage: 'linear-gradient(to bottom, rgba(153,69,255,0), rgba(153,69,255,0.5)) 1'
            }}
          >
            {/* 装饰性扫描线背景 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(153,69,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-30" />
          </div>

          {/* 内容层 - 不裁剪，允许下拉菜单溢出 */}
          <div className="relative z-10 px-2 md:px-16 py-3 grid grid-flow-col gap-2 md:gap-16 items-center max-w-full overflow-x-auto scrollbar-hide">
            {/* 左侧装饰元素 - 绿色点缀 */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 grid grid-flow-row gap-1 opacity-50">
            <div className="w-2 h-2 bg-[#14F195] rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-[#14F195]/50 rounded-full" />
            <div className="w-2 h-2 bg-[#14F195]/20 rounded-full" />
          </div>

          {/* Logo 区域 - 保持一致的 Solana 渐变 */}
          <Tooltip content="返回首页">
            <Link href="/" className="relative group/logo grid grid-flow-col gap-3 mr-0 md:mr-4 items-center">
              <div className="relative w-8 h-8 md:w-10 md:h-10 grid place-items-center bg-[#2B2B30] rounded-lg border border-[#9945FF]/30 group-hover/logo:border-[#14F195] transition-colors">
                <Zap className="text-[#14F195] w-5 h-5 md:w-6 md:h-6 group-hover/logo:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-[#14F195]/20 blur-md opacity-0 group-hover/logo:opacity-100 transition-opacity" />
              </div>
              <div className="hidden md:grid grid-flow-row">
                <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
                  SOLANA
                </span>
                <span className="text-[9px] tracking-[0.4em] text-[#9945FF] font-bold uppercase">
                  PREDICTION
                </span>
              </div>
            </Link>
          </Tooltip>

          {/* 导航链接区域 */}
          <div className="grid grid-flow-col gap-1 md:gap-2 items-center bg-[#2B2B30]/50 rounded-lg p-1 border border-[#4B5563]/50">
            <Link href="/" className="relative">
              <div className={`
                px-3 md:px-6 py-2 rounded font-bold text-xs md:text-sm transition-all duration-300 grid grid-flow-col gap-1 md:gap-2 items-center overflow-hidden relative
                ${isActive('/') 
                  ? 'text-white shadow-[0_0_20px_rgba(20,241,149,0.2)]' 
                  : 'text-[#D1D5DB] hover:text-white'}
              `}>
                {/* 激活时的背景流光 - 绿色 */}
                {isActive('/') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#14F195]/80 to-[#10B981]/80 opacity-90" />
                )}
                <span className="relative z-10 grid grid-flow-col gap-1 md:gap-2 items-center">
                  <LayoutGrid size={14} className="md:w-4 md:h-4" />
                  <span className="hidden sm:inline">市场列表</span>
                  <span className="sm:hidden">市场</span>
                </span>
              </div>
            </Link>

            <Link href="/create" className="relative">
              <div className={`
                px-3 md:px-6 py-2 rounded font-bold text-xs md:text-sm transition-all duration-300 grid grid-flow-col gap-1 md:gap-2 items-center overflow-hidden relative
                ${isActive('/create') 
                  ? 'text-white shadow-[0_0_20px_rgba(153,69,255,0.2)]' 
                  : 'text-[#D1D5DB] hover:text-white'}
              `}>
                {isActive('/create') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF]/80 to-[#7C3AED]/80 opacity-90" />
                )}
                <span className="relative z-10 grid grid-flow-col gap-1 md:gap-2 items-center">
                  <PlusCircle size={14} className="md:w-4 md:h-4" />
                  <span className="hidden sm:inline">创建事件</span>
                  <span className="sm:hidden">创建</span>
                </span>
              </div>
            </Link>
          </div>

          {/* 右侧数据与钱包 */}
          <div className="grid grid-flow-col gap-2 md:gap-6 pl-2 md:pl-8 border-l border-[#4B5563]/50 ml-2 md:ml-4 items-center">
            {/* 2D 视图切换按钮 */}
            <Tooltip content="切换到 2D 标准视图">
              <button
                onClick={() => setViewMode('2d')}
                className="group/btn relative grid place-items-center w-8 h-8 rounded-full border border-[#4B5563]/50 bg-[#2B2B30]/50 hover:bg-[#2B2B30] hover:border-[#14F195] transition-all"
              >
                <Monitor size={14} className="text-[#9CA3AF] group-hover/btn:text-[#14F195] transition-colors" />
                <div className="absolute inset-0 bg-[#14F195]/20 blur-md rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </button>
            </Tooltip>

            {/* 系统状态指标 - 移动端隐藏 */}
            <div className="hidden lg:grid grid-flow-col gap-4 text-xs font-mono text-[#9CA3AF]">
              <Tooltip content="当前网络吞吐量 (TPS)">
                <div className="grid grid-flow-col gap-1 items-center cursor-help">
                  <Activity size={12} className="text-[#14F195]" />
                  <span>TPS: 2450</span>
                </div>
              </Tooltip>
              <Tooltip content="网络延迟 (Ping)">
                <div className="grid grid-flow-col gap-1 items-center cursor-help">
                  <Cpu size={12} className="text-[#9945FF]" />
                  <span>PING: 12ms</span>
                </div>
              </Tooltip>
            </div>

            {connected && (
              <div className="hidden sm:grid grid-flow-row justify-items-end">
                <span className="text-[9px] text-[#9945FF] uppercase tracking-widest">余额</span>
                <span className="font-mono font-bold text-[#14F195] text-lg leading-none text-shadow-green">
                  ${balance.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="scale-75 md:scale-90 origin-right">
              <CoolWalletButton />
            </div>
          </div>

          {/* 右侧装饰元素 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 grid grid-flow-row gap-1 opacity-50 justify-items-end">
            <div className="w-2 h-2 bg-[#9945FF] rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-[#9945FF]/50 rounded-full" />
            <div className="w-2 h-2 bg-[#9945FF]/20 rounded-full" />
          </div>
        </div>
      </div>

        {/* 底部全息投影线 */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-[#9945FF]/30 to-transparent blur-[2px]" />
        
        {/* 角落科技装饰 */}
        <div className="absolute -bottom-1 left-0 w-4 h-4 border-l-2 border-b-2 border-[#9945FF]/50 rounded-bl-lg" />
        <div className="absolute -bottom-1 right-0 w-4 h-4 border-r-2 border-b-2 border-[#9945FF]/50 rounded-br-lg" />
      </div>
      
      <style>{`
        .clip-path-trapezoid {
          clip-path: polygon(20px 0, calc(100% - 20px) 0, 100% 100%, 0 100%);
        }
        .text-shadow-green {
          text-shadow: 0 0 10px rgba(20, 241, 149, 0.5);
        }
      `}</style>
    </div>
  );
};
