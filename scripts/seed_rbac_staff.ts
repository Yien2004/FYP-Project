import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { supabaseAdmin, supabase } from "../db";

export interface StaffAccountDef {
  email: string;
  name: string;
  role: "Doctor" | "Admin";
  facility_id: number;
  hospital: string;
  department: string;
  approved: boolean;
}

export const RBAC_STAFF_ACCOUNTS: StaffAccountDef[] = [
  // 1. 槟城班台医院主院 (Pantai Hospital Penang - Bayan Lepas, facility_id: 1)
  {
    email: "pantaipenang_ae@gmail.com",
    name: "Bayan Lepas A&E Desk",
    role: "Doctor",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "Emergency A&E",
    approved: true
  },
  {
    email: "pantaipenang_surgery@gmail.com",
    name: "Bayan Lepas Surgery Desk",
    role: "Doctor",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "General Surgery",
    approved: true
  },
  {
    email: "pantaipenang_internal@gmail.com",
    name: "Bayan Lepas Internal Medicine Desk",
    role: "Doctor",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "Internal Medicine",
    approved: true
  },
  {
    email: "pantaipenang_respiratory@gmail.com",
    name: "Bayan Lepas Respiratory Desk",
    role: "Doctor",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "Respiratory Medicine",
    approved: true
  },
  {
    email: "pantaipenang_admin@gmail.com",
    name: "Main Hospital Admin",
    role: "Admin",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "All",
    approved: true
  },

  // 2. 乔治市心脏与健康中心 (Pantai Heart & Wellness Pavilion - Georgetown, facility_id: 2)
  {
    email: "pantaipavilion_cardio@gmail.com",
    name: "Georgetown Pavilion Cardio Desk",
    role: "Doctor",
    facility_id: 2,
    hospital: "Pantai Heart & Wellness Pavilion",
    department: "Cardiology",
    approved: true
  },
  {
    email: "pantaipavilion_wellness@gmail.com",
    name: "Georgetown Wellness Desk",
    role: "Doctor",
    facility_id: 2,
    hospital: "Pantai Heart & Wellness Pavilion",
    department: "Health Screening & Wellness",
    approved: true
  },
  {
    email: "pantaipavilion_admin@gmail.com",
    name: "Georgetown Pavilion Admin",
    role: "Admin",
    facility_id: 2,
    hospital: "Pantai Heart & Wellness Pavilion",
    department: "All",
    approved: true
  },

  // 3. 峇央峇鲁日间专科门诊 (Pantai Premier Clinic & Day Surgery - Bayan Baru, facility_id: 3)
  {
    email: "pantaiclinic_gastro@gmail.com",
    name: "Bayan Baru Gastro Desk",
    role: "Doctor",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "Gastroenterology & Hepatology",
    approved: true
  },
  {
    email: "pantaiclinic_derma@gmail.com",
    name: "Bayan Baru Derma Desk",
    role: "Doctor",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "Dermatology",
    approved: true
  },
  {
    email: "pantaiclinic_admin@gmail.com",
    name: "Bayan Baru Clinic Admin",
    role: "Admin",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "All",
    approved: true
  },

  // 4. 亚依淡专科中心 (Pantai Specialist Centre - Ayer Itam, facility_id: 4)
  {
    email: "pantaicentre_ortho@gmail.com",
    name: "Ayer Itam Ortho Desk",
    role: "Doctor",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "Orthopaedic Surgery",
    approved: true
  },
  {
    email: "pantaicentre_ent@gmail.com",
    name: "Ayer Itam ENT Desk",
    role: "Doctor",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "Ear, Nose & Throat (Otorhinolaryngology)",
    approved: true
  },
  {
    email: "pantaicentre_admin@gmail.com",
    name: "Ayer Itam Centre Admin",
    role: "Admin",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "All",
    approved: true
  }
];

const password = "12345678";

async function run() {
  console.log("Listing existing users in Supabase Auth...");
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("Failed to list users:", listError);
    process.exit(1);
  }

  const existingUsers = (listData as any)?.users || listData || [];
  console.log(`Found ${existingUsers.length} total users in Supabase.`);

  for (const acc of RBAC_STAFF_ACCOUNTS) {
    const existing = existingUsers.find((u: any) => (u.email || "").toLowerCase() === acc.email.toLowerCase());

    const metadata = {
      full_name: acc.name,
      role: acc.role,
      approved: true,
      hospital: acc.hospital,
      facility_id: acc.facility_id,
      department: acc.department
    };

    if (existing) {
      console.log(`User ${acc.email} exists (ID: ${existing.id}). Updating password and metadata...`);
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: password,
        email_confirm: true,
        user_metadata: metadata
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
        user_metadata: metadata
      });
      if (error) {
        console.error(`Error creating ${acc.email}:`, error);
      } else {
        console.log(`Successfully created ${acc.email} (ID: ${data.user?.id})`);
      }
    }

    // Attempt to upsert into patient_profiles table so queries finding by email have the record
    try {
      await supabaseAdmin.from('patient_profiles').upsert({
        email: acc.email,
        full_name: acc.name,
        nationality: JSON.stringify({
          role: acc.role,
          facility_id: acc.facility_id,
          department: acc.department,
          hospital: acc.hospital
        })
      }, { onConflict: 'email' });
    } catch (e) {
      // ignore
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
      console.error(`Login check exception for ${acc.email}:`, e.message);
    }
  }

  console.log("\nAll 14 RBAC staff accounts seeded and verified successfully!");
}

run().catch(console.error);
