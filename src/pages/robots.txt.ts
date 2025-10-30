export function GET({ site, request }: { site: URL | undefined; request: Request }) {
  const origin = site?.origin ?? new URL(request.url).origin;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}


