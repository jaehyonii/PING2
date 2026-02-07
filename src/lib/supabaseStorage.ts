const PROFILES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROFILES_BUCKET ||
  process.env.SUPABASE_PROFILES_BUCKET ||
  "profiles";
const FEEDS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_FEEDS_BUCKET ||
  process.env.SUPABASE_FEEDS_BUCKET ||
  "feeds";

const getSupabaseUrl = () =>
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

const toRelativePath = (rawPath: string, folder: string) => {
  const trimmed = rawPath.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_URL_PATTERN.test(trimmed) || trimmed.startsWith("data:")) {
    return null;
  }

  const withoutLeadingSlash = trimmed.replace(/^\/+/, "");
  const folderPrefix = `${folder}/`;
  if (!withoutLeadingSlash.startsWith(folderPrefix)) {
    return null;
  }

  const key = withoutLeadingSlash.slice(folderPrefix.length).replace(/^\/+/, "");
  return key || null;
};

const toStoragePublicUrl = (
  rawPath: string | null | undefined,
  folder: string,
  bucketName: string
) => {
  if (!rawPath) return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_URL_PATTERN.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const key = toRelativePath(trimmed, folder);
  if (!key) return trimmed;

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) return trimmed;

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${key}`;
};

const getBucketAssetUrl = (
  fileName: string,
  folder: string,
  converter: (path: string) => string | null
) => {
  const trimmed = fileName.trim().replace(/^\/+/, "");
  const folderPrefix = `${folder}/`;
  const rawPath = trimmed.startsWith(folderPrefix) ? `/${trimmed}` : `/${folder}/${trimmed}`;
  return converter(rawPath) || rawPath;
};

export const toProfilesStorageUrl = (rawPath: string | null | undefined) =>
  toStoragePublicUrl(rawPath, "profiles", PROFILES_BUCKET);

export const toFeedsStorageUrl = (rawPath: string | null | undefined) =>
  toStoragePublicUrl(rawPath, "feeds", FEEDS_BUCKET);

export const getProfilesAssetUrl = (fileName: string) =>
  getBucketAssetUrl(fileName, "profiles", toProfilesStorageUrl);

export const getFeedsAssetUrl = (fileName: string) =>
  getBucketAssetUrl(fileName, "feeds", toFeedsStorageUrl);
