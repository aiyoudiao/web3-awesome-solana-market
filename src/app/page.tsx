'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Tv, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Home() {
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ['trendingMarkets'],
    queryFn: api.getTrendingMarkets,
    retry: false
  });

  return (
    <div className="space-y-8">
      {/* 英雄区 */}
      <div className="relative rounded-2xl overflow-hidden glass p-8 border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <h1 className="text-5xl font-bold font-heading mb-4 relative z-10">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            预测. 观战. 赢取.
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-6 relative z-10">
          Solana 上首个娱乐向预测市场。观看实时电竞，即时交易结果，攀登排行榜。
        </p>
        <div className="flex gap-4 relative z-10">
           <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold">
             开始交易
           </Button>
           <Link href="/create">
             <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
               创建事件
             </Button>
           </Link>
        </div>
      </div>

      {/* 实时市场网格 */}
      <div>
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
             热门赛事
           </h2>
           <Link href="/markets" className="text-primary hover:underline">查看全部</Link>
        </div>

        {/* 加载状态 */}
        {isLoading && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                 <div key={i} className="glass rounded-xl h-64 animate-pulse bg-white/5"></div>
              ))}
           </div>
        )}

        {/* 错误状态 */}
        {error && (
           <div className="glass p-8 rounded-xl text-center text-red-400 border-red-500/30 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <p>加载市场失败。请检查后端是否运行。</p>
           </div>
        )}

        {/* 数据展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets?.map((market) => (
            <Link key={market.marketId} href={`/market/${market.marketId}`} className="group">
              <div className="glass rounded-xl p-0 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                 <div className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 relative p-4 flex items-center justify-between">
                    <img src={market.thumbnail} alt={market.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    <div className="relative z-10 w-full flex justify-between items-start">
                       <span className="bg-black/60 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-white border border-white/10 uppercase">
                          {market.category}
                       </span>
                       {market.category === 'sports' && (
                          <div className="text-xs text-red-500 font-bold bg-black/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> 直播中
                          </div>
                       )}
                    </div>
                 </div>
                 
                 <div className="p-4 space-y-4">
                    <h3 className="text-lg font-bold truncate pr-2" title={market.title}>{market.title}</h3>
                    
                    {/* 赔率条 */}
                    <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                       <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: `${market.odds.yes}%` }}></div>
                       <div className="absolute right-0 top-0 h-full bg-secondary" style={{ width: `${market.odds.no}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                       <span className="text-primary">是: {market.odds.yes}%</span>
                       <span className="text-secondary">否: {market.odds.no}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
                       <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" /> ${(market.volume / 1000).toFixed(1)}K 交易量
                       </span>
                       <span className="flex items-center gap-1">
                          <Tv className="w-3 h-3 text-purple-500" /> {market.participants} 人围观
                       </span>
                    </div>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
