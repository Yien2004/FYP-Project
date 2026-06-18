import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspect() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("Error fetching patient_profiles:", error);
    } else {
      console.log("patient_profiles row:", data);
      if (data && data[0]) {
        console.log("Columns:", Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error("Inspect error:", e);
  }
}

inspect();
