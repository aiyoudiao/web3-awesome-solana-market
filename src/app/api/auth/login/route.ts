import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const { walletAddress, signature, message } = await request.json();
  
  // TODO: Verify signature using tweetnacl
  // For Hackathon Demo: Assume signature is valid if provided
  const isValid = true; 

  if (!isValid) {
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 });
  }

  // Check if user exists, if not create
  const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
      
  if (!user) {
      await supabase.from('users').insert({
          wallet_address: walletAddress,
          username: `User_${walletAddress.slice(0,6)}`,
          level: 'Bronze'
      });
  }

  // Issue JWT (Mock for now, return simple session object)
  return NextResponse.json({ 
      status: "success", 
      data: { 
          token: "mock_jwt_token_" + nanoid(),
          user: { walletAddress }
      } 
  });
}
