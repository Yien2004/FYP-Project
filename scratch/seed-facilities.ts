import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const penangFacilities = [
  {
    id: crypto.randomUUID(),
    name: 'Hospital Pulau Pinang',
    address: 'Jalan Residensi, 10990 Georgetown, Penang',
    phone: '04-222 5333',
    hours: 'Open 24 hours, 7 days a week',
    distance: '1.2 km away',
    lat: 5.4171,
    lng: 100.3115,
    featured: true,
    zip_code: '10990'
  },
  {
    id: crypto.randomUUID(),
    name: 'Hospital Seberang Jaya',
    address: 'Jalan Tun Hussein Onn, 13700 Seberang Jaya, Penang',
    phone: '04-382 3333',
    hours: 'Open 24 hours, 7 days a week',
    distance: '9.8 km away',
    lat: 5.3932,
    lng: 100.3985,
    featured: true,
    zip_code: '13700'
  },
  {
    id: crypto.randomUUID(),
    name: 'Klinik Kesihatan Jalan Perak',
    address: 'Jalan Perak, 10150 Georgetown, Penang',
    phone: '04-261 5266',
    hours: 'Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM',
    distance: '2.1 km away',
    lat: 5.4005,
    lng: 100.3155,
    featured: false,
    zip_code: '10150'
  },
  {
    id: crypto.randomUUID(),
    name: 'Klinik Kesihatan Bayan Baru',
    address: 'Jalan Mahsuri, 11950 Bayan Baru, Penang',
    phone: '04-642 2222',
    hours: 'Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM',
    distance: '10.5 km away',
    lat: 5.3263,
    lng: 100.2848,
    featured: false,
    zip_code: '11950'
  },
  {
    id: crypto.randomUUID(),
    name: 'Pantai Hospital Penang',
    address: '82 Jalan Tengah, 10450 Bayan Lepas, Penang',
    phone: '04-643 3888',
    hours: 'Open 24 hours, 7 days a week',
    distance: '11.0 km away',
    lat: 5.3216,
    lng: 100.2825,
    featured: true,
    zip_code: '10450'
  },
  {
    id: crypto.randomUUID(),
    name: 'Hospital Lam Wah Ee',
    address: '141 Jalan Tan Sri Teh Ewe Lim, 11600 Georgetown, Penang',
    phone: '04-652 2888',
    hours: 'Open 24 hours, 7 days a week',
    distance: '3.4 km away',
    lat: 5.3923,
    lng: 100.3055,
    featured: false,
    zip_code: '11600'
  },
  {
    id: crypto.randomUUID(),
    name: 'Gleneagles Hospital Penang',
    address: '1 Jalan Pangkor, 10050 Georgetown, Penang',
    phone: '04-222 9111',
    hours: 'Open 24 hours, 7 days a week',
    distance: '1.8 km away',
    lat: 5.4267,
    lng: 100.3204,
    featured: true,
    zip_code: '10050'
  },
  {
    id: crypto.randomUUID(),
    name: 'Island Hospital',
    address: '308 Macalister Road, 10450 Georgetown, Penang',
    phone: '04-228 8222',
    hours: 'Open 24 hours, 7 days a week',
    distance: '1.5 km away',
    lat: 5.4230,
    lng: 100.3146,
    featured: false,
    zip_code: '10450'
  },
  {
    id: crypto.randomUUID(),
    name: 'O2 Klinik',
    address: '35, Jalan Burma, 10050 Georgetown, Penang',
    phone: '04-228 8822',
    hours: 'Mon–Sat: 8:30 AM – 9:00 PM',
    distance: '1.9 km away',
    lat: 5.4200,
    lng: 100.3220,
    featured: false,
    zip_code: '10050'
  },
  {
    id: crypto.randomUUID(),
    name: 'Klinik Singapore',
    address: 'Georgetown, Penang',
    phone: '04-263 3388',
    hours: 'Mon–Sat: 8:00 AM – 6:00 PM',
    distance: '1.4 km away',
    lat: 5.4120,
    lng: 100.3120,
    featured: false,
    zip_code: '10050'
  },
  {
    id: crypto.randomUUID(),
    name: 'Poliklinik Perdana',
    address: 'Penang (Mainland & Island)',
    phone: '04-399 9922',
    hours: 'Mon–Fri: 8:00 AM – 5:30 PM',
    distance: '8.5 km away',
    lat: 5.3850,
    lng: 100.4000,
    featured: false,
    zip_code: '10050'
  }
];

async function seed() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.log("Seeding facilities with IDs...");
  
  // Clear existing first
  const { error: deleteErr } = await supabaseAdmin
    .from('facilities')
    .delete()
    .neq('name', '___NON_EXISTENT___'); // delete all
    
  if (deleteErr) {
    console.error("Delete error:", deleteErr);
  }

  const { data, error } = await supabaseAdmin
    .from('facilities')
    .insert(penangFacilities)
    .select();

  if (error) {
    console.error("Error inserting facilities:", error);
  } else {
    console.log("SUCCESSFULLY SEEDED FACILITIES:", data.length);
  }
}

seed();
