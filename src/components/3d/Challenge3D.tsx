import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html, Float, Grid } from '@react-three/drei';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Button } from '@/components/ui/button';
import { Share2, Download, Swords, Copy, CheckCircle2, Twitter } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toPng } from 'html-to-image';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { CyberQR } from '../ui/CyberQR';

export const Challenge3D = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = searchParams.get('id');
  const marketTitle = searchParams.get('title') || "未知市场";
  const { publicKey } = useWallet();
  const cardRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<Group>(null);
  const ringsRef = useRef<Group>(null);

  const [tauntMessage, setTauntMessage] = useState("我预测这个结果，不服来战！");
  const [theme, setTheme] = useState<'blue' | 'purple' | 'orange'>('blue');
  const [isCopied, setIsCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const finalShareUrl = currentUrl || `https://prediction-market-dapp.netlify.app/market/${marketId}`;

  // 装饰环动画
  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= 0.005;
      ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#000000', // 强制黑色背景
        style: {
          transform: 'scale(1)',
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
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = encodeURIComponent(`${tauntMessage} 🚀\n\nPredict on this market now on SolPredict! #Solana #PredictionMarket`);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

  // 如果没有 marketId，显示选择市场提示
  if (!marketId) {
      return (
        <group>
           <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} position={[0, 1, 0]}>
             <Html center transform>
                <div className="flex flex-col items-center justify-center text-center p-8 bg-black/80 backdrop-blur border border-primary/30 rounded-xl w-[400px]">
                    <Swords className="w-16 h-16 text-primary mb-6 opacity-80" />
                    <h1 className="text-2xl font-bold mb-4 text-white">发起挑战</h1>
                    <p className="text-gray-400 mb-8">请先选择一个市场，然后在详情页点击“挑战好友”。</p>
                    <Button onClick={() => router.push('/')} className="w-full">
                        浏览市场
                    </Button>
                </div>
             </Html>
           </Float>
        </group>
      );
  }

  return (
    <group ref={groupRef}>
      {/* 背景装饰环 */}
      <group ref={ringsRef} position={[0, 0, -5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[10, 0.1, 16, 100]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[14, 0.05, 16, 100]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
        </mesh>
      </group>

      <Grid 
        position={[0, -6, 0]}
        args={[30, 30]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#3b82f6" 
        sectionSize={3} 
        sectionThickness={1} 
        sectionColor="#8b5cf6" 
        fadeDistance={20} 
      />

      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1} position={[0, 4, 0]}>
        <Html center transform>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 tracking-widest uppercase text-center w-[800px] drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            CHALLENGE GENERATOR // 挑战生成器
          </div>
        </Html>
      </Float>

      {/* 主界面 */}
      <Html position={[0, -1, 0]} transform distanceFactor={3}>
        <div className="w-[1000px] grid grid-cols-2 gap-8 bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* 左侧：预览区域 */}
            <div className="space-y-6">
                <div className="flex justify-between items-center text-white/50 text-sm uppercase font-bold tracking-wider">
                    <span>卡片预览</span>
                    <span>实时渲染</span>
                </div>
                
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

                    {/* 卡片底部 */}
                    <div className="flex justify-between items-end z-10 mt-auto">
                        <div className="max-w-[70%]">
                            <div className="text-sm text-muted-foreground mb-1">目标市场</div>
                            <div className="font-bold text-white text-lg leading-tight line-clamp-2">{marketTitle}</div>
                            <div className="text-xs text-muted-foreground mt-1">Solana 预测市场</div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-lg blur opacity-40"></div>
                            <div className="relative bg-black p-1 rounded-lg border border-white/10">
                                <CyberQR value={finalShareUrl} size={64} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button className="flex-1 gap-2 h-12 text-lg font-bold" variant="outline" onClick={handleDownload}>
                        <Download className="w-5 h-5" /> 下载卡片
                    </Button>
                    <Button className="flex-1 gap-2 h-12 text-lg font-bold bg-primary text-black hover:bg-primary/90" onClick={handleShare}>
                        {isCopied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {isCopied ? "已复制" : "复制链接"}
                    </Button>
                </div>
            </div>

            {/* 右侧：控制面板 */}
            <div className="space-y-6 border-l border-white/10 pl-8">
                <div className="flex items-center gap-2 mb-6">
                    <Swords className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-xl text-white">自定义设置</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-400 block mb-3 uppercase tracking-wider">卡片主题</label>
                        <div className="flex gap-4">
                            <div 
                                onClick={() => setTheme('blue')}
                                className={clsx("w-14 h-14 rounded-full bg-slate-900 border-2 cursor-pointer transition-transform hover:scale-110", theme === 'blue' ? "border-primary ring-2 ring-primary/50" : "border-gray-600")}
                            ></div>
                            <div 
                                onClick={() => setTheme('purple')}
                                className={clsx("w-14 h-14 rounded-full bg-purple-900 border-2 cursor-pointer transition-transform hover:scale-110", theme === 'purple' ? "border-purple-500 ring-2 ring-purple-500/50" : "border-gray-600")}
                            ></div>
                            <div 
                                onClick={() => setTheme('orange')}
                                className={clsx("w-14 h-14 rounded-full bg-orange-900 border-2 cursor-pointer transition-transform hover:scale-110", theme === 'orange' ? "border-orange-500 ring-2 ring-orange-500/50" : "border-gray-600")}
                            ></div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-bold text-gray-400 block mb-3 uppercase tracking-wider">挑战宣言</label>
                        <textarea 
                            value={tauntMessage}
                            onChange={(e) => setTauntMessage(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-base text-white focus:outline-none focus:border-primary transition-colors min-h-[150px]"
                            placeholder="输入你的狠话..."
                            maxLength={100}
                        ></textarea>
                        <div className="text-right text-xs text-gray-500 mt-2">
                            {tauntMessage.length}/100
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5 mt-8">
                    <h4 className="font-bold mb-2 text-primary text-sm uppercase">Tips</h4>
                    <p className="text-sm text-gray-400">
                        在 3D 模式下，你可以更直观地感受卡片的设计。生成的图片依然是高清 2D 格式，方便社交分享。
                    </p>
                </div>
            </div>
        </div>
      </Html>
    </group>
  );
};
