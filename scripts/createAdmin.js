import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const client = createClient(url, key);
const email = 'admin@gmail.com';
const password = '12345@Tyw';

const result = await client.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: 'System Admin',
    role: 'Admin',
  },
});

if (result.error) {
  if (result.error.message.includes('already exists')) {
    console.log('Admin already exists or email already taken:', result.error.message);
    process.exit(0);
  }
  throw result.error;
}

console.log('Created admin user:', result.data.user?.id || 'no-id');
