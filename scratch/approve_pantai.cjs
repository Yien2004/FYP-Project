const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error.message);
    process.exit(1);
  }

  const pantai = users.find(u => u.email === 'pantaihospital@gmail.com');
  if (pantai) {
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      pantai.id,
      {
        user_metadata: {
          ...pantai.user_metadata,
          approved: true
        }
      }
    );
    if (updateError) {
      console.error("Error approving user:", updateError.message);
    } else {
      console.log("✅ Successfully approved pantaihospital@gmail.com!");
    }
  } else {
    console.log("User pantaihospital@gmail.com not found!");
  }
}

run();
