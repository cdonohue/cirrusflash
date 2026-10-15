/**
 * Serves the built app. Paths that are not files are app routes, so they get
 * index.html and the client-side router renders them, including its 404.
 * This lives in code rather than `not_found_handling` because Worker previews
 * (`wrangler preview`) do not apply that setting.
 */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;
    const url = new URL(request.url);
    // A missing static file stays a 404. Only known file types count: app
    // paths can end in a dot too, like /domains/acme-robotics.example.
    if (/\.(?:js|mjs|css|map|json|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|txt|xml|webmanifest)$/i.test(url.pathname)) return response;
    const page = await env.ASSETS.fetch(new Request(new URL('/', url), request));
    return new Response(page.body, { status: 200, headers: page.headers });
  },
};
