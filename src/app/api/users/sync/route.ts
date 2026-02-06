import { NextRequest, NextResponse } from "next/server";

interface SyncUserBody {
  walletAddress?: string;
  username?: string | null;
  profilePictureUrl?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SyncUserBody;
    const rawWallet = body.walletAddress?.trim();

    if (!rawWallet) {
      return NextResponse.json(
        { status: "error", message: "walletAddress is required" },
        { status: 400 }
      );
    }

    const walletAddress = rawWallet.toLowerCase();
    const shortWallet = walletAddress.slice(2, 8);
    const nickname = body.username?.trim() || `user-${shortWallet}`;
    const profileUrl = body.profilePictureUrl?.trim() || null;
    console.log("Syncing user:", { walletAddress, nickname, profileUrl });
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.log("Supabase env vars missing");
      return NextResponse.json(
        {
          status: "error",
          message: "Supabase server env is missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/users?on_conflict=wallet_address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify([
        {
          wallet_address: walletAddress,
          nickname,
          profile_url: profileUrl,
        },
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Supabase insert failed:", errorText);
      return NextResponse.json(
        { status: "error", message: "Supabase insert failed", detail: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
