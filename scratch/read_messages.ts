import { supabaseAdmin } from '../db';

async function run() {
  try {
    console.log("Fetching messages from Supabase...");
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching messages:", error.message);
      return;
    }
    
    console.log(`Found ${messages?.length || 0} messages:`);
    console.log(JSON.stringify(messages, null, 2));
  } catch (err: any) {
    console.error("Error running script:", err.message);
  }
}

run();
