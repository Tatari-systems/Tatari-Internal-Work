<p align="center">
  <img src="public/tatari-logo.jpg" alt="Tatari" width="88" height="88" />
</p>

<h1 align="center">Tatari Work</h1>

<p align="center">
  Internal task tracker for Tatari operations.<br />
  My work, inbox, projects, and boards — company-wide, not a personal to-do list.
</p>

Tatari Work is a separate product from the Compute Platform quote-to-commit app in Tatari 1.5. This repo is the ops tracker only.

## Product

One Tatari workspace. Sign in with an `@tatari.systems` email. Self-signup and invites join as **reviewer**. Seeded team members stay **admin**. Log out lives in **Settings**.

| Surface | What it is |
| --- | --- |
| **My work** | Tasks assigned to you, grouped overdue / today / later |
| **Inbox** | Open tasks with no assignee |
| **Projects** | Boards for Tatari 1.5, Internal Work, Mining ops, and Pitch |
| **Settings** | Profile, members, invites, workspace, log out |

Statuses are `todo` → `in_progress` → `done`. Boards use HTML5 drag and drop. Assignees start as Dagim, Manish, Aarash, Glodi, and Yasha.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 App Router, React 19, Tailwind 4 |
| Auth | Supabase Auth (email + password, Google) |
| Data | Supabase Postgres via `@supabase/ssr` — no Prisma, Neon, or `pg` |
| Access | `@tatari.systems` only; RLS allows authenticated users |
| Tooling | npm, Vitest, Playwright |

The app never talks to a raw Postgres URL. Auth and Work tables live in the same Supabase project.

## Requirements

- Node.js 24 or newer
- npm
- A Supabase project (Auth + SQL editor)

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env`:

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Keep the service role on the server only. The anon key is the public one.

### 1. Database

In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) once. That creates `profiles`, `workspaces`, `projects`, `tasks`, `audit_logs`, RLS, the `TAT-n` counter, the four projects, and the team assignees.

Re-run the same file after schema or seed changes; inserts are idempotent.

### 2. Auth

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

In **Authentication → Providers**:

- Email: enable email + password. Turn off “Confirm email” if local sign-up should land in Work immediately.
- Google: enable, then set the Client ID and secret. In Google Cloud, the authorized redirect is:

  `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

Only `@tatari.systems` addresses are accepted. New sign-ups are reviewers. Admins invite from Settings → Members.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits go to `/login`, then into `/work`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local app |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test:run` | Vitest |
| `npm run test:e2e` | Playwright |

## Layout

```
src/app/(auth)          Login and signup
src/app/auth/callback   Supabase OAuth callback
src/app/(console)/work  My work, inbox, projects, task pages
src/app/(console)/settings  Profile, members, workspace, log out
src/lib/auth            Email allowlist, session actor, server actions
src/lib/supabase        Browser, server, and proxy clients
src/lib/db              Supabase Work/profile stores
src/lib/work            Input parse helpers and view mapping
src/lib/services/work   Task and project mutations
supabase/schema.sql     Tables, RLS, seed
public/tatari-logo.jpg  Brand mark
```

## Security

- Anon key is public. `SUPABASE_SERVICE_ROLE_KEY` is server-only, for member invite emails.
- Domain check is in the app (`isTatariEmail`), not only in Supabase dashboard settings.
- Work routes require a session. Missing tables redirect to login with a setup message instead of crashing the sign-in action.
- Seed profiles use `firstname@tatari.systems`. Signing up with that same email reuses the assignee row.

## License

Private. Internal Tatari use only.
