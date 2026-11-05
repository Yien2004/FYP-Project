import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testDeptMismatch() {
  const baseUrl = "http://localhost:3000";

  // Test Ticket #Q-521 is 'Consultant Physician' (Facility 1)
  // Desk: Bayan Lepas Surgery Desk (Facility 1, Department: 'General Surgery')
  const res = await fetch(`${baseUrl}/api/queue/verify-and-checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queueNumber: "#Q-521",
      staffEmail: "pantaipenang_surgery@gmail.com"
    })
  });
  const data = await res.json();
  console.log(`Surgery Desk trying to check in Physician Ticket -> Status: ${res.status} (Expected 403)`);
  console.log("Response:", data);
}

testDeptMismatch().catch(console.error);
