import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Car, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Calendar
} from "lucide-react";
import { Appointment } from "../types";
import { mockClinics } from "../mockData";

// Access global Leaflet variable from window
declare const L: any;

interface FetchingTransitProps {
  appointments: Appointment[];
  onSetScreen: (screen: string) => void;
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void;
}

// Maps clinics to their exact travel times as shown in the clinic locator
export function getClinicTravelTime(clinicName: string): number {
  const name = clinicName.toLowerCase();
  if (name.includes("pantai")) return 14;
  if (name.includes("pulau pinang")) return 18;
  if (name.includes("seberang jaya")) return 25;
  if (name.includes("jalan perak")) return 10;
  if (name.includes("bayan baru")) return 12;
  if (name.includes("bukit mertajam")) return 28;
  if (name.includes("lam wah ee")) return 15;
  if (name.includes("gleneagles")) return 16;
  if (name.includes("island")) return 11;
  if (name.includes("adventist")) return 13;
  if (name.includes("loh guan lye")) return 12;
  if (name.includes("kpj")) return 22;
  if (name.includes("o2")) return 9;
  if (name.includes("singapore")) return 15;
  if (name.includes("perdana")) return 8;
  return 15; // default fallback
}

// Haversine formula to compute exact distance between two coordinates in km
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; 
  return `${d.toFixed(1)} km away`;
}

