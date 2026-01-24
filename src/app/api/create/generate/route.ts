import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { nanoid } from 'nanoid';
import { mockStore, MockMarket } from '@/lib/mockStore';

export async function POST(request: Request) {
  const body = await request.json();
  const { type, title, description, creatorWallet, endTime, image } = body;
  
  // 模拟 ID 生成
  const id = nanoid(10);
  const marketId = `market_${id}`;
  
  // 构造新的市场对象 (Event / Market)
  // 注意：这里我们统一使用 MockMarket 接口结构
  const newEntry: MockMarket = {
    id: marketId,
    market_id: marketId,
    title: title || "New Prediction Market",
    description: description || "No description provided",
    category: 'custom',
    volume: 0,
    participants: 0,
    odds: { yes: 50, no: 50 },
    resolution_date: endTime ? new Date(endTime).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trending_score: 100, // 新创建的设为最热门，方便在列表中看到
    image_url: image || `https://placehold.co/1200x675/000000/FFF?text=${encodeURIComponent(title || 'Market')}`,
    creator_wallet: creatorWallet,
    status: 'active',
    created_at: new Date().toISOString()
  };

  try {
    // 尝试写入 Supabase (如果配置了)
    const { error } = await supabase.from('markets').insert({
        id: newEntry.id,
        market_id: newEntry.market_id,
        title: newEntry.title,
        description: newEntry.description,
        category: newEntry.category,
        volume: newEntry.volume,
        participants: newEntry.participants,
        yes_pool: 0,
        no_pool: 0,
        odds: newEntry.odds,
        trending_score: newEntry.trending_score,
        image_url: newEntry.image_url,
        creator_wallet: newEntry.creator_wallet,
        status: newEntry.status,
        resolution_date: newEntry.resolution_date,
        expires_at: newEntry.resolution_date,
        created_at: newEntry.created_at
    });
    
    if (error) {
       console.warn("Supabase insert failed, falling back to local memory store:", error.message);
       // 写入内存 MockStore
       mockStore.addMarket(newEntry);
    }
  } catch (err) {
    console.log("Mocking creation due to DB error or missing config");
    // 写入内存 MockStore
    mockStore.addMarket(newEntry);
  }
  
  // 返回标准响应格式
  return NextResponse.json({
    status: "success",
    data: newEntry
  });
}
