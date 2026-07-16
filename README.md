<p align="center">
  <img alt="Jingdex" src="public/logos/logo_rect.svg" width="360">
</p>

<p align="center">
  A community-built Chinese dictionary and vocabulary deck platform.
</p>

# Jingdex

Jingdex (精典) helps Chinese learners find useful vocabulary, study curated decks, and improve the shared learning library. Members can suggest dictionary entries and build private decks, then submit their work for review before it becomes available to the wider community.

The interface supports simplified and Traditional Chinese (Taiwan) characters, pinyin and zhuyin, responsive layouts, and accessible light and dark themes.

## What the app includes

- **Chinese dictionary:** Search by simplified or traditional Hanzi, pinyin with tone marks or tone numbers, zhuyin, or English definition. Results include pronunciation, parts of speech, definitions, notes, and attribution.
- **Vocabulary decks:** Browse featured Jingdex decks and approved community decks, search and sort public collections, and move through terms in a flashcard-style deck browser.
- **Personal deck workspace:** Create private decks, edit their terms and details, and submit complete decks for community review. Submission states and reviewer notes remain visible to the creator.
- **Community contributions:** Suggest missing terms. Traditional forms, pinyin, and zhuyin are generated as a starting point and can be corrected before submission.
- **Review workflow:** Authorized reviewers can accept or reject terms and decks, with rejection notes returned to the contributor.
- **Profiles and recognition:** Public profiles can show a bio, contributed terms, published decks, role labels, and automatic or manually assigned tags. Private profiles expose only limited account information.
- **Personal preferences:** Choose which character set and pronunciation system appears most prominently, switch between accessible light and dark themes, manage profile visibility, change account credentials, or delete an account.
- **Role-based moderation:** Moderators, admins, and developers receive progressively broader tools for user lookup, content review, dictionary and deck management, role assignment, and tag catalog management.

## Main routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product overview and contribution entry points | Public |
| `/dictionary/search` | Search and inspect dictionary terms | Public |
| `/dictionary/contribute` | Submit a term for review | Signed in |
| `/community/featured` | View decks selected by Jingdex | Public |
| `/community/browse` | Search and sort approved community decks | Public |
| `/community/[deckId]` | Browse the terms in a public deck | Public |
| `/my-stuff/decks` | Create, edit, submit, and track personal decks | Signed in |
| `/my-stuff/contributions` | Track submitted dictionary terms | Signed in |
| `/users/[user]` | View a member profile and their public work | Public, subject to profile visibility |
| `/settings/account` | Profile visibility, username, password, and account controls | Signed in |
| `/settings/language` | Theme, character-set, and pronunciation preferences | Signed in |
| `/community/review` | Review pending term and deck submissions | Admin or developer |
| `/settings/moderation` | User, term, deck, role, and tag administration | Permission-based |
| `/demo` | Internal interface and design-system reference | Moderator, admin, or developer |

## Technology

- [Next.js 16](https://nextjs.org/) App Router with React 19 and TypeScript
- [Supabase](https://supabase.com/) Auth and Postgres, including row-level security, triggers, and RPCs
- [Tailwind CSS 4](https://tailwindcss.com/) with semantic theme variables
- [OpenCC JS](https://github.com/nk2028/opencc-js) for simplified/traditional conversion
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) and [pinyin-zhuyin](https://www.npmjs.com/package/pinyin-zhuyin) for pronunciation generation and normalization

## Local development

### Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project
- The [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), if you want to apply the checked-in migrations from the command line

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project with email/password authentication enabled. Apply every migration in [`supabase/migrations`](supabase/migrations) in filename order.

With the Supabase CLI, a hosted project can be initialized, linked, and updated with:

```bash
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

In Supabase Authentication URL settings, use `http://localhost:3000` as the local Site URL and add this redirect URL:

```text
http://localhost:3000/auth/callback
```

The migrations create the learning schema, account/profile trigger, publication and review workflow, row-level security policies, moderation functions, public profile controls, and user-tag system.

### 3. Add environment variables

Create `.env.local` in the project root:

```dotenv
SITE_NAME=Jingdex
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The publishable key may appear as the legacy `anon` key in older Supabase projects. Do not place a service-role key in a `NEXT_PUBLIC_` variable.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). New accounts begin with the `member` role and default to simplified characters, pinyin, and light mode.

### Optional: grant a development role

Administrative pages are hidden from ordinary members. For a development account, update its profile role from the Supabase SQL editor or another trusted database connection:

```sql
update public.profiles
set role = 'developer'
where id = (
  select id from auth.users where email = 'you@example.com'
);
```

Never expose privileged role changes through client-side code.

## Core scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the project |

There is currently no automated test suite. Before merging changes, run at least `npm run lint` and `npm run build`, then manually verify the affected authenticated and unauthenticated flows at mobile and desktop widths.

## Project structure

```text
app/                    Next.js routes, layouts, server actions, and route loading states
  (app)/dictionary/     Dictionary search and term contribution
  (app)/community/      Featured/public decks and moderation review queues
  (app)/my-stuff/       Personal decks and contribution history
  (app)/settings/       Account, language, and moderation settings
  (app)/users/          Public member profiles
components/             Shared navigation, layout, identity, and loading primitives
lib/                    Auth permissions, preferences, Supabase clients, and term utilities
public/                 Jingdex logos, icons, and static images
supabase/migrations/    Ordered database schema and policy migrations
```

## Development conventions

- Treat [`app/(app)/demo/page.tsx`](app/(app)/demo/page.tsx) as the visual reference for the rest of the product.
- Define theme colors semantically in [`app/globals.css`](app/globals.css) and verify every component in both light and dark mode.
- Keep interfaces keyboard accessible, screen-reader friendly, responsive, and respectful of reduced-motion preferences.
- Use the shared loading primitives in [`components/loading.tsx`](components/loading.tsx) for route skeletons and pending states.
- Apply the signed-in member's simplified/traditional and pinyin/zhuyin preferences whenever Chinese content is presented.
- Keep authorization rules aligned between [`lib/auth/roles.ts`](lib/auth/roles.ts) and Supabase policies or RPC guards. Client-side visibility is not an authorization boundary.
- Put all database changes in a new timestamped migration; do not rewrite migration history that may already be deployed.

## Data and moderation model

Public dictionary terms and community decks are reviewed resources. Members work in private submission states, authorized reviewers make publication decisions, and Supabase row-level security enforces which records each visitor can read or change.

The application roles are:

- `member`: personal decks, term submissions, preferences, and profile controls
- `moderator`: moderation-page access and user search
- `admin`: term/deck review and management, plus moderator role assignment
- `developer`: all admin capabilities, admin role assignment, and user-tag management

Automatic tags are maintained in the database from profile roles and contribution milestones. Changes to automatic-tag behavior must include trigger reconciliation and a backfill for existing profiles.

## Current project status

Jingdex is under active development. Core dictionary, deck, contribution, profile, preference, and moderation workflows are implemented; operational deployment documentation and automated tests are not yet included in the repository.
