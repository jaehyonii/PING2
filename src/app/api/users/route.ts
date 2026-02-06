import { NextRequest, NextResponse } from "next/server";
import { toProfilesStorageUrl } from "@/lib/supabaseStorage";

export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get("walletAddress")?.trim().toLowerCase();
    if (!walletAddress) {
      return NextResponse.json(
        { status: "error", message: "walletAddress query is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "Supabase server env is missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
        },
        { status: 500 }
      );
    }

    const query = `${supabaseUrl}/rest/v1/users?select=wallet_address,nickname,profile_url,background_url&wallet_address=eq.${encodeURIComponent(
      walletAddress
    )}&limit=1`;

    const response = await fetch(query, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Profile": "public",
        "Accept-Profile": "public",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { status: "error", message: "Supabase user query failed", detail },
        { status: 500 }
      );
    }

    const rows = (await response.json()) as Array<{
      wallet_address: string;
      nickname: string;
      profile_url: string | null;
      background_url: string | null;
    }>;

    if (!rows.length) {
      return NextResponse.json({ status: "success", user: null }, { status: 200 });
    }

    const row = rows[0];
    const user = {
      ...row,
      profile_url: toProfilesStorageUrl(row.profile_url),
      background_url: toProfilesStorageUrl(row.background_url),
    };

    return NextResponse.json({ status: "success", user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
