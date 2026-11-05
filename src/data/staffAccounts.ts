import { allPantaiDoctors } from './pantaiHospitalsData';

export interface StaffAccountDef {
  email: string;
  name: string;
  role: "super_admin" | "admin" | "doctor" | "staff" | "Doctor" | "Admin" | "Nurse";
  facility_id: number;
  hospital: string;
  department: string;
  room_number?: string;
  approved: boolean;
}

export const PANTAI_FACILITIES: { id: number; name: string; shortTag: string; location: string }[] = [
  { id: 1, name: "Pantai Hospital Penang (Main Hospital)", shortTag: "Main Hospital", location: "Bayan Lepas" },
  { id: 2, name: "Pantai Heart & Wellness Pavilion", shortTag: "Heart & Wellness", location: "Georgetown" },
  { id: 3, name: "Pantai Premier Clinic & Day Surgery", shortTag: "Premier Clinic", location: "Bayan Baru" },
  { id: 4, name: "Pantai Specialist Centre", shortTag: "Specialist Centre", location: "Ayer Itam" },
];

export function getFacilityIdByHospital(hospitalOrClinicName?: string): number {
  const h = (hospitalOrClinicName || "").toLowerCase().trim();
  if (h.includes("heart") || h.includes("wellness") || h.includes("pavilion") || h.includes("georgetown")) return 2;
  if (h.includes("premier") || h.includes("day surgery") || h.includes("bayan baru")) return 3;
  if (h.includes("specialist") || h.includes("centre") || h.includes("ayer itam") || h.includes("air itam")) return 4;
  return 1; // Default to Facility 1: Pantai Hospital Penang (Main Hospital)
}

export function getHospitalByFacilityId(facilityId: number): string {
  const facility = PANTAI_FACILITIES.find(f => f.id === facilityId);
  return facility ? facility.name : "Pantai Hospital Penang (Main Hospital)";
}

