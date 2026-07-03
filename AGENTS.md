<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


This is an app for learning Chinese, mainly through flashcards.
This app is called "Jingdex" (精dex)
Do not start dev servers. I will do that manually.
Look at globals.css when picking colors and fonts to ensure that everything matches the theme nicely.

This project uses supabase.

In public/logos, there is a square logo and a rectangular one. The dimensions of the square one are 1024px by 1024px, and the rectangular one is 2176px by 1024px. The rectangular one is the square logo + the word jingdex on the right.

Everything on the demo page of this website should be a guide for how the rest of the app should look, so look at that if guidance is needed. If you would like to add a new element to the demo page, ask.

Always ensure that components and ui elements are accessible from different screen sizes.

Special role permissions are defined in lib/auth/roles.ts.

This app uses pinyin-pro and pinyin-zhuyin.
This app also uses opencc-js to convert between simplified and traditional. For traditional, target tw unless told otherwise.

If there is anything I need to do on my end to complete a task, such as run an sql query in supabase, let me know.
