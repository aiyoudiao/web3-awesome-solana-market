'use client';

import { Trophy, Medal, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { clsx } from "clsx";

export default function Leaderboard() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: api.getLeaderboard
  });

  if (isLoading) {
      return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Trophy className="w-10 h-10 text-yellow-500" />
        <h1 className="text-4xl font-bold font-heading">全球排行榜</h1>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">排名</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-muted-foreground">用户</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">等级</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">积分 (RP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users?.map((user) => (
              <tr key={user.walletAddress} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4 font-bold">
                    {user.rank === 1 && <Medal className="w-5 h-5 text-yellow-500 inline mr-2" />}
                    {user.rank === 2 && <Medal className="w-5 h-5 text-gray-400 inline mr-2" />}
                    {user.rank === 3 && <Medal className="w-5 h-5 text-amber-700 inline mr-2" />}
                    #{user.rank}
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                   <div className={clsx(
                       "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                       user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" : "bg-primary/20 text-primary"
                   )}>
                     {user.username.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                       <span className="font-bold">{user.username}</span>
                       <span className="text-xs text-muted-foreground font-mono">{user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <span className={clsx(
                        "text-xs px-2 py-1 rounded border",
                        user.level === '黄金' || user.level === 'Gold' ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10" :
                        user.level === '白银' || user.level === 'Silver' ? "border-gray-400/50 text-gray-400 bg-gray-400/10" :
                        "border-orange-700/50 text-orange-700 bg-orange-700/10"
                    )}>
                        {user.level}
                    </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-primary font-mono">
                    {user.totalPoints.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
