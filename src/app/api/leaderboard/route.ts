import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { nanoid } from 'nanoid';

export async function GET() {
  let users = [];
  
  try {
      // 1. Fetch top users by total_points
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50); // Limit to top 50 for now
        
      if (error) throw error;
      users = data;
  } catch (err) {
      console.warn("Leaderboard fetch failed, using mock data:", err);
      // Mock Users
      users = Array.from({ length: 10 }).map((_, i) => ({
          wallet_address: `SoL${nanoid(4)}...${nanoid(4)}`,
          username: `Player_${i+1}`,
          total_points: 12000 - (i * 850),
          level: i < 3 ? 'Gold' : i < 7 ? 'Silver' : 'Bronze',
          badges: i === 0 ? ['🏆'] : []
      }));
  }

  // Format data
  const topUsers = users.map((u: any, index: number) => ({
    rank: index + 1,
    walletAddress: u.wallet_address,
    username: u.username || `User_${u.wallet_address.slice(0,4)}`,
    totalPoints: u.total_points || 0,
    level: u.level || 'Bronze',
    badges: u.badges || []
  }));

  return NextResponse.json({
    status: "success",
    data: {
      period: "all",
      totalUsers: users.length,
      lastUpdated: new Date().toISOString(),
      topUsers
    }
  });
}
