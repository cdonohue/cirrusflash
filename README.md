# stratobeam

A demo web app for testing Exhibit, which posts before-and-after screenshots of the pages a pull request changes.

It looks like a cloud provider's admin dashboard and is built with Cloudflare's Kumo design system.

**Stratobeam is a fictional product.** The brand, logo, account ("Acme Robotics"), user ("Dana Park") and all data are made up. There is no sign-in and no backend. All domains use `.example` or `.test`.

## Run it

```sh
npm install
npm run dev       # Vite dev server
npm run build     # typecheck, then build to dist/
npm run preview   # serve dist/
npm run deploy    # build, then wrangler deploy (static assets only)
```

## Determinism

Screenshots must match between runs, so:

- All data comes from a fixed in-memory seed (`src/data/`). There is no `Math.random` and no `Date.now`. The demo clock is fixed at Oct 9, 2026 14:05 UTC.
- State resets when the page reloads. It stays while you navigate inside the app, so a flow can add something on one page and see it on another.
- Charts render without animation.
- The app makes no network calls and loads no external fonts.

## Theme

Add `?theme=light` or `?theme=dark` to any URL to force a mode for that page load. The parameter stays on the URL as you navigate inside the app. Without it, the app uses the choice saved from the top bar or Settings, and then the system preference.

## Routes and flows

| Route | What you can do |
| --- | --- |
| `/` | Account home: stats, a 7-day requests chart, recent activity, "Add a domain" |
| `/domains` | Search and filter by status. "Add a domain" checks the input, then adds the domain as Pending nameservers and opens its page |
| `/domains/:domain` | Overview: traffic chart, details, quick actions, nameservers. Pending domains show an "Update your nameservers" banner |
| `/domains/:domain/dns` | DNS records: search, add, edit and delete (with confirmation). The form validates each field for the record type |
| `/domains/:domain/ssl` | Encryption mode and Always Use HTTPS. Save shows "Settings saved" |
| `/workers` | Workers & Pages list |
| `/workers/create` | Three steps: template, name (checked), review, Deploy. Then opens the new worker |
| `/workers/:name` | Metrics and deployments |
| `/workers/:name/settings` | Variables (add, remove, secret), Logs switch, Delete worker (type the name to confirm) |
| `/analytics` | 24h / 7d / 30d ranges, chart, top paths |
| `/settings` | Theme, account name, account ID |
| `/settings/members` | Members list, "Invite member" with email check and role |

Any other path shows a 404 page inside the app. The top bar has an account switcher, a search palette (⌘K / Ctrl+K), the theme menu and a user menu.
