const PROFILES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROFILES_BUCKET ||
  process.env.SUPABASE_PROFILES_BUCKET ||
  "profiles";

const getSupabaseUrl = () =>
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

const toRelativeProfilesPath = (rawPath: string) => {
  const trimmed = rawPath.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_URL_PATTERN.test(trimmed) || trimmed.startsWith("data:")) {
    return null;
  }

  const withoutLeadingSlash = trimmed.replace(/^\/+/, "");
  if (!withoutLeadingSlash.startsWith("profiles/")) {
    return null;
  }

  const key = withoutLeadingSlash.slice("profiles/".length).replace(/^\/+/, "");
  return key || null;
};

export const toProfilesStorageUrl = (rawPath: string | null | undefined) => {
  if (!rawPath) return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_URL_PATTERN.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const key = toRelativeProfilesPath(trimmed);
  if (!key) return trimmed;

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) return trimmed;

  return `${supabaseUrl}/storage/v1/object/public/${PROFILES_BUCKET}/${key}`;
};

export const getProfilesAssetUrl = (fileName: string) => {
  const trimmed = fileName.trim().replace(/^\/+/, "");
  const rawPath = trimmed.startsWith("profiles/") ? `/${trimmed}` : `/profiles/${trimmed}`;
  return toProfilesStorageUrl(rawPath) || rawPath;
};
