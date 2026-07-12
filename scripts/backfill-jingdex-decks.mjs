import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
const { data: decks, error: decksError } = await supabase
  .from("decks")
  .select("id")
  .eq("created_by", "Jingdex");

if (decksError) {
  console.error(`Could not load Jingdex decks: ${decksError.message}`);
  process.exit(1);
}

if (!decks?.length) {
  console.log("No Jingdex decks need to be registered.");
  process.exit(0);
}

const { error: insertError } = await supabase
  .from("jingdex_decks")
  .upsert(decks.map(({ id }) => ({ deck_id: id })), {
    onConflict: "deck_id",
    ignoreDuplicates: true,
  });

if (insertError) {
  console.error(`Could not register Jingdex decks: ${insertError.message}`);
  process.exit(1);
}

console.log(`Registered ${decks.length} Jingdex deck ID(s).`);
