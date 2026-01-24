import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Html, Float } from '@react-three/drei';
import { MarketArtifact } from './MarketArtifact';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * 3D 市场详情页组件
 * @description
 * 沉浸式的市场详情查看和下注交互。
 */
export const MarketDetail3D = () => {
  const params = useParams();
  const id = params?.id as string;
  const { publicKey } = useWallet();
  const [betAmount, setBetAmount] = useState<number>(0);
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);

  const groupRef = useRef<Group>(null);

  // 缓慢旋转整个详情展示组
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  // 获取市场详情数据
  const { data: market, isLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => api.getMarketDetail(id),
    enabled: !!id
  });

  // 下注 Mutation
  const placeBetMutation = useMutation({
    mutationFn: api.placeBet,
    onSuccess: (data) => {
      alert(`下注成功！交易哈希: ${data.txId}`);
      setBetAmount(0);
      setSelectedSide(null);
    },
    onError: (err) => {
      alert("下注失败: " + err);
    }
  });

  if (isLoading || !market) {
    return (
      <Html center>
        <div className="text-white text-xl font-bold bg-white/10 p-4 rounded backdrop-blur-md animate-pulse">
          {isLoading ? '正在加载数据...' : '未找到市场数据'}
        </div>
      </Html>
    );
  }

  const yesOdds = market.odds.yes;
  const noOdds = market.odds.no;
  const isExpired = new Date(market.resolutionDate).getTime() < Date.now();
  
  // 模拟 active 状态 (API 暂无 status)
  const isActive = !isExpired; 

  const handleBet = () => {
    if (!publicKey) return alert("请先连接钱包");
    if (!selectedSide || betAmount <= 0) return;

    placeBetMutation.mutate({
      marketId: id,
      outcome: selectedSide,
      amount: betAmount,
      walletAddress: publicKey.toBase58()
    });
  };

  const handleClaim = () => {
      alert("功能开发中...");
  };

  return (
    <group ref={groupRef}>
      {/* 中央核心展示 */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <MarketArtifact 
          market={market} 
          position={[0, 0, 0]} 
          onSelect={() => {}} // 详情页不需要点击跳转
        />
      </Float>

      {/* 左侧信息面板 */}
      <Html position={[-4, 1, 0]} transform distanceFactor={5} style={{ pointerEvents: 'none' }}>
        <div className="w-[400px] bg-[#1B1B1F]/80 backdrop-blur-xl border border-[#9945FF]/50 p-6 rounded-lg text-white shadow-[0_0_30px_rgba(153,69,255,0.2)]">
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
            {market.title}
          </h1>
          <p className="text-slate-300 mb-6 text-lg leading-relaxed line-clamp-4">
            {market.description}
          </p>
          <div className="grid grid-flow-col justify-start items-center gap-4 text-sm text-slate-400 border-t border-slate-700 pt-4">
            <div className="grid gap-0">
              <span className="text-xs uppercase tracking-wider text-slate-500">截止时间</span>
              <span className="font-mono text-[#14F195]">
                {formatDistanceToNow(new Date(market.resolutionDate), { addSuffix: true, locale: zhCN })}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="grid gap-0">
              <span className="text-xs uppercase tracking-wider text-slate-500">状态</span>
              <span className={`font-bold ${isActive ? 'text-[#14F195]' : 'text-slate-400'}`}>
                {isActive ? '进行中' : '已结束'}
              </span>
            </div>
          </div>
        </div>
      </Html>

      {/* 右侧数据面板 */}
      <Html position={[4, 1, 0]} transform distanceFactor={5} style={{ pointerEvents: 'none' }}>
        <div className="w-[300px] bg-[#1B1B1F]/80 backdrop-blur-xl border border-[#9945FF]/50 p-6 rounded-lg text-white shadow-[0_0_30px_rgba(153,69,255,0.2)]">
          <h3 className="text-xl font-bold mb-4 border-b border-[#9945FF]/30 pb-2">市场数据</h3>
          
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-[1fr_auto] mb-2">
                <span className="text-[#14F195] font-bold">是 (YES)</span>
                <span className="font-mono">{yesOdds}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#14F195]" style={{ width: `${yesOdds}%` }} />
              </div>
            </div>

            <div>
              <div className="grid grid-cols-[1fr_auto] mb-2">
                <span className="text-red-400 font-bold">否 (NO)</span>
                <span className="font-mono">{noOdds}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${noOdds}%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <div className="grid grid-cols-[1fr_auto] items-center">
                <span className="text-slate-400">交易量</span>
                <span className="text-xl font-mono font-bold text-yellow-400">
                  ${market.volume.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Html>

      {/* 底部控制台 - 仅在 Active 状态显示 */}
      {isActive && (
        <Html position={[0, -3, 2]} transform distanceFactor={4} rotation={[-0.5, 0, 0]}>
          <div className="w-[500px] bg-[#1B1B1F]/90 backdrop-blur-xl border-2 border-[#14F195]/50 p-6 rounded-xl text-white shadow-[0_0_50px_rgba(20,241,149,0.3)]">
            <h3 className="text-lg font-bold mb-4 text-[#14F195] uppercase tracking-widest text-center">
              操作控制台
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedSide('yes')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 font-bold text-xl ${
                  selectedSide === 'yes'
                    ? 'bg-[#14F195]/20 border-[#14F195] text-[#14F195] shadow-[0_0_20px_rgba(20,241,149,0.3)]'
                    : 'bg-[#2B2B30]/50 border-slate-700 text-slate-400 hover:border-[#14F195]/50'
                }`}
              >
                是 (YES)
              </button>
              <button
                onClick={() => setSelectedSide('no')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 font-bold text-xl ${
                  selectedSide === 'no'
                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-[#2B2B30]/50 border-slate-700 text-slate-400 hover:border-red-500/50'
                }`}
              >
                否
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4 mb-6">
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  value={betAmount || ''}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  placeholder="输入金额..."
                  className="w-full bg-[#2B2B30]/80 border border-slate-600 rounded-lg py-3 pl-8 pr-4 text-white focus:border-[#14F195] focus:ring-1 focus:ring-[#14F195] outline-none font-mono text-lg"
                />
              </div>
              <button
                onClick={handleBet}
                disabled={!selectedSide || betAmount <= 0 || placeBetMutation.isPending}
                className="px-8 py-3 bg-gradient-to-r from-[#9945FF] to-[#7C3AED] rounded-lg font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#8B5CF6] hover:to-[#6D28D9] transition-all active:scale-95 flex items-center gap-2"
              >
                {placeBetMutation.isPending ? '提交中...' : '确认下注'}
              </button>
            </div>
          </div>
        </Html>
      )}

      {/* 结果展示 - 仅在 Resolved 状态显示 */}
      {!isActive && (
        <Html position={[0, -2, 2]} transform distanceFactor={4}>
          <div className="bg-[#1B1B1F]/90 backdrop-blur-xl border-2 border-yellow-500/50 p-6 rounded-xl text-white text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
            <h3 className="text-2xl font-bold mb-2 text-yellow-400">市场已结束</h3>
            <p className="text-lg mb-4">等待结算中...</p>
            
            <button
                onClick={handleClaim}
                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-white transition-colors shadow-[0_0_20px_rgba(234,179,8,0.4)]"
              >
                查看结果
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};
