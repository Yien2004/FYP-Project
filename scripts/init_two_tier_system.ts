import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { supabaseAdmin, supabase } from "../db";

export interface AccountSeed {
  email: string;
  name: string;
  role: "staff" | "doctor" | "admin";
  facility_id: number;
  hospital: string;
  department: string;
  room_number: string;
}

export const TWO_TIER_ACCOUNTS: AccountSeed[] = [
  // 1. 亚依淡专科中心 (Ayer Itam - Facility 4)
  {
    email: "pantaicentre_frontdesk@gmail.com",
    name: "Ayer Itam Ortho Frontdesk",
    role: "staff",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "Orthopaedic Surgery",
    room_number: "Front Counter"
  },
  {
    email: "dr_asha_ortho@pantaipenang.com",
    name: "Dr. Asha Gupta",
    role: "doctor",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "Orthopaedic Surgery",
    room_number: "Consultation Room 101"
  },
  {
    email: "dr_balwant_ortho@pantaipenang.com",
    name: "Dato' Dr. Balwant Singh",
    role: "doctor",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "Orthopaedic Surgery",
    room_number: "Consultation Room 102"
  },

  // 2. 峇央峇鲁日间专科门诊 (Bayan Baru - Facility 3)
  {
    email: "pantaiclinic_frontdesk@gmail.com",
    name: "Bayan Baru Gastro Frontdesk",
    role: "staff",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "Gastroenterology & Hepatology",
    room_number: "Front Counter"
  },
  {
    email: "dr_ganesan_gastro@pantaipenang.com",
    name: "Dato' Dr. Ganesananthan",
    role: "doctor",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "Gastroenterology & Hepatology",
    room_number: "Consultation Room 201"
  },

  // 3. 槟城主院 (Bayan Lepas - Facility 1)
  {
    email: "pantaipenang_frontdesk@gmail.com",
    name: "Main Hospital Frontdesk",
    role: "staff",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "Internal Medicine",
    room_number: "Main Counter"
  },
  {
    email: "dr_ainol_internal@pantaipenang.com",
    name: "Dr. Ainol Shareha",
    role: "doctor",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "Internal Medicine",
    room_number: "Consultation Room 301"
  },
  {
    email: "pantaipenang_admin@gmail.com",
    name: "Main Hospital Admin",
    role: "admin",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "All",
    room_number: "Admin Suite"
  }
];

const PASSWORD = "12345678";

