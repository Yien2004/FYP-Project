import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Car, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Navigation,
  CreditCard,
  Check,
  Users,
  Compass
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
  return 15;
}

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // km
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

interface VehicleTier {
  id: string;
  name: string;
  category: string;
  seats: string;
  baseFare: number;
  multiplier: number;
  etaMins: number;
  icon: string;
  desc: string;
}

const VEHICLE_TIERS: VehicleTier[] = [
  {
    id: "grabcar",
    name: "JustGrab / GrabCar",
    category: "Standard",
    seats: "4 seats",
    baseFare: 14,
    multiplier: 1.0,
    etaMins: 3,
    icon: "🚗",
    desc: "Affordable, quick everyday ride to your appointment"
  },
  {
    id: "grabcar_plus",
    name: "GrabCar Plus",
    category: "Premium Comfort",
    seats: "4 seats • Extra Space",
    baseFare: 22,
    multiplier: 1.4,
    etaMins: 4,
    icon: "✨",
    desc: "Top-rated drivers with spacious premium vehicles"
  },
  {
    id: "medical_transit",
    name: "GrabCare Medical Assist",
    category: "Healthcare Priority",
    seats: "Priority Assist",
    baseFare: 32,
    multiplier: 1.8,
    etaMins: 6,
    icon: "🩺",
    desc: "Wheelchair-friendly trunk & certified patient assistance driver"
  }
];

