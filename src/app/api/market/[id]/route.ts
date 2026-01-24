import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { mockStore } from '@/lib/mockStore';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let market = null;

    try {
        // 尝试从 Supabase 获取
        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .or(`id.eq.${id},market_id.eq.${id}`) // 兼容两种 ID 字段查询
            .single();
            
        if (error) throw error;
        market = data;
    } catch (err) {
        // 回退逻辑：从内存 MockStore 获取
        console.log(`Supabase fetch failed for ${id}, using mock store.`);
        market = mockStore.getMarketById(id);
        
        // 如果 MockStore 也没找到（极少数情况），回退到硬编码兜底
        if (!market) {
            const isT1 = id === 'market_456' || id.includes('T1');
            market = {
                id: id,
                title: isT1 ? "Will T1 win Worlds 2024? (MOCK)" : "Will Bitcoin reach $100,000? (MOCK)",
                category: isT1 ? "esports" : "crypto",
                volume: isT1 ? 89000 : 125000,
                participants: isT1 ? 267 : 342,
                odds: { yes: isT1 ? 72 : 65, no: isT1 ? 28 : 35 },
                resolution_date: "2024-12-31T23:59:59Z",
                description: "This is a mock description because database connection failed.",
                image_url: isT1 
                    ? "https://placehold.co/600x400/E4002B/FFF?text=T1+Worlds"
                    : "https://placehold.co/600x400/F7931A/FFF?text=BTC+100K",
                liveScore: isT1 ? { teamA: "T1", scoreA: 2, teamB: "BLG", scoreB: 1, time: "Game 4" } : null
            };
        }
    }
    
    if (!market) {
        return NextResponse.json({ status: "error", message: "Market not found" }, { status: 404 });
    }
    
    const formattedMarket = {
        marketId: market.id || (market as any).market_id,
        title: market.title,
        category: market.category,
        volume: market.volume || 0,
        participants: market.participants || 0,
        odds: market.odds || { yes: 50, no: 50 },
        resolutionDate: market.resolution_date,
        description: market.description,
        thumbnail: market.image_url || "https://placehold.co/600x400/1a1a1a/FFF?text=Market",
        liveScore: (market as any).liveScore || null 
    };

    return NextResponse.json({ status: "success", data: formattedMarket });
}
