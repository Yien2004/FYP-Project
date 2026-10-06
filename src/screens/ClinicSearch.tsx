import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";
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

  // Coordinates state for mapping
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([5.4164, 100.3301]); // Penang Town center default

  // Live Navigation Animation States
  const [isNavigating, setIsNavigating] = useState(false);
  const [carLocation, setCarLocation] = useState<[number, number] | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const isPublicFacility = (name: string) =>
    name.includes("Klinik Kesihatan") ||
    name.includes("Hospital Pulau Pinang") ||
    name.includes("Hospital Seberang Jaya") ||
    name.includes("Hospital Bukit Mertajam");

  // Load facilities from backend API on mount (Private facilities only)
  useEffect(() => {
    fetch("/api/facilities")
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data: Clinic[]) => {
        // Filter to Penang private clinics only
        const penangClinics = data.filter(c => 
          c.lat > 5.0 && c.lat < 5.8 && c.lng > 100.0 && c.lng < 100.8 && !isPublicFacility(c.name)
        );

        setClinics(penangClinics);
        setFilteredClinics(penangClinics);
        
        setSelectedClinic(null);
        setMapCenter([5.4164, 100.3301]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("Facilities API failed, using fallback mock data:", err);
        // Fallback to local mock clinics filtered to private Penang facilities
        const penangMocks = mockClinics.filter(c => 
          c.lat > 5.0 && c.lat < 5.8 && c.lng > 100.0 && c.lng < 100.8 && !isPublicFacility(c.name)
        );
        const fallbackList = penangMocks.length > 0 ? penangMocks : mockClinics.filter(c => !isPublicFacility(c.name));
        setClinics(fallbackList);
        setFilteredClinics(fallbackList);
        setSelectedClinic(null);
        setMapCenter([5.4164, 100.3301]);
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
    if (map && mapCenter && !isNavigating) {
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

    // Add Car/Ambulance Location Marker if actively navigating
    if (carLocation) {
      const carMarker = L.marker(carLocation, {
        icon: L.divIcon({
          className: 'navigation-car-icon',
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              background-color: #3b82f6;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 10px rgba(59, 130, 246, 0.5);
              font-size: 16px;
            ">
              🚑
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);
      markersRef.current.push(carMarker);
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

    // Only pan bounds on initial selection/draw, do not bounce bounds during active animation
    if (!isNavigating) {
      const start: [number, number] = userLocation || [5.4164, 100.3301];
      const end: [number, number] = selectedClinic ? [selectedClinic.lat, selectedClinic.lng] : start;
      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
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
  }, [filteredClinics, selectedClinic, userLocation, carLocation, routePath, showRouteLine]);

  // Clean up animation interval and layers on clinic change or unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
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

  // Unified Filtering logic for Search + Categories (Private facilities only)
  const applyFilter = (category: "All" | "Hospitals" | "Clinics", searchVal: string) => {
    let result = clinics;

    // 1. Filter by category type
    if (category === "Hospitals") {
      result = result.filter(c => 
        c.name.toLowerCase().includes("hospital") || 
        c.name.toLowerCase().includes("centre") || 
        c.name.toLowerCase().includes("center")
      );
    } else if (category === "Clinics") {
      result = result.filter(c => 
        c.name.toLowerCase().includes("klinik") || 
        c.name.toLowerCase().includes("clinic") || 
        c.name.toLowerCase().includes("poliklinik")
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

    setFilteredClinics(result);
    if (result.length > 0) {
      setSelectedClinic(result[0]);
      setMapCenter([result[0].lat, result[0].lng]);
    } else {
      setSelectedClinic(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter(categoryFilter, zipInput);
  };

  const handleSelectClinic = (clinic: Clinic) => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    setIsNavigating(false);
    setCarLocation(null);
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
        // Verify if coordinates are inside Penang boundaries
        if (latitude > 5.1 && latitude < 5.6 && longitude > 100.1 && longitude < 100.6) {
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setIsUsingSimulatedGps(false);
          initialRealCoordsRef.current = null;
        } else {
          // If outside Penang (e.g. testing in KL), simulate central Penang island Georgetown coordinates
          if (!initialRealCoordsRef.current) {
            initialRealCoordsRef.current = [latitude, longitude];
          }
          const deltaLat = latitude - initialRealCoordsRef.current[0];
          const deltaLng = longitude - initialRealCoordsRef.current[1];
          const simulatedLat = 5.4116 + deltaLat;
          const simulatedLng = 100.3245 + deltaLng;
          setUserLocation([simulatedLat, simulatedLng]);
          setMapCenter([simulatedLat, simulatedLng]);
          setIsUsingSimulatedGps(true);
        }
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

  const handleStartNavigation = () => {
    if (!selectedClinic || routePath.length === 0) return;
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }

    setIsNavigating(true);
    
    let step = 0;
    // Total steps scales with path length to keep speeds smooth and consistent
    const totalSteps = Math.min(150, routePath.length * 3); 

    setCarLocation(routePath[0]);

    animationIntervalRef.current = setInterval(() => {
      step += 1;
      if (step > totalSteps) {
        clearInterval(animationIntervalRef.current!);
        setIsNavigating(false);
        setCarLocation(null);
        alert(`You have arrived at ${selectedClinic.name}!`);
        return;
      }

      // Linear interpolation along coordinates of the OSRM route path
      const progress = step / totalSteps;
      const exactIndex = progress * (routePath.length - 1);
      const segmentIndex = Math.floor(exactIndex);
      const segmentProgress = exactIndex - segmentIndex;

      if (segmentIndex >= routePath.length - 1) {
        setCarLocation(routePath[routePath.length - 1]);
      } else {
        const c1 = routePath[segmentIndex];
        const c2 = routePath[segmentIndex + 1];
        const nextLat = c1[0] + (c2[0] - c1[0]) * segmentProgress;
        const nextLng = c1[1] + (c2[1] - c1[1]) * segmentProgress;
        setCarLocation([nextLat, nextLng]);
      }
    }, 50); // 50ms interval -> very smooth animation!
  };

  return (
    <div id="clinic-search-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Intelligent Clinic Search & Live Map</h1>
        <p className="text-sm text-slate-500 mt-1">
          Locate physical healthcare branches in Penang with live GPS positioning and OSM tile maps.
        </p>
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
              <label className="block text-xs font-bold text-slate-700">Filter branches by Zip, Name or Locality</label>
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
                    placeholder="e.g. 10450, Bayan Lepas, Georgetown..."
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
          {selectedClinic && (
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/85 border border-sky-500/35 p-5 rounded-3xl text-white shadow-[0_0_25px_rgba(56,189,248,0.15)] animate-fade-in font-sans space-y-4">
              
              {/* Header: Status & Mode */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                  </span>
                  <span className="font-extrabold uppercase text-[10px] text-sky-400 tracking-wider">
                    {isNavigating ? "Simulated Emergency Dispatch" : "Live Routing System"}
                  </span>
                </div>
                <span className="text-[9px] bg-sky-950 text-sky-450 border border-sky-850 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Driving Mode
                </span>
              </div>

              {/* Destination Info */}
              <div className="space-y-1">
                <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Destination Branch</span>
                <h4 className="font-black text-slate-100 text-sm leading-tight">
                  {selectedClinic.name}
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">{selectedClinic.address}</p>
              </div>

              {/* Distance & Time Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/60">
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Drive Distance</span>
                  <span className="font-mono text-sm font-extrabold text-sky-400">
                    {routeDistance !== null ? `${routeDistance.toFixed(2)} km` : "Calculating..."}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Est. Duration</span>
                  <span className="font-mono text-sm font-extrabold text-cyan-400">
                    {routeDuration !== null ? `${routeDuration} mins` : "Calculating..."}
                  </span>
                </div>
              </div>

              {/* Route Summary & Actions */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3.5">
                <div className="bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850/60 flex items-start gap-2 text-[10px]">
                  <span className="text-sky-400 shrink-0">🛣️</span>
                  <div className="leading-snug">
                    <span className="text-slate-500 block uppercase font-mono text-[8px] tracking-wider">Recommended Route</span>
                    {formatRoutePath(routeName)}
                  </div>
                </div>

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
                        onClick={() => onSetScreen("schedule-appointment")}
                        className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-350 text-[11px] py-2.5 rounded-xl transition cursor-pointer text-center"
                      >
                        Book Hospital/Clinic
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          handleStartNavigation();
                          scrollToMap();
                        }}
                        disabled={isNavigating}
                        className={`flex-1 text-white text-[11px] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isNavigating
                            ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-sky-600 hover:bg-sky-500 shadow shadow-sky-500/10"
                        }`}
                      >
                        <Navigation className={`w-3 h-3 ${isNavigating ? "animate-spin" : ""}`} />
                        {isNavigating ? "Navigating..." : "Start Navigation"}
                      </button>
                      <button 
                        onClick={() => setShowRouteLine(false)}
                        disabled={isNavigating}
                        className={`flex-1 border border-rose-950 hover:border-rose-900 text-rose-350 text-[11px] py-2.5 rounded-xl transition cursor-pointer text-center ${
                          isNavigating ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Hide Route
                      </button>
                      <button 
                        onClick={() => onSetScreen("schedule-appointment")}
                        className={`flex-1 border border-slate-800 hover:border-slate-700 text-slate-350 text-[11px] py-2.5 rounded-xl transition cursor-pointer text-center ${
                          isNavigating ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isNavigating}
                      >
                        Book Hospital/Clinic
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
                Loading Penang healthcare clinics...
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
                    {cl.featured && (
                      <span className="absolute top-3 right-3 bg-teal-50 text-teal-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        FEATURED EXPRESS
                      </span>
                    )}

                    <div className="space-y-1 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-xs leading-snug">{cl.name}</h3>
                      <p className="text-[11px] text-slate-500 leading-normal max-w-xs">{cl.address}</p>
                      
                      <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-500 font-medium">
                        <span className="bg-slate-50 px-2 py-0.5 rounded leading-none text-teal-700 font-bold font-mono">
                          {cl.distance}
                        </span>
                        <span>{cl.hours}</span>
                      </div>

                      {/* Book appointment action directly inside left side card */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetScreen("schedule-appointment");
                        }}
                        className="mt-3.5 w-full bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl transition shadow shadow-teal-500/10 cursor-pointer text-center block"
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
