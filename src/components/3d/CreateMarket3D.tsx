'use client';

import { useRef } from 'react';
import { Html, Float, Grid } from '@react-three/drei';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Dices } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useCreateMarketViewModel } from '@/hooks/view-models/useCreateMarketViewModel';

/**
 * 3D 创建市场页面组件
 * @description
 * 赛博朋克风格的“造物台”。
 * 用户在这里通过全息控制台创建新的预测市场。
 * 配色遵循 2D 黑暗模式 (Solana Purple & Green)。
 */
export const CreateMarket3D = () => {
  const { 
    formData, 
    setFormData, 
    handleSubmit, 
    handleRandomFill, 
    isPending,
    router
  } = useCreateMarketViewModel();

  const groupRef = useRef<Group>(null);
  const ringsRef = useRef<Group>(null);

  // 装饰环动画
  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z += 0.005;
      ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

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
            创建事件
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
                预测标题
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
                详细规则描述
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
                disabled={isPending}
                className="px-6 py-3 bg-gradient-to-r from-[#9945FF] to-[#7C3AED] rounded-lg text-white font-bold shadow-lg hover:from-[#8B5CF6] hover:to-[#6D28D9] transition-all active:scale-95 shadow-[0_0_20px_rgba(153,69,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isPending ? '提交中...' : '发布预测事件'}
              </button>
            </div>
          </form>
        </div>
      </Html>
    </group>
  );
};
