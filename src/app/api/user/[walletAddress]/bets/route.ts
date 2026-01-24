import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { nanoid } from 'nanoid';

export async function GET(request: Request, { params }: { params: Promise<{ walletAddress: string }> }) {
    const { walletAddress } = await params;
    let bets = [];

    try {
        const { data, error } = await supabase
            .from('bets')
            .select(`
                *,
                markets (
                    title,
                    image_url,
                    resolution_date
                )
            `)
            .eq('wallet_address', walletAddress)
            .order('created_at', { ascending: false });

        if (error) throw error;
        bets = data;
    } catch (err) {
        console.log("Supabase fetch bets failed, using mock.");
        // Mock Bets
        bets = [
            {
                id: "bet_mock_1",
                market_id: "market_123",
                outcome: "yes",
                amount: 1.5,
                shares: 3.0,
                price: 0.5,
                created_at: new Date().toISOString(),
                markets: {
                    title: "Will Bitcoin reach $100,000 by end of 2024? (MOCK)",
                    image_url: "https://placehold.co/600x400/F7931A/FFF?text=BTC+100K",
                    resolution_date: "2024-12-31T23:59:59Z"
                }
            }
        ];
    }

    // Format for frontend
    const formattedBets = bets.map((b: any) => ({
        id: b.id,
        marketId: b.market_id,
        marketTitle: b.markets?.title || "Unknown Market",
        marketImage: b.markets?.image_url,
        outcome: b.outcome,
        amount: b.amount,
        shares: b.shares,
        value: b.shares * 1.0, // Mock current value calculation
        date: b.created_at
    }));

    return NextResponse.json({ status: "success", data: formattedBets });
}
