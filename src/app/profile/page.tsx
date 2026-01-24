'use client';

import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";

export default function Profile() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', walletAddress],
    queryFn: () => api.getUserProfile(walletAddress || ''),
    enabled: !!walletAddress
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username: string }) => api.updateUserProfile(walletAddress || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', walletAddress] });
      setIsEditing(false);
    },
    onError: (error) => {
      alert("更新失败: " + error.message);
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

  const { data: bets, isLoading: isBetsLoading } = useQuery({
    queryKey: ['userBets', walletAddress],
    queryFn: () => api.getUserBets(walletAddress || ''),
    enabled: !!walletAddress
  });

  if (!walletAddress) {
      return (
          <div className="py-20 text-center">
              <h1 className="text-3xl font-bold mb-4">请连接钱包</h1>
              <p className="text-muted-foreground">连接你的 Solana 钱包以查看个人资料和下注历史。</p>
          </div>
      );
  }

  if (isProfileLoading || isBetsLoading) {
      return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 个人资料头部 */}
      <div className="flex items-center gap-6 mb-8 p-6 border rounded-lg bg-card relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-9xl">{profile?.level || '青铜'}</div>
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-3xl font-bold text-white relative z-10">
           {profile?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 relative z-10">
          <h1 className="text-3xl font-bold font-heading mb-2">{profile?.username || '未知用户'}</h1>
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
      <h2 className="text-2xl font-bold font-heading mb-4">我的持仓与历史</h2>
      <div className="border rounded-lg bg-card overflow-hidden">
        {bets && bets.length > 0 ? (
        <table className="w-full">
           <thead className="bg-secondary/10">
             <tr>
               <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">市场</th>
               <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">结果</th>
               <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">金额</th>
               <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">预估价值</th>
               <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">日期</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
             {bets.map((bet) => (
             <tr key={bet.id} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4">
                    <Link href={`/market/${bet.marketId}`} className="hover:text-primary flex items-center gap-2 group">
                        {bet.marketImage && <img src={bet.marketImage} className="w-8 h-8 rounded object-cover" />}
                        <span className="group-hover:underline truncate max-w-[200px]">{bet.marketTitle}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </td>
                <td className="px-6 py-4">
                    <span className={bet.outcome === 'yes' ? "text-green-500 font-bold uppercase" : "text-red-500 font-bold uppercase"}>
                        {bet.outcome}
                    </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">{bet.amount} SOL</td>
                <td className="px-6 py-4 text-right font-mono text-green-400">${bet.value.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                    {format(new Date(bet.date), 'MMM d, yyyy')}
                </td>
             </tr>
             ))}
           </tbody>
        </table>
        ) : (
            <div className="p-12 text-center text-muted-foreground">
                <p>暂无下注记录。开始交易以查看您的持仓！</p>
                <Link href="/">
                    <Button className="mt-4" variant="secondary">浏览市场</Button>
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}
