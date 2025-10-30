function detectOrigin(): string {
  // On server, prefer SITE; on client, window.location
  const site = (typeof window === 'undefined') ? (import.meta as any).env?.SITE : window.location.origin;
  return site || '';
}

export function absoluteUrl(path: string, base?: string | URL): string {
  const origin = base ? (typeof base === 'string' ? base : base.origin) : detectOrigin();
  return origin ? new URL(path, origin).toString() : path;
}

export function buildMeta({
  title,
  description,
  image = '/og.jpg',
  url = '/',
}: { title: string; description: string; image?: string; url?: string }) {
  const fullUrl = absoluteUrl(url);
  const imageUrl = absoluteUrl(image);
  const fullTitle = `${title} | Product`;
  return { fullTitle, description, fullUrl, imageUrl };
}


