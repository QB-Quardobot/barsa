export async function GET({ site, request }: { site: URL | undefined; request: Request }) {
  const origin = site?.origin ?? new URL(request.url).origin;
  const urls = [`${origin}/`];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map((u) => `\n  <url><loc>${u}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`).join('') +
    `\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}


