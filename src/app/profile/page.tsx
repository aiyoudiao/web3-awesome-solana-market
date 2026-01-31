'use client';

import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2, ExternalLink, X, Coins, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useSoldoraProgram } from "@/hooks/useSoldoraProgram";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { clsx } from "clsx";

export default function Profile() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const queryClient = useQueryClient();
  const { events, fetchState, fetchUserPositions, loading: programLoading } = useSoldoraProgram();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [positions, setPositions] = useState<any[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const loadPositions = async () => {
        if (walletAddress && events.length > 0) {
            setLoadingPositions(true);
            const pos = await fetchUserPositions(walletAddress);
            setPositions(pos);
            setLoadingPositions(false);
        }
    };
    loadPositions();
  }, [walletAddress, events, fetchUserPositions]);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', walletAddress],
    queryFn: () => api.getUserProfile(walletAddress || ''),
    enabled: !!walletAddress
  });

  const { data: userEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['userEvents', walletAddress],
    queryFn: () => api.getUserEvents(walletAddress || ''),
    enabled: !!walletAddress
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username: string }) => api.updateUserProfile(walletAddress || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', walletAddress] });
      setIsEditing(false);
      toast.success("个人资料已更新");
    },
    onError: (error) => {
      toast.error("更新失败: " + error.message);
    }
  });

  const handleEditClick = () => {
    setNewUsername(profile?.username || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!newUsername.trim()) return;
    updateProfileMutation.mutate({ username: newUsername });
  };

  if (!walletAddress) {
      return (
          <div className="py-20 text-center">
              <h1 className="text-3xl font-bold mb-4">请连接钱包</h1>
              <p className="text-muted-foreground">连接你的 Solana 钱包以查看个人资料和下注历史。</p>
          </div>
      );
  }

  if (isProfileLoading || (programLoading && events.length === 0)) {
      return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 个人资料头部 */}
      <div className="flex items-center gap-6 p-6 border rounded-lg bg-card relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-9xl">{profile?.level || '青铜'}</div>
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-3xl font-bold text-white relative z-10">
           {profile?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 relative z-10">
          <h1 className="text-3xl font-bold font-heading mb-2">{profile?.username || '用户'}</h1>
          <div className="flex gap-4">
             <div className="text-sm">排名: <span className="font-bold text-yellow-500">{profile?.rank || '未排名'}</span></div>
             <div className="text-sm">积分: <span className="font-bold">{profile?.totalPoints || 0} RP</span></div>
             <div className="text-sm">等级: <span className="font-bold text-primary">{profile?.level || '青铜'}</span></div>
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-mono">{walletAddress}</div>
        </div>
        <Button variant="outline" className="relative z-10" onClick={handleEditClick}>编辑资料</Button>
      </div>

      {/* 编辑资料弹窗 */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4">编辑个人资料</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">用户名</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-secondary/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                  placeholder="输入新用户名"
                />
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
                <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  保存更改
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 持仓与历史 */}
      <div>
          <h2 className="text-2xl font-bold font-heading mb-4 flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              我的持仓与历史
              {loadingPositions && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h2>
          <div className="border rounded-lg bg-card overflow-hidden">
            {positions && positions.length > 0 ? (
            <table className="w-full">
               <thead className="bg-secondary/10">
                 <tr>
                   <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">市场</th>
                   <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">结果</th>
                   <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">持仓量</th>
                   <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">预估价值 (SOL)</th>
                   <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">状态</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {positions.map((pos, idx) => (
                 <tr key={idx} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-6 py-4">
                        <Link href={`/market/${pos.marketId}`} className="hover:text-primary flex items-center gap-2 group">
                            <span className="group-hover:underline truncate max-w-[200px]">{pos.marketTitle}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </td>
                    <td className="px-6 py-4">
                        <span className={pos.outcome === 'yes' ? "text-green-500 font-bold uppercase" : "text-red-500 font-bold uppercase"}>
                            {pos.outcome}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{pos.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono text-green-400">{(pos.amount).toFixed(4)}</td>
                    <td className="px-6 py-4 text-right text-xs">
                        <span className={clsx(
                            "px-2 py-1 rounded text-xs font-bold",
                            pos.status.active ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-400"
                        )}>
                            {pos.status.active ? '进行中' : '已结束'}
                        </span>
                    </td>
                 </tr>
                 ))}
               </tbody>
            </table>
            ) : (
                <div className="p-12 text-center text-muted-foreground">
                    <p>暂无持仓记录。开始交易以查看您的持仓！</p>
                    <Link href="/">
                        <Button className="mt-4" variant="secondary">浏览市场</Button>
                    </Link>
                </div>
            )}
          </div>
      </div>

      {/* 创建记录 */}
      <div>
          <h2 className="text-2xl font-bold font-heading mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              我创建的事件
              {isEventsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h2>
          <div className="border rounded-lg bg-card overflow-hidden">
            {userEvents && userEvents.length > 0 ? (
            <table className="w-full">
               <thead className="bg-secondary/10">
                 <tr>
                   <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">标题</th>
                   <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">创建时间</th>
                   <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">截止时间</th>
                   <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">状态</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {userEvents.map((ev: any, idx: number) => (
                 <tr key={idx} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-bold">{ev.title || "Untitled"}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{ev.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                        {ev.created_at ? format(new Date(ev.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                        {ev.end_time ? format(new Date(Number(ev.end_time)), 'yyyy-MM-dd HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                        <span className={clsx(
                            "px-2 py-1 rounded text-xs font-bold",
                            ev.status === 'approved' ? "bg-green-500/20 text-green-500" : 
                            ev.status === 'rejected' ? "bg-red-500/20 text-red-500" :
                            "bg-yellow-500/20 text-yellow-500"
                        )}>
                            {ev.status === 'approved' ? '已通过' : 
                             ev.status === 'rejected' ? '已拒绝' : '审核中'}
                        </span>
                    </td>
                 </tr>
                 ))}
               </tbody>
            </table>
            ) : (
                <div className="p-12 text-center text-muted-foreground">
                    <p>暂无创建记录。去创建一个属于你的预测市场吧！</p>
                    <Link href="/create">
                        <Button className="mt-4" variant="secondary">创建事件</Button>
                    </Link>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
