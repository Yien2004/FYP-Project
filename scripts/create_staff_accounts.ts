import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { supabaseAdmin, supabase } from "../db";

const accounts = [
  {
    email: "PantaiHospitalPenang@gmail.com",
    name: "Pantai Hospital Penang Staff",
    hospital: "Pantai Hospital Penang (Main Hospital)",
    role: "Doctor",
    approved: true
  },
  {
    email: "PantaiHeartWellness@gmail.com",
    name: "Pantai Heart & Wellness Staff",
    hospital: "Pantai Heart & Wellness Pavilion",
    role: "Doctor",
    approved: true
  },
  {
    email: "PantaiPremierClinic@gmail.com",
    name: "Pantai Premier Clinic Staff",
    hospital: "Pantai Premier Clinic & Day Surgery",
    role: "Doctor",
    approved: true
  },
  {
    email: "PantaiSpecialistCentre@gmail.com",
    name: "Pantai Specialist Centre Staff",
    hospital: "Pantai Specialist Centre",
    role: "Doctor",
    approved: true
  }
];

const password = "12345678";

async function run() {
  console.log("Listing existing users in Supabase...");
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("Failed to list users:", listError);
    process.exit(1);
  }

  const existingUsers = (listData as any)?.users || listData || [];
  console.log(`Found ${existingUsers.length} total users in Supabase.`);

  for (const acc of accounts) {
    const existing = existingUsers.find((u: any) => (u.email || "").toLowerCase() === acc.email.toLowerCase());

    if (existing) {
      console.log(`User ${acc.email} exists (ID: ${existing.id}). Updating password and metadata...`);
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.name,
          role: acc.role,
          approved: true,
          hospital: acc.hospital
        }
      });
      if (error) {
        console.error(`Error updating ${acc.email}:`, error);
      } else {
        console.log(`Successfully updated ${acc.email}`);
      }
    } else {
      console.log(`Creating user ${acc.email}...`);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.name,
          role: acc.role,
          approved: true,
          hospital: acc.hospital
        }
      });
      if (error) {
        console.error(`Error creating ${acc.email}:`, error);
      } else {
        console.log(`Successfully created ${acc.email} (ID: ${data.user?.id})`);
      }
    }

    // Verify login
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: password
      });
      if (loginError) {
        console.error(`Login check FAILED for ${acc.email}:`, loginError.message);
      } else {
        console.log(`Login check PASSED for ${acc.email} (session: ${!!loginData.session})`);
      }
    } catch (e: any) {
      console.error(`Login exception for ${acc.email}:`, e.message);
    }
  }

  console.log("\nAll 4 staff accounts created / verified successfully!");
}

run();
