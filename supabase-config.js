const SUPABASE_URL = "https://bblmuxniukakjlygzlod.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_m39DFRqd4adPCPloueLcIw_o6EYJp_p";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient; 
