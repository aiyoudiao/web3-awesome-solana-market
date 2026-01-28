'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSoldora } from '@/hooks/useSoldora';
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

export default function Home() {
    const { program, connection } = useSoldora();
    const { publicKey } = useWallet();
    const [events, setEvents] = useState<any[]>([]);
    const [treasury, setTreasury] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isMainnet, setIsMainnet] = useState(false);

    // 表单状态
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        // 检查是否连接到 Mainnet
        const checkNetwork = async () => {
            if (!connection) return;
            try {
                const genesisHash = await connection.getGenesisHash();
                // Solana Mainnet Genesis Hash: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
                if (genesisHash === '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d') {
                    setIsMainnet(true);
                    alert("警告：检测到 Mainnet 环境！本应用仅用于测试，请切换到 Localnet 或 Devnet。");
                }
            } catch (e) {
                console.error("检查网络失败:", e);
            }
        };
        checkNetwork();
    }, [connection]);

    const fetchState = async () => {
        if (!program || isMainnet) return; // 如果是 Mainnet，停止获取状态
        try {
            // 获取 Treasury 账户
            const [treasuryPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("treasury")],
                program.programId
            );
            const treasuryAccount = await program.account.treasury.fetchNullable(treasuryPda);
            setTreasury(treasuryAccount);

            // 获取所有事件
            const eventsData = await program.account.event.all();
            // 按 uniqueId 降序排序
            eventsData.sort((a, b) => b.account.uniqueId.sub(a.account.uniqueId).toNumber());
            setEvents(eventsData);
        } catch (e) {
            console.error("获取状态出错:", e);
        }
    };

    const requestAirdrop = async () => {
        if (!connection || !publicKey) return;
        try {
            setLoading(true);
            const signature = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature, "confirmed");
            alert("空投成功！已获得 1 SOL");
        } catch (e) {
            console.error(e);
            alert("空投失败，请检查本地网络是否启动 (solana-test-validator)");
        } finally {
            setLoading(false);
        }
    };

    const handleError = (e: any, actionName: string) => {
        console.error(e);
        const msg = e.message || e.toString();
        if (msg.includes("Attempt to debit an account but found no record of a prior credit")) {
            alert(`${actionName}失败：账户余额不足或账户不存在。请先点击右上角的“空投 1 SOL”按钮获取测试币。`);
        } else {
            alert(`${actionName}出错: ` + msg);
        }
    };

    useEffect(() => {
        fetchState();
    }, [program]);

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

    const createEvent = async () => {
        if (!program || !publicKey) return;
        try {
            setLoading(true);
            const uniqueId = new BN(Date.now());
            const deadlineDate = new Date(deadline);
            const deadlineBn = new BN(Math.floor(deadlineDate.getTime() / 1000));
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

            await program.methods
                .createEvent(uniqueId, description, deadlineBn)
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
            setDescription('');
            setDeadline('');
        } catch (e) {
            handleError(e, "创建事件");
        } finally {
            setLoading(false);
        }
    };

    const placeBet = async (event: any, choice: boolean, amount: number) => {
         if (!program || !publicKey) return;
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
         } catch (e) {
             handleError(e, "下注");
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
            alert("兑换成功！");
        } catch (e) {
            handleError(e, "兑换");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {isMainnet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-600 bg-opacity-95 text-white text-center p-10">
                    <div>
                        <h1 className="text-4xl font-bold mb-4">⛔️ 严禁连接主网 (Mainnet)</h1>
                        <p className="text-xl">本应用仅用于测试目的，请切换您的钱包网络到 Localnet 或 Devnet。</p>
                        <p className="mt-4 text-sm opacity-80">检测到的 Genesis Hash: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d</p>
                    </div>
                </div>
            )}
            
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">Soldora 预测市场 <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Localnet 测试版</span></h1>
                    {publicKey && !isMainnet && (
                        <button 
                            onClick={requestAirdrop}
                            disabled={loading}
                            className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            空投 1 SOL
                        </button>
                    )}
                </div>
                <WalletMultiButton />
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Treasury 区域 */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Treasury (国库)</h2>
                    {treasury ? (
                        <div>
                            <p>状态: 已初始化</p>
                            <p>累计手续费: {(treasury.totalFees.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
                        </div>
                    ) : (
                        <button
                            onClick={initializeTreasury}
                            disabled={loading || !publicKey}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            初始化 Treasury
                        </button>
                    )}
                </section>

                {/* 创建事件区域 */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">创建新预测事件</h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="事件描述 (例如: 2026年比特币会达到10万刀吗?)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                        <button
                            onClick={createEvent}
                            disabled={loading || !publicKey || !description || !deadline}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            创建事件
                        </button>
                    </div>
                </section>

                {/* 事件列表区域 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">活跃事件</h2>
                    {events.map((ev) => (
                        <div key={ev.publicKey.toString()} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                            <div className="flex justify-between">
                                <h3 className="text-xl font-semibold">{ev.account.description}</h3>
                                <span className={`px-2 py-1 rounded text-sm ${ev.account.status.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {ev.account.status.active ? '进行中' : '已结束'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">截止时间: {new Date(ev.account.deadline.toNumber() * 1000).toLocaleString()}</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded text-center">
                                    <p className="font-bold text-lg text-green-600">YES (是)</p>
                                    <p className="text-sm">奖池: {(ev.account.yesSupply.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>
                                    {ev.account.status.active && (
                                        <button
                                            onClick={() => placeBet(ev, true, 1)}
                                            className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                            disabled={loading}
                                        >
                                            下注 1 SOL
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded text-center">
                                    <p className="font-bold text-lg text-red-600">NO (否)</p>
                                    <p className="text-sm">奖池: {(ev.account.noSupply.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>
                                    {ev.account.status.active && (
                                        <button
                                            onClick={() => placeBet(ev, false, 1)}
                                            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                            disabled={loading}
                                        >
                                            下注 1 SOL
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 管理员控制区域 */}
                            {publicKey && ev.account.authority.toString() === publicKey.toString() && ev.account.status.active && (
                                <div className="border-t pt-4 mt-4">
                                    <p className="text-sm font-semibold mb-2">管理员操作: 公布结果</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => resolveEvent(ev, true)} className="px-3 py-1 bg-green-500 text-white rounded text-sm">Yes 胜出</button>
                                        <button onClick={() => resolveEvent(ev, false)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">No 胜出</button>
                                    </div>
                                </div>
                            )}

                             {/* 兑换区域 */}
                             {ev.account.status.resolved && (
                                <div className="border-t pt-4 mt-4">
                                    <p className="text-sm font-semibold mb-2">最终结果: {ev.account.result ? 'YES' : 'NO'} 胜出</p>
                                    <button 
                                        onClick={() => redeem(ev, ev.account.result)} 
                                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                        disabled={loading}
                                    >
                                        领取奖金
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
