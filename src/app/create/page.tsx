'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dices, Loader2, Calendar, Type, FileText } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";

export default function CreatePrediction() {
  console.log("CreatePrediction");
  const router = useRouter();
  const { publicKey } = useWallet();
  console.log('publicKey', publicKey);
  // const { createEvent } = useSoldoraProgram();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    endTime: '',
  });

  // 创建市场的 Mutation (Backend API)
  const createMarketMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; endTime: number }) => {
      // 通过后端接口创建，由后端负责上链交互
      return await api.generateChallenge({
        type: 'custom',
        title: data.title,
        description: data.description,
        creatorWallet: publicKey?.toString() || '',
        endTime: data.endTime
      });
    },
    onSuccess: (data: any) => {
      alert(`预测事件已提交审核！\n请等待管理员审核通过后上链。\nEvent ID: ${data.id}`);
      router.push('/profile'); // Redirect to profile to see status
    },
    onError: (err: any) => {
      console.error(err);
      alert("创建失败: " + err.message);
    }
  });

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
    const randomDays = Math.floor(Math.random() * 30) + 1;
    now.setDate(now.getDate() + randomDays);
    
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

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary">
          创建 <span className="text-foreground">预测</span>
        </h1>
        <p className="text-muted-foreground">发起一个新的预测市场，让全网用户参与预测。</p>
      </div>

      <div className="glass p-8 rounded-xl border border-primary/20 relative overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
        
        {/* 随机填充按钮 */}
        <div className="absolute top-6 right-6 z-20">
          <Tooltip content="随机生成测试数据" position="left">
            <div
              onClick={handleRandomFill}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <Dices className="w-5 h-5" />
            </div>
          </Tooltip>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          {/* 标题输入 */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" /> 
              预测标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
              placeholder="例如：2026年英雄联盟S16全球总决赛，LPL赛区能夺冠吗？"
            />
          </div>

          {/* 描述输入 */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" /> 
              详细规则描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-base focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all h-32 resize-none placeholder:text-muted-foreground/50"
              placeholder="请详细描述裁决标准，例如：以 Riot Games 官方最终公布的S16决赛结果为准..."
            />
          </div>

          {/* 时间输入 */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> 
              截止时间
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all [color-scheme:dark]"
            />
          </div>

          {/* 提交按钮区 */}
          <div className="pt-6 grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-12 text-lg border-white/10 hover:bg-white/5"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={createMarketMutation.isPending}
              className="h-12 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(153,69,255,0.3)]"
            >
              {createMarketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  创建中...
                </>
              ) : (
                '发布预测事件'
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
