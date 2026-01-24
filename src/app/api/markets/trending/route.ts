import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { mockStore } from "@/lib/mockStore";

export async function GET() {
  let markets = [];

  try {
    // 尝试从 Supabase 获取数据
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("created_at", { ascending: false });
    console.debug("Supabase connection successful ", data?.length);
    if (error) throw error;
    markets = data;
  } catch (err) {
    console.error("Supabase 连接失败，回退到本地内存存储:", err);

    // 回退模式：从内存 MockStore 获取数据（包含用户新创建的数据）
    markets = mockStore.getMarkets();
  }

  // 映射 Supabase snake_case 到前端 camelCase
  const formattedMarkets = markets.map((m: any) => ({
    marketId: m.id || m.market_id, // 兼容不同 ID 字段
    title: m.title,
    category: m.category,
    volume: m.volume || 0,
    participants: m.participants || 0,
    odds: m.odds || { yes: 50, no: 50 },
    resolutionDate: m.resolution_date,
    trendingScore: m.trending_score || 0,
    thumbnail:
      m.image_url || "https://placehold.co/600x400/1a1a1a/FFF?text=Market",
  }));

  return NextResponse.json({
    status: "success",
    data: {
      timeframe: "24h",
      totalMarkets: markets.length,
      trendingMarkets: formattedMarkets,
    },
  });
}
