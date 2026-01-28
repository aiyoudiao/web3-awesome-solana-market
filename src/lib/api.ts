const API_BASE_URL = '/api';

export interface Market {
  marketId: string;
  title: string;
  category: string;
  volume: number;
  participants: number;
  odds: { yes: number; no: number };
  resolutionDate: string;
  trendingScore: number;
  thumbnail: string;
}

export interface UserProfile {
  walletAddress: string;
  username: string;
  rank: number;
  totalPoints: number;
  level: string;
  badges: string[];
}

export interface MarketDetail extends Market {
  description: string;
  liveScore?: {
    teamA: string;
    scoreA: number;
    teamB: string;
    scoreB: number;
    time: string;
  };
}

export interface Bet {
  id: string;
  marketId: string;
  marketTitle: string;
  marketImage?: string;
  outcome: 'yes' | 'no';
  amount: number;
  shares: number;
  value: number;
  date: string;
}

export interface LeaderboardUser {
  rank: number;
  walletAddress: string;
  username: string;
  totalPoints: number;
  level: string;
  badges: string[];
}

export const api = {
  // 市场相关接口
  getTrendingMarkets: async (): Promise<Market[]> => {
    const res = await fetch(`${API_BASE_URL}/markets/trending`);
    if (!res.ok) throw new Error('获取市场列表失败');
    const json = await res.json();
    return json.data.trendingMarkets;
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    const res = await fetch(`${API_BASE_URL}/leaderboard`);
    if (!res.ok) throw new Error('获取排行榜失败');
    const json = await res.json();
    return json.data.topUsers;
  },

  getMarketDetail: async (id: string): Promise<MarketDetail> => {
    const res = await fetch(`${API_BASE_URL}/market/${id}`);
    if (!res.ok) throw new Error('获取市场详情失败');
    const json = await res.json();
    return json.data;
  },

  placeBet: async (data: {
    marketId: string;
    outcome: 'yes' | 'no';
    amount: number;
    walletAddress: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/bet/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('下注失败');
    const json = await res.json();
    return json.data;
  },

  // 用户相关接口
  getUserProfile: async (walletAddress: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/user/${walletAddress}`);
    if (!res.ok) throw new Error('获取用户资料失败');
    const json = await res.json();
    return json.data;
  },

  updateUserProfile: async (walletAddress: string, data: { username: string }) => {
    const res = await fetch(`${API_BASE_URL}/user/${walletAddress}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('更新用户资料失败');
    const json = await res.json();
    return json.data;
  },

  getUserBets: async (walletAddress: string): Promise<Bet[]> => {
    const res = await fetch(`${API_BASE_URL}/user/${walletAddress}/bets`);
    if (!res.ok) throw new Error('获取用户下注记录失败');
    const json = await res.json();
    return json.data;
  },

  getUserEvents: async (walletAddress: string): Promise<Market[]> => {
    const res = await fetch(`${API_BASE_URL}/user/${walletAddress}/events`);
    if (!res.ok) throw new Error('获取用户创建事件失败');
    const json = await res.json();
    return json.data;
  },

  // 创建挑战/市场
  generateChallenge: async (data: { 
    type: string; 
    title: string; 
    description: string; 
    creatorWallet: string; 
    endTime?: number; // 可选的时间戳
  }) => {
    const res = await fetch(`${API_BASE_URL}/create/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('创建挑战失败');
    const json = await res.json();
    return json.data;
  },

  // Admin
  getAdminEvents: async (status: string = 'pending') => {
    const res = await fetch(`${API_BASE_URL}/admin/events?status=${status}`);
    if (!res.ok) throw new Error('获取待审核事件失败');
    const json = await res.json();
    return json.data;
  },

  updateEventStatus: async (id: string, status: string, txSignature?: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/events/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, txSignature }),
    });
    if (!res.ok) throw new Error('更新状态失败');
    const json = await res.json();
    return json.data;
  },

  // 评论相关接口
  getComments: async (marketId: string) => {
    const res = await fetch(`${API_BASE_URL}/market/${marketId}/comments`);
    if (!res.ok) throw new Error('获取评论失败');
    const json = await res.json();
    return json.data;
  },

  postComment: async (marketId: string, data: { userWallet: string, username?: string, content: string }) => {
    const res = await fetch(`${API_BASE_URL}/market/${marketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('发表评论失败');
    const json = await res.json();
    return json.data;
  }
};