function buildDoctorAccounts(): StaffAccountDef[] {
  const seenEmails = new Set<string>();

  return allPantaiDoctors.map((doc, idx) => {
    const facId = getFacilityIdByHospital(doc.hospital);
    const dept = doc.department || doc.specialty || "General Medicine";

    let email = "";
    const lower = doc.name.toLowerCase();
    if (lower.includes("ainol")) email = "dr_ainol_internal@pantaipenang.com";
    else if (lower.includes("neoh")) email = "dr_neoh_internal@pantaipenang.com";
    else if (lower.includes("lee boon teik")) email = "dr_lee_surgery@pantaipenang.com";
    else if (lower.includes("wong kah sheng")) email = "dr_wong_ae@pantaipenang.com";
    else if (lower.includes("khoo lay hoon")) email = "dr_khoo_respiratory@pantaipenang.com";
    else if (lower.includes("adrian tan")) email = "dr_adrian_cardio@pantaipenang.com";
    else if (lower.includes("simon wong") || lower.includes("simon lo")) email = "dr_simon_wellness@pantaipenang.com";
    else if (lower.includes("ganesan")) email = "dr_ganesan_gastro@pantaipenang.com";
    else if (lower.includes("sarah lim")) email = "dr_lim_derma@pantaipenang.com";
    else if (lower.includes("asha gupta")) email = "dr_asha_ortho@pantaipenang.com";
    else if (lower.includes("balwant")) email = "dr_balwant_ortho@pantaipenang.com";
    else if (lower.includes("tan chee seng")) email = "dr_tan_ent@pantaipenang.com";
    else {
      const cleaned = doc.name.replace(/^(Dato'|Datin|Datuk|Tan Sri Datuk|Tan Sri|Dr\.?|Mr\.?|Ms\.?)\s+/i, "").trim();
      const nameParts = cleaned.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(p => p !== "bin" && p !== "binti" && p !== "bt" && p !== "al" && p !== "ap");
      const mainName = nameParts.slice(0, 2).join("");
      const deptSlug = dept.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "clinic";
      email = `dr_${mainName}_${deptSlug}@pantaipenang.com`;
    }

    if (seenEmails.has(email)) {
      const num = doc.id.replace(/[^0-9]/g, '') || String(idx + 1);
      email = email.replace('@', `${num}@`);
    }
    seenEmails.add(email);

    const roomBase = facId === 1 ? 100 : facId === 2 ? 400 : facId === 3 ? 200 : 300;
    const roomNum = `Consultation Room ${roomBase + ((idx % 25) + 1)}`;

    return {
      email,
      name: doc.name,
      role: "doctor" as const,
      facility_id: facId,
      hospital: doc.hospital,
      department: dept,
      room_number: roomNum,
      approved: true
    };
  });
}

export const RBAC_STAFF_ACCOUNTS: StaffAccountDef[] = [
  // ========================================================
  // 0. GROUP SUPER ADMINISTRATOR (role: 'super_admin' - facility_id: 0 (All Facilities))
  // ========================================================
  {
    email: "superadmin@pantaicare.com",
    name: "PantaiCare Group Super Admin",
    role: "super_admin",
    facility_id: 0,
    hospital: "PantaiCare Healthcare Group (All Facilities)",
    department: "Executive Group Administration",
    room_number: "HQ Suite 100",
    approved: true
  },
  {
    email: "superadmin@gmail.com",
    name: "PantaiCare Super Admin",
    role: "super_admin",
    facility_id: 0,
    hospital: "PantaiCare Healthcare Group (All Facilities)",
    department: "Executive Group Administration",
    room_number: "HQ Suite 100",
    approved: true
  },

  // ========================================================
  // 1. HOSPITAL FRONT COUNTERS (Internal reference)
  // ========================================================
  {
    email: "pantaipenang_frontdesk@gmail.com",
    name: "Main Hospital Front Counter",
    role: "staff",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "All",
    room_number: "Main Front Counter",
    approved: true
  },
  {
    email: "pantaipavilion_frontdesk@gmail.com",
    name: "Pavilion Front Counter",
    role: "staff",
    facility_id: 2,
    hospital: "Pantai Heart & Wellness Pavilion",
    department: "All",
    room_number: "Front Counter",
    approved: true
  },
  {
    email: "pantaiclinic_frontdesk@gmail.com",
    name: "Premier Clinic Front Counter",
    role: "staff",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "All",
    room_number: "Front Counter",
    approved: true
  },
  {
    email: "pantaicentre_frontdesk@gmail.com",
    name: "Specialist Centre Front Counter",
    role: "staff",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "All",
    room_number: "Front Counter",
    approved: true
  },

  // ========================================================
  // 2. CONSULTANT DOCTORS MATCHING PATIENT APPOINTMENT BOOKING PAGE
  // ========================================================
  ...buildDoctorAccounts(),

  // ========================================================
  // 3. BRANCH ADMINISTRATORS (role: 'admin' - facility_id: 1-4)
  // ========================================================
  {
    email: "pantaipenangadmin@gmail.com",
    name: "Main Pantai Hospital Penang Admin",
    role: "admin",
    facility_id: 1,
    hospital: "Pantai Hospital Penang (Main Hospital)",
    department: "Hospital Administration",
    room_number: "Admin Suite 1",
    approved: true
  },
  {
    email: "pantaipavilionadmin@gmail.com",
    name: "Georgetown Pavilion Admin",
    role: "admin",
    facility_id: 2,
    hospital: "Pantai Heart & Wellness Pavilion",
    department: "Hospital Administration",
    room_number: "Admin Suite 2",
    approved: true
  },
  {
    email: "pantaiclinicadmin@gmail.com",
    name: "Bayan Baru Clinic Admin",
    role: "admin",
    facility_id: 3,
    hospital: "Pantai Premier Clinic & Day Surgery",
    department: "Hospital Administration",
    room_number: "Admin Suite 3",
    approved: true
  },
  {
    email: "pantaicentreadmin@gmail.com",
    name: "Ayer Itam Centre Admin",
    role: "admin",
    facility_id: 4,
    hospital: "Pantai Specialist Centre",
    department: "Hospital Administration",
    room_number: "Admin Suite 4",
    approved: true
  }
];

export function getStaffAccountByEmail(email?: string): StaffAccountDef | undefined {
  if (!email) return undefined;
  const clean = email.toLowerCase().trim();
  
  // Direct match in RBAC list
  const found = RBAC_STAFF_ACCOUNTS.find(s => s.email.toLowerCase() === clean);
  if (found) return found;

  // Dynamic session fallback from localStorage for newly onboarded staff / doctors
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const cachedEmail = (localStorage.getItem("lifelink_user_email") || "").toLowerCase().trim();
      if (cachedEmail === clean) {
        const cachedRole = (localStorage.getItem("lifelink_user_role") || "doctor") as any;
        const cachedName = localStorage.getItem("lifelink_user_name") || clean.split("@")[0];
        const cachedHospital = localStorage.getItem("lifelink_user_clinic") || "Pantai Hospital Penang (Main Hospital)";
        const cachedDept = localStorage.getItem("lifelink_user_department") || "General Medicine";
        const cachedRoom = localStorage.getItem("lifelink_user_room") || "Consultation Room 301";
        const cachedFacId = Number(localStorage.getItem("lifelink_facility_id") || "1");

        return {
          email: clean,
          name: cachedName,
          role: cachedRole,
          facility_id: cachedFacId,
          hospital: cachedHospital,
          department: cachedDept,
          room_number: cachedRoom,
          approved: true
        };
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback for Dr Neoh
  if (clean.includes("neoh")) {
    return {
      email: clean,
      name: "Dr Neoh Khek Koun",
      role: "doctor",
      facility_id: 1,
      hospital: "Pantai Hospital Penang (Main Hospital)",
      department: "Internal Medicine",
      room_number: "Consultation Room 301",
      approved: true,
    };
  }

  // Fallback for doctor@hospital.com and staff@hospital.com demo accounts
  if (clean === "doctor@hospital.com") {
    return {
      email: clean,
      name: "Dr. Consultant (Main Hospital)",
      role: "Doctor",
      facility_id: 1,
      hospital: "Pantai Hospital Penang (Main Hospital)",
      department: "All",
      room_number: "Consultation Room 101",
      approved: true,
    };
  }
  if (clean === "staff@hospital.com") {
    return {
      email: clean,
      name: "Front Counter Reception",
      role: "staff",
      facility_id: 1,
      hospital: "Pantai Hospital Penang (Main Hospital)",
      department: "All",
      room_number: "Front Counter",
      approved: true,
    };
  }

  // Fallback for previous legacy accounts
  if (clean === "pantaihospitalpenang@gmail.com") {
    return {
      email: clean,
      name: "Pantai Hospital Penang Staff",
      role: "Doctor",
      facility_id: 1,
      hospital: "Pantai Hospital Penang (Main Hospital)",
      department: "All",
      approved: true,
    };
  }
  if (clean === "pantaiheartwellness@gmail.com") {
    return {
      email: clean,
      name: "Pantai Heart & Wellness Staff",
      role: "Doctor",
      facility_id: 2,
      hospital: "Pantai Heart & Wellness Pavilion",
      department: "All",
      approved: true,
    };
  }
  if (clean === "pantaipremierclinic@gmail.com") {
    return {
      email: clean,
      name: "Pantai Premier Clinic Staff",
      role: "Doctor",
      facility_id: 3,
      hospital: "Pantai Premier Clinic & Day Surgery",
      department: "All",
      approved: true,
    };
  }
  if (clean === "pantaispecialistcentre@gmail.com") {
    return {
      email: clean,
      name: "Pantai Specialist Centre Staff",
      role: "Doctor",
      facility_id: 4,
      hospital: "Pantai Specialist Centre",
      department: "All",
      approved: true,
    };
  }

  return undefined;
}

export function matchesSpecialty(staffDept: string, patientSpecialty: string): boolean {
  if (!staffDept || staffDept.trim().toLowerCase() === "all") return true;
  const s = staffDept.toLowerCase();
  const a = (patientSpecialty || "").toLowerCase();

  if (s === a) return true;
  if (a.includes(s) || s.includes(a)) return true;

  // Department-specific keyword mappings
  if (s.includes("emergency") || s.includes("a&e")) {
    return a.includes("emergency") || a.includes("a&e") || a.includes("trauma") || a.includes("critical");
  }
  if (s.includes("surgery") && !s.includes("ortho")) {
    return a.includes("surgery") || a.includes("surgical") || a.includes("operation");
  }
  if (s.includes("internal")) {
    return a.includes("internal") || a.includes("infectious") || a.includes("metabolic") || a.includes("general medicine");
  }
  if (s.includes("respiratory")) {
    return a.includes("respiratory") || a.includes("pulmonolog") || a.includes("chest") || a.includes("lung");
  }
  if (s.includes("cardio")) {
    return a.includes("cardio") || a.includes("heart") || a.includes("cardiovascular");
  }
  if (s.includes("wellness") || s.includes("screening")) {
    return a.includes("wellness") || a.includes("screening") || a.includes("preventive") || a.includes("health check");
  }
  if (s.includes("gastro") || s.includes("hepatology")) {
    return a.includes("gastro") || a.includes("hepat") || a.includes("digestive") || a.includes("endoscopy");
  }
  if (s.includes("derma")) {
    return a.includes("derma") || a.includes("skin");
  }
  if (s.includes("ortho")) {
    return a.includes("ortho") || a.includes("bone") || a.includes("joint") || a.includes("sports");
  }
  if (s.includes("ent") || s.includes("ear") || s.includes("otorhinolaryngology")) {
    return a.includes("ent") || a.includes("ear") || a.includes("throat") || a.includes("otorhinolaryngology");
  }

  return false;
}

export function getDepartmentQueueCode(deptOrSpecialty?: string): number {
  if (!deptOrSpecialty) return 1;
  const s = deptOrSpecialty.toLowerCase().trim();

  // 1. Internal Medicine
  if (s.includes("internal") || s.includes("nephro") || s.includes("rheumat") || s.includes("endocrin") || s.includes("geriatric")) return 1;

  // 2. Cardiology & Cardiothoracic
  if (s.includes("cardio") || s.includes("heart") || s.includes("electrophysio") || s.includes("vascular")) return 2;

  // 3. General Surgery
  if (s.includes("general surgery") || s.includes("colorectal") || s.includes("git surgery") || s.includes("breast") || s.includes("plastic") || (s.includes("surgery") && !s.includes("ortho") && !s.includes("neuro") && !s.includes("dental") && !s.includes("uro") && !s.includes("cardio"))) return 3;

  // 4. Orthopaedic Surgery
  if (s.includes("orthop") || s.includes("bone") || s.includes("spine") || s.includes("joint") || s.includes("sports medicine") || s.includes("rehab")) return 4;

  // 5. Paediatrics
  if (s.includes("paediat") || s.includes("pediat") || s.includes("child")) return 5;

  // 6. Gastroenterology & Hepatology
  if (s.includes("gastro") || s.includes("hepat") || s.includes("digest") || s.includes("endoscop")) return 6;

  // 7. Dermatology
  if (s.includes("derma") || s.includes("skin")) return 7;

  // 8. Respiratory Medicine
  if (s.includes("respirat") || s.includes("lung") || s.includes("pulmon") || s.includes("chest")) return 8;

  // 9. ENT / Otorhinolaryngology
  if (s.includes("ent") || s.includes("ear") || s.includes("nose") || s.includes("throat") || s.includes("otorhinolaryngology")) return 9;

  // 10. Emergency Medicine / A&E
  if (s.includes("emergenc") || s.includes("a&e") || s.includes("trauma")) return 10;

  // 11. Obstetrics & Gynaecology
  if (s.includes("obstet") || s.includes("gynaec") || s.includes("o&g") || s.includes("women")) return 11;

  // 12. Neurology & Neurosurgery
  if (s.includes("neuro") || s.includes("brain") || s.includes("stroke")) return 12;

  // 13. Oncology
  if (s.includes("oncol") || s.includes("cancer") || s.includes("radiotherap")) return 13;

  // 14. Ophthalmology
  if (s.includes("ophthalm") || s.includes("eye")) return 14;

  // 15. Dentistry
  if (s.includes("dent") || s.includes("oral") || s.includes("orthodont")) return 15;

  // 16. Radiology
  if (s.includes("radiol") || s.includes("imaging") || s.includes("x-ray")) return 16;

  // 17. Anaesthesiology & Critical Care
  if (s.includes("anaesth") || s.includes("anest") || s.includes("critical care") || s.includes("icu")) return 17;

  // 18. Psychiatry
  if (s.includes("psychiat") || s.includes("mental") || s.includes("psychol")) return 18;

  // 19. Urology
  if (s.includes("uro")) return 19;

  // 20. Wellness / Health Screening / General Practice
  if (s.includes("wellness") || s.includes("screening") || s.includes("general") || s.includes("family")) return 20;

  return 1;
}

export function formatQueueNumber(deptCode: number, seq: number): string {
  const seqStr = String(seq).padStart(2, '0');
  return `Q-${deptCode}${seqStr}`;
}

export function parseSlotStartTime(slot?: string): number {
  if (!slot) return 9999;
  const match = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}
