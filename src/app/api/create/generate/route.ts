
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, creatorWallet, endTime, type } = body;

    if (!title || !description || !creatorWallet || !endTime) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newMarket = {
      title,
      description,
      creator_wallet: creatorWallet,
      end_time: endTime,
      status: "pending",
      category: type || "custom",
      created_at: new Date().toISOString(),
      volume: 0,
      participants: 0,
      trending_score: 0,
      odds: { yes: 50, no: 50 }
    };

    // Try to insert into Supabase
    const { data, error } = await supabase
      .from("markets")
      .insert([newMarket])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error details:", JSON.stringify(error, null, 2));
      // Fallback to mockStore if Supabase fails (optional, but good for dev)
      // Note: mockStore is in-memory, so it won't persist across restarts usually
      // but for this hackathon context it might be useful if DB is flaky.
      // However, for "Admin" feature to work, we really need the DB.
      // We will try to use mockStore as well so frontend doesn't break immediately.
       const mockMarket = {
          id: `local-${Date.now()}`,
          ...newMarket
       };
       mockStore.addMarket(mockMarket);
       
       return NextResponse.json({
        status: "success",
        data: {
            id: mockMarket.id,
            message: "Created in local store (DB failed)"
        }
      });
    }

    return NextResponse.json({
      status: "success",
      data: data,
    });

  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
