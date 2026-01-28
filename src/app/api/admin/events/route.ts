
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { mockStore } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase error:", error);
        // Fallback to mockStore
        const allMarkets = mockStore.getMarkets();
        const pendingMarkets = allMarkets.filter(m => m.status === status);
        return NextResponse.json({ status: "success", data: pendingMarkets });
    }

    return NextResponse.json({ status: "success", data: data });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to fetch admin events" },
      { status: 500 }
    );
  }
}
