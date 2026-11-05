import { Request, Response, NextFunction } from "express";
import * as db from "../../db";
import { getStaffAccountByEmail } from "../../src/data/staffAccounts";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "patient" | "staff" | "doctor" | "admin" | "super_admin";
  full_name: string;
  facility_id: number;
  department: string;
  room_number: string;
  hospital: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware for two-tier architecture (Staff Frontdesk & Consultant Doctor).
 * Verifies Supabase JWT access token or fallback headers (x-doctor-email, x-staff-email, x-user-email).
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 1. If JWT token provided, verify via Supabase
    if (token) {
      try {
        const authUser = await db.verifyToken(token);
        if (authUser && authUser.email) {
          const profile = db.getAuthUserProfile(authUser);
          const rawRole = (profile.role || "patient").toLowerCase();
          const role: "patient" | "staff" | "doctor" | "admin" | "super_admin" =
            rawRole === "super_admin" || rawRole === "superadmin" ? "super_admin" :
            rawRole === "doctor" ? "doctor" :
            (rawRole === "staff" || rawRole === "nurse") ? "staff" :
            rawRole === "admin" ? "admin" : "patient";

          const staffInfo = getStaffAccountByEmail(authUser.email);

          req.user = {
            id: authUser.id,
            email: authUser.email,
            role,
            full_name: profile.name || staffInfo?.name || authUser.email.split("@")[0],
            facility_id: profile.facility_id || staffInfo?.facility_id || 1,
            department: profile.department || staffInfo?.department || "General",
            room_number: profile.room_number || staffInfo?.room_number || (role === "doctor" ? "Consultation Room" : "Front Counter"),
            hospital: profile.hospital || staffInfo?.hospital || "Pantai Hospital Penang (Main Hospital)"
          };

          return next();
        }
      } catch (tokenErr) {
        // Fallback to header inspection if token expired or invalid in dev environment
      }
    }

    // 2. Fallback header or query-based authentication for dev / demo environment
    const emailHeader = (
      req.headers["x-admin-email"] ||
      req.headers["x-doctor-email"] ||
      req.headers["x-staff-email"] ||
      req.headers["x-user-email"] ||
      req.query.adminEmail ||
      req.query.doctorEmail ||
      req.query.staffEmail ||
      req.query.email ||
      req.body?.adminEmail ||
      req.body?.doctorEmail ||
      req.body?.staffEmail
    ) as string | undefined;

    if (emailHeader) {
      const email = emailHeader.trim().toLowerCase();
      const staffInfo = getStaffAccountByEmail(email);
      if (staffInfo) {
        const rawRole = staffInfo.role.toLowerCase();
        const role: "patient" | "staff" | "doctor" | "admin" | "super_admin" =
          rawRole === "super_admin" || rawRole === "superadmin" ? "super_admin" :
          rawRole === "doctor" ? "doctor" :
          (rawRole === "staff" || rawRole === "nurse") ? "staff" :
          rawRole === "admin" ? "admin" : "patient";

        req.user = {
          id: staffInfo.email,
          email: staffInfo.email,
          role,
          full_name: staffInfo.name,
          facility_id: staffInfo.facility_id,
          department: staffInfo.department,
          room_number: staffInfo.room_number || (role === "doctor" ? "Consultation Room" : "Front Counter"),
          hospital: staffInfo.hospital
        };
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized: Access token or valid identity header required."
    });
  } catch (err: any) {
    console.error("authenticateToken middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Authentication server error."
    });
  }
}
