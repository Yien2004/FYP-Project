// Auto-generated Pantai Hospitals and Doctors dataset (Penang Single-Hospital Directive)
export interface PantaiHospital {
  id: string;
  name: string;
  type: string;
  tag: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  services: string[];
  gradient: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

export interface PantaiDoctor {
  id: string;
  name: string;
  department: string;
  specialty: string;
  hospital: string;
  status: "Resident" | "Sessional" | "Visiting" | string;
  avatar: string;
  title: string;
  availability?: string;
  experience?: string;
  rating?: number;
  reviews?: number;
  bio?: string;
}

export const allPantaiHospitals: PantaiHospital[] = [
  {
    "id": "ph-penang",
    "name": "Pantai Hospital Penang (Main Hospital)",
    "type": "Tertiary Multi-Specialty Hospital",
    "tag": "Bayan Lepas (Main Hospital)",
    "address": "82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang",
    "phone": "04-643 3888",
    "hours": "Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)",
    "description": "The flagship tertiary medical center of the PantaiCare network in Penang, providing comprehensive 24/7 inpatient, emergency, and surgical services.",
    "services": [
      "Cardiology",
      "Cardiothoracic Surgery",
      "General Surgery",
      "Neurology",
      "Clinical Oncology",
      "24/7 Emergency"
    ],
    "gradient": "from-teal-600 to-cyan-700",
    "city": "Bayan Lepas",
    "state": "Pulau Pinang",
    "lat": 5.321389,
    "lng": 100.284722
  },
  {
    "id": "pantai-pavilion",
    "name": "Pantai Heart & Wellness Pavilion",
    "type": "Cardiovascular & Wellness Pavilion",
    "tag": "Georgetown Branch",
    "address": "128, Jalan Burma, 10050 Georgetown, Pulau Pinang",
    "phone": "04-226 7888",
    "hours": "Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM",
    "description": "Specialized cardiovascular, metabolic health, and preventive wellness pavilion situated in central Georgetown.",
    "services": [
      "Cardiology",
      "Endocrinology",
      "Internal Medicine",
      "Health Screening & Wellness"
    ],
    "gradient": "from-sky-500 to-blue-600",
    "city": "Georgetown",
    "state": "Pulau Pinang",
    "lat": 5.4208,
    "lng": 100.3201
  },
  {
    "id": "pantai-premier",
    "name": "Pantai Premier Clinic & Day Surgery",
    "type": "Ambulatory & Day Surgery Centre",
    "tag": "Bayan Baru Branch",
    "address": "1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang",
    "phone": "04-641 2288",
    "hours": "Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM",
    "description": "Ambulatory surgical and outpatient specialist hub providing rapid GI endoscopies, minor surgeries, dermatology, dental surgery, and family medicine.",
    "services": [
      "Gastroenterology & Hepatology",
      "Upper GI Surgery / Colorectal Surgery",
      "Dermatology",
      "Plastic Surgery",
      "Dental Surgery & Dentistry",
      "General Practice / Family Medicine"
    ],
    "gradient": "from-teal-500 to-emerald-600",
    "city": "Bayan Baru",
    "state": "Pulau Pinang",
    "lat": 5.3262,
    "lng": 100.2905
  },
  {
    "id": "pantai-specialist",
    "name": "Pantai Specialist Centre",
    "type": "Outpatient Specialist Centre",
    "tag": "Ayer Itam Branch",
    "address": "588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang",
    "phone": "04-828 5588",
    "hours": "Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed",
    "description": "Center of excellence for orthopedic trauma, sports medicine, post-operative rehabilitation, ENT, and ophthalmology.",
    "services": [
      "Orthopedic Surgery",
      "Sports Medicine",
      "Rehabilitation Medicine",
      "Ear, Nose & Throat (Otorhinolaryngology)",
      "Ophthalmology"
    ],
    "gradient": "from-blue-600 to-indigo-700",
    "city": "Ayer Itam",
    "state": "Pulau Pinang",
    "lat": 5.4051,
    "lng": 100.2829
  }
];

export const allPantaiDoctors: PantaiDoctor[] = [
  {
    "id": "php-doc-1",
    "name": "Dato' Dr Adnan Bin Ramli",
    "department": "Clinical Radiology",
    "specialty": "Clinical Radiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "AB",
    "title": "Resident Consultant - Clinical Radiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-2",
    "name": "Dr Ainol Shareha Binti Sahar",
    "department": "Internal Medicine",
    "specialty": "Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "AS",
    "title": "Resident Consultant - Internal Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-3",
    "name": "Dr Alfred Charles Poey",
    "department": "Cardiothoracic Surgery",
    "specialty": "Cardiothoracic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "AC",
    "title": "Resident Consultant - Cardiothoracic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-4",
    "name": "Dr Awangku Bakhrunnuddin Bin Pengiran Ahmad Tajuddin",
    "department": "Cardiology, Internal Medicine",
    "specialty": "Cardiology, Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "AB",
    "title": "Resident Consultant - Cardiology, Internal Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-5",
    "name": "Dr Balkees Binti Abdul Majeed",
    "department": "General Paediatrics",
    "specialty": "General Paediatrics",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "BB",
    "title": "Resident Consultant - General Paediatrics",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-6",
    "name": "Mr Boon Huck Wee",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "BH",
    "title": "Resident Consultant - Orthopaedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-7",
    "name": "Dr. Boon Kah Yoong",
    "department": "Anaesthesiology & Critical Care",
    "specialty": "Anaesthesiology & Critical Care",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "BK",
    "title": "Resident Consultant - Anaesthesiology & Critical Care",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-8",
    "name": "Dr Chan Lee Pon",
    "department": "General Paediatrics",
    "specialty": "General Paediatrics",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "CL",
    "title": "Resident Consultant - General Paediatrics",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-9",
    "name": "Dr Chan Tha A Hing",
    "department": "Internal Medicine, Respiratory Medicine",
    "specialty": "Internal Medicine, Respiratory Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "CT",
    "title": "Resident Consultant - Internal Medicine, Respiratory Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-10",
    "name": "Dr Chee Wei Shen",
    "department": "Cardiology, Electrophysiology, Internal Medicine",
    "specialty": "Cardiology, Electrophysiology, Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "CW",
    "title": "Sessional Consultant - Cardiology, Electrophysiology, Internal Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-11",
    "name": "Dr. (Mr.) Chew Yu Wei",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "CY",
    "title": "Resident Consultant - Orthopaedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-12",
    "name": "Dr Chiam Keng Hoong",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "CK",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-13",
    "name": "Dr Choo Chin Yin",
    "department": "Orthopaedic - Arthroscopy & Sport Surgery",
    "specialty": "Orthopaedic - Arthroscopy & Sport Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "CC",
    "title": "Resident Consultant - Orthopaedic - Arthroscopy & Sport Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-14",
    "name": "Dr Elsa Jasmin Binti Roslan",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "EJ",
    "title": "Resident Consultant - General Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-15",
    "name": "Dr Eric Tang Boon Kiat",
    "department": "Anaesthesiology & Critical Care",
    "specialty": "Anaesthesiology & Critical Care",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "ET",
    "title": "Resident Consultant - Anaesthesiology & Critical Care",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-16",
    "name": "Dr Eric Yong Ngai Yin",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "EY",
    "title": "Resident Consultant - General Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-17",
    "name": "Dr Farhat Aziz Khan",
    "department": "Clinical Oncology, Oncology - Radiation",
    "specialty": "Clinical Oncology, Oncology - Radiation",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "FA",
    "title": "Resident Consultant - Clinical Oncology, Oncology - Radiation",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-18",
    "name": "Dr Fawziah Binti Tan Sri Dato Ishak",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "FB",
    "title": "Resident Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-19",
    "name": "Dr Gee Teak Sheng",
    "department": "Neurosurgery, Spine Surgery",
    "specialty": "Neurosurgery, Spine Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "GT",
    "title": "Resident Consultant - Neurosurgery, Spine Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-20",
    "name": "Dr Git Kah Ann",
    "department": "Urology",
    "specialty": "Urology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "GK",
    "title": "Resident Consultant - Urology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-21",
    "name": "Dr Hannah Saw Joo Ee",
    "department": "Plastic & Reconstructive Surgery",
    "specialty": "Plastic & Reconstructive Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "HS",
    "title": "Resident Consultant - Plastic & Reconstructive Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-22",
    "name": "Dr Hasanah Bt Ishak",
    "department": "General Paediatrics, Paediatric Cardiology",
    "specialty": "General Paediatrics, Paediatric Cardiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "HB",
    "title": "Resident Consultant - General Paediatrics, Paediatric Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-23",
    "name": "Dr Jamaludin Bin Mohamad",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "JB",
    "title": "Resident Consultant - Orthopaedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-24",
    "name": "Dr. Jasvinder Kaur",
    "department": "General Paediatrics, Paediatric Cardiology",
    "specialty": "General Paediatrics, Paediatric Cardiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "JK",
    "title": "Resident Consultant - General Paediatrics, Paediatric Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-25",
    "name": "Dr Julian Tan Li Kwang",
    "department": "Neurosurgery",
    "specialty": "Neurosurgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "JT",
    "title": "Sessional Consultant - Neurosurgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-26",
    "name": "Dr Kan Choon Hong",
    "department": "Neurosurgery, Spine Surgery",
    "specialty": "Neurosurgery, Spine Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "KC",
    "title": "Resident Consultant - Neurosurgery, Spine Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-27",
    "name": "Ms Kang Jia Yi",
    "department": "Allied Health - Clinical Psychology",
    "specialty": "Allied Health - Clinical Psychology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "KJ",
    "title": "Resident Consultant - Allied Health - Clinical Psychology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-28",
    "name": "Dr. Kew Chen Hui",
    "department": "Dermatology, Internal Medicine",
    "specialty": "Dermatology, Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "KC",
    "title": "Resident Consultant - Dermatology, Internal Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-29",
    "name": "Dr Khaw Chern Wern James",
    "department": "General Surgery, Colorectal Surgery",
    "specialty": "General Surgery, Colorectal Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "KC",
    "title": "Sessional Consultant - General Surgery, Colorectal Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-30",
    "name": "Dr. Khoo Hui Ying",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "KH",
    "title": "Sessional Consultant - General Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-31",
    "name": "Dr Lai Huey Yoke",
    "department": "Dentistry",
    "specialty": "Dentistry",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LH",
    "title": "Resident Consultant - Dentistry",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-32",
    "name": "Dr Law Lay Fen",
    "department": "Clinical Radiology",
    "specialty": "Clinical Radiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LL",
    "title": "Resident Consultant - Clinical Radiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-33",
    "name": "Mr Lee Foo Hoon",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LF",
    "title": "Resident Consultant - Orthopaedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-34",
    "name": "Dr Lee Kian Guan",
    "department": "Internal Medicine, Nephrology (Renal Medicine)",
    "specialty": "Internal Medicine, Nephrology (Renal Medicine)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LK",
    "title": "Resident Consultant - Internal Medicine, Nephrology (Renal Medicine)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-35",
    "name": "Dr Lee Soon Kiat",
    "department": "Anaesthesiology & Critical Care",
    "specialty": "Anaesthesiology & Critical Care",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LS",
    "title": "Resident Consultant - Anaesthesiology & Critical Care",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-36",
    "name": "Ms Lee Xiao Shiang",
    "department": "Allied Health - Clinical Psychology",
    "specialty": "Allied Health - Clinical Psychology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "LX",
    "title": "Sessional Consultant - Allied Health - Clinical Psychology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-37",
    "name": "Dr Liew Chee Tat",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LC",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-38",
    "name": "Dr Liew Kean Chiew",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LK",
    "title": "Resident Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-39",
    "name": "Dr Lim Chee Chong",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LC",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-40",
    "name": "Dr Lim Guan Choon",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LG",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-41",
    "name": "Dr Lim Lay Ang",
    "department": "Internal Medicine, Endocrinology",
    "specialty": "Internal Medicine, Endocrinology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "LL",
    "title": "Sessional Consultant - Internal Medicine, Endocrinology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-42",
    "name": "Dr Lim Yueh Ni",
    "department": "Clinical Oncology, Oncology - Radiation",
    "specialty": "Clinical Oncology, Oncology - Radiation",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LY",
    "title": "Resident Consultant - Clinical Oncology, Oncology - Radiation",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-43",
    "name": "Dr Looi Chee Kheong",
    "department": "Dentistry",
    "specialty": "Dentistry",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LC",
    "title": "Resident Consultant - Dentistry",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-44",
    "name": "Dr Low Keng Joo",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "LK",
    "title": "Resident Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-45",
    "name": "Dr. (Mr.) Mah Kok Keong",
    "department": "Orthopaedic Surgery, Hand, Upper Limb & Microsurgery",
    "specialty": "Orthopaedic Surgery, Hand, Upper Limb & Microsurgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "MK",
    "title": "Resident Consultant - Orthopaedic Surgery, Hand, Upper Limb & Microsurgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-46",
    "name": "Dr Neeraj Kumar N Krishna Kumar",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "NK",
    "title": "Sessional Consultant - General Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-47",
    "name": "Dr Neoh Khek Koun",
    "department": "Internal Medicine",
    "specialty": "Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "NK",
    "title": "Resident Consultant - Internal Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-48",
    "name": "Dr Ng Thong Pin",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "NT",
    "title": "Sessional Consultant - Orthopaedic Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-49",
    "name": "Dr Ng Yin Ping",
    "department": "Psychiatry",
    "specialty": "Psychiatry",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "NY",
    "title": "Resident Consultant - Psychiatry",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-50",
    "name": "Dr Noor Purdah binti Abdul Kadir",
    "department": "Gastroenterology & Hepatology, Internal Medicine",
    "specialty": "Gastroenterology & Hepatology, Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "NP",
    "title": "Sessional Consultant - Gastroenterology & Hepatology, Internal Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-51",
    "name": "Dr Rm Udayar Pandian A/L Ramachandhiran",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "RU",
    "title": "Sessional Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-52",
    "name": "Dr Rosita Binti Ramli",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "RB",
    "title": "Resident Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-53",
    "name": "Dr. Sanjeevan Radhakrishnan",
    "department": "Orthopaedic Surgery, Orthopaedic Oncology & Reconstructive Surgery",
    "specialty": "Orthopaedic Surgery, Orthopaedic Oncology & Reconstructive Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "SR",
    "title": "Sessional Consultant - Orthopaedic Surgery, Orthopaedic Oncology & Reconstructive Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-54",
    "name": "Dr. Saravanan Krishinan",
    "department": "Cardiology, Internal Medicine",
    "specialty": "Cardiology, Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "SK",
    "title": "Sessional Consultant - Cardiology, Internal Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-55",
    "name": "Dr Saw Chong Beng",
    "department": "Interventional Radiology",
    "specialty": "Interventional Radiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "SC",
    "title": "Resident Consultant - Interventional Radiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-56",
    "name": "Dr See Sze Shien",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "SS",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-57",
    "name": "Dr. Shahul Hamid Bin K A Ahmadsah",
    "department": "Cardiology, Internal Medicine",
    "specialty": "Cardiology, Internal Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "SH",
    "title": "Resident Consultant - Cardiology, Internal Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-58",
    "name": "Dr Shanker A/L Ar. Sn. Sathappan",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "SA",
    "title": "Resident Consultant - General Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-59",
    "name": "Dr Shazril Imran Bin Shaukat",
    "department": "Oncology, Radiotherapy",
    "specialty": "Oncology, Radiotherapy",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "SI",
    "title": "Sessional Consultant - Oncology, Radiotherapy",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-60",
    "name": "Dr Soon Tong Oon",
    "department": "Clinical Radiology",
    "specialty": "Clinical Radiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "ST",
    "title": "Resident Consultant - Clinical Radiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-61",
    "name": "Dr Sudhagar A/L Krishinan",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "SA",
    "title": "Sessional Consultant - Orthopaedic Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-62",
    "name": "Dr Tan Ai Lian",
    "department": "Clinical Oncology, Oncology - Radiation",
    "specialty": "Clinical Oncology, Oncology - Radiation",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "TA",
    "title": "Sessional Consultant - Clinical Oncology, Oncology - Radiation",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-63",
    "name": "Dr Tan Boon Seang",
    "department": "Clinical Oncology, Oncology - Radiation",
    "specialty": "Clinical Oncology, Oncology - Radiation",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "TB",
    "title": "Sessional Consultant - Clinical Oncology, Oncology - Radiation",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-64",
    "name": "Dr Tan Chia Chia",
    "department": "General Paediatrics",
    "specialty": "General Paediatrics",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "TC",
    "title": "Sessional Consultant - General Paediatrics",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-65",
    "name": "Dr Tan Jin Keat",
    "department": "Anaesthesiology & Critical Care",
    "specialty": "Anaesthesiology & Critical Care",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "TJ",
    "title": "Resident Consultant - Anaesthesiology & Critical Care",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-66",
    "name": "Dr Tan Jin Poi",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "TJ",
    "title": "Resident Consultant - Ophthalmology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-67",
    "name": "Dr Tan Jun Wen",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "TJ",
    "title": "Resident Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-68",
    "name": "Dr Tan Swee Wei",
    "department": "General Paediatrics, Paediatric Respiratory Medicine",
    "specialty": "General Paediatrics, Paediatric Respiratory Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "TS",
    "title": "Resident Consultant - General Paediatrics, Paediatric Respiratory Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-69",
    "name": "Dr Tang Chee Chuan",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "TC",
    "title": "Resident Consultant - General Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-70",
    "name": "Dr Terrence Cheng Yen Wee",
    "department": "Anaesthesiology & Critical Care",
    "specialty": "Anaesthesiology & Critical Care",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "TC",
    "title": "Resident Consultant - Anaesthesiology & Critical Care",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-71",
    "name": "Dr. Thiam Chiann Ni",
    "department": "Internal Medicine, Geriatric Medicine",
    "specialty": "Internal Medicine, Geriatric Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "TC",
    "title": "Sessional Consultant - Internal Medicine, Geriatric Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-72",
    "name": "Dr. Victor Lim Ban Jin",
    "department": "Emergency Medicine",
    "specialty": "Emergency Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "VL",
    "title": "Resident Consultant - Emergency Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-73",
    "name": "Dr Wan Mohd Ashraf bin Abdul Rauf",
    "department": "Sports Medicine",
    "specialty": "Sports Medicine",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "WM",
    "title": "Sessional Consultant - Sports Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-74",
    "name": "Dr William Ong Lay Keat",
    "department": "Urology",
    "specialty": "Urology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "WO",
    "title": "Resident Consultant - Urology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-75",
    "name": "Mr Wong Chee Leong",
    "department": "Orthopaedic Surgery",
    "specialty": "Orthopaedic Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "WC",
    "title": "Resident Consultant - Orthopaedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-76",
    "name": "Dr Wong Choy Hoong",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "WC",
    "title": "Sessional Consultant - Ophthalmology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-77",
    "name": "Dr. Wong Chun Mun",
    "department": "Internal Medicine, Nephrology (Renal Medicine)",
    "specialty": "Internal Medicine, Nephrology (Renal Medicine)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "WC",
    "title": "Resident Consultant - Internal Medicine, Nephrology (Renal Medicine)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-78",
    "name": "Dr Wong Kep Kee @ Jeffry Paul Wong",
    "department": "Anaesthesiology & Critical Care",
    "specialty": "Anaesthesiology & Critical Care",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "WK",
    "title": "Resident Consultant - Anaesthesiology & Critical Care",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-79",
    "name": "Dr Wong Yee Choon",
    "department": "Neurology",
    "specialty": "Neurology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "WY",
    "title": "Resident Consultant - Neurology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-80",
    "name": "Dr WONG YIM CHAN",
    "department": "Psychiatry, Child & Adolescent Psychiatry",
    "specialty": "Psychiatry, Child & Adolescent Psychiatry",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "WY",
    "title": "Sessional Consultant - Psychiatry, Child & Adolescent Psychiatry",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-81",
    "name": "Dr Yap Soo Shu",
    "department": "Clinical Radiology",
    "specialty": "Clinical Radiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "YS",
    "title": "Resident Consultant - Clinical Radiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-82",
    "name": "Dr Yeap Geok Bean",
    "department": "Obstetrics & Gynaecology (O&G)",
    "specialty": "Obstetrics & Gynaecology (O&G)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "YG",
    "title": "Resident Consultant - Obstetrics & Gynaecology (O&G)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-83",
    "name": "Dr Yeoh Si Han",
    "department": "Allied Health - Clinical Psychology",
    "specialty": "Allied Health - Clinical Psychology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "YS",
    "title": "Sessional Consultant - Allied Health - Clinical Psychology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-84",
    "name": "Dr Yeoh Whei Chuern",
    "department": "Internal Medicine, Rheumatology",
    "specialty": "Internal Medicine, Rheumatology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Sessional",
    "avatar": "YW",
    "title": "Sessional Consultant - Internal Medicine, Rheumatology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "php-doc-85",
    "name": "Dr Yeoh Wooi Pin",
    "department": "General Surgery",
    "specialty": "General Surgery",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "YW",
    "title": "Resident Consultant - General Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-86",
    "name": "Dr Yeoh Ze Ming",
    "department": "Clinical Radiology",
    "specialty": "Clinical Radiology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "YZ",
    "title": "Resident Consultant - Clinical Radiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-87",
    "name": "Dr. Yew Yih Chian",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "YY",
    "title": "Resident Consultant - Ophthalmology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "php-doc-88",
    "name": "Dr Zulkefli Bin Hussein",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Hospital Penang (Main Hospital)",
    "status": "Resident",
    "avatar": "ZB",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-16",
    "name": "Datuk Dr. Arumugam Nachiappan",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "DA",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-43",
    "name": "Dr. Ernest Ng Wee Oon",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "EN",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-44",
    "name": "Dr. Faizal Khan",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "FK",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-101",
    "name": "Dr Lim Sue Wen",
    "department": "Endocrinology",
    "specialty": "Endocrinology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "LS",
    "title": "Resident Consultant - Endocrinology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-123",
    "name": "Dr. Muhammad Imran Bin Abdul Hafidz",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "MI",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-134",
    "name": "Dr. Ng Wai Kiat",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "NW",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-137",
    "name": "Dr. Juita Hassan",
    "department": "Internal Medicine, Intensive Care Medicine",
    "specialty": "Internal Medicine, Intensive Care Medicine",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "JH",
    "title": "Resident Consultant - Internal Medicine, Intensive Care Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-154",
    "name": "Dr. David Quek Kwang Leng",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "DQ",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-163",
    "name": "Tan Sri Datuk Dr. Ridzwan B. Abu Bakar",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "DD",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-172",
    "name": "Datuk Dr. Sanjiv Joshi",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "DS",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-177",
    "name": "Dr. Shah Mohd Nazri",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "SM",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-178",
    "name": "Dr. Shalini C. Sree Dharan",
    "department": "Endocrinology",
    "specialty": "Endocrinology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "SC",
    "title": "Resident Consultant - Endocrinology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-195",
    "name": "Dr. Tan Kok Leng",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "TK",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-205",
    "name": "Dr. Vijay Ananda Paramasvaran",
    "department": "Endocrinology",
    "specialty": "Endocrinology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "VA",
    "title": "Resident Consultant - Endocrinology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-214",
    "name": "Dr. Yee Kok Meng",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "YK",
    "title": "Resident Consultant - Cardiology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "pha-doc-15",
    "name": "Dr Mah Doo Yee",
    "department": "Internal Medicine, Nephrology (Renal Medicine)",
    "specialty": "Internal Medicine, Nephrology (Renal Medicine)",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "MD",
    "title": "Resident Consultant - Internal Medicine, Nephrology (Renal Medicine)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "pha-doc-20",
    "name": "Dr Ng Yoke Mui",
    "department": "Internal Medicine, Endocrinology",
    "specialty": "Internal Medicine, Endocrinology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "NY",
    "title": "Resident Consultant - Internal Medicine, Endocrinology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "pha-doc-21",
    "name": "Dr Nor Adina Binti Ahmad Tajudin",
    "department": "Internal Medicine, Respiratory Medicine",
    "specialty": "Internal Medicine, Respiratory Medicine",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Resident",
    "avatar": "NA",
    "title": "Resident Consultant - Internal Medicine, Respiratory Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "pha-doc-42",
    "name": "Dr. Chong Wei Peng",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Sessional",
    "avatar": "CW",
    "title": "Sessional Consultant - Cardiology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "pha-doc-50",
    "name": "Dr. Noor Azleen Ahmad Tarmizi",
    "department": "Internal Medicine, Geriatric Medicine",
    "specialty": "Internal Medicine, Geriatric Medicine",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Sessional",
    "avatar": "NA",
    "title": "Sessional Consultant - Internal Medicine, Geriatric Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "pha-doc-57",
    "name": "Dr Teh Khai Chih",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Sessional",
    "avatar": "TK",
    "title": "Sessional Consultant - Cardiology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "pha-doc-58",
    "name": "Dr Teoh Sze Kye",
    "department": "Internal Medicine, Respiratory Medicine",
    "specialty": "Internal Medicine, Respiratory Medicine",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Sessional",
    "avatar": "TS",
    "title": "Sessional Consultant - Internal Medicine, Respiratory Medicine",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "pha-doc-63",
    "name": "Dato' Dr Azar Azman Bin Abu Bakar",
    "department": "Cardiology",
    "specialty": "Cardiology",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Visiting",
    "avatar": "AA",
    "title": "Visiting Consultant - Cardiology",
    "availability": "By Prior Clinic Appointment"
  },
  {
    "id": "pha-doc-83",
    "name": "Dr Ong Chun Seong",
    "department": "Internal Medicine, Nephrology (Renal Medicine)",
    "specialty": "Internal Medicine, Nephrology (Renal Medicine)",
    "hospital": "Pantai Heart & Wellness Pavilion",
    "status": "Visiting",
    "avatar": "OC",
    "title": "Visiting Consultant - Internal Medicine, Nephrology (Renal Medicine)",
    "availability": "By Prior Clinic Appointment"
  },
  {
    "id": "phkl-doc-27",
    "name": "Dr Catherine Lee Tong How",
    "department": "Dentistry, Orthodontics",
    "specialty": "Dentistry, Orthodontics",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "CL",
    "title": "Sessional Consultant - Dentistry, Orthodontics",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-28",
    "name": "Dr. Chai Pei Fan",
    "department": "General Pediatrics, Pediatric Gastroenterology",
    "specialty": "General Pediatrics, Pediatric Gastroenterology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "CP",
    "title": "Resident Consultant - General Pediatrics, Pediatric Gastroenterology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-36",
    "name": "Dr. Steven Chow Kim Weng",
    "department": "Dermatology",
    "specialty": "Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "SC",
    "title": "Resident Consultant - Dermatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-40",
    "name": "Dr. Dawn Angelia Ambrose",
    "department": "Dermatology",
    "specialty": "Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "DA",
    "title": "Resident Consultant - Dermatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-47",
    "name": "Dato' Dr. Ganesananthan Shanmuganathan",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "DG",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-49",
    "name": "Dr. Gew Lai Teck",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "GL",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-79",
    "name": "Dr. Khong Su San",
    "department": "Plastic Surgery",
    "specialty": "Plastic Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "KS",
    "title": "Resident Consultant - Plastic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-83",
    "name": "Dato' Dr. Kuladeva Ratnam",
    "department": "Plastic Surgery",
    "specialty": "Plastic Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "DK",
    "title": "Sessional Consultant - Plastic Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-84",
    "name": "Dr. Lalitha Pillay",
    "department": "Pediatrics, Pediatric Dermatology",
    "specialty": "Pediatrics, Pediatric Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "LP",
    "title": "Sessional Consultant - Pediatrics, Pediatric Dermatology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-88",
    "name": "Dr. Lau Peng Choong",
    "department": "General Surgery, Upper GIT Surgery",
    "specialty": "General Surgery, Upper GIT Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "LP",
    "title": "Resident Consultant - General Surgery, Upper GIT Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-95",
    "name": "Dr. Alex Leow Hwong Ruey",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "AL",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-98",
    "name": "Dr. Lim Ai Wei",
    "department": "Dermatology",
    "specialty": "Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "LA",
    "title": "Resident Consultant - Dermatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-102",
    "name": "Dr. Lim Tou Chai",
    "department": "Dermatology",
    "specialty": "Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "LT",
    "title": "Resident Consultant - Dermatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-105",
    "name": "Dato' Dr. Luqman Bin Mazlan",
    "department": "General Surgery, Colorectal Surgery",
    "specialty": "General Surgery, Colorectal Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "DL",
    "title": "Sessional Consultant - General Surgery, Colorectal Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-106",
    "name": "Dr. M.V. Kudva",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "MK",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-107",
    "name": "Dato' Dr. Mahendra Raj",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "DM",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-114",
    "name": "Dato' Dr. Meheshinder Singh",
    "department": "General Surgery, Colorectal Surgery",
    "specialty": "General Surgery, Colorectal Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "DM",
    "title": "Resident Consultant - General Surgery, Colorectal Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-121",
    "name": "Datuk Dr. Mohd Noor Awang",
    "department": "Dental Surgery, Oral & Maxillofacial Surgery",
    "specialty": "Dental Surgery, Oral & Maxillofacial Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "DM",
    "title": "Sessional Consultant - Dental Surgery, Oral & Maxillofacial Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-129",
    "name": "Dr Navinakathiresu Muthukumarasamy",
    "department": "General Surgery, Colorectal Surgery",
    "specialty": "General Surgery, Colorectal Surgery",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "NM",
    "title": "Resident Consultant - General Surgery, Colorectal Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-130",
    "name": "Dr. Nazirin Ariffin",
    "department": "Dermatology",
    "specialty": "Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "NA",
    "title": "Resident Consultant - Dermatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-147",
    "name": "Dr. Prabhjot Singh Sidhu",
    "department": "Gastroenterology & Hepatology",
    "specialty": "Gastroenterology & Hepatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "PS",
    "title": "Resident Consultant - Gastroenterology & Hepatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-148",
    "name": "Dr. Prasanna Kannankutty",
    "department": "Dermatology",
    "specialty": "Dermatology",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Resident",
    "avatar": "PK",
    "title": "Resident Consultant - Dermatology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-149",
    "name": "Dr. Praveen Gill",
    "department": "Dentistry, Orthodontics",
    "specialty": "Dentistry, Orthodontics",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "PG",
    "title": "Sessional Consultant - Dentistry, Orthodontics",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-151",
    "name": "Dr. Priya Damodaran",
    "department": "Dentistry",
    "specialty": "Dentistry",
    "hospital": "Pantai Premier Clinic & Day Surgery",
    "status": "Sessional",
    "avatar": "PD",
    "title": "Sessional Consultant - Dentistry",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-18",
    "name": "Dr. Asha Gupta",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "AG",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-25",
    "name": "Dato' Dr. Balwant Singh Gendeh",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Specialist Centre",
    "status": "Sessional",
    "avatar": "DB",
    "title": "Sessional Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-29",
    "name": "Dr. Chang Chew Ming",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "CC",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-38",
    "name": "Dr Collin Looi Seng Kim",
    "department": "Orthopedic Surgery, Hand, Upper Limb & Microsurgery",
    "specialty": "Orthopedic Surgery, Hand, Upper Limb & Microsurgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "CL",
    "title": "Resident Consultant - Orthopedic Surgery, Hand, Upper Limb & Microsurgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-51",
    "name": "Dr. Gobinder Singh",
    "department": "Orthopedic Surgery",
    "specialty": "Orthopedic Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "GS",
    "title": "Resident Consultant - Orthopedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-58",
    "name": "Dr. Hoh Hon Bing",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "HH",
    "title": "Resident Consultant - Ophthalmology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-64",
    "name": "Dr. Jeevanan Jahendran",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "JJ",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-72",
    "name": "Dr. K. Sivamalar",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "KS",
    "title": "Resident Consultant - Ophthalmology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-73",
    "name": "Dr. K. John Mathen",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "KJ",
    "title": "Resident Consultant - Ophthalmology",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-81",
    "name": "Dr. Kok Choong Seng",
    "department": "Orthopedic Surgery",
    "specialty": "Orthopedic Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "KC",
    "title": "Resident Consultant - Orthopedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-82",
    "name": "Dr. Kong Min Han",
    "department": "Ear, Nose & Throat (Otorhinolaryngology)",
    "specialty": "Ear, Nose & Throat (Otorhinolaryngology)",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "KM",
    "title": "Resident Consultant - Ear, Nose & Throat (Otorhinolaryngology)",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-91",
    "name": "Dr. Lee Hwee Ming",
    "department": "Rehabilitation Medicine",
    "specialty": "Rehabilitation Medicine",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "LH",
    "title": "Resident Consultant - Rehabilitation Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-108",
    "name": "Dato' Dr. Mahmood Merican",
    "department": "Orthopedic Surgery",
    "specialty": "Orthopedic Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Sessional",
    "avatar": "DM",
    "title": "Sessional Consultant - Orthopedic Surgery",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-111",
    "name": "Dr. Manoharan Shunmugam",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Specialist Centre",
    "status": "Sessional",
    "avatar": "MS",
    "title": "Sessional Consultant - Ophthalmology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  },
  {
    "id": "phkl-doc-116",
    "name": "Dr. Mohamed Ashraff Mohd Ariff",
    "department": "Orthopedic Surgery",
    "specialty": "Orthopedic Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "MA",
    "title": "Resident Consultant - Orthopedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-117",
    "name": "Dr Mohamed Noortheen Ahamed Mustafa",
    "department": "Orthopedic Surgery",
    "specialty": "Orthopedic Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "MN",
    "title": "Resident Consultant - Orthopedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-120",
    "name": "Dr. Mohd Iskandar b Mohd Amin",
    "department": "Orthopedic Surgery, Hand, Upper Limb & Microsurgery",
    "specialty": "Orthopedic Surgery, Hand, Upper Limb & Microsurgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "MI",
    "title": "Resident Consultant - Orthopedic Surgery, Hand, Upper Limb & Microsurgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-122",
    "name": "Dr. Mohd Noor Azam Mohd Ithnin",
    "department": "Orthopedic Surgery, Pediatric Orthopedic",
    "specialty": "Orthopedic Surgery, Pediatric Orthopedic",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "MN",
    "title": "Resident Consultant - Orthopedic Surgery, Pediatric Orthopedic",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-131",
    "name": "Dr. Ng Bing Wui",
    "department": "Orthopedic Surgery, Spine Surgery",
    "specialty": "Orthopedic Surgery, Spine Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "NB",
    "title": "Resident Consultant - Orthopedic Surgery, Spine Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-135",
    "name": "Dr. Nik Aizah Nabilla bt Faheem",
    "department": "Orthopedic Surgery, Foot & Ankle",
    "specialty": "Orthopedic Surgery, Foot & Ankle",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "NA",
    "title": "Resident Consultant - Orthopedic Surgery, Foot & Ankle",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-141",
    "name": "Dr Pabrinder Kaur Ap Naginder Singh",
    "department": "Sports Medicine",
    "specialty": "Sports Medicine",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "PK",
    "title": "Resident Consultant - Sports Medicine",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-142",
    "name": "Dr. Paramaswaran Suppiah",
    "department": "Orthopedic Surgery, Spine Surgery",
    "specialty": "Orthopedic Surgery, Spine Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "PS",
    "title": "Resident Consultant - Orthopedic Surgery, Spine Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-143",
    "name": "Dr. Pasupathy Sivapragasam",
    "department": "Orthopedic Surgery",
    "specialty": "Orthopedic Surgery",
    "hospital": "Pantai Specialist Centre",
    "status": "Resident",
    "avatar": "PS",
    "title": "Resident Consultant - Orthopedic Surgery",
    "availability": "Mon–Fri: 9:00 AM – 5:00 PM"
  },
  {
    "id": "phkl-doc-153",
    "name": "Dr. Puspha Raman",
    "department": "Ophthalmology",
    "specialty": "Ophthalmology",
    "hospital": "Pantai Specialist Centre",
    "status": "Sessional",
    "avatar": "PR",
    "title": "Sessional Consultant - Ophthalmology",
    "availability": "Tue, Thu: 2:00 PM – 5:00 PM"
  }
];
