'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Html, Float, Grid } from '@react-three/drei';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Dices } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { Tooltip } from '@/components/ui/Tooltip';

/**
 * 3D 创建市场页面组件
 * @description
 * 赛博朋克风格的“造物台”。
 * 用户在这里通过全息控制台创建新的预测市场。
 * 配色遵循 2D 黑暗模式 (Solana Purple & Green)。
 */
export const CreateMarket3D = () => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    endTime: '',
  });

  const groupRef = useRef<Group>(null);
  const ringsRef = useRef<Group>(null);

  // 装饰环动画
  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z += 0.005;
      ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // 创建市场的 Mutation
  const createMarketMutation = useMutation({
    mutationFn: api.generateChallenge,
    onSuccess: (data) => {
      alert(`市场创建成功！ID: ${data.id}`);
      router.push('/');
    },
    onError: (err) => {
      alert("创建失败: " + err);
    }
  });

  const handleRandomFill = () => {
    // 移除了 VITE_ENABLE_RANDOM_FILL 检查，或确保它在 NEXT_PUBLIC 中定义
    const randomTitles = [
      "2024年比特币会突破10万美元吗？",
      "2025年人类会登陆火星吗？",
      "以太坊会在2024年底完成分片升级吗？",
      "Solana TPS 会在下个月突破10万吗？",
      "下一场世界杯冠军会是巴西吗？"
    ];
    const randomDescriptions = [
      "只要在指定日期前价格触及该点位即视为达成。",
      "基于官方新闻发布为准。",
      "需要主网正式上线。",
      "以Solana官方浏览器数据为准。",
      "FIFA官方结果为准。"
    ];

    const randomIndex = Math.floor(Math.random() * randomTitles.length);
    const now = new Date();
    // 随机设置截止时间为 1 到 30 天后
    const randomDays = Math.floor(Math.random() * 30) + 1;
    now.setDate(now.getDate() + randomDays);
    
    // 格式化为 datetime-local 输入框支持的格式: YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

    setFormData({
      title: randomTitles[randomIndex],
      description: randomDescriptions[randomIndex] || randomDescriptions[0],
      endTime: formattedDate,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      alert('请先连接钱包');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('标题和描述不能为空');
      return;
    }

    const endTime = new Date(formData.endTime).getTime();
    if (isNaN(endTime) || endTime <= Date.now()) {
      alert('截止时间必须大于当前时间');
      return;
    }

    createMarketMutation.mutate({
      type: 'market',
      title: formData.title,
      description: formData.description,
      creatorWallet: publicKey.toBase58(),
    });
  };

  return (
    <group ref={groupRef}>
      {/* 背景装饰环 - 使用 Solana 品牌色 */}
      <group ref={ringsRef} position={[0, 0, -5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[8, 0.1, 16, 100]} />
          <meshStandardMaterial color="#9945FF" emissive="#9945FF" emissiveIntensity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[12, 0.05, 16, 100]} />
          <meshStandardMaterial color="#14F195" emissive="#14F195" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* 底部网格平台 */}
      <Grid 
        position={[0, -4, 0]}
        args={[20, 20]} 
        cellSize={0.5} 
        cellThickness={0.5} 
        cellColor="#9945FF" 
        sectionSize={2} 
        sectionThickness={1} 
        sectionColor="#14F195" 
        fadeDistance={15} 
      />

      {/* 标题浮动文字 */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2} position={[0, 3.5, 0]}>
        <Html center transform>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#9945FF] tracking-widest uppercase" style={{ textShadow: '0 0 20px rgba(153,69,255,0.5)' }}>
            创建预测协议
          </div>
        </Html>
      </Float>

      {/* 全息表单控制台 */}
      <Html position={[0, 0, 0]} transform distanceFactor={3}>
        <div className="w-[600px] bg-[#1B1B1F]/90 backdrop-blur-xl border border-[#9945FF]/30 p-8 rounded-xl shadow-[0_0_50px_rgba(153,69,255,0.2)] relative overflow-hidden">
          {/* 扫描线动画 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9945FF]/5 to-transparent h-[20%] w-full animate-scan pointer-events-none" />
          
          {/* 随机填充按钮 */}
          <div className="absolute top-6 right-6 z-30">
            <Tooltip content="随机生成测试数据" position="left">
              <button
                type="button"
                onClick={handleRandomFill}
                className="p-2 bg-[#9945FF]/20 text-[#9945FF] rounded-lg hover:bg-[#9945FF]/30 border border-[#9945FF]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Dices size={20} />
              </button>
            </Tooltip>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-[#9945FF] text-sm font-bold mb-2 uppercase tracking-wider">
                预测事件标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#2B2B30]/80 border border-[#4B5563] rounded-lg p-3 text-white focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF] outline-none transition-all"
                placeholder="例如：2024年比特币会突破10万美元吗？"
              />
            </div>

            <div>
              <label className="block text-[#14F195] text-sm font-bold mb-2 uppercase tracking-wider">
                详细描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#2B2B30]/80 border border-[#4B5563] rounded-lg p-3 text-white focus:border-[#14F195] focus:ring-1 focus:ring-[#14F195] outline-none transition-all h-32 resize-none"
                placeholder="描述具体的判定标准..."
              />
            </div>

            <div>
              <label className="block text-[#D1D5DB] text-sm font-bold mb-2 uppercase tracking-wider">
                截止时间
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-[#2B2B30]/80 border border-[#4B5563] rounded-lg p-3 text-white focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF] outline-none transition-all [color-scheme:dark]"
              />
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-[#4B5563] rounded-lg text-[#9CA3AF] hover:bg-[#2B2B30] hover:text-white transition-all font-bold"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createMarketMutation.isPending}
                className="px-6 py-3 bg-gradient-to-r from-[#9945FF] to-[#7C3AED] rounded-lg text-white font-bold shadow-lg hover:from-[#8B5CF6] hover:to-[#6D28D9] transition-all active:scale-95 shadow-[0_0_20px_rgba(153,69,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {createMarketMutation.isPending ? '提交中...' : '初始化协议'}
              </button>
            </div>
          </form>
        </div>
      </Html>
    </group>
  );
};
