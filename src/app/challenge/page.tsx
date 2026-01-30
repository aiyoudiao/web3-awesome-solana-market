'use client';

import { useRef, useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Share2, Download, Swords, Copy, CheckCircle2, Twitter } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toPng } from "html-to-image";
import { CyberQR } from "@/components/ui/CyberQR";
import { clsx } from "clsx";

function ChallengeContent() {
  const searchParams = useSearchParams();
  const marketId = searchParams.get('id');
  const marketTitle = searchParams.get('title') || "Unknown Market";
  const { publicKey } = useWallet();
  const cardRef = useRef<HTMLDivElement>(null);

  const [tauntMessage, setTauntMessage] = useState("我赌这个结果，不服来战！");
  const [theme, setTheme] = useState<'blue' | 'purple' | 'orange'>('blue');
  const [isCopied, setIsCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const finalShareUrl = currentUrl || `https://prediction-market-dapp.netlify.app/market/${marketId}`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#000000', // 强制黑色背景，防止透明导致的灰白
        style: {
          transform: 'scale(1)', // 防止缩放导致的样式错位
        }
      });
      
      const link = document.createElement('a');
      link.download = `challenge-${marketId || 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
      alert("生成图片失败，请重试");
    }
  };

  const handleShare = () => {
    const url = window.location.href; // Or the market URL
    const text = `${tauntMessage}\n${url}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const shareUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${tauntMessage} 🚀\n\nBet on this market now on SolPredict! #Solana #PredictionMarket`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank');
  };

  const themes = {
    blue: "from-slate-900 to-black border-primary/30",
    purple: "from-purple-900 to-black border-purple-500/30",
    orange: "from-orange-900 to-black border-orange-500/30"
  };

  const accentColors = {
    blue: "text-primary drop-shadow-[0_0_10px_rgba(0,212,255,0.8)]",
    purple: "text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]",
    orange: "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]"
  };

  if (!marketId) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
              <Swords className="w-20 h-20 text-primary mb-6 opacity-50" />
              <h1 className="text-3xl font-bold mb-4">发起挑战</h1>
              <p className="text-muted-foreground mb-8">请先选择一个市场，然后在详情页点击“挑战好友”。</p>
              <Button onClick={() => window.location.href = '/'}>
                  浏览市场
              </Button>
          </div>
      );
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
         <h1 className="text-4xl font-bold font-heading mb-2">生成挑战卡片</h1>
         <p className="text-muted-foreground">自定义你的战书，保存图片或直接分享</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Preview Area */}
        <div className="space-y-6">
           <div 
             ref={cardRef}
             className={clsx(
                "aspect-[1.91/1] bg-gradient-to-br rounded-xl border relative overflow-hidden p-6 flex flex-col justify-between shadow-2xl",
                themes[theme]
             )}
             style={{
                backgroundImage: theme === 'blue' 
                    ? "radial-gradient(circle at 50% -20%, rgba(0, 212, 255, 0.2), transparent 70%)" 
                    : theme === 'purple'
                    ? "radial-gradient(circle at 50% -20%, rgba(168, 85, 247, 0.2), transparent 70%)"
                    : "radial-gradient(circle at 50% -20%, rgba(249, 115, 22, 0.2), transparent 70%)"
             }}
           >
              {/* Card Header */}
              <div className="flex justify-between items-start z-10">
                 <div className="flex items-center gap-3">
                    <div className={clsx("w-12 h-12 rounded-full border-2 bg-black flex items-center justify-center overflow-hidden", 
                        theme === 'blue' ? "border-primary" : theme === 'purple' ? "border-purple-500" : "border-orange-500"
                    )}>
                       {/* Avatar Placeholder or User Image */}
                       <span className="font-bold text-lg text-white">
                           {publicKey ? publicKey.toBase58().substring(0, 2) : "ME"}
                       </span>
                    </div>
                    <div>
                       <div className="font-bold text-white text-lg">
                           {publicKey ? `${publicKey.toBase58().substring(0, 4)}...${publicKey.toBase58().slice(-4)}` : "My Wallet"}
                       </div>
                       <div className="text-xs text-yellow-500 font-bold px-2 py-0.5 bg-yellow-500/10 rounded-full inline-block">
                           LV.10 预言家
                       </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className={clsx("text-3xl font-black italic", accentColors[theme])}>
                        I PREDICT YES
                    </div>
                    <div className="text-sm text-white/80">My Prediction</div>
                 </div>
              </div>

              {/* VS Section */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                 <span className="text-[120px] font-black italic text-white">VS</span>
              </div>
              
              {/* Taunt Message Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-white/90 text-xl font-bold italic max-w-[80%] text-center drop-shadow-md">
                      "{tauntMessage}"
                  </p>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-end z-10 mt-auto">
                 <div className="max-w-[70%]">
                    <div className="text-sm text-muted-foreground mb-1">目标市场</div>
                    <div className="font-bold text-white text-lg leading-tight line-clamp-2">{marketTitle}</div>
                    <div className="text-xs text-muted-foreground mt-1">Solana 预测市场</div>
                 </div>
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-lg blur opacity-40"></div>
                    <div className="relative bg-black p-0 rounded-lg border border-white/10">
                        <CyberQR value={finalShareUrl} size={80} />
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex gap-4">
              <Button className="flex-1 gap-2 h-12 text-lg font-bold" variant="outline" onClick={handleDownload}>
                 <Download className="w-5 h-5" /> 下载卡片
              </Button>
              <Button className="flex-1 gap-2 h-12 text-lg font-bold bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 border-none" onClick={handleTwitterShare}>
                 <Twitter className="w-5 h-5 fill-current" /> 分享到推特
              </Button>
              <Button className="flex-1 gap-2 h-12 text-lg font-bold bg-primary text-black hover:bg-primary/90" onClick={handleShare}>
                 {isCopied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                 {isCopied ? "已复制" : "复制链接"}
              </Button>
           </div>
        </div>

        {/* 自定义控制 */}
        <div className="space-y-6">
           <div className="glass p-8 rounded-2xl border-primary/20">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-primary" />
                  自定义设置
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-sm font-bold text-muted-foreground block mb-3">卡片主题</label>
                    <div className="flex gap-4">
                       <div 
                            onClick={() => setTheme('blue')}
                            className={clsx("w-12 h-12 rounded-full bg-slate-900 border-2 cursor-pointer transition-transform hover:scale-110", theme === 'blue' ? "border-primary ring-2 ring-primary/50" : "border-gray-600")}
                            title="Cyber Blue"
                       ></div>
                       <div 
                            onClick={() => setTheme('purple')}
                            className={clsx("w-12 h-12 rounded-full bg-purple-900 border-2 cursor-pointer transition-transform hover:scale-110", theme === 'purple' ? "border-purple-500 ring-2 ring-purple-500/50" : "border-gray-600")}
                            title="Neon Purple"
                       ></div>
                       <div 
                            onClick={() => setTheme('orange')}
                            className={clsx("w-12 h-12 rounded-full bg-orange-900 border-2 cursor-pointer transition-transform hover:scale-110", theme === 'orange' ? "border-orange-500 ring-2 ring-orange-500/50" : "border-gray-600")}
                            title="Magma Orange"
                       ></div>
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-sm font-bold text-muted-foreground block mb-3">挑战宣言</label>
                    <textarea 
                      value={tauntMessage}
                      onChange={(e) => setTauntMessage(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-base focus:outline-none focus:border-primary transition-colors min-h-[120px]"
                      placeholder="输入你的狠话..."
                      maxLength={100}
                    ></textarea>
                    <div className="text-right text-xs text-muted-foreground mt-2">
                        {tauntMessage.length}/100
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="glass p-6 rounded-2xl border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
               <h4 className="font-bold mb-2 text-primary">小贴士</h4>
               <p className="text-sm text-muted-foreground">
                   下载卡片后分享到 Twitter 或 Telegram，可以让更多好友通过二维码直接进入你的对局！
               </p>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
            <ChallengeContent />
        </Suspense>
    );
}
