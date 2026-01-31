
'use client';

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useSoldoraProgram } from "@/hooks/useSoldoraProgram";
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}

const ADMIN_WALLET = "8R7TCzkhdURCAWdwEiqbZAFVnRNkXVCG4XVgHjLGhUNH";

export default function AdminPage() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const queryClient = useQueryClient();
  const { createEvent } = useSoldoraProgram();
  const { confirm } = useConfirm();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingEvents, isLoading } = useQuery({
    queryKey: ['adminEvents', 'pending'],
    queryFn: () => api.getAdminEvents('pending'),
    enabled: !!walletAddress && walletAddress === ADMIN_WALLET
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: string, txSignature?: string }) => 
      api.updateEventStatus(data.id, data.status, data.txSignature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      setProcessingId(null);
    },
    onError: (err) => {
      toast.error("更新状态失败: " + err.message);
      setProcessingId(null);
    }
  });

  const handleApprove = async (event: any) => {
    if (!await confirm({
      title: "确认通过",
      description: `确定要通过 "${event.title}" 吗？这将调用合约上链。`,
      confirmText: "通过并上链"
    })) return;
    
    setProcessingId(event.id || event.marketId);

    try {
      // 1. Call Smart Contract
      console.log("Creating event on chain...", event);
      // Ensure description is a string and not empty (Anchor might dislike empty strings too, or just to be safe)
      const description = event.description || "No description provided";
      // Convert milliseconds to seconds for on-chain program
      const endTime = Math.floor(Number(event.end_time || event.endTime) / 1000);
      
      if (isNaN(endTime)) {
        throw new Error("Event end time is invalid");
      }

      const result = await createEvent(
        event.title || "Untitled",
        description, 
        endTime
      );
      
      console.log("On-chain creation success:", result);

      if (!result.success) {
          throw new Error("On-chain transaction failed");
      }

      // 2. Update DB
      updateStatusMutation.mutate({
        id: event.id || event.marketId,
        status: 'approved',
        txSignature: result.signature
      });

    } catch (error: any) {
      console.error("Approval failed:", error);
      toast.error("上链失败: " + error.message);
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!await confirm({
      title: "确认拒绝",
      description: "确定要拒绝该事件吗？",
      variant: "destructive",
      confirmText: "拒绝"
    })) return;
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-yellow-500" />
        <h1 className="text-2xl font-bold">请连接钱包</h1>
      </div>
    );
  }

  if (walletAddress !== ADMIN_WALLET) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">无权访问</h1>
        <p className="text-muted-foreground">此页面仅限管理员访问。</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-heading">管理员控制台</h1>
        <div className="text-sm text-muted-foreground font-mono bg-secondary/20 px-4 py-2 rounded">
          Admin: {ADMIN_WALLET.slice(0, 6)}...{ADMIN_WALLET.slice(-4)}
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-6 border-b bg-secondary/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            待审核事件 ({pendingEvents?.length || 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pendingEvents && pendingEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10 text-sm font-bold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 text-left">标题/描述</th>
                  <th className="px-6 py-4 text-left">创建者</th>
                  <th className="px-6 py-4 text-left">截止时间</th>
                  <th className="px-6 py-4 text-left">创建时间</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingEvents.map((event: any) => (
                  <tr key={event.id || event.marketId} className="hover:bg-secondary/5">
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-bold mb-1">{event.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {event.creator_wallet}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {event.end_time ? format(new Date(Number(event.end_time)), 'yyyy-MM-dd HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {event.created_at ? format(new Date(event.created_at), 'MM-dd HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(event.id || event.marketId)}
                          disabled={processingId === (event.id || event.marketId)}
                        >
                          拒绝
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(event)}
                          disabled={processingId === (event.id || event.marketId)}
                        >
                          {processingId === (event.id || event.marketId) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              通过并上链
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-muted-foreground">
            没有待审核的事件
          </div>
        )}
      </div>
    </div>
  );
}
