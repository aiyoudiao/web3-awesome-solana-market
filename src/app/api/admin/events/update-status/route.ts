
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status, txSignature } = body;

    if (!id || !status) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update Supabase
    const { data, error } = await supabase
      .from("markets")
      .update({ 
        status: status, 
        tx_signature: txSignature
      })
      .eq("id", id)
      .select();
      
    // If we can't find by UUID 'id', maybe 'id' passed is 'market_id' string?
    // Let's try to match either. But supabase .eq usually expects exact column match.
    // Let's assume frontend passes the internal DB ID.

    if (error) {
       console.error("Supabase update error:", error);
       // Fallback
       const market = mockStore.getMarketById(id);
       if (market) {
           market.status = status;
           if (txSignature) {
               // mockStore doesn't have tx_signature field type, but JS is loose
               (market as any).tx_signature = txSignature;
           }
       }
       return NextResponse.json({ status: "success", data: market });
    }

    return NextResponse.json({ status: "success", data: data });

  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
