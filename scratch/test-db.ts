import * as db from '../db';

async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const facilities = await db.getFacilities();
    console.log("FACILITIES IN DB:", facilities.length);
    console.log("FIRST FACILITY:", facilities[0]);
  } catch (e) {
    console.error("ERROR QUERYING DB:", e);
  }
}

test();