export default function FetchingTransit({ appointments, onSetScreen, onUpdateAppointment }: FetchingTransitProps) {
  // Find next booking that has requested a ride
  const activeRideApt = useMemo(() => {
    return appointments.find(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status) && a.requestRide) || null;
  }, [appointments]);

  // List of other upcoming bookings without rides
  const eligibleBookings = useMemo(() => {
    return appointments.filter(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status) && !a.requestRide);
  }, [appointments]);

  const [loadingAptId, setLoadingAptId] = useState<string | null>(null);

  // User coordinates state, defaulted to Georgetown but fetched dynamically from browser GPS
  const [userCoords, setUserCoords] = useState<[number, number]>([5.4172, 100.3256]);

  // Map reference hooks
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  // Retrieve actual user location via HTML5 Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation permission denied, defaulting to Penang coordinates", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Stats computation for active transit based on user's live location
  const transitStats = useMemo(() => {
    if (!activeRideApt) return null;
    const clinicObj = mockClinics.find(c => c.name.toLowerCase() === activeRideApt.clinic.toLowerCase());
    const clinicLat = clinicObj ? clinicObj.lat : 5.3216;
    const clinicLng = clinicObj ? clinicObj.lng : 100.2825;

    const actualDistance = getHaversineDistance(userCoords[0], userCoords[1], clinicLat, clinicLng);

    return {
      distance: actualDistance,
      duration: getClinicTravelTime(activeRideApt.clinic),
      driverArrivalMins: 5 
    };
  }, [activeRideApt, userCoords]);

  // Render Leaflet Map dynamically linking live coordinates to target hospital
  useEffect(() => {
    if (!activeRideApt || !mapContainerRef.current) return;

    // Scoped destination coordinates matching mockData.ts
    const clinicObj = mockClinics.find(c => c.name.toLowerCase() === activeRideApt.clinic.toLowerCase());
    const clinicCoords: [number, number] = clinicObj ? [clinicObj.lat, clinicObj.lng] : [5.3216, 100.2825];

    try {
      // 1. Initialize Map Instance
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView(userCoords, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // 2. Clear existing layers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // 3. Draw Live Home/User Marker
      const homeIcon = L.divIcon({
        html: '<div style="font-size: 24px;">🏠</div>',
        iconSize: [30, 30],
        className: 'map-div-icon'
      });
      L.marker(userCoords, { icon: homeIcon }).addTo(map).bindPopup("Your Location");

      // 4. Draw Destination Clinic Marker
      const clinicIcon = L.divIcon({
        html: '<div style="font-size: 24px;">🏥</div>',
        iconSize: [30, 30],
        className: 'map-div-icon'
      });
      L.marker(clinicCoords, { icon: clinicIcon }).addTo(map).bindPopup(activeRideApt.clinic);

      // 5. Draw route line connecting live GPS coordinates to Clinic
      L.polyline([userCoords, clinicCoords], {
        color: '#0d9488',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 12'
      }).addTo(map);

      // Fit map view bounds to encompass both coordinates
      map.fitBounds([userCoords, clinicCoords], { padding: [50, 50] });

    } catch (e) {
      console.warn("Leaflet Map failed to load", e);
    }

    // Cleanup: remove map instance when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeRideApt, userCoords]);

  const handleRequestRideNow = async (aptId: string) => {
    setLoadingAptId(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestRide: true })
      });
      if (res.ok) {
        if (onUpdateAppointment) {
          onUpdateAppointment(aptId, { requestRide: true });
        }
      }
    } catch (err) {
      console.error("Failed to request ride", err);
    } finally {
      setLoadingAptId(null);
    }
  };

  const handleCancelRide = async (aptId: string) => {
    if (!confirm("Are you sure you want to cancel your transport dispatch request?")) return;
    setLoadingAptId(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestRide: false })
      });
      if (res.ok) {
        if (onUpdateAppointment) {
          onUpdateAppointment(aptId, { requestRide: false });
        }
      }
    } catch (err) {
      console.error("Failed to cancel ride", err);
    } finally {
      setLoadingAptId(null);
    }
  };

  return (
    <div id="fetching-transit-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans text-neutral-800">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="text-teal-600 w-8 h-8" /> Fetching Transit Service
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Non-Emergency Patient Transportation System. Direct dispatch tracking strictly scoped to your booked clinic.
          </p>
        </div>
        <button
          onClick={() => onSetScreen("dashboard")}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>

      {activeRideApt && transitStats ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Live Status & Transit Map */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live Progress Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Transport statistics row */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-5 text-center md:text-left">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Driver ETA to Pickup</span>
                  <span className="text-xl font-extrabold text-teal-700">{transitStats.driverArrivalMins} Mins</span>
                </div>
                <div className="space-y-1 border-x border-slate-100 px-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinic Route Distance</span>
                  <span className="text-xl font-extrabold text-slate-800">{transitStats.distance}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Travel Time</span>
                  <span className="text-xl font-extrabold text-slate-800">{transitStats.duration} Mins</span>
                </div>
              </div>

              {/* Real Interactive Leaflet Map Container */}
              <div className="relative bg-slate-150 border border-slate-250 h-[380px] rounded-2xl overflow-hidden shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full z-0"></div>
                <span className="absolute bottom-3 left-3 text-[9px] font-bold text-slate-400 bg-white/95 border border-slate-250/50 px-2.5 py-1 rounded-full uppercase tracking-wider z-10 font-mono">
                  📍 live gps active • destination locked: {activeRideApt.clinic} ({transitStats.distance})
                </span>
              </div>

              {/* Transit Steps Progress list */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transit Sequence Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                  
                  {/* Step 1 */}
                  <div className="p-3 border rounded-xl space-y-1 bg-teal-50 border-teal-200 text-teal-800 animate-pulse">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-4 h-4 text-teal-600" />
                      Step 1: Driver Dispatched
                    </span>
                    <p className="text-[10px] text-teal-700 font-medium">Danish is heading to pickup point.</p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="p-3 border rounded-xl space-y-1 bg-slate-50/50 border-slate-100 text-slate-455">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-4 h-4" />
                      Step 2: Pickup
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Arrival at patient home.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 border rounded-xl space-y-1 bg-slate-50/50 border-slate-100 text-slate-455">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-4 h-4" />
                      Step 3: In Transit
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">En route to destination.</p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3 border rounded-xl space-y-1 bg-slate-50/50 border-slate-100 text-slate-455">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-4 h-4" />
                      Step 4: Drop-Off
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Arrival at clinic entrance.</p>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Driver Details & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Driver Profile Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Assigned Transport Driver</span>
              <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-3xl font-bold mx-auto border-2 border-teal-100 shadow-md">
                👨‍✈️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Danish Bin Razak</h3>
                <span className="text-[10px] text-slate-455 font-mono block mt-1">Verified LifeLink NEMT Driver</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-left space-y-1.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between"><span>Vehicle Model:</span><span className="font-bold text-slate-800">Proton Saga (Grey)</span></div>
                <div className="flex justify-between"><span>License Plate:</span><span className="font-mono font-bold bg-slate-200 px-1 py-0.5 rounded text-[10px]">WEE 2026</span></div>
                <div className="flex justify-between"><span>Rating:</span><span className="font-bold text-amber-600">⭐ 4.9 (184 trips)</span></div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => alert("Connecting secure lobby telephone call to Driver Danish (+6011-2345678)...")}
                  className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver
                </button>
                <button
                  onClick={() => alert("🚨 Medical Emergency Alert sent to Dispatcher. An emergency vehicle will be re-routed immediately.")}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-3 rounded-xl border border-red-200 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Emergency SOS
                </button>
              </div>

              {/* Cancel Request trigger */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleCancelRide(activeRideApt.id)}
                  disabled={loadingAptId === activeRideApt.id}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {loadingAptId === activeRideApt.id ? "Processing..." : "Cancel Transport Request"}
                </button>
              </div>
            </div>

            {/* Destination Preview (Strictly locked to booked hospital) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono">
                🔒 DESTINATION LOCKED TO APPOINTMENT
              </span>
              
              <div className="flex items-start gap-2.5 border border-amber-250 bg-amber-50/20 p-3 rounded-2xl">
                <MapPin className="w-5 h-5 text-teal-655 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold">
                  <p className="font-bold text-slate-800">{activeRideApt.clinic}</p>
                  <p className="text-[10px] text-slate-455 mt-0.5">Assigned Clinician: Dr. {activeRideApt.doctorName}</p>
                  <p className="text-[10px] text-slate-455 mt-0.5">Schedule: {activeRideApt.date} @ {activeRideApt.timeSlot}</p>
                  <p className="text-[10px] text-teal-700 font-bold mt-1.5">
                    * The dispatch is strictly restricted to your booked clinic destination.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="space-y-6">
          {/* No active ride banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-5 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-slate-200 shadow-inner">
              🚗
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-md">No Active Transit Dispatched</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                You have not requested fetching transport for any of your upcoming consultations. Select an eligible appointment below to dispatch a driver.
              </p>
            </div>
          </div>

          {/* Eligible bookings selector */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-655" /> Request Fetching Ride for Upcoming Consultations
            </h3>

            {eligibleBookings.length === 0 ? (
              <p className="text-xs text-slate-455 italic">No upcoming consultations eligible for transport requests. Go to "Book Appointment" to schedule one.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eligibleBookings.map((apt) => {
                  const duration = getClinicTravelTime(apt.clinic);
                  return (
                    <div key={apt.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-350 transition shadow-xs">
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-800">{apt.clinic}</p>
                        <p className="text-[10px] text-slate-555 font-medium">Physician: Dr. {apt.doctorName} ({apt.specialty})</p>
                        <p className="text-[10px] text-slate-455 font-mono font-bold">{apt.date} @ {apt.timeSlot}</p>
                        <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono font-bold inline-block mt-1">
                          📍 {duration} mins travel duration
                        </span>
                      </div>
                      <button
                        onClick={() => handleRequestRideNow(apt.id)}
                        disabled={loadingAptId === apt.id}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Car className="w-3.5 h-3.5" /> 
                        {loadingAptId === apt.id ? "Booking..." : "Request Ride"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
