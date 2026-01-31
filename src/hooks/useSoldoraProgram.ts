import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Buffer } from "buffer";
import { toast } from "sonner";

import { useState } from 'react';
import { useSoldora } from '@/hooks/useSoldora';

import { useQuery } from "@tanstack/react-query";

export function useSoldoraProgram() {
  const { program, connection } = useSoldora();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  // 获取 Treasury 账户
  const { data: treasury = null, refetch: refetchTreasury } = useQuery({
    queryKey: ['program-treasury', program?.programId?.toString()],
    queryFn: async () => {
      if (!program) return null;
      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
      );
      return await program.account.treasury.fetchNullable(treasuryPda);
    },
    enabled: !!program,
    staleTime: 30000, // 30s cache
  });

  // 获取所有事件
  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['program-events', program?.programId?.toString()],
    queryFn: async () => {
      if (!program) return [];
      const eventsData = await program.account.event.all();
      // 按 uniqueId 降序排序
      eventsData.sort((a: any, b: any) => b.account.uniqueId.sub(a.account.uniqueId).toNumber());
      return eventsData;
    },
    enabled: !!program,
    staleTime: 10000, // 10s cache
  });

  const fetchState = useCallback(async () => {
    await Promise.all([refetchTreasury(), refetchEvents()]);
  }, [refetchTreasury, refetchEvents]);
  const requestAirdrop = async () => {
    if (!connection || !publicKey) return;
    try {
      setLoading(true);
      const signature = await connection.requestAirdrop(publicKey, 10 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, "confirmed");
      toast.success("空投成功！已获得 10 SOL");
    } catch (e) {
      console.error(e);
      toast.error("空投失败，请检查本地网络是否启动 (solana-test-validator)");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (title: string, description: string, deadline: number) => {
    if (!program || !publicKey) return { success: false };
    try {
      setLoading(true);
      const uniqueId = new BN(Date.now());
      const deadlineDate = new Date(deadline);
      const deadlineBn = new BN(Math.floor(deadlineDate.getTime()));
      console.log("deadlineBn:", deadlineBn.toNumber());
      const yesMint = Keypair.generate();
      const noMint = Keypair.generate();

      const [eventPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("event"), publicKey.toBuffer(), uniqueId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [prizePoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("prize_pool"), eventPda.toBuffer()],
        program.programId
      );

      const signature = await program.methods
        .createEvent(uniqueId, title, deadlineBn)
        .accounts({
          authority: publicKey,
          event: eventPda,
          prizePool: prizePoolPda,
          yesMint: yesMint.publicKey,
          noMint: noMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([yesMint, noMint])
        .rpc();

      await fetchState();
      return { success: true, signature };
    } catch (e) {
      handleError(e, "创建事件");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // 获取用户持仓
  const fetchUserPositions = useCallback(async (walletAddress: string) => {
    if (!connection || !events.length) return [];
    try {
      // 获取用户所有 SPL Token 账户
      const userPublicKey = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userPublicKey, {
        programId: TOKEN_PROGRAM_ID
      });

      const positions: any[] = [];
      const tokenMap = new Map<string, number>();

      // 构建 Token Map (Mint -> Balance)
      tokenAccounts.value.forEach((account) => {
        const info = account.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmount;
        if (amount > 0) {
            tokenMap.set(mint, amount);
        }
      });

      // 匹配事件
      events.forEach((ev) => {
          const yesMint = ev.account.yesMint.toString();
          const noMint = ev.account.noMint.toString();
          
          if (tokenMap.has(yesMint)) {
              positions.push({
                  marketId: ev.publicKey.toString(),
                  marketTitle: ev.account.description,
                  outcome: 'yes',
                  amount: tokenMap.get(yesMint),
                  value: tokenMap.get(yesMint), // 简单估值，实际可能不同
                  date: new Date().toISOString(), // 无法获取购买时间，暂用当前时间或不显示
                  status: ev.account.status
              });
          }

          if (tokenMap.has(noMint)) {
              positions.push({
                  marketId: ev.publicKey.toString(),
                  marketTitle: ev.account.description,
                  outcome: 'no',
                  amount: tokenMap.get(noMint),
                  value: tokenMap.get(noMint),
                  date: new Date().toISOString(),
                  status: ev.account.status
              });
          }
      });

      return positions;

    } catch (e) {
      console.error("获取用户持仓失败:", e);
      return [];
    }
  }, [connection, events]);

  const initializeTreasury = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
      );

      await program.methods
        .initializeTreasury()
        .accounts({
          authority: publicKey,
          treasury: treasuryPda,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      await fetchState();
    } catch (e) {
      handleError(e, "初始化 Treasury");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (e: any, actionName: string) => {
    console.error(e);
    const msg = e.message || e.toString();
    if (msg.includes("Attempt to debit an account but found no record of a prior credit")) {
      toast.error(`${actionName}失败：账户余额不足或账户不存在。请先点击右上角的“空投 1 SOL”按钮获取测试币。`);
    } else {
      toast.error(`${actionName}出错: ` + msg);
    }
  };

  const placeBet = async (event: any, choice: boolean, amount: number) => {
    if (!program || !publicKey) return false;
    try {
      setLoading(true);
      const betAmount = new BN(amount * LAMPORTS_PER_SOL);

      const yesMint = event.account.yesMint;
      const noMint = event.account.noMint;
      const eventPda = event.publicKey;
      const [prizePoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("prize_pool"), eventPda.toBuffer()],
        program.programId
      );
      const userYesAta = await getAssociatedTokenAddress(yesMint, publicKey);
      const userNoAta = await getAssociatedTokenAddress(noMint, publicKey);

      await program.methods
        .bet(betAmount, choice)
        .accounts({
          user: publicKey,
          event: eventPda,
          prizePool: prizePoolPda,
          yesMint: yesMint,
          noMint: noMint,
          userYesAta: userYesAta,
          userNoAta: userNoAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      await fetchState();
      return true;
    } catch (e) {
      handleError(e, "下注");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resolveEvent = async (event: any, result: boolean) => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      await program.methods
        .updateResult(result)
        .accounts({
          authority: publicKey,
          event: event.publicKey,
          yesMint: event.account.yesMint,
          noMint: event.account.noMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();
      await fetchState();
    } catch (e) {
      handleError(e, "公布结果");
    } finally {
      setLoading(false);
    }
  };

  const redeem = async (event: any, choice: boolean) => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);

      const yesMint = event.account.yesMint;
      const noMint = event.account.noMint;
      const winnerMint = choice ? yesMint : noMint;

      const eventPda = event.publicKey;
      const [prizePoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("prize_pool"), eventPda.toBuffer()],
        program.programId
      );
      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
      );
      const userTokenAccount = await getAssociatedTokenAddress(winnerMint, publicKey);

      await program.methods
        .redeem(choice)
        .accounts({
          user: publicKey,
          event: eventPda,
          prizePool: prizePoolPda,
          treasury: treasuryPda,
          yesMint: yesMint,
          noMint: noMint,
          winnerMint: winnerMint,
          userTokenAccount: userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      await fetchState();
      toast.success("兑换成功！");
    } catch (e) {
      handleError(e, "兑换");
    } finally {
      setLoading(false);
    }
  }
  const getParticipants = async (yesMint: PublicKey, noMint: PublicKey) => {
    if (!connection) return 0;
    try {
        // SPL Token Account size is 165 bytes.
        // Mint offset is 0.
        const configYes = {
            filters: [
                { dataSize: 165 },
                { memcmp: { offset: 0, bytes: yesMint.toBase58() } }
            ]
        };
        const yesAccounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, configYes);
        
        const configNo = {
            filters: [
                { dataSize: 165 },
                { memcmp: { offset: 0, bytes: noMint.toBase58() } }
            ]
        };
        const noAccounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, configNo);
        
        const owners = new Set<string>();
        yesAccounts.forEach(acc => {
            // Owner offset is 32
            const owner = new PublicKey(acc.account.data.slice(32, 64)).toBase58();
            owners.add(owner);
        });
        noAccounts.forEach(acc => {
            const owner = new PublicKey(acc.account.data.slice(32, 64)).toBase58();
            owners.add(owner);
        });
        
        return owners.size;
    } catch (e) {
        console.error("获取参与人数失败:", e);
        return 0;
    }
  };

  return {
    program,
    events,
    treasury,
    loading,
    fetchState,
    resolveEvent,
    createEvent,
    placeBet,
    initializeTreasury,
    redeem,
    requestAirdrop,
    fetchUserPositions,
    getParticipants
  };
}
