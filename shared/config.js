/* SkyWorld settings — edit this file only.
   Use the SAME supabaseUrl + supabaseKey in the owner site and in the store site so they share one database.
   Leave them empty to run in "local mode" (data stays inside one browser; both sites must share the same web address). */
window.SW_CONFIG = {
  supabaseUrl: '',   // e.g. 'https://abcdxyz.supabase.co'
  supabaseKey: '',   // the "anon public" key from Supabase -> Project Settings -> API
  storeUrl: ''       // used by the OWNER site's "Open my store" button, e.g. 'https://yourname.github.io/skyworld-store/'
};
