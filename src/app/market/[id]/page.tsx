'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Share2, TrendingUp, Loader2, Send } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect, useMemo } from "react";
import { clsx } from "clsx";
import { useSoldoraProgram } from "@/hooks/useSoldoraProgram";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function MarketDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { publicKey } = useWallet();
  const { events, fetchState, placeBet, getParticipants, loading: programLoading } = useSoldoraProgram();
  const [betAmount, setBetAmount] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [commentContent, setCommentContent] = useState("");
  const queryClient = useQueryClient();

  // Comments Query
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
      queryKey: ['comments', id],
      queryFn: () => api.getComments(id),
      enabled: !!id,
      refetchInterval: 5000 // Poll every 5 seconds for new comments
  });

  // Post Comment Mutation
  const postCommentMutation = useMutation({
      mutationFn: (content: string) => api.postComment(id, {
          userWallet: publicKey?.toBase58() || '',
          content
      }),
      onSuccess: () => {
          setCommentContent("");
          queryClient.invalidateQueries({ queryKey: ['comments', id] });
      },
      onError: (err) => {
          alert("发表评论失败: " + err.message);
      }
  });

  const handlePostComment = () => {
      if (!publicKey) return alert("请先连接钱包");
      if (!commentContent.trim()) return;
      postCommentMutation.mutate(commentContent);
  };

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const event = useMemo(() => {
    return events.find(e => e.publicKey.toString() === id);
  }, [events, id]);

  useEffect(() => {
      const fetchCount = async () => {
          if (event) {
              const count = await getParticipants(event.account.yesMint, event.account.noMint);
              setParticipantCount(count);
          }
      };
      fetchCount();
  }, [event, getParticipants]);

  const market = useMemo(() => {
      if (!event) return null;
      
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
          volume: total,
          participants: participantCount,
          odds: { yes: yesOdds, no: noOdds },
          resolutionDate: new Date(event.account.deadline.toNumber() * 1000).toISOString(),
          trendingScore: 0,
          thumbnail: `https://placeholdit.com/600x400/F7931A/ffffff?text=${encodeURIComponent(event.account.description)}`, // Random crypto image
          description: event.account.description,
          liveScore: undefined,
          status: event.account.status
      };
  }, [event, participantCount]);

  const handlePlaceBet = async () => {
    if (!publicKey) return alert("请先连接钱包");
    if (!selectedOutcome) return alert("请选择一个结果 (是/否)");
    if (!betAmount || parseFloat(betAmount) <= 0) return alert("请输入有效金额");
    if (!event) return alert("事件不存在");

    const success = await placeBet(event, selectedOutcome === 'yes', parseFloat(betAmount));
    if (success) {
        alert("下注成功！");
        // Post a system comment about the bet
        postCommentMutation.mutate(`刚刚下注了 ${betAmount} SOL 买 ${selectedOutcome === 'yes' ? '是' : '否'}`);
        setBetAmount("");
        setSelectedOutcome(null);
    }
  };

  if (programLoading && !market) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!market) return <div className="p-20 text-center text-red-500">加载市场失败或市场不存在 (请确保钱包已连接)</div>;

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
                     <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> {(market.volume / LAMPORTS_PER_SOL).toFixed(4)} SOL 奖池</span>
                     <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-500" /> +15% 交易量 (1小时)</span>
                  </div>
               </div>
               
               {/* 实时比分板 - 暂不支持 */}
               {/* {market.liveScore && (
               <div className="hidden md:block bg-black/50 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">实时比分</div>
                  <div className="text-3xl font-mono font-bold flex items-center gap-4">
                     <span className="text-primary">{market.liveScore.teamA} {market.liveScore.scoreA}</span>
                     <span className="text-sm text-muted-foreground">-</span>
                     <span className="text-secondary">{market.liveScore.scoreB} {market.liveScore.teamB}</span>
                  </div>
                  <div className="text-xs text-green-500 mt-1">{market.liveScore.time}</div>
               </div>
               )} */}
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
                    <div className="text-primary font-bold">{market.odds.yes}%</div>
                    <div className="text-xs text-muted-foreground">当前概率</div>
                 </button>

                 <button 
                    onClick={() => setSelectedOutcome('no')}
                    className={clsx(
                        "rounded-xl p-4 text-left transition-all relative overflow-hidden group border-2",
                        selectedOutcome === 'no' ? "bg-secondary/20 border-secondary" : "bg-secondary/5 border-secondary/30 hover:bg-secondary/10"
                    )}
                 >
                    {selectedOutcome === 'no' && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_#FF0055]"></div>}
                    <div className="font-bold text-2xl mb-1">否 (NO)</div>
                    <div className="text-secondary font-bold">{market.odds.no}%</div>
                    <div className="text-xs text-muted-foreground">当前概率</div>
                 </button>
              </div>

              {/* 订单表单 */}
              <div className="bg-black/20 rounded-lg p-4 space-y-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">订单类型</span>
                    <span className="font-bold">下注</span>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">金额 (SOL)</span>
                       <span className="text-muted-foreground">余额: {publicKey ? "已连接" : "未连接"}</span>
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={betAmount}
                         onChange={(e) => setBetAmount(e.target.value)}
                         className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 font-mono text-lg focus:outline-none focus:border-primary"
                         placeholder="0.0"
                       />
                       <Button className="w-24 font-bold" onClick={() => setBetAmount("1")}>1 SOL</Button>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">预估获得代币</span>
                       <span className="font-bold">
                           {betAmount 
                               ? parseFloat(betAmount).toFixed(2)
                               : "0.00"}
                       </span>
                    </div>
                 </div>

                 <Button 
                    onClick={handlePlaceBet}
                    disabled={programLoading || !publicKey}
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                 >
                    {programLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {!publicKey ? "连接钱包以下注" : "下注"}
                 </Button>
              </div>
           </div>
        </div>

        {/* 聊天 / 动态流 */}
        <div className="glass p-4 rounded-xl h-[600px] flex flex-col">
           <h3 className="font-bold mb-4 px-2 flex items-center justify-between">
               <span>实时讨论</span>
               <span className="text-xs text-muted-foreground bg-white/10 px-2 py-1 rounded-full">
                   {comments?.length || 0} 条消息
               </span>
           </h3>
           
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {isCommentsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : comments && comments.length > 0 ? (
                  [...comments].reverse().map((comment: any) => (
                 <div key={comment.id} className="flex gap-3 text-sm group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary border border-white/10">
                        {comment.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-baseline gap-2">
                          <span className="font-bold text-primary hover:underline cursor-pointer" title={comment.user_wallet}>
                              {comment.username}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                              {format(new Date(comment.created_at), 'HH:mm')}
                          </span>
                       </div>
                       <div className="text-gray-200 break-words mt-0.5 leading-relaxed">
                          {comment.content}
                       </div>
                    </div>
                 </div>
              ))) : (
                  <div className="text-center text-muted-foreground py-10 text-xs">
                      暂无评论，快来抢沙发！
                  </div>
              )}
           </div>

           <div className="mt-4 pt-4 border-t border-white/10 relative">
              <input 
                type="text" 
                placeholder={publicKey ? "发表你的观点..." : "连接钱包参与讨论"}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                disabled={!publicKey || postCommentMutation.isPending}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary transition-all disabled:opacity-50"
              />
              <button 
                  onClick={handlePostComment}
                  disabled={!publicKey || !commentContent.trim() || postCommentMutation.isPending}
                  className="absolute right-2 top-[22px] p-1.5 bg-primary text-black rounded-md hover:bg-primary/90 disabled:opacity-0 transition-all transform hover:scale-105"
              >
                  {postCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
