process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    const { data, error } = await supabase
      .from("patient_profiles")
      .select("*")
      .limit(1);
      
    if (error) {
      console.error("Error fetching patient profiles:", error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log("Columns in patient_profiles:", Object.keys(data[0]));
    } else {
      console.log("No data in patient_profiles to inspect.");
    }
  } catch (err) {
    console.error("Failed to check schema:", err);
  }
}

checkSchema();
