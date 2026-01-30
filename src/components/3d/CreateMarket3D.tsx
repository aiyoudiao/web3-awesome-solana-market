'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  // 创建市场的 Mutation (Backend API) - 同步 2D 逻辑
  const createMarketMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; endTime: number }) => {
      // 通过后端接口创建，由后端负责上链交互
      return await api.generateChallenge({
        type: 'custom', // 保持与 2D 一致
        title: data.title,
        description: data.description,
        creatorWallet: publicKey?.toString() || '',
        endTime: data.endTime
      });
    },
    onSuccess: (data: any) => {
      alert(`预测事件已提交审核！\n请等待管理员审核通过后上链。\nEvent ID: ${data.id}`);
      router.push('/profile'); // Redirect to profile to see status (保持与 2D 一致)
    },
    onError: (err: any) => {
      console.error(err);
      alert("创建失败: " + err.message);
    }
  });

  const handleRandomFill = () => {
    const randomTitles = [
      "2026年英雄联盟S16全球总决赛，LPL赛区能夺冠吗？",
      "2026年王者荣耀KPL春季赛，AG超玩会能否卫冕冠军？",
      "2026年DOTA2国际邀请赛(TI15)，中国战队能否重铸荣光？",
      "2026年CS2 Major大赛，FaZe Clan能再次捧杯吗？",
      "2026年无畏契约(Valorant)全球冠军赛，EDG能否夺冠？",
      "2026年NBA总决赛，湖人队能再次夺得总冠军吗？",
      "2026年世界杯决赛，法国队能战胜巴西队吗？",
      "2026年F1赛季，周冠宇能拿到职业生涯首个分站冠军吗？",
      "2026年LPL夏季赛，BLG战队能否实现全胜夺冠？",
      "2026年MSI季中冠军赛，T1战队能否再次登顶？",
      "2026年亚运会电子竞技项目，中国队能包揽所有金牌吗？",
      "2026年英超联赛，曼城能否实现五连冠霸业？",
      "2026年欧冠决赛，皇马能否再次捧起大耳朵杯？",
      "2026年网球四大满贯，郑钦文能拿到首个大满贯冠军吗？",
      "2026年WTT乒乓球大满贯，孙颖莎能卫冕女单冠军吗？",
      "2026年守望先锋世界杯，中国队能否夺得冠军？",
      "2026年和平精英全球总决赛(PMGC)，NV战队能夺冠吗？",
      "2026年PUBG全球总决赛(PGC)，4AM能拿到世界冠军吗？",
      "2026年超级碗，堪萨斯城酋长队能再次卫冕吗？",
      "2026年UFC格斗之夜，张伟丽能成功卫冕草量级金腰带吗？"
    ];
    const randomDescriptions = [
      "以Riot Games官方最终公布的S16决赛结果为准。",
      "以KPL联盟官方公布的春季赛总决赛结果为准。",
      "以Valve官方公布的TI15决赛结果为准。",
      "以HLTV或赛事主办方公布的最终冠军为准。",
      "以Valorant Champions Tour官方结果为准。",
      "以NBA官方公布的总决赛最终比分为准。",
      "以FIFA官方公布的2026世界杯决赛结果为准（含加时/点球）。",
      "以FIA官方公布的2026赛季分站赛最终排名为准。",
      "以LPL官方公布的夏季赛常规赛及季后赛战绩为准。",
      "以Riot Games官方公布的MSI决赛结果为准。",
      "以亚奥理事会官方公布的电子竞技项目奖牌榜为准。",
      "以英超联赛官方公布的2025-2026赛季最终积分为准。",
      "以欧足联官方公布的欧冠决赛结果为准。",
      "以ITF/WTA官方公布的大满贯决赛结果为准。",
      "以WTT世界乒联官方公布的比赛结果为准。",
      "以暴雪官方公布的OW世界杯决赛结果为准。",
      "以和平精英电竞官方公布的PMGC总决赛积分为准。",
      "以PUBG电竞官方公布的PGC总决赛最终排名为准。",
      "以NFL官方公布的超级碗决赛比分为准。",
      "以UFC官方公布的比赛裁决结果（KO/TKO/判定）为准。"
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
      title: formData.title,
      description: formData.description,
      endTime: endTime
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
                placeholder="例如：2026年英雄联盟S16全球总决赛，LPL赛区能夺冠吗？"
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
                placeholder="请详细描述裁决标准，例如：以 Riot Games 官方最终公布的S16决赛结果为准..."
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
                {createMarketMutation.isPending ? '提交中...' : '发布预测事件'}
              </button>
            </div>
          </form>
        </div>
      </Html>
    </group>
  );
};
