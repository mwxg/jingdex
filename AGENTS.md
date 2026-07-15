<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


This is an app for learning Chinese, mainly through flashcards.
This app is called "Jingdex" (精dex)
Do not start dev servers. I will do that manually.

Implement visual themes through the semantic color variables in app/globals.css, default new users to light mode, and ensure every component remains accessible in both light and dark modes.

This project uses supabase.

In public/logos, there is a square logo and a rectangular one. The dimensions of the square one are 1024px by 1024px, and the rectangular one is 2176px by 1024px. The rectangular one is the square logo + the word jingdex on the right.

Everything on the demo page of this website should be a guide for how the rest of the app should look, so look at that if guidance is needed. If you would like to add a new element to the demo page, ask.

Always ensure that components and ui elements are accessible from different screen sizes.

Special role permissions are defined in lib/auth/roles.ts.

This app uses pinyin-pro and pinyin-zhuyin.
This app also uses opencc-js to convert between simplified and traditional. For traditional, target tw unless told otherwise.

The user has a setting for whether they prefer simplified/traditional and zhuyin/pinyin. Ensure this setting is applied when one has to be displayed more prominently than the other.

Use the reusable loading primitives in components/loading.tsx for route skeletons, inline pending states, and action feedback; preserve content dimensions and include accessible status announcements.

When adding server-side data fetching, minimize critical-path network round trips: reuse request-scoped auth/profile lookups, run independent queries in parallel, and consolidate dependent query chains with relational selects or Supabase RPCs.

Only edit necessary files for the task.

Use the reusable dictionary short-definition preview logic whenever a compact term summary is needed: prefer short_definition, otherwise use the first line of english_definition, truncate it to 150 characters, and omit the full definition.

If something is created by Jingdex, do not link it to a profile. Otherwise, whenever usernames of users are displayed, they should link to the actual profile. Check how the site is currently wired up if guidance is needed on how it currently works.

When adding an automatic user tag, use a Supabase migration to seed its metadata, extend reconcile_user_automatic_tags and the relevant database triggers for both assignment and removal, and backfill existing profiles; never rely on application code or manual assignment to maintain it.

If there is anything I need to do on my end to complete a task, such as run an sql query in supabase, let me know.
