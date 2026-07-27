import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import app from "./dist/server/server.js";

const port = Number(process.env.PORT || 3000);
const publicRoot = join(process.cwd(), "dist", "client");
const types = {
  ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function staticResponse(pathname) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  const file = join(publicRoot, relative);
  if (!file.startsWith(publicRoot)) return null;
  try {
    if (!(await stat(file)).isFile()) return null;
    return new Response(await readFile(file), {
      headers: {
        "content-type": types[extname(file)] || "application/octet-stream",
        "cache-control": relative.startsWith("assets/") ? "public, max-age=31536000, immutable" : "public, max-age=300",
      },
    });
  } catch {
    return null;
  }
}

createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || "/", `http://${incoming.headers.host || "localhost"}`);
    if (url.pathname === "/health") {
      outgoing.writeHead(200, { "content-type": "application/json" });
      outgoing.end('{"status":"UP"}');
      return;
    }
    const asset = await staticResponse(url.pathname);
    const body = ["GET", "HEAD"].includes(incoming.method || "GET") ? undefined : incoming;
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers,
      body,
      duplex: body ? "half" : undefined,
    });
    const response = asset || await app.fetch(request, process.env, {});
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500, { "content-type": "application/json" });
    outgoing.end('{"message":"Erro interno."}');
  }
}).listen(port, "0.0.0.0", () => console.log(`Angell frontend listening on :${port}`));
