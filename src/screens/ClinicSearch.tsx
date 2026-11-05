import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Loader2, X } from "lucide-react";
import { Clinic } from "../types";
import { mockClinics } from "../mockData";
import * as L from "leaflet";

interface ClinicSearchProps {
  onSetScreen: (screen: string) => void;
}

// Custom Leaflet marker icons utilizing SVG styling
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background-color: ${isSelected ? '#0d9488' : '#0f172a'};
        color: ${isSelected ? '#ffffff' : '#14b8a6'};
        border: 2px solid ${isSelected ? '#ffffff' : '#334155'};
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        transition: all 0.2s;
        transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-icon',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: #3b82f6;
        border-radius: 50%;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        opacity: 0.75;
      "></div>
      <div style="
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background-color: #3b82f6;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgb(0 0 0 / 0.2);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Geolocation distance and routing helpers
const getHaversineDistance = (coords1: [number, number], coords2: [number, number]): number => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getRouteName = (lat: number, lng: number): string => {
  if (lng > 100.37) {
    return "Penang Bridge, Lebuhraya Utara-Selatan";
  }
  if (lat < 5.35) {
    return "Tun Dr. Lim Chong Eu Hwy, Jalan Tengah";
  }
  if (lat > 5.41) {
    return "Jalan Burma, Jalan Macalister";
  }
  return "Jalan Perak, Jalan Masjid Negeri";
};

const getEstimatedTime = (distance: number): number => {
  const baseTime = (distance / 35) * 60;
  const buffer = distance > 5 ? 5 : 2;
  return Math.round(baseTime + buffer);
};

