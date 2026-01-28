import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("market_id", id)
      .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", data: data });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { userWallet, username, content } = body;

  if (!userWallet || !content) {
      return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("comments")
      .insert([
        { 
            market_id: id,
            user_wallet: userWallet,
            username: username || `User_${userWallet.slice(0, 4)}`,
            content: content
        }
      ])
      .select()
      .single();

    if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", data: data });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to post comment" },
      { status: 500 }
    );
  }
}
