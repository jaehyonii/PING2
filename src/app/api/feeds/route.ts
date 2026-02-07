import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { getFeedsAssetUrl, toFeedsStorageUrl, toProfilesStorageUrl } from "@/lib/supabaseStorage";

interface CreateFeedBody {
  walletAddress?: string;
  frontImage?: string;
  backImage?: string;
  caption?: string | null;
}

interface ParsedImageData {
  ext: string;
  buffer: Buffer;
}

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

export const runtime = "nodejs";

const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const FEEDS_BUCKET =
  process.env.SUPABASE_FEEDS_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_FEEDS_BUCKET ||
  "feeds";

const getSupabaseConfig = () => {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Profile": "public",
      "Accept-Profile": "public",
    },
  };
};

const createFeedId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `feed-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const parseImageDataUrl = (raw: string | undefined): ParsedImageData | null => {
  if (!raw) return null;
  const match = raw.match(DATA_URL_PATTERN);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const ext = MIME_TO_EXT[mime];
  if (!ext) return null;

  try {
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length) return null;
    return { ext, buffer };
  } catch {
    return null;
  }
};

const encodeObjectPath = (objectPath: string) =>
  objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const uploadFeedObject = async (
  config: NonNullable<ReturnType<typeof getSupabaseConfig>>,
  fileName: string,
  image: ParsedImageData
) => {
  const contentType = EXT_TO_MIME[image.ext] || "application/octet-stream";
  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(
    FEEDS_BUCKET
  )}/${encodeObjectPath(fileName)}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      "x-upsert": "true",
      "Content-Type": contentType,
    },
    body: image.buffer as unknown as BodyInit,
  });

  if (response.ok) return;

  const detail = await response.text();
  throw new Error(`Supabase storage upload failed (${fileName}): ${detail}`);
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
    image: toFeedsStorageUrl(row.back_url) || row.back_url,
    overlay: toFeedsStorageUrl(row.front_url) || row.front_url,
    caption: row.caption || "",
    created_at: row.created_at,
  };
};

export async function GET(req: NextRequest) {
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

    const limitRaw = Number(req.nextUrl.searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 100;
    const walletAddressFilter = req.nextUrl.searchParams.get("walletAddress")?.trim().toLowerCase() || "";

    const feedsUrl = new URL(`${config.supabaseUrl}/rest/v1/feeds`);
    feedsUrl.searchParams.set("select", "feed_id,wallet_address,front_url,back_url,caption,created_at");
    feedsUrl.searchParams.set("order", "created_at.desc");
    feedsUrl.searchParams.set("limit", String(limit));
    if (walletAddressFilter) {
      feedsUrl.searchParams.set("wallet_address", `eq.${walletAddressFilter}`);
    }

    const feedsResponse = await fetch(feedsUrl.toString(), {
      method: "GET",
      headers: config.headers,
      cache: "no-store",
    });

    if (!feedsResponse.ok) {
      const detail = await feedsResponse.text();
      return NextResponse.json(
        { status: "error", message: "Supabase feeds query failed", detail },
        { status: 500 }
      );
    }

    const feedRows = (await feedsResponse.json()) as FeedRow[];
    if (!feedRows.length) {
      return NextResponse.json({ status: "success", feeds: [] }, { status: 200 });
    }

    const walletAddresses = [...new Set(feedRows.map((row) => row.wallet_address).filter(Boolean))];
    let usersMap = new Map<string, UserRow>();

    if (walletAddresses.length) {
      const usersUrl = new URL(`${config.supabaseUrl}/rest/v1/users`);
      usersUrl.searchParams.set("select", "wallet_address,nickname,profile_url");
      usersUrl.searchParams.set("wallet_address", `in.(${walletAddresses.join(",")})`);

      const usersResponse = await fetch(usersUrl.toString(), {
        method: "GET",
        headers: config.headers,
        cache: "no-store",
      });

      if (usersResponse.ok) {
        const users = (await usersResponse.json()) as UserRow[];
        usersMap = new Map(users.map((user) => [user.wallet_address, user]));
      }
    }

    const feeds = feedRows.map((row) => toFeedCard(row, usersMap.get(row.wallet_address)));
    return NextResponse.json({ status: "success", feeds }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateFeedBody;
    const rawWallet = body.walletAddress?.trim();
    const frontImage = parseImageDataUrl(body.frontImage);
    const backImage = parseImageDataUrl(body.backImage);
    const caption = typeof body.caption === "string" ? body.caption.trim() : null;

    if (!rawWallet || !frontImage || !backImage) {
      return NextResponse.json(
        {
          status: "error",
          message: "walletAddress, frontImage(data url), backImage(data url) are required",
        },
        { status: 400 }
      );
    }

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

    const walletAddress = rawWallet.toLowerCase();
    const feedId = createFeedId();
    const frontFileName = `${feedId}-front.${frontImage.ext}`;
    const backFileName = `${feedId}-back.${backImage.ext}`;
    const frontUrl = getFeedsAssetUrl(frontFileName);
    const backUrl = getFeedsAssetUrl(backFileName);

    await Promise.all([
      uploadFeedObject(config, frontFileName, frontImage),
      uploadFeedObject(config, backFileName, backImage),
    ]);

    const response = await fetch(`${config.supabaseUrl}/rest/v1/feeds`, {
      method: "POST",
      headers: {
        ...config.headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify([
        {
          feed_id: feedId,
          wallet_address: walletAddress,
          front_url: frontUrl,
          back_url: backUrl,
          caption: caption || null,
        },
      ]),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { status: "error", message: "Supabase feeds insert failed", detail },
        { status: 500 }
      );
    }

    const rows = (await response.json()) as FeedRow[];
    const inserted = rows?.[0];
    const feed = inserted ? toFeedCard(inserted, undefined) : null;

    return NextResponse.json(
      { status: "success", feed },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