const formatRoutePath = (name: string): React.ReactNode => {
  if (!name) return <span className="text-slate-400">Calculating best street path...</span>;
  
  const parts = name.split(/(?:,|\/|&|and|via)\s+/gi)
                    .map(p => p.trim())
                    .filter(p => p.length > 0 && p.toLowerCase() !== 'via');
                    
  if (parts.length <= 1) {
    return <span className="font-semibold text-slate-200">{name}</span>;
  }
  
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-sky-400 font-mono text-[9px] font-black">➔</span>}
          <span className="bg-sky-950/60 text-sky-200 border border-sky-900/50 px-2 py-0.5 rounded-md font-medium tracking-wide">
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default function ClinicSearch({ onSetScreen }: ClinicSearchProps) {
  const [zipInput, setZipInput] = useState("");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Category states matching appointment selection (Private facilities only)
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Hospitals" | "Clinics">("All");

  // Coordinates state for mapping (Penang Island focus)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([5.3600, 100.2950]); // Penang Island default

  // OSRM Routing States
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeName, setRouteName] = useState<string>("");

  // Route Rendering and User GPS Modes
  const [showRouteLine, setShowRouteLine] = useState(false);
  const [isUsingSimulatedGps, setIsUsingSimulatedGps] = useState(false);
  const [isTrackingGps, setIsTrackingGps] = useState(false);

  // Leaflet Map Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);
  const initialRealCoordsRef = useRef<[number, number] | null>(null);

  const scrollToMap = () => {
    if (window.innerWidth < 1024 && mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper to calculate Haversine distance and sort branches nearest to furthest
  const sortClinicsByDistance = (list: Clinic[], userCoords: [number, number] | null): Clinic[] => {
    const refCoords = userCoords || [5.4164, 100.3301];
    return [...list].map(c => {
      const km = getHaversineDistance(refCoords, [c.lat, c.lng]);
      return {
        ...c,
        distance: `${km.toFixed(1)} km`,
        rawDistance: km
      } as Clinic & { rawDistance: number };
    }).sort((a, b) => ((a as any).rawDistance || 0) - ((b as any).rawDistance || 0));
  };

  // Load PantaiCare facilities from backend API on mount
  useEffect(() => {
    fetch("/api/facilities")
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data: Clinic[]) => {
        // Filter strictly to PantaiCare exclusive branches
        const pantaiClinics = data.filter(c => c.name.toLowerCase().includes("pantai"));
        const baseList = pantaiClinics.length > 0 ? pantaiClinics : data;
        const sorted = sortClinicsByDistance(baseList, userLocation);

        setClinics(sorted);
        setFilteredClinics(sorted);
        
        if (sorted.length > 0) {
          setMapCenter([sorted[0].lat, sorted[0].lng]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("Facilities API failed, using fallback mock data:", err);
        const pantaiMocks = mockClinics.filter(c => c.name.toLowerCase().includes("pantai"));
        const fallbackList = pantaiMocks.length > 0 ? pantaiMocks : mockClinics;
        const sorted = sortClinicsByDistance(fallbackList, userLocation);

        setClinics(sorted);
        setFilteredClinics(sorted);
        if (sorted.length > 0) {
          setMapCenter([sorted[0].lat, sorted[0].lng]);
        }
        setIsLoading(false);
      });
  }, []);

  // Fetch real street road route from OSRM API
  const fetchRoute = (start: [number, number], end: [number, number]) => {
    const startLng = start[1];
    const startLat = start[0];
    const endLng = end[1];
    const endLat = end[0];

    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("OSRM failed");
        return res.json();
      })
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setRoutePath(coords);
          setRouteDistance(route.distance / 1000); // km
          setRouteDuration(Math.round(route.duration / 60)); // mins
          
          const summaryName = route.legs?.[0]?.summary || getRouteName(end[0], end[1]);
          setRouteName(summaryName);
        } else {
          throw new Error("No route found");
        }
      })
      .catch((err) => {
        console.warn("OSRM route fetch failed, using fallback orthogonal route:", err);
        // Fallback to orthogonal path
        const p2: [number, number] = [start[0] + (end[0] - start[0]) * 0.4, start[1]];
        const p3: [number, number] = [start[0] + (end[0] - start[0]) * 0.4, end[1]];
        const fallbackPath = [start, p2, p3, end];
        
        const dist = getHaversineDistance(start, end);
        setRoutePath(fallbackPath);
        setRouteDistance(dist);
        setRouteDuration(getEstimatedTime(dist));
        setRouteName(getRouteName(end[0], end[1]));
      });
  };

  // Trigger route fetching whenever selected clinic or user location changes
  useEffect(() => {
    if (!selectedClinic) return;
    const start: [number, number] = userLocation || [5.4164, 100.3301];
    const end: [number, number] = [selectedClinic.lat, selectedClinic.lng];
    fetchRoute(start, end);
  }, [selectedClinic, userLocation]);

  // Initialize Map Instance
  useEffect(() => {
    if (isLoading || !mapRef.current || mapInstanceRef.current) return;

    // Create the map object
    const map = L.map(mapRef.current, {
      zoomControl: false,
      center: mapCenter,
      zoom: 12
    });

    // Add TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Trigger initial markers draw
    drawMarkers(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoading]);

  // Keep map view in sync with mapCenter state
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && mapCenter) {
      map.setView(mapCenter, map.getZoom(), { animate: true });
    }
  }, [mapCenter]);

  // Helper function to draw markers on the map
  const drawMarkers = (map: L.Map) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add User Location Marker
    if (userLocation) {
      const userMarker = L.marker(userLocation, { icon: userLocationIcon })
        .addTo(map)
        .bindPopup('<div class="text-xs font-bold font-sans text-slate-800">Your Current Location</div>');
      markersRef.current.push(userMarker);
    }

    // Add Clinic Markers
    filteredClinics.forEach((cl) => {
      const isSelected = selectedClinic?.id === cl.id;
      const marker = L.marker([cl.lat, cl.lng], { icon: createCustomIcon(isSelected) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <div style="font-weight: bold; font-size: 12px; color: #0f172a;">${cl.name}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${cl.address}</div>
            <div style="font-size: 10px; font-family: monospace; color: #0d9488; font-weight: bold; margin-top: 4px;">${cl.hours}</div>
          </div>
        `);

      marker.on('click', () => {
        handleSelectClinic(cl);
      });

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 1 && !selectedClinic) {
      try {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
      } catch (e) {
        // ignore
      }
    }
  };

  // Helper function to draw the real road route on the map
  const drawRoute = (map: L.Map) => {
    // Clear existing route layers
    routeLayersRef.current.forEach(layer => layer.remove());
    routeLayersRef.current = [];

    if (routePath.length === 0) return;

    // Draw Google Maps styled glowing route line (outer border + inner line)
    const shadowLine = L.polyline(routePath, {
      color: '#1d4ed8', // Darker blue border
      weight: 7,
      opacity: 0.4,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    const routeLine = L.polyline(routePath, {
      color: '#3b82f6', // Bright blue inner line (Google Maps style)
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    routeLayersRef.current.push(shadowLine, routeLine);

    const start: [number, number] = userLocation || [5.4164, 100.3301];
    const end: [number, number] = selectedClinic ? [selectedClinic.lat, selectedClinic.lng] : start;
    const bounds = L.latLngBounds([start, end]);
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  // Keep markers and route in sync with state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      drawMarkers(map);
      if (showRouteLine) {
        drawRoute(map);
      } else {
        routeLayersRef.current.forEach(layer => layer.remove());
        routeLayersRef.current = [];
      }
    }
  }, [filteredClinics, selectedClinic, userLocation, routePath, showRouteLine]);

  // Clean up route layers on clinic change or unmount
  useEffect(() => {
    return () => {
      const map = mapInstanceRef.current;
      if (map) {
        routeLayersRef.current.forEach(layer => layer.remove());
      }
    };
  }, [selectedClinic]);

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  // Unified Filtering logic for Search + Categories (PantaiCare branches only)
  const applyFilter = (category: "All" | "Hospitals" | "Clinics", searchVal: string) => {
    let result = clinics;

    // 1. Filter by category type
    if (category === "Hospitals") {
      result = result.filter(c => 
        c.name.toLowerCase().includes("hospital") || 
        c.name.toLowerCase().includes("pavilion")
      );
    } else if (category === "Clinics") {
      result = result.filter(c => 
        c.name.toLowerCase().includes("clinic") || 
        c.name.toLowerCase().includes("centre") ||
        c.name.toLowerCase().includes("center")
      );
    }

    // 2. Filter by search input
    if (searchVal.trim()) {
      result = result.filter(c => 
        c.zipCode.includes(searchVal) || 
        c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
        c.address.toLowerCase().includes(searchVal.toLowerCase())
      );
    }

    const sortedResult = sortClinicsByDistance(result, userLocation);
    setFilteredClinics(sortedResult);
    if (selectedClinic && !sortedResult.some(c => c.id === selectedClinic.id)) {
      setSelectedClinic(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter(categoryFilter, zipInput);
  };

  const handleSelectClinic = (clinic: Clinic) => {
    setShowRouteLine(false);
    setSelectedClinic(clinic);
    setMapCenter([clinic.lat, clinic.lng]);
    scrollToMap();
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
      initialRealCoordsRef.current = null;
      setIsTrackingGps(false);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let activeCoords: [number, number];

        // Verify if coordinates are inside Peninsular Malaysia boundaries
        if (latitude >= 1.0 && latitude <= 7.5 && longitude >= 99.0 && longitude <= 105.0) {
          activeCoords = [latitude, longitude];
          setIsUsingSimulatedGps(false);
          initialRealCoordsRef.current = null;
        } else {
          activeCoords = [latitude, longitude];
          setIsUsingSimulatedGps(false);
        }

        setUserLocation(activeCoords);
        setMapCenter(activeCoords);

        // Auto-sort PantaiCare branches from nearest to furthest based on live distance
        setClinics(prev => sortClinicsByDistance(prev, activeCoords));
        setFilteredClinics(prev => sortClinicsByDistance(prev, activeCoords));
      },
      (error) => {
        console.error("GPS tracking failed:", error);
        alert("Unable to retrieve your location. Make sure GPS permissions are allowed.");
        setIsTrackingGps(false);
        gpsWatchIdRef.current = null;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    gpsWatchIdRef.current = id;
    setIsTrackingGps(true);
  };

  return (
    <div id="clinic-search-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Hospital Finder</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Category filters & Clinic Lists */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Zipcode filter row */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            
            {/* Categories matching Appointment Step 1 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Facility:</span>
              <div className="flex gap-1.5">
                {(["All", "Hospitals", "Clinics"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      applyFilter(cat, zipInput);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-sky-600 text-white shadow shadow-sky-500/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Filter Name</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                  <input 
                    type="text" 
                    value={zipInput}
                    onChange={(e) => {
                      setZipInput(e.target.value);
                      applyFilter(categoryFilter, e.target.value);
                    }}
                    placeholder="example: Bayan Lepas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-bold"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Dedicated Route Navigation Panel - COMPLETELY OUT OF THE MAP */}
          {/* Dedicated Route Navigation Panel - Light Theme */}
          {selectedClinic && (
            <div className="bg-white border border-slate-200 p-5 rounded-3xl text-slate-800 shadow-sm animate-fade-in font-sans space-y-4">
              
              {/* Header with Branch Name and Close (X) button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                    {selectedClinic.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">{selectedClinic.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClinic(null);
                    setShowRouteLine(false);
                  }}
                  className="text-slate-400 hover:text-slate-700 transition p-1.5 cursor-pointer rounded-xl hover:bg-slate-100 flex items-center justify-center shrink-0"
                  title="Hide Route Details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Distance & Time Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Distance</span>
                  <span className="font-mono text-sm font-extrabold text-sky-600">
                    {routeDistance !== null ? `${routeDistance.toFixed(2)} km` : "Calculating..."}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Time</span>
                  <span className="font-mono text-sm font-extrabold text-teal-600">
                    {routeDuration !== null ? `${routeDuration} mins` : "Calculating..."}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex gap-2 w-full">
                  {!showRouteLine ? (
                    <>
                      <button 
                        onClick={() => {
                          setShowRouteLine(true);
                          const map = mapInstanceRef.current;
                          if (map && routePath.length > 0) {
                            const start = userLocation || [5.4164, 100.3301];
                            const end: [number, number] = [selectedClinic.lat, selectedClinic.lng];
                            const bounds = L.latLngBounds([start, end]);
                            map.fitBounds(bounds, { padding: [50, 50] });
                          }
                          scrollToMap();
                        }}
                        className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-sky-500/10"
                      >
                        <Navigation className="w-3 h-3" /> Show Route
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem("pantai_booking_preselected_clinic", selectedClinic.name);
                          localStorage.setItem("pantai_booking_initial_step", "2");
                          onSetScreen("schedule-appointment");
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition cursor-pointer text-center shadow shadow-teal-500/10"
                      >
                        Book Appointment
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setShowRouteLine(false)}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold py-2.5 rounded-xl transition cursor-pointer text-center"
                      >
                        Hide Route
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem("pantai_booking_preselected_clinic", selectedClinic.name);
                          localStorage.setItem("pantai_booking_initial_step", "2");
                          onSetScreen("schedule-appointment");
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition cursor-pointer text-center shadow shadow-teal-500/10"
                      >
                        Book Appointment
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Clinics cards list */}
          <div className="space-y-4 max-h-[440px] overflow-y-auto scrollbar-thin flex-1 pr-1">
            {isLoading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-teal-650" />
                Loading PantaiCare healthcare branches...
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
                No clinics found matching your criteria. Please select another category.
              </div>
            ) : (
              filteredClinics.map((cl) => {
                const isSelected = selectedClinic?.id === cl.id;
                return (
                  <div 
                    key={cl.id}
                    onClick={() => handleSelectClinic(cl)}
                    className={`bg-white border p-4.5 rounded-2xl hover:shadow-md transition cursor-pointer flex justify-between gap-4 relative ${
                      isSelected ? 'border-teal-650 shadow-md ring-1 ring-teal-500/10' : 'border-slate-150'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-xs leading-snug">{cl.name}</h3>
                      <p className="text-[11px] text-slate-500 leading-normal max-w-xs">{cl.address}</p>
                      
                      <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-500 font-medium">
                        <span className="bg-slate-50 px-2 py-0.5 rounded leading-none text-teal-700 font-bold font-mono">
                          {cl.distance}
                        </span>
                      </div>

                      {/* Book appointment action directly inside left side card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem("pantai_booking_preselected_clinic", cl.name);
                          localStorage.setItem("pantai_booking_initial_step", "2");
                          onSetScreen("schedule-appointment");
                        }}
                        className="mt-3 w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer text-center block"
                      >
                        Book Appointment
                      </button>
                    </div>

                    <MapPin className={`w-5 h-5 shrink-0 mt-1 ${isSelected ? 'text-teal-600 fill-teal-100' : 'text-slate-400'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Leaflet Interactive Map */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          <div 
            ref={mapContainerRef}
            id="interactive-map-container" 
            className="bg-slate-100 rounded-3xl border border-slate-200 h-[500px] relative overflow-hidden shadow-sm z-0"
          >
            {/* Native Leaflet Map Target Div */}
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* GPS Locate Me Button floating on top of the map */}
            <button
              onClick={handleLocateUser}
              className={`absolute top-4 right-4 p-2.5 rounded-xl border shadow-md transition z-[1000] cursor-pointer flex items-center gap-1.5 text-xs font-bold font-sans animate-fade-in ${
                isTrackingGps
                  ? "bg-sky-600 border-sky-600 text-white shadow shadow-sky-500/30"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
              }`}
              title={isTrackingGps ? "Stop Tracking Position" : "Track My Position (Real-time)"}
            >
              <Navigation className={`w-4 h-4 ${isTrackingGps ? "text-white animate-pulse" : "text-sky-600 fill-sky-100"}`} />
              {isTrackingGps ? "Tracking Live" : "Locate Me"}
            </button>

            {isUsingSimulatedGps && (
              <div className="absolute top-16 right-4 bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-lg border border-amber-400 shadow-lg text-[9px] font-black uppercase tracking-wider backdrop-blur-sm z-[1000] animate-fade-in">
                ⚠️ Simulated GPS in Penang
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
