import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { getProfilesAssetUrl, toProfilesStorageUrl } from "@/lib/supabaseStorage";

interface UserRow {
  wallet_address: string;
  nickname: string | null;
  profile_url: string | null;
  background_url: string | null;
}

interface UpdateUserBody {
  walletAddress?: string;
  nickname?: string;
  profileImage?: string;
  backgroundImage?: string;
}

interface ParsedImageData {
  ext: string;
  buffer: Buffer;
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

const PROFILES_BUCKET =
  process.env.SUPABASE_PROFILES_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_PROFILES_BUCKET ||
  "profiles";

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

const uploadProfilesObject = async (
  config: NonNullable<ReturnType<typeof getSupabaseConfig>>,
  fileName: string,
  image: ParsedImageData
) => {
  const contentType = EXT_TO_MIME[image.ext] || "application/octet-stream";
  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(
    PROFILES_BUCKET
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

const toPublicUser = (row: UserRow) => ({
  ...row,
  profile_url: toProfilesStorageUrl(row.profile_url),
  background_url: toProfilesStorageUrl(row.background_url),
});

export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get("walletAddress")?.trim().toLowerCase();
    if (!walletAddress) {
      return NextResponse.json(
        { status: "error", message: "walletAddress query is required" },
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

    const query = `${config.supabaseUrl}/rest/v1/users?select=wallet_address,nickname,profile_url,background_url&wallet_address=eq.${encodeURIComponent(
      walletAddress
    )}&limit=1`;

    const response = await fetch(query, {
      method: "GET",
      headers: config.headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { status: "error", message: "Supabase user query failed", detail },
        { status: 500 }
      );
    }

    const rows = (await response.json()) as UserRow[];

    if (!rows.length) {
      return NextResponse.json({ status: "success", user: null }, { status: 200 });
    }

    return NextResponse.json({ status: "success", user: toPublicUser(rows[0]) }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as UpdateUserBody;
    const rawWallet = body.walletAddress?.trim();
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;
    const profileImage = parseImageDataUrl(body.profileImage);
    const backgroundImage = parseImageDataUrl(body.backgroundImage);

    if (!rawWallet) {
      return NextResponse.json(
        { status: "error", message: "walletAddress is required" },
        { status: 400 }
      );
    }

    if (nickname !== undefined && !nickname) {
      return NextResponse.json(
        { status: "error", message: "nickname cannot be empty" },
        { status: 400 }
      );
    }

    if (body.profileImage && !profileImage) {
      return NextResponse.json(
        { status: "error", message: "profileImage must be a supported image data URL (jpg/png/webp)" },
        { status: 400 }
      );
    }

    if (body.backgroundImage && !backgroundImage) {
      return NextResponse.json(
        { status: "error", message: "backgroundImage must be a supported image data URL (jpg/png/webp)" },
        { status: 400 }
      );
    }

    if (nickname === undefined && !profileImage && !backgroundImage) {
      return NextResponse.json(
        { status: "error", message: "No profile changes were provided" },
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
    const walletToken = walletAddress.replace(/[^a-z0-9]/gi, "").slice(0, 18) || "user";
    const updates: Record<string, string> = {};

    if (nickname !== undefined) {
      updates.nickname = nickname;
    }

    if (profileImage) {
      const profileFileName = `${walletToken}-profile-${Date.now()}.${profileImage.ext}`;
      await uploadProfilesObject(config, profileFileName, profileImage);
      updates.profile_url = getProfilesAssetUrl(profileFileName);
    }

    if (backgroundImage) {
      const backgroundFileName = `${walletToken}-background-${Date.now()}.${backgroundImage.ext}`;
      await uploadProfilesObject(config, backgroundFileName, backgroundImage);
      updates.background_url = getProfilesAssetUrl(backgroundFileName);
    }

    const userUrl = new URL(`${config.supabaseUrl}/rest/v1/users`);
    userUrl.searchParams.set("select", "wallet_address,nickname,profile_url,background_url");
    userUrl.searchParams.set("wallet_address", `eq.${walletAddress}`);
    userUrl.searchParams.set("limit", "1");

    const patchResponse = await fetch(userUrl.toString(), {
      method: "PATCH",
      headers: {
        ...config.headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    });

    if (!patchResponse.ok) {
      const detail = await patchResponse.text();
      return NextResponse.json(
        { status: "error", message: "Supabase user update failed", detail },
        { status: 500 }
      );
    }

    let rows = (await patchResponse.json()) as UserRow[];

    if (!rows.length) {
      const upsertResponse = await fetch(
        `${config.supabaseUrl}/rest/v1/users?on_conflict=wallet_address&select=wallet_address,nickname,profile_url,background_url`,
        {
          method: "POST",
          headers: {
            ...config.headers,
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify([
            {
              wallet_address: walletAddress,
              nickname: updates.nickname || `user-${walletAddress.slice(2, 8)}`,
              profile_url: updates.profile_url ?? null,
              background_url: updates.background_url ?? null,
            },
          ]),
        }
      );

      if (!upsertResponse.ok) {
        const detail = await upsertResponse.text();
        return NextResponse.json(
          { status: "error", message: "Supabase user upsert failed", detail },
          { status: 500 }
        );
      }

      rows = (await upsertResponse.json()) as UserRow[];
    }

    return NextResponse.json(
      { status: "success", user: rows[0] ? toPublicUser(rows[0]) : null },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
