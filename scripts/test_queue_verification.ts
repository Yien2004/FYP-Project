import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testVerification() {
  const baseUrl = "http://localhost:3000";

  console.log("=== 1. Fetching appointments to test ===");
  const aptsRes = await fetch(`${baseUrl}/api/appointments`);
  const appointments: any[] = await aptsRes.json();
  console.log(`Found ${appointments.length} appointments.`);

  if (appointments.length === 0) {
    console.log("No appointments found to test.");
    return;
  }

  const testApt = appointments[0];
  console.log(`Selected Test Appointment:`, {
    id: testApt.id,
    patientName: testApt.patientName,
    clinic: testApt.clinic,
    specialty: testApt.specialty,
    queueNumber: testApt.queueNumber
  });

  // Test Case A: Incorrect facility (Facility Mismatch)
  console.log("\n=== 2. Testing Cross-Facility Mismatch Rejection ===");
  // If testApt is at Bayan Lepas (Facility 1), test with Ayer Itam desk (Facility 4)
  const mismatchEmail = (testApt.clinic || "").includes("Specialist") 
    ? "pantaipenang_ae@gmail.com" 
    : "pantaicentre_ortho@gmail.com";

  const resMismatch = await fetch(`${baseUrl}/api/queue/verify-and-checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queueNumber: testApt.queueNumber,
      staffEmail: mismatchEmail
    })
  });
  const dataMismatch = await resMismatch.json();
  console.log(`Status: ${resMismatch.status} (Expected 403)`);
  console.log("Response:", dataMismatch);

  // Test Case B: Matching facility & department or Matching Admin
  console.log("\n=== 3. Testing Correct Staff / Admin Verification ===");
  let matchedEmail = "pantaipenang_admin@gmail.com";
  if ((testApt.clinic || "").includes("Heart") || (testApt.clinic || "").includes("Pavilion")) {
    matchedEmail = "pantaipavilion_admin@gmail.com";
  } else if ((testApt.clinic || "").includes("Premier")) {
    matchedEmail = "pantaiclinic_admin@gmail.com";
  } else if ((testApt.clinic || "").includes("Specialist")) {
    matchedEmail = "pantaicentre_admin@gmail.com";
  }

  const resMatch = await fetch(`${baseUrl}/api/queue/verify-and-checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queueNumber: testApt.queueNumber,
      staffEmail: matchedEmail
    })
  });
  const dataMatch = await resMatch.json();
  console.log(`Status: ${resMatch.status} (Expected 200)`);
  console.log("Response:", dataMatch);
}

testVerification().catch(console.error);
