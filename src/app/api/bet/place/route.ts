import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
    const { marketId, walletAddress, outcome, amount } = await request.json();

    // 3. Store in Supabase 'bets' table (Optional for now)
    try {
        await supabase.from('bets').insert({
            id: `bet_${nanoid()}`,
            market_id: marketId,
            wallet_address: walletAddress,
            outcome,
            amount,
            shares: amount / 0.5, // Mock price calculation (assume 0.5)
            price: 0.5
        });
    } catch (err) {
        console.warn("Failed to save bet to DB, but proceeding:", err);
    }

    return NextResponse.json({ 
        status: "success", 
        data: { 
            txId: "tx_" + nanoid(),
            marketId,
            outcome,
            amount,
            newOdds: { yes: 73, no: 27 } // Mock odds update
        } 
    });
}
