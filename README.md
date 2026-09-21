# Tatari Work

Internal task tracker for Tatari ops (My work, inbox, projects, boards). This is a separate product from the Compute Platform quote-to-commit app in `Tatari 1.5`.

## Local setup

```bash
npm install
cp .env.example .env
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# run supabase/schema.sql once in the Supabase SQL editor
npm run dev
```

Open http://localhost:3000 — it goes to `/work`. Sign in with an `@tatari.systems` email.

## Put this in the other Cursor agent

File → Open Folder → `D:\DEV\Tatari\Tatari Work`

That chat (`b0983f15-94b0-4fd3-b0b9-602217771a79`) should work in this folder, not in Tatari 1.5.

## First GitHub push (no Cursor co-author)

Use the terminal, not Cursor’s Commit button. Cursor’s commit hook can add `Co-authored-by: Cursor`, which shows Cursor as a GitHub contributor.

```bash
cd "D:\DEV\Tatari\Tatari Work"
git add .
git commit -m "feat: add Tatari internal work tracker"
gh repo create tatari-work --private --source=. --remote=origin --push
```

Check the commit with `git log -1` before pushing. If you see `Co-authored-by: Cursor`, do not push that commit.
