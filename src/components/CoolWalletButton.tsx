'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';

export const CoolWalletButton = () => {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 更新下拉菜单位置
  const updatePosition = () => {
    if (buttonRef.current && showDropdown) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  };

  // 监听窗口大小变化和滚动
  useEffect(() => {
    if (showDropdown) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [showDropdown]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在按钮上
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        return;
      }
      // 检查点击是否在下拉菜单上
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setShowDropdown(false);
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleCopyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) return null;

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="relative px-6 py-2 rounded-full font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden shadow-[0_0_15px_rgba(153,69,255,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF] to-[#14F195] opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF] to-[#14F195] blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
        <span className="relative z-10 flex items-center gap-2">
           <Wallet size={18} />
           {connecting ? '连接中...' : '连接钱包'}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => {
          if (!showDropdown) updatePosition();
          setShowDropdown(!showDropdown);
        }}
        className="relative px-5 py-2 rounded-full font-bold text-white transition-all duration-300 transform hover:brightness-110 active:scale-95 group overflow-hidden border border-[#9945FF]/50 bg-[#1B1B1F]/80 backdrop-blur-md"
      >
        <span className="relative z-10 flex items-center gap-2">
           {wallet?.adapter.icon && <img 
             src={wallet.adapter.icon} 
             alt={wallet.adapter.name} 
             className="w-5 h-5 rounded-full"
           />}
           <span className="font-mono text-sm">
             {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
           </span>
           <ChevronDown size={16} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown Menu via Portal */}
      {showDropdown && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] w-56 bg-[#1B1B1F]/95 backdrop-blur-xl border border-[#9945FF]/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ top: coords.top, right: coords.right }}
        >
          <div className="p-3 border-b border-[#9945FF]/20">
             <div className="text-xs text-gray-400 mb-1">当前钱包</div>
             <div className="flex items-center gap-2 text-white font-bold">
               {wallet?.adapter.name}
             </div>
          </div>
          
          <div className="p-1">
            <button 
              onClick={() => { handleCopyAddress(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#9945FF]/20 rounded-lg transition-colors text-left"
            >
              {copied ? <Check size={16} className="text-[#14F195]" /> : <Copy size={16} />}
              {copied ? '已复制地址' : '复制地址'}
            </button>
            
            <a 
              href={`https://solscan.io/account/${publicKey?.toBase58()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#9945FF]/20 rounded-lg transition-colors text-left"
            >
              <ExternalLink size={16} />
              在 Solscan 查看
            </a>

            <div className="h-px bg-[#9945FF]/20 my-1" />

            <button 
              onClick={disconnect}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
            >
              <LogOut size={16} />
              断开连接
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