export default function FetchingTransit({ appointments, onSetScreen, onUpdateAppointment }: FetchingTransitProps) {
  // Local state for direct / ad-hoc clinic rides when user has no booked appointments
  const [adHocRide, setAdHocRide] = useState<Appointment | null>(null);

  // Find next booking that has requested a ride, or fallback to active adHoc ride
  const activeRideApt = useMemo(() => {
    return appointments.find(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status) && a.requestRide) || adHocRide;
  }, [appointments, adHocRide]);

  // List of upcoming bookings without rides
  const eligibleBookings = useMemo(() => {
    return appointments.filter(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status) && !a.requestRide);
  }, [appointments]);

  const [loadingAptId, setLoadingAptId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("grabcar");
  const [pickupAddress, setPickupAddress] = useState<string>("128, Jalan Macalister, 10400 George Town, Pulau Pinang");
  const [paymentMethod, setPaymentMethod] = useState<string>("grabpay");
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Selected clinic destination (supports both booked appointments and direct clinic selection)
  const [selectedClinicName, setSelectedClinicName] = useState<string>(() => {
    if (eligibleBookings.length > 0) return eligibleBookings[0].clinic;
    return mockClinics[0]?.name || "Hospital Pulau Pinang";
  });

  // User coordinates state
  const [userCoords, setUserCoords] = useState<[number, number]>([5.4172, 100.3256]);

  // Map references
  const liveMapContainerRef = useRef<HTMLDivElement | null>(null);
  const liveMapInstanceRef = useRef<any>(null);
  const previewMapContainerRef = useRef<HTMLDivElement | null>(null);
  const previewMapInstanceRef = useRef<any>(null);

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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setPickupAddress(`Current GPS: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (George Town)`);
        setIsLocating(false);
      },
      (err) => {
        alert("Could not retrieve location. Please input address manually.");
        setIsLocating(false);
      }
    );
  };

  // Selected Clinic Coordinates & Stats
  const selectedClinicObj = useMemo(() => {
    return mockClinics.find(c => c.name.toLowerCase() === selectedClinicName.toLowerCase()) || mockClinics[0];
  }, [selectedClinicName]);

  const previewDistance = useMemo(() => {
    const lat = selectedClinicObj ? selectedClinicObj.lat : 5.3216;
    const lng = selectedClinicObj ? selectedClinicObj.lng : 100.2825;
    return getHaversineDistance(userCoords[0], userCoords[1], lat, lng);
  }, [selectedClinicObj, userCoords]);

  const previewDuration = useMemo(() => {
    return getClinicTravelTime(selectedClinicName);
  }, [selectedClinicName]);

  // Stats computation for active transit
  const transitStats = useMemo(() => {
    if (!activeRideApt) return null;
    const clinicObj = mockClinics.find(c => c.name.toLowerCase() === activeRideApt.clinic.toLowerCase());
    const clinicLat = clinicObj ? clinicObj.lat : 5.3216;
    const clinicLng = clinicObj ? clinicObj.lng : 100.2825;

    const actualDistance = getHaversineDistance(userCoords[0], userCoords[1], clinicLat, clinicLng);
    const duration = getClinicTravelTime(activeRideApt.clinic);

    return {
      distance: actualDistance,
      duration,
      driverArrivalMins: 4
    };
  }, [activeRideApt, userCoords]);

  // Render Leaflet Map for Active In-Progress Ride
  useEffect(() => {
    if (!activeRideApt || !liveMapContainerRef.current) return;

    const clinicObj = mockClinics.find(c => c.name.toLowerCase() === activeRideApt.clinic.toLowerCase());
    const clinicCoords: [number, number] = clinicObj ? [clinicObj.lat, clinicObj.lng] : [5.3216, 100.2825];

    try {
      if (!liveMapInstanceRef.current) {
        const map = L.map(liveMapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView(userCoords, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        liveMapInstanceRef.current = map;
      }

      const map = liveMapInstanceRef.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const homeIcon = L.divIcon({
        html: '<div style="font-size: 24px;">🏠</div>',
        iconSize: [30, 30],
        className: 'map-div-icon'
      });
      L.marker(userCoords, { icon: homeIcon }).addTo(map).bindPopup("Your Pickup Location");

      const clinicIcon = L.divIcon({
        html: '<div style="font-size: 24px;">🏥</div>',
        iconSize: [30, 30],
        className: 'map-div-icon'
      });
      L.marker(clinicCoords, { icon: clinicIcon }).addTo(map).bindPopup(activeRideApt.clinic);

      L.polyline([userCoords, clinicCoords], {
        color: '#10b981',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 12'
      }).addTo(map);

      map.fitBounds([userCoords, clinicCoords], { padding: [50, 50] });

    } catch (e) {
      console.warn("Leaflet Live Map failed to load", e);
    }

    return () => {
      if (liveMapInstanceRef.current) {
        liveMapInstanceRef.current.remove();
        liveMapInstanceRef.current = null;
      }
    };
  }, [activeRideApt, userCoords]);

  // Render Leaflet Map for Booking Preview Route
  useEffect(() => {
    if (activeRideApt || !previewMapContainerRef.current) return;

    const clinicCoords: [number, number] = selectedClinicObj ? [selectedClinicObj.lat, selectedClinicObj.lng] : [5.3216, 100.2825];

    try {
      if (!previewMapInstanceRef.current) {
        const map = L.map(previewMapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(userCoords, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        previewMapInstanceRef.current = map;
      }

      const map = previewMapInstanceRef.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const homeIcon = L.divIcon({
        html: '<div style="font-size: 20px;">🏠</div>',
        iconSize: [26, 26],
        className: 'map-div-icon'
      });
      L.marker(userCoords, { icon: homeIcon }).addTo(map).bindPopup("Pickup Point");

      const clinicIcon = L.divIcon({
        html: '<div style="font-size: 20px;">🏥</div>',
        iconSize: [26, 26],
        className: 'map-div-icon'
      });
      L.marker(clinicCoords, { icon: clinicIcon }).addTo(map).bindPopup(selectedClinicName);

      L.polyline([userCoords, clinicCoords], {
        color: '#0d9488',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 10'
      }).addTo(map);

      map.fitBounds([userCoords, clinicCoords], { padding: [30, 30] });

    } catch (e) {
      console.warn("Leaflet Preview Map failed to load", e);
    }

    return () => {
      if (previewMapInstanceRef.current) {
        previewMapInstanceRef.current.remove();
        previewMapInstanceRef.current = null;
      }
    };
  }, [activeRideApt, selectedClinicName, selectedClinicObj, userCoords]);

  const handleBookRide = async () => {
    // Check if the selected clinic matches an eligible booked appointment
    const matchedApt = eligibleBookings.find(b => b.clinic.toLowerCase() === selectedClinicName.toLowerCase());

    if (matchedApt) {
      setLoadingAptId(matchedApt.id);
      try {
        const res = await fetch(`/api/appointments/${matchedApt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestRide: true })
        });
        if (res.ok && onUpdateAppointment) {
          onUpdateAppointment(matchedApt.id, { requestRide: true });
        }
      } catch (err) {
        console.error("Failed to request ride", err);
      } finally {
        setLoadingAptId(null);
      }
    } else {
      // Direct clinic booking without pre-existing appointment
      setLoadingAptId("adhoc");
      setTimeout(() => {
        const newRide: Appointment = {
          id: `transit-direct-${Date.now()}`,
          doctorId: "doc-triage",
          doctorName: "Clinic Triage Reception",
          specialty: "Walk-In Patient Transit",
          doctorImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
          date: new Date().toISOString().split("T")[0],
          timeSlot: "Immediate Arrival",
          type: "In-Clinic",
          clinic: selectedClinicName,
          status: "Approved",
          symptoms: "Fetching Transit Ride Request",
          requestRide: true
        };
        setAdHocRide(newRide);
        setLoadingAptId(null);
      }, 500);
    }
  };

  const handleCancelRide = async (aptId: string) => {
    if (!confirm("Are you sure you want to cancel your Grab ride dispatch?")) return;
    
    if (aptId.startsWith("transit-direct")) {
      setAdHocRide(null);
      return;
    }

    setLoadingAptId(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestRide: false })
      });
      if (res.ok && onUpdateAppointment) {
        onUpdateAppointment(aptId, { requestRide: false });
      }
    } catch (err) {
      console.error("Failed to cancel ride", err);
    } finally {
      setLoadingAptId(null);
    }
  };

  const activeTierObj = useMemo(() => {
    return VEHICLE_TIERS.find(t => t.id === selectedTier) || VEHICLE_TIERS[0];
  }, [selectedTier]);

  return (
    <div id="fetching-transit-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans text-neutral-800">
      
      {/* Top Grab Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Clinic & Hospital Ride Booking
          </h1>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Easily book a ride to your clinic or doctor appointment. Select your destination or an upcoming consultation below to arrange transport.
          </p>
        </div>
      </div>

      {activeRideApt && transitStats ? (
        /* TRIP IN PROGRESS TRACKING SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Route Map & Step Timeline */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Trip stats */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-5 text-center md:text-left">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Driver ETA to Pickup</span>
                  <span className="text-2xl font-black text-emerald-600">{transitStats.driverArrivalMins} Mins</span>
                </div>
                <div className="space-y-1 border-x border-slate-100 px-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Route Distance</span>
                  <span className="text-2xl font-black text-slate-800">{transitStats.distance}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trip Duration</span>
                  <span className="text-2xl font-black text-slate-800">{transitStats.duration} Mins</span>
                </div>
              </div>

              {/* Interactive Leaflet Map */}
              <div className="relative bg-slate-150 border border-slate-250 h-[360px] rounded-2xl overflow-hidden shadow-inner">
                <div ref={liveMapContainerRef} className="w-full h-full z-0"></div>
                <span className="absolute bottom-3 left-3 text-[10px] font-bold text-slate-700 bg-white/95 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider z-10 font-mono shadow-sm">
                  📍 Destination Locked: {activeRideApt.clinic} ({transitStats.distance})
                </span>
              </div>

              {/* Transit Sequence Timeline */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ride Status Progress</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
                  
                  <div className="p-3 border rounded-xl space-y-1 bg-emerald-50 border-emerald-300 text-emerald-900">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      1. Driver En Route
                    </span>
                    <p className="text-[10px] text-emerald-700 font-medium">Danish is driving towards pickup point.</p>
                  </div>
                  
                  <div className="p-3 border rounded-xl space-y-1 bg-slate-50 border-slate-100 text-slate-400">
                    <span className="flex items-center gap-1 font-bold">
                      <MapPin className="w-4 h-4" />
                      2. Pickup
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Arrival at patient pickup location.</p>
                  </div>

                  <div className="p-3 border rounded-xl space-y-1 bg-slate-50 border-slate-100 text-slate-400">
                    <span className="flex items-center gap-1 font-bold">
                      <Navigation className="w-4 h-4" />
                      3. In Transit
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">En route to {activeRideApt.clinic}.</p>
                  </div>

                  <div className="p-3 border rounded-xl space-y-1 bg-slate-50 border-slate-100 text-slate-400">
                    <span className="flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      4. Drop-Off
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Safe drop-off at clinic lobby.</p>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Driver Details & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Driver Profile Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Assigned Grab Driver</span>
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-bold mx-auto border-2 border-emerald-200 shadow-md">
                👨‍✈️
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Danish Bin Razak</h3>
                <span className="text-xs text-emerald-750 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                  ⭐ 4.9 Rating (340 Trips) • Grab Certified
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-bold text-emerald-700">{activeTierObj.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Model:</span>
                  <span className="font-bold text-slate-800">Proton Saga (Grey)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plate Number:</span>
                  <span className="font-mono font-bold bg-slate-200 text-slate-900 px-2 py-0.5 rounded text-[11px]">WEE 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Fare:</span>
                  <span className="font-bold text-slate-900">
                    RM {Math.round(activeTierObj.baseFare + (transitStats.duration * 0.4))}.00 ({paymentMethod === "grabpay" ? "GrabPay" : paymentMethod === "cash" ? "Cash" : "Online Banking"})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => alert("Connecting secure phone call to Driver Danish (+6011-2345678)...")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver
                </button>
                <button
                  type="button"
                  onClick={() => alert("🚨 Priority Alert sent to Grab Medical Dispatcher. Driver has been instructed to assist.")}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-3 rounded-xl border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Emergency
                </button>
              </div>

              {/* Cancel Request trigger */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleCancelRide(activeRideApt.id)}
                  disabled={loadingAptId === activeRideApt.id}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {loadingAptId === activeRideApt.id ? "Processing..." : "Cancel Grab Ride"}
                </button>
              </div>
            </div>

            {/* Destination Preview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono">
                🔒 DESTINATION LOCKED TO APPOINTMENT
              </span>
              
              <div className="flex items-start gap-2.5 border border-emerald-200 bg-emerald-50/40 p-3.5 rounded-2xl">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold space-y-0.5">
                  <p className="font-bold text-slate-900">{activeRideApt.clinic}</p>
                  <p className="text-[11px] text-slate-600">Assigned Clinician: Dr. {activeRideApt.doctorName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Time: {activeRideApt.date} @ {activeRideApt.timeSlot}</p>
                  <p className="text-[10px] text-emerald-700 font-bold pt-1">
                    * The destination is locked to prevent transit deviation.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* GRAB-LIKE SIMULATED BOOKING INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form: Booking Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Book Ride to Clinic</h2>
                <p className="text-xs text-slate-500 mt-1">Select your clinic destination below to view the route on the map and calculate estimated prices.</p>
              </div>

              {/* 1. Pickup Location Input */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pickup Location
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{isLocating ? "Locating..." : "Use Current GPS"}</span>
                  </button>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Enter your home or pickup address"
                  />
                </div>
              </div>

              {/* 2. Destination Clinic Selection (Allows selecting from appointments OR full clinic list) */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Destination Clinic
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {previewDistance} • ~{previewDuration} mins
                  </span>
                </label>

                <select
                  value={selectedClinicName}
                  onChange={(e) => setSelectedClinicName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {eligibleBookings.length > 0 && (
                    <optgroup label="Your Booked Consultations">
                      {eligibleBookings.map(b => (
                        <option key={b.id} value={b.clinic}>
                          {b.clinic} — Dr. {b.doctorName} ({b.date} @ {b.timeSlot})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All Available Clinics & Hospitals">
                    {mockClinics.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.distance})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 3. Interactive Route Preview Map Right Under Destination */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Route Preview & Clinic Location
                </span>
                <div className="relative bg-slate-100 border border-slate-200 h-[220px] rounded-2xl overflow-hidden shadow-inner">
                  <div ref={previewMapContainerRef} className="w-full h-full z-0"></div>
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold text-slate-700 bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md z-10 font-mono">
                    📍 {selectedClinicName} ({previewDistance} • ~{previewDuration} Mins)
                  </span>
                </div>
              </div>

              {/* 4. Vehicle Tier Selection with Dynamically Calculated Price */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                  Select Ride Tier & Live Fare
                </label>

                <div className="space-y-2.5">
                  {VEHICLE_TIERS.map((tier) => {
                    const isSelected = selectedTier === tier.id;
                    const estimatedFare = Math.round(tier.baseFare + (previewDuration * 0.4));

                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected 
                            ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="text-2xl">{tier.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">{tier.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {tier.seats}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{tier.desc}</p>
                            <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-block">
                              ⚡ Driver ETA: ~{tier.etaMins} mins
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-slate-900 block">
                            RM {estimatedFare}.00
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Est. Fare</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Payment Method Selection (GrabPay without price, Cash, Online Banking) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("grabpay")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === "grabpay"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    GrabPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Cash on Arrival
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online_banking")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === "online_banking"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Online Banking (FPX)
                  </button>
                </div>
              </div>

              {/* 6. Primary Book Button */}
              <button
                type="button"
                onClick={handleBookRide}
                disabled={loadingAptId !== null}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Car className="w-5 h-5" />
                <span>
                  {loadingAptId ? "Dispatching Driver..." : `Book ${activeTierObj.name} to ${selectedClinicName} (RM ${Math.round(activeTierObj.baseFare + (previewDuration * 0.4))}.00)`}
                </span>
              </button>

            </div>
          </div>

          {/* Right Column: Information & Clinic Summary Cards */}
          <div className="lg:col-span-5 space-y-6">
            


            {/* Selected Destination Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Selected Destination
              </span>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm">{selectedClinicName}</h4>
                <p className="text-xs text-slate-600 font-medium">{selectedClinicObj?.address || "Penang, Malaysia"}</p>
                <p className="text-xs text-slate-500 font-mono font-bold">Contact: {selectedClinicObj?.phone || "04-222 5333"}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimated Travel Time:</span>
                <span className="font-bold text-emerald-700">~{previewDuration} Mins ({previewDistance})</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
