// 简单的内存存储，用于在没有数据库连接时模拟数据持久化
// 注意：在 Serverless 环境（如 Vercel 部署）中，这个变量会在函数执行完后重置
// 但在本地开发环境 (next dev) 中，它通常能保持状态

export interface MockMarket {
  id: string;
  market_id?: string;
  title: string;
  category: string;
  volume: number;
  participants: number;
  odds: { yes: number; no: number };
  resolution_date: string;
  trending_score: number;
  image_url: string;
  description?: string;
  creator_wallet?: string;
  created_at?: string;
  status?: string;
}

const initialMarkets: MockMarket[] = [
  {
    id: "market_btc_100k",
    title: "比特币会在2024年底突破10万美元吗？",
    category: "crypto",
    volume: 1250000,
    participants: 450,
    odds: { yes: 45, no: 55 },
    resolution_date: "2024-12-31T23:59:59Z",
    trending_score: 98,
    image_url: "https://placehold.co/600x400/F7931A/FFF?text=BTC+100K",
    description: "本预测基于 CoinMarketCap 上的比特币价格。",
    status: 'active'
  },
  {
    id: "market_t1_worlds",
    title: "T1 会赢得 2024 英雄联盟全球总决赛冠军吗？",
    category: "esports",
    volume: 890000,
    participants: 3200,
    odds: { yes: 25, no: 75 },
    resolution_date: "2024-11-02T20:00:00Z",
    trending_score: 95,
    image_url: "https://placehold.co/600x400/E4002B/FFF?text=T1+Worlds",
    description: "以 Riot Games 官方比赛结果为准。",
    status: 'active'
  },
  {
    id: "market_sol_200",
    title: "SOL 会在本月突破 $200 吗？",
    category: "crypto",
    volume: 560000,
    participants: 120,
    odds: { yes: 60, no: 40 },
    resolution_date: "2024-10-31T23:59:59Z",
    trending_score: 88,
    image_url: "https://placehold.co/600x400/9945FF/FFF?text=SOL+200",
    description: "基于主流交易所的平均价格。",
    status: 'active'
  },
  {
    id: "market_spacex_mars",
    title: "SpaceX 星舰能在 2024 年成功入轨吗？",
    category: "science",
    volume: 340000,
    participants: 890,
    odds: { yes: 80, no: 20 },
    resolution_date: "2024-12-31T23:59:59Z",
    trending_score: 85,
    image_url: "https://placehold.co/600x400/005288/FFF?text=SpaceX",
    description: "只要完成一次完整的入轨飞行即视为成功。",
    status: 'active'
  },
  {
    id: "market_gta6",
    title: "GTA 6 会在 2025 年之前发布吗？",
    category: "gaming",
    volume: 2100000,
    participants: 5600,
    odds: { yes: 10, no: 90 },
    resolution_date: "2024-12-31T23:59:59Z",
    trending_score: 99,
    image_url: "https://placehold.co/600x400/000000/FFF?text=GTA+VI",
    description: "Rockstar Games 官方发布游戏本体。",
    status: 'active'
  }
];

class MockStore {
  private markets: MockMarket[] = [...initialMarkets];

  getMarkets() {
    return this.markets;
  }

  getMarketById(id: string) {
    return this.markets.find(m => m.id === id || m.market_id === id);
  }

  addMarket(market: MockMarket) {
    // 放到最前面，模拟最新创建
    this.markets.unshift(market);
  }
}

// 导出单例
export const mockStore = new MockStore();
