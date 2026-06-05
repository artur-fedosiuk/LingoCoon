const DEFAULT_LOCAL_SITE_URL = 'http://localhost:3000';

function parseHttpOrigin(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(fallbackUrl = DEFAULT_LOCAL_SITE_URL): string {
  return (
    parseHttpOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    parseHttpOrigin(fallbackUrl) ??
    DEFAULT_LOCAL_SITE_URL
  );
}
