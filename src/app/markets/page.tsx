'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Tv, Search, Filter } from "lucide-react";
import { Buffer } from 'buffer';
import { useMarketListViewModel } from "@/hooks/view-models/useMarketListViewModel";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { clsx } from "clsx";

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}

export default function MarketsPage() {
  const { 
    markets, 
    isLoading, 
    filter, 
    setFilter, 
    searchQuery, 
    setSearchQuery 
  } = useMarketListViewModel();

  return (
    <div className="container py-8 space-y-8">
      {/* 头部区域 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-4xl font-bold font-heading mb-2">全部赛事</h1>
            <p className="text-muted-foreground">探索并参与最热门的预测市场</p>
        </div>
        <Link href="/create">
             <Button size="lg" className="font-bold">
               创建事件
             </Button>
        </Link>
      </div>

      {/* 筛选和搜索栏 */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
                type="text" 
                placeholder="搜索赛事..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground"
            />
        </div>
        
        <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex bg-black/20 rounded-lg p-1">
                <button 
                    onClick={() => setFilter('all')}
                    className={clsx(
                        "px-3 py-1 text-sm rounded-md transition-all",
                        filter === 'all' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    全部
                </button>
                <button 
                    onClick={() => setFilter('active')}
                    className={clsx(
                        "px-3 py-1 text-sm rounded-md transition-all",
                        filter === 'active' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    进行中
                </button>
                <button 
                    onClick={() => setFilter('resolved')}
                    className={clsx(
                        "px-3 py-1 text-sm rounded-md transition-all",
                        filter === 'resolved' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    已结束
                </button>
            </div>
        </div>
      </div>

      {/* 市场列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market) => (
          <Link href={`/market/${market.marketId}`} key={market.marketId}>
              <div className="glass rounded-xl p-0 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] h-full flex flex-col">
                 <div className="h-48 bg-gradient-to-br from-slate-900 to-slate-800 relative p-4 flex items-center justify-between">
                    <img src={market.thumbnail} alt={market.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    <div className="relative z-10 w-full flex justify-between items-start">
                       <span className="bg-black/60 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-white border border-white/10 uppercase">
                          {market.category}
                       </span>
                       <div className={clsx(
                           "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                           market.status.active ? "bg-green-500/80 text-white" : "bg-gray-500/80 text-white"
                       )}>
                          {market.status.active ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> 进行中
                              </>
                          ) : "已结束"}
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold line-clamp-2 mb-2" title={market.title}>{market.title}</h3>
                        <p className="text-xs text-muted-foreground mb-4">截止时间: {new Date(market.resolutionDate).toLocaleString()}</p>
                        
                        {/* 赔率条 */}
                        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                           <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: `${market.odds.yes}%` }}></div>
                           <div className="absolute right-0 top-0 h-full bg-secondary" style={{ width: `${market.odds.no}%` }}></div>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                           <span className="text-primary">是: {market.odds.yes}%</span>
                           <span className="text-secondary">否: {market.odds.no}%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5 mt-auto">
                       <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" /> {(market.volume / LAMPORTS_PER_SOL).toFixed(4)} SOL 奖池
                       </span>
                       <span className="flex items-center gap-1">
                          <Tv className="w-3 h-3 text-purple-500" /> {market.participants} 人参与
                       </span>
                    </div>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
  );
}
