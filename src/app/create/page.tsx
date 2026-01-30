'use client';

import { Button } from "@/components/ui/button";
import { Dices, Loader2, Calendar, Type, FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useCreateMarketViewModel } from "@/hooks/view-models/useCreateMarketViewModel";

export default function CreatePrediction() {
  const { 
    formData, 
    setFormData, 
    handleSubmit, 
    handleRandomFill, 
    isPending, 
    publicKey,
    router
  } = useCreateMarketViewModel();
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary">
          创建 <span className="text-foreground">事件</span>
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
              disabled={isPending}
              className="h-12 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(153,69,255,0.3)]"
            >
              {isPending ? (
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
