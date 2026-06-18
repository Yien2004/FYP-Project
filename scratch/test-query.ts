import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const { data, error } = await supabaseAdmin.from('facilities').select('*');
  console.log("FACILITIES ROW COUNT:", data ? data.length : 0);
  if (data && data.length > 0) {
    console.log("SAMPLE ROW:", data[0]);
  }
  if (error) console.error("QUERY ERROR:", error);
}
check();