async function main() {
  console.log("=== 1. Seeding Supabase Auth for Two-Tier Architecture ===");

  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("Failed to list users:", listError);
    process.exit(1);
  }

  const existingUsers = (listData as any)?.users || listData || [];
  console.log(`Found ${existingUsers.length} total users in Supabase.`);

  const userIds: Record<string, string> = {};

  for (const acc of TWO_TIER_ACCOUNTS) {
    const existing = existingUsers.find((u: any) => (u.email || "").toLowerCase() === acc.email.toLowerCase());

    const metadata = {
      full_name: acc.name,
      fullName: acc.name,
      role: acc.role,
      approved: true,
      hospital: acc.hospital,
      facility_id: acc.facility_id,
      department: acc.department,
      room_number: acc.room_number
    };

    let uid = "";
    if (existing) {
      console.log(`Updating ${acc.email} (${acc.role})...`);
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: metadata
      });
      if (error) {
        console.error(`Error updating ${acc.email}:`, error);
      } else {
        uid = existing.id;
        console.log(`Updated ${acc.email}`);
      }
    } else {
      console.log(`Creating ${acc.email} (${acc.role})...`);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: metadata
      });
      if (error) {
        console.error(`Error creating ${acc.email}:`, error);
      } else {
        uid = data.user?.id || "";
        console.log(`Created ${acc.email} (ID: ${uid})`);
      }
    }

    if (uid) userIds[acc.email] = uid;

    // Verify login
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: PASSWORD
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

  console.log("\n=== 2. Creating Sample Today Appointments for Doctor Queues ===");
  const todayStr = new Date().toISOString().split("T")[0];

  const testAppointments = [
    // Ayer Itam - Orthopaedic Surgery - Dr. Asha Gupta (Room 101)
    {
      patient_name: "Tan Ah Teck",
      doctor_id: userIds["dr_asha_ortho@pantaipenang.com"] || "dr-asha-ortho-id",
      doctor_name: "Dr. Asha Gupta",
      specialty: "Orthopaedic Surgery",
      date: todayStr,
      time_slot: "09:30 AM",
      status: "Upcoming",
      type: "In-Clinic Specialist Consultation",
      symptoms: JSON.stringify({
        symptoms: "Acute right knee trauma after badminton match, intense joint swelling and inability to bear full weight.",
        clinic: "Pantai Specialist Centre",
        queueNumber: "#Q-101",
        checkedIn: false,
        checkInTime: "",
        roomNumber: "Consultation Room 101",
        doctorEmail: "dr_asha_ortho@pantaipenang.com",
        facility_id: 4,
        triage: {
          chiefComplaint: "Acute right knee swelling & pain following sports impact",
          urgencyLevel: "Priority Referral",
          score: 78,
          preliminaryDiagnosis: "Suspected Right Knee Anterior Cruciate Ligament (ACL) or Medial Meniscus Tear",
          careyAssessment: "Patient reports audible pop sound during sudden pivot motion with rapid effusion within 2 hours. Joint aspiration and mechanical stability testing required.",
          recommendations: [
            "Lachman test & Anterior Drawer examination",
            "Urgent non-contrast MRI Right Knee",
            "Temporary knee brace immobilization and crutches offloading"
          ]
        }
      })
    },
    // Ayer Itam - Orthopaedic Surgery - Dato' Dr. Balwant Singh (Room 102)
    {
      patient_name: "Siti Nurhaliza Binti Kassim",
      doctor_id: userIds["dr_balwant_ortho@pantaipenang.com"] || "dr-balwant-ortho-id",
      doctor_name: "Dato' Dr. Balwant Singh",
      specialty: "Orthopaedic Surgery",
      date: todayStr,
      time_slot: "10:15 AM",
      status: "Upcoming",
      type: "In-Clinic Specialist Consultation",
      symptoms: JSON.stringify({
        symptoms: "Chronic lumbar spine pain radiating down left sciatic nerve for 3 weeks, aggravated by forward flexion.",
        clinic: "Pantai Specialist Centre",
        queueNumber: "#Q-102",
        checkedIn: false,
        checkInTime: "",
        roomNumber: "Consultation Room 102",
        doctorEmail: "dr_balwant_ortho@pantaipenang.com",
        facility_id: 4,
        triage: {
          chiefComplaint: "Lower back pain with left L5-S1 radiculopathy",
          urgencyLevel: "Standard Specialty",
          score: 64,
          preliminaryDiagnosis: "Lumbar Disc Herniation (L5-S1) with Sciatic Nerve Compression",
          careyAssessment: "Radicular distribution along lateral thigh down to great toe. Positive straight leg raise test indicated in primary screening.",
          recommendations: [
            "Straight Leg Raise (Lasègue's sign) & Slump test confirmation",
            "Lumbosacral spine MRI without contrast",
            "Prescribe short course NSAIDs & neuropathic analgesia"
          ]
        }
      })
    },
    // Ayer Itam - Orthopaedic Surgery - Dr. Asha Gupta (Room 101) - 2nd patient
    {
      patient_name: "Kumar Sanu a/l Raman",
      doctor_id: userIds["dr_asha_ortho@pantaipenang.com"] || "dr-asha-ortho-id",
      doctor_name: "Dr. Asha Gupta",
      specialty: "Orthopaedic Surgery",
      date: todayStr,
      time_slot: "11:00 AM",
      status: "Upcoming",
      type: "In-Clinic Specialist Consultation",
      symptoms: JSON.stringify({
        symptoms: "Left shoulder impingement and sharp pain when lifting arm above 90 degrees.",
        clinic: "Pantai Specialist Centre",
        queueNumber: "#Q-103",
        checkedIn: false,
        checkInTime: "",
        roomNumber: "Consultation Room 101",
        doctorEmail: "dr_asha_ortho@pantaipenang.com",
        facility_id: 4,
        triage: {
          chiefComplaint: "Subacromial shoulder pain and restricted abduction",
          urgencyLevel: "Standard Specialty",
          score: 58,
          preliminaryDiagnosis: "Rotator Cuff Tendinopathy / Subacromial Bursitis",
          careyAssessment: "Painful arc sign positive between 60°-120°. Neer's and Hawkins-Kennedy tests recommended.",
          recommendations: [
            "Diagnostic ultrasound or MRI of left shoulder",
            "Targeted rotator cuff physical therapy"
          ]
        }
      })
    },
    // Bayan Baru - Gastroenterology & Hepatology - Dato' Dr. Ganesananthan (Room 201)
    {
      patient_name: "Wong Mei Ling",
      doctor_id: userIds["dr_ganesan_gastro@pantaipenang.com"] || "dr-ganesan-gastro-id",
      doctor_name: "Dato' Dr. Ganesananthan",
      specialty: "Gastroenterology & Hepatology",
      date: todayStr,
      time_slot: "09:45 AM",
      status: "Upcoming",
      type: "In-Clinic Specialist Consultation",
      symptoms: JSON.stringify({
        symptoms: "Recurrent burning epigastric discomfort, postprandial fullness and acid regurgitation for 1 month.",
        clinic: "Pantai Premier Clinic & Day Surgery",
        queueNumber: "#Q-201",
        checkedIn: false,
        checkInTime: "",
        roomNumber: "Consultation Room 201",
        doctorEmail: "dr_ganesan_gastro@pantaipenang.com",
        facility_id: 3,
        triage: {
          chiefComplaint: "GERD / Dyspepsia syndrome refractory to OTC antacids",
          urgencyLevel: "Standard Specialty",
          score: 55,
          preliminaryDiagnosis: "Gastroesophageal Reflux Disease (GERD) with Gastritis",
          careyAssessment: "No alarm symptoms (no dysphagia, weight loss, or melena). High likelihood of peptic acid mucosal injury.",
          recommendations: [
            "Consider diagnostic Upper GI Endoscopy (OGDS) if symptoms persist",
            "Initiate high-dose Proton Pump Inhibitor (PPI)"
          ]
        }
      })
    },
    // Bayan Lepas Main Hospital - Internal Medicine - Dr. Ainol Shareha (Room 301)
    {
      patient_name: "Ahmad Danish Bin Razali",
      doctor_id: userIds["dr_ainol_internal@pantaipenang.com"] || "dr-ainol-internal-id",
      doctor_name: "Dr. Ainol Shareha",
      specialty: "Internal Medicine",
      date: todayStr,
      time_slot: "10:30 AM",
      status: "Upcoming",
      type: "In-Clinic Specialist Consultation",
      symptoms: JSON.stringify({
        symptoms: "Prolonged low-grade fever with fatigue, mild productive cough and body aches for 5 days.",
        clinic: "Pantai Hospital Penang (Main Hospital)",
        queueNumber: "#Q-301",
        checkedIn: false,
        checkInTime: "",
        roomNumber: "Consultation Room 301",
        doctorEmail: "dr_ainol_internal@pantaipenang.com",
        facility_id: 1,
        triage: {
          chiefComplaint: "Subacute viral or bacterial upper respiratory infection",
          urgencyLevel: "Standard Specialty",
          score: 60,
          preliminaryDiagnosis: "Community-acquired Bronchitis / Atypical Viral Illness",
          careyAssessment: "Vital signs stable, oxygen saturation 98%. Chest auscultation recommended to rule out focal consolidation.",
          recommendations: [
            "Full Blood Count (FBC) and inflammatory markers (CRP)",
            "Chest X-Ray PA view",
            "Supportive symptomatic bronchodilator & hydration therapy"
          ]
        }
      })
    }
  ];

  for (const apt of testAppointments) {
    // Check if appointment with same queueNumber already exists for today
    const { data: existingApt } = await supabaseAdmin
      .from("appointments")
      .select("id, symptoms")
      .eq("date", todayStr);

    let found = false;
    if (existingApt && existingApt.length > 0) {
      for (const row of existingApt) {
        if (row.symptoms && row.symptoms.includes(JSON.parse(apt.symptoms).queueNumber)) {
          found = true;
          console.log(`Appointment ${JSON.parse(apt.symptoms).queueNumber} already exists (ID: ${row.id}). Updating...`);
          await supabaseAdmin.from("appointments").update({
            doctor_name: apt.doctor_name,
            specialty: apt.specialty,
            time_slot: apt.time_slot,
            status: apt.status,
            symptoms: apt.symptoms
          }).eq("id", row.id);
          break;
        }
      }
    }

    if (!found) {
      console.log(`Inserting appointment ${JSON.parse(apt.symptoms).queueNumber} for ${apt.patient_name}...`);
      const { data, error } = await supabaseAdmin.from("appointments").insert(apt).select().single();
      if (error) {
        console.error(`Error inserting appointment:`, error.message);
      } else {
        console.log(`Created appointment ${JSON.parse(apt.symptoms).queueNumber} (ID: ${data.id})`);
      }
    }
  }

  console.log("\n=== Two-Tier Architecture Data Initialized Successfully ===");
}

main().catch(console.error);
