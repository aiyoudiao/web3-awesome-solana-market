import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { nanoid } from 'nanoid';

export async function GET(request: Request, { params }: { params: Promise<{ walletAddress: string }> }) {
  const { walletAddress } = await params;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (user) {
    const formattedUser = {
        walletAddress: user.wallet_address,
        username: user.username,
        rank: user.rank,
        totalPoints: user.total_points,
        weeklyPoints: user.weekly_points,
        predictionAccuracy: user.prediction_accuracy,
        totalPredictions: user.total_predictions,
        correctPredictions: user.correct_predictions,
        level: user.level,
        badges: user.badges,
        joinDate: user.join_date,
        lastActive: user.last_active
    };
    return NextResponse.json({ status: "success", data: formattedUser });
  } else {
    // If not found, create a new user (Auto-registration for demo)
    const newUser = {
        wallet_address: walletAddress,
        username: `用户_${walletAddress.slice(0,6)}`,
        level: '青铜'
    };
    
    const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
        
    if (createError) {
        return NextResponse.json({ status: "error", message: createError.message }, { status: 500 });
    }
    
    return NextResponse.json({ status: "success", data: { ...createdUser, walletAddress: createdUser.wallet_address } });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ walletAddress: string }> }) {
  const { walletAddress } = await params;
  const body = await request.json();
  const { username } = body;

  if (!username) {
    return NextResponse.json({ status: "error", message: "Username is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ username })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "success", data });
}
