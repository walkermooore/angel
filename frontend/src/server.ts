import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { API_BASE } from "./lib/api";
import { productSlug, SITE_URL } from "./lib/seo";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const apiOrigin = (() => {
    try {
      return new URL(API_BASE, "http://localhost").origin;
    } catch {
      return "";
    }
  })();
  headers.set("Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ${apiOrigin} https://viacep.com.br; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), usb=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const xmlEscape = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&apos;");

async function seoResponse(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (path === "/robots.txt") {
    return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  if (!["/sitemap.xml", "/produtos.xml"].includes(path)) return null;
  const products = await fetch(`${API_BASE}/produtos`).then(r => r.ok ? r.json() : []).catch(() => []) as any[];
  if (path === "/produtos.xml") {
    const entries = products.map(product => `
      <item><g:id>${xmlEscape(product.id)}</g:id><title>${xmlEscape(product.name)}</title>
      <description>${xmlEscape(product.description)}</description>
      <link>${SITE_URL}/produtos/${productSlug({ id: String(product.id), name: product.name })}</link>
      <g:image_link>${xmlEscape(product.image || product.imageUrl)}</g:image_link>
      <g:availability>${Number(product.stockQuantity || 0) > Number(product.reservedQuantity || 0) ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${Number(product.discountPrice || product.price).toFixed(2)} BRL</g:price>
      <g:condition>new</g:condition><g:brand>Angell</g:brand></item>`).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Angell</title><link>${SITE_URL}</link>${entries}</channel></rss>`, {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
    });
  }
  const staticPaths = ["", "/produtos", "/sobre", "/faq", "/privacidade", "/termos", "/trocas", "/cookies"];
  const urls = [
    ...staticPaths.map(item => `${SITE_URL}${item}`),
    ...products.map(product => `${SITE_URL}/produtos/${productSlug({ id: String(product.id), name: product.name })}`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${xmlEscape(url)}</loc></url>`).join("")}</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const seo = await seoResponse(request);
      if (seo) return withSecurityHeaders(seo);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      }));
    }
  },
};
