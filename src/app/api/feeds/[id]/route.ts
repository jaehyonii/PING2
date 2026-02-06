import { NextRequest, NextResponse } from "next/server";
import { toProfilesStorageUrl } from "@/lib/supabaseStorage";

interface FeedRow {
  feed_id: string;
  wallet_address: string;
  front_url: string;
  back_url: string;
  caption: string | null;
  created_at: string;
}

interface UserRow {
  wallet_address: string;
  nickname: string | null;
  profile_url: string | null;
}

const getSupabaseConfig = () => {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Profile": "public",
      "Accept-Profile": "public",
    },
  };
};

const toFeedCard = (row: FeedRow, user: UserRow | undefined) => {
  const fallbackWalletLabel = row.wallet_address ? `user-${row.wallet_address.slice(2, 8)}` : "user";

  return {
    id: row.feed_id,
    feed_id: row.feed_id,
    wallet_address: row.wallet_address,
    user: user?.nickname?.trim() || fallbackWalletLabel,
    meta: row.caption?.trim() || "오늘의 Ping!",
    avatar: toProfilesStorageUrl(user?.profile_url?.trim()) || "/figma/home/avatar-default.png",
    image: row.back_url,
    overlay: row.front_url,
    caption: row.caption || "",
    created_at: row.created_at,
  };
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const config = getSupabaseConfig();
    if (!config) {
      return NextResponse.json(
        {
          status: "error",
          message: "Supabase server env is missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
        },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const feedId = id?.trim();
    if (!feedId) {
      return NextResponse.json(
        { status: "error", message: "feed id is required" },
        { status: 400 }
      );
    }

    const feedUrl = new URL(`${config.supabaseUrl}/rest/v1/feeds`);
    feedUrl.searchParams.set("select", "feed_id,wallet_address,front_url,back_url,caption,created_at");
    feedUrl.searchParams.set("feed_id", `eq.${feedId}`);
    feedUrl.searchParams.set("limit", "1");

    const feedResponse = await fetch(feedUrl.toString(), {
      method: "GET",
      headers: config.headers,
      cache: "no-store",
    });

    if (!feedResponse.ok) {
      const detail = await feedResponse.text();
      return NextResponse.json(
        { status: "error", message: "Supabase feed query failed", detail },
        { status: 500 }
      );
    }

    const rows = (await feedResponse.json()) as FeedRow[];
    if (!rows.length) {
      return NextResponse.json(
        { status: "error", message: "Feed not found" },
        { status: 404 }
      );
    }

    const feed = rows[0];
    const userUrl = new URL(`${config.supabaseUrl}/rest/v1/users`);
    userUrl.searchParams.set("select", "wallet_address,nickname,profile_url");
    userUrl.searchParams.set("wallet_address", `eq.${feed.wallet_address}`);
    userUrl.searchParams.set("limit", "1");

    const userResponse = await fetch(userUrl.toString(), {
      method: "GET",
      headers: config.headers,
      cache: "no-store",
    });

    let user: UserRow | undefined;
    if (userResponse.ok) {
      const users = (await userResponse.json()) as UserRow[];
      user = users[0];
    }

    return NextResponse.json(
      { status: "success", feed: toFeedCard(feed, user) },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
