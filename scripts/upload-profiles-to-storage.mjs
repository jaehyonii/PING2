import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const loadDotEnv = (envFilePath) => {
  if (!existsSync(envFilePath)) return;

  const content = readFileSync(envFilePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
};

const encodeObjectPath = (objectPath) =>
  objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const assertOk = async (response, label) => {
  if (response.ok) return;
  const detail = await response.text();
  throw new Error(`${label} failed (${response.status}): ${detail}`);
};

const ensureBucket = async (supabaseUrl, serviceKey, bucketName) => {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: true,
    }),
  });

  if (response.ok) return;

  const detail = await response.text();
  const alreadyExists =
    response.status === 409 ||
    detail.includes("already exists") ||
    detail.includes("duplicate key");

  if (!alreadyExists) {
    throw new Error(`create bucket failed (${response.status}): ${detail}`);
  }
};

const main = async () => {
  loadDotEnv(path.join(process.cwd(), ".env"));

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const bucketName =
    (process.env.SUPABASE_PROFILES_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_PROFILES_BUCKET || "profiles")
      .trim() || "profiles";
  const profilesDir = path.join(process.cwd(), "public", "profiles");

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!existsSync(profilesDir)) {
    throw new Error(`Directory does not exist: ${profilesDir}`);
  }

  await ensureBucket(supabaseUrl, serviceKey, bucketName);

  const entries = await readdir(profilesDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

  if (!files.length) {
    console.log("No files found in public/profiles.");
    return;
  }

  for (const fileName of files) {
    const ext = path.extname(fileName).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const objectPath = fileName;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucketName)}/${encodeObjectPath(
      objectPath
    )}`;
    const data = await readFile(path.join(profilesDir, fileName));

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "x-upsert": "true",
        "Content-Type": contentType,
      },
      body: data,
    });

    await assertOk(response, `upload ${fileName}`);
    console.log(`Uploaded: ${fileName}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
