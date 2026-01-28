
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { mockStore } from "@/lib/mockStore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;

  try {
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .eq("creator_wallet", walletAddress)
      .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase error:", error);
        // Fallback to mockStore
        const allMarkets = mockStore.getMarkets();
        const userMarkets = allMarkets.filter(m => m.creator_wallet === walletAddress);
        return NextResponse.json({ status: "success", data: userMarkets });
    }

    return NextResponse.json({ status: "success", data: data });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to fetch user events" },
      { status: 500 }
    );
  }
}
