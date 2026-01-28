'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Tv, Search, Filter } from "lucide-react";
import { Buffer } from 'buffer';
import { useSoldoraProgram } from "@/hooks/useSoldoraProgram";
import { useEffect, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { clsx } from "clsx";

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}

export default function MarketsPage() {
  const { events, fetchState, getParticipants, loading: isLoading } = useSoldoraProgram();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [participantsMap, setParticipantsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const fetchAllParticipants = async () => {
        if (events.length === 0) return;
        const map: Record<string, number> = {};
        for (const ev of events) {
            const count = await getParticipants(ev.account.yesMint, ev.account.noMint);
            map[ev.publicKey.toString()] = count;
        }
        setParticipantsMap(map);
    };
    fetchAllParticipants();
  }, [events, getParticipants]);

  const markets = useMemo(() => {
    return events.map((event) => {
        const yesSupply = event.account.yesSupply.toNumber();
        const noSupply = event.account.noSupply.toNumber();
        const total = yesSupply + noSupply;
        
        let yesOdds = 50;
        let noOdds = 50;
        if (total > 0) {
            yesOdds = Math.round((yesSupply / total) * 100);
            noOdds = Math.round((noSupply / total) * 100);
        }

        return {
            marketId: event.publicKey.toString(),
            title: event.account.description,
            category: 'crypto', // Default
            volume: total, // In Lamports
            participants: participantsMap[event.publicKey.toString()] || 0,
            odds: { yes: yesOdds, no: noOdds },
            resolutionDate: new Date(event.account.deadline.toNumber() * 1000).toISOString(),
            thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=1000', // Random crypto image
            status: event.account.status
        };
    });
  }, [events, participantsMap]);

  const filteredMarkets = useMemo(() => {
    return markets.filter(market => {
        // 状态过滤
        if (filter === 'active' && !market.status.active) return false;
        if (filter === 'resolved' && !market.status.resolved) return false; // 假设 resolved 状态是这样判断，如果不是 active 就是 resolved? 参考 test.tsx 是 status.active

        // 搜索过滤
        if (searchQuery && !market.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });
  }, [markets, filter, searchQuery]);

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
               创建新事件
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
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors"
            />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button 
                onClick={() => setFilter('all')}
                className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    filter === 'all' ? "bg-primary text-primary-foreground" : "bg-white/5 hover:bg-white/10"
                )}
            >
                全部
            </button>
            <button 
                onClick={() => setFilter('active')}
                className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    filter === 'active' ? "bg-green-600 text-white" : "bg-white/5 hover:bg-white/10"
                )}
            >
                进行中
            </button>
            <button 
                onClick={() => setFilter('resolved')}
                className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    filter === 'resolved' ? "bg-gray-600 text-white" : "bg-white/5 hover:bg-white/10"
                )}
            >
                已结束
            </button>
        </div>
      </div>

      {/* 市场列表 */}
      <div>
        {/* 加载状态 */}
        {isLoading && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className="glass rounded-xl h-64 animate-pulse bg-white/5"></div>
              ))}
           </div>
        )}

        {/* 空状态 */}
        {!isLoading && filteredMarkets.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">暂无符合条件的赛事</p>
                {filter !== 'all' && (
                    <Button variant="link" onClick={() => setFilter('all')} className="mt-2">
                        清除筛选
                    </Button>
                )}
            </div>
        )}
        
        {/* 数据展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <Link key={market.marketId} href={`/market/${market.marketId}`} className="group">
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
    </div>
  );
}
