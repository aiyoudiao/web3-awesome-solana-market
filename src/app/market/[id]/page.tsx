'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Share2, TrendingUp, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { clsx } from "clsx";

export default function MarketDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { publicKey } = useWallet();
  const [betAmount, setBetAmount] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);

  const { data: market, isLoading, error } = useQuery({
    queryKey: ['market', id],
    queryFn: () => api.getMarketDetail(id || ''),
    enabled: !!id
  });

  const placeBetMutation = useMutation({
    mutationFn: api.placeBet,
    onSuccess: (data) => {
      alert(`下注成功！交易哈希: ${data.txId}`);
      setBetAmount("");
      setSelectedOutcome(null);
    },
    onError: (err) => {
      alert("下注失败: " + err);
    }
  });

  const handlePlaceBet = () => {
    if (!publicKey) return alert("请先连接钱包");
    if (!selectedOutcome) return alert("请选择一个结果 (是/否)");
    if (!betAmount || parseFloat(betAmount) <= 0) return alert("请输入有效金额");

    placeBetMutation.mutate({
      marketId: id || '',
      outcome: selectedOutcome,
      amount: parseFloat(betAmount),
      walletAddress: publicKey.toBase58()
    });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (error || !market) return <div className="p-20 text-center text-red-500">加载市场失败</div>;

  const yesPrice = market.odds.yes / 100;
  const noPrice = market.odds.no / 100;

  return (
    <div className="space-y-6">
      {/* 游戏 Banner 头部 */}
      <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[32/9] bg-slate-900 border border-white/10 group">
         <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${market.thumbnail})` }}></div>
         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
         
         <div className="absolute bottom-0 left-0 p-8 w-full">
            <div className="flex justify-between items-end">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">进行中</span>
                     <span className="text-muted-foreground text-sm uppercase">{market.category}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black italic mb-2">{market.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                     <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> ${market.volume.toLocaleString()} 交易量</span>
                     <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-500" /> +15% 交易量 (1小时)</span>
                  </div>
               </div>
               
               {/* 实时比分板 */}
               {market.liveScore && (
               <div className="hidden md:block bg-black/50 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">实时比分</div>
                  <div className="text-3xl font-mono font-bold flex items-center gap-4">
                     <span className="text-primary">{market.liveScore.scoreA}</span>
                     <span className="text-sm text-muted-foreground">-</span>
                     <span className="text-secondary">{market.liveScore.scoreB}</span>
                  </div>
                  <div className="text-xs text-green-500 mt-1">{market.liveScore.time}</div>
               </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 交易界面 */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass p-6 rounded-xl space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold">预测结果</h2>
                 <Link href={`/challenge?id=${id}&title=${encodeURIComponent(market.title || '')}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                       <Share2 className="w-4 h-4" /> 挑战好友
                    </Button>
                 </Link>
              </div>

              {/* 结果选择 */}
              <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => setSelectedOutcome('yes')}
                    className={clsx(
                        "rounded-xl p-4 text-left transition-all relative overflow-hidden group border-2",
                        selectedOutcome === 'yes' ? "bg-primary/20 border-primary" : "bg-primary/5 border-primary/30 hover:bg-primary/10"
                    )}
                 >
                    {selectedOutcome === 'yes' && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_#00D4FF]"></div>}
                    <div className="font-bold text-2xl mb-1">是 (YES)</div>
                    <div className="text-primary font-bold">{market.odds.yes}¢</div>
                    <div className="text-xs text-muted-foreground">回报: ${(1/yesPrice).toFixed(2)}x</div>
                 </button>

                 <button 
                    onClick={() => setSelectedOutcome('no')}
                    className={clsx(
                        "rounded-xl p-4 text-left transition-all relative overflow-hidden group border-2",
                        selectedOutcome === 'no' ? "bg-secondary/20 border-secondary" : "bg-secondary/5 border-secondary/30 hover:bg-secondary/10"
                    )}
                 >
                    {selectedOutcome === 'no' && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_#FF0055]"></div>}
                    <div className="font-bold text-2xl mb-1">否</div>
                    <div className="text-secondary font-bold">{market.odds.no}¢</div>
                    <div className="text-xs text-muted-foreground">回报: ${(1/noPrice).toFixed(2)}倍</div>
                 </button>
              </div>

              {/* 订单表单 */}
              <div className="bg-black/20 rounded-lg p-4 space-y-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">订单类型</span>
                    <span className="font-bold">市价买入</span>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">金额 (SOL)</span>
                       <span className="text-muted-foreground">余额: {publicKey ? "12.5 SOL" : "--"}</span>
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={betAmount}
                         onChange={(e) => setBetAmount(e.target.value)}
                         className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 font-mono text-lg focus:outline-none focus:border-primary"
                         placeholder="0.0"
                       />
                       <Button className="w-24 font-bold" onClick={() => setBetAmount("1")}>最大</Button>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">预估份额</span>
                       <span className="font-bold">
                           {betAmount && selectedOutcome 
                               ? (parseFloat(betAmount) / (selectedOutcome === 'yes' ? yesPrice : noPrice)).toFixed(2) 
                               : "0.00"}
                       </span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">潜在回报</span>
                       <span className="font-bold text-green-500">
                           {betAmount && selectedOutcome 
                               ? `$${(parseFloat(betAmount) / (selectedOutcome === 'yes' ? yesPrice : noPrice)).toFixed(2)}`
                               : "$0.00"} 
                       </span>
                    </div>
                 </div>

                 <Button 
                    onClick={handlePlaceBet}
                    disabled={placeBetMutation.isPending || !publicKey}
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                 >
                    {placeBetMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                    {!publicKey ? "连接钱包以下注" : "下注"}
                 </Button>
              </div>
           </div>
        </div>

        {/* 聊天 / 动态流 */}
        <div className="glass p-4 rounded-xl h-[600px] flex flex-col">
           <h3 className="font-bold mb-4 px-2">实时动态</h3>
           <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {[1,2,3,4,5,6,7,8].map(i => (
                 <div key={i} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0"></div>
                    <div>
                       <div className="flex items-baseline gap-2">
                          <span className="font-bold text-primary">用户_{900+i}</span>
                          <span className="text-xs text-muted-foreground">刚刚买入</span>
                       </div>
                       <div>
                          <span className="font-bold text-white">T1 是</span> 花费 <span className="text-yellow-500 font-mono">5 SOL</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
           <div className="mt-4 pt-4 border-t border-white/10">
              <input 
                type="text" 
                placeholder="说点什么..." 
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
           </div>
        </div>
      </div>
    </div>
  );
}
