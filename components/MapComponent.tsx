// "use client";

// import { useEffect, useRef } from "react";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";
// import { Store } from "@/lib/types";

// // Define custom marker icon
// const customIcon = new L.Icon({
//   iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
//   iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// interface MapComponentProps {
//   stores: Store[];
//   selectedMarker: Store | null;
//   onMarkerClick: (store: Store) => void;
//   onClosePopup: () => void;
//   zoom?: number;
// }

// const MapComponent = ({ 
//   stores, 
//   selectedMarker, 
//   onMarkerClick, 
//   onClosePopup,
//   zoom = 7 
// }: MapComponentProps) => {
//   const mapRef = useRef<L.Map>(null);

//   useEffect(() => {
//     if (selectedMarker && mapRef.current) {
//       mapRef.current.setView(
//         [selectedMarker.latitude, selectedMarker.longitude],
//         zoom
//       );
//     }
//   }, [selectedMarker, zoom]);

//   const center = stores.length > 0
//     ? [stores[0].latitude, stores[0].longitude]
//     : [36.8065, 10.1815];

//   return (
//     <MapContainer
//       center={center as L.LatLngExpression}
//       zoom={zoom}
//       style={{ height: "100%", width: "100%" }}
//       ref={mapRef}
//     >
//       <TileLayer
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />
//       {stores.map((store) => (
//         <Marker
//           key={store.id}
//           position={[store.latitude, store.longitude]}
//           icon={customIcon}
//           eventHandlers={{
//             click: () => onMarkerClick(store),
//           }}
//         >
//           {selectedMarker?.id === store.id && (
//             <Popup onClose={onClosePopup}>
//               <div className="p-2">
//                 <h3 className="font-bold">{store.nom}</h3>
//                 <p>{store.adresse}</p>
//                 <p>{store.ville}, {store.pays}</p>
//                 <p>{store.telephone}</p>
//               </div>
//             </Popup>
//           )}
//         </Marker>
//       ))}
//     </MapContainer>
//   );
// };






// export default MapComponent;
// "use client";

// import { useEffect, useRef, useState } from "react";
// import {
//   GoogleMap,
//   Marker,
//   InfoWindow,
//   useJsApiLoader,
//   LatLngLiteral,
// } from "@react-google-maps/api";

// const MAP_LIBS = ["places"] as const;
// const PIN_BASE_URL = "/marker-pin.png"; // your pin base image in public/
// const BRAND_ICONS: Record<string,string> = {
//   Aziza: "/icons/aziza.png",
//   Carrefour: "/icons/carrefour.png",
//   Monoprix: "/icons/monoprix.png",
//   MG: "/icons/mg.png",
// };

// interface MarkerData {
//   placeId: string;
//   position: LatLngLiteral;
//   name: string;
//   address: string;
//   distanceKm: number;
//   openingHours?: string;
//   iconUrl: string;       // dataURL from canvas
//   brand: string;
// }

// export default function MapComponent() {
//   const mapRef = useRef<google.maps.Map|null>(null);
//   const [currentPos, setCurrentPos] = useState<LatLngLiteral|null>(null);
//   const [markers, setMarkers] = useState<MarkerData[]>([]);
//   const [filtered, setFiltered] = useState<MarkerData[]>([]);
//   const [selectedBrand, setSelectedBrand] = useState<string| null>(null);
//   const [activeMarker, setActiveMarker] = useState<MarkerData| null>(null);

//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY||"",
//     libraries: MAP_LIBS,
//   });

//   // 1️⃣ Get user’s location
//   useEffect(() => {
//     navigator.geolocation.getCurrentPosition(
//       ({ coords }) => setCurrentPos({ lat: coords.latitude, lng: coords.longitude }),
//       () => alert("Location permission needed")
//     );
//   }, []);

//   // 2️⃣ Once we have map & position, fetch places
//   useEffect(() => {
//     if (isLoaded && currentPos) fetchPlaces();
//   }, [isLoaded, currentPos]);

//   // 3️⃣ Filter when brand changes
//   useEffect(() => {
//     setFiltered(
//       selectedBrand
//         ? markers.filter(m => m.brand === selectedBrand)
//         : markers
//     );
//   }, [selectedBrand, markers]);

//   if (loadError) return <p>Map load error</p>;
//   if (!isLoaded || !currentPos) return <p>Loading…</p>;

//   return (
//     <div style={{ height: "100%", width: "100%" }}>
//       <div className="controls">
//         <button onClick={()=>setSelectedBrand(null)}>All</button>
//         {Object.keys(BRAND_ICONS).map(b => (
//           <button key={b} onClick={()=>setSelectedBrand(b)}>
//             {b}
//           </button>
//         ))}
//       </div>

//       <GoogleMap
//         mapContainerStyle={{ height: "100%", width: "100%" }}
//         center={currentPos}
//         zoom={13}
//         onLoad={map => mapRef.current = map}
//       >
//         {filtered.map(m => (
//           <Marker
//             key={m.placeId}
//             position={m.position}
//             icon={{ url: m.iconUrl, anchor: new google.maps.Point(12,40) }}
//             onClick={()=>setActiveMarker(m)}
//           />
//         ))}

//         {activeMarker && (
//           <InfoWindow
//             position={activeMarker.position}
//             onCloseClick={()=>setActiveMarker(null)}
//           >
//             <div style={{ minWidth: 200 }}>
//               <h3>{activeMarker.name}</h3>
//               <p>{activeMarker.address}</p>
//               <p>{activeMarker.distanceKm.toFixed(1)} km away</p>
//               {activeMarker.openingHours && (
//                 <p>Hours: {activeMarker.openingHours}</p>
//               )}
//             </div>
//           </InfoWindow>
//         )}
//       </GoogleMap>
//     </div>
//   );

//   // ──────────── Helpers ──────────────────────────────────────────────

//   async function fetchPlaces() {
//     if (!mapRef.current) return;
//     const service = new google.maps.places.PlacesService(mapRef.current);
//     const seen = new Set<string>();
//     const all: MarkerData[] = [];

//     for (const brand of Object.keys(BRAND_ICONS)) {
//       const keywords = [brand.toLowerCase()];
//       const req: google.maps.places.TextSearchRequest = {
//         query: brand,
//         location: currentPos!,
//         radius: 5000,
//         type: "supermarket",
//       };

//       const resp = await new Promise<google.maps.places.PlaceResult[]>((res)=>{
//         service.textSearch(req, (results, status) =>
//           res(status === google.maps.places.PlacesServiceStatus.OK && results || [])
//         );
//       });

//       for (const place of resp) {
//         if (!place.place_id || seen.has(place.place_id)) continue;
//         seen.add(place.place_id);

//         const name = place.name ?? "";
//         const addr = place.formatted_address ?? "";
//         const pos = place.geometry?.location?.toJSON();
//         if (!pos) continue;

//         // keyword filter
//         if (!keywords.some(kw => name.toLowerCase().includes(kw))) continue;

//         // distance
//         const d = haversine(currentPos!, pos);

//         // skip beyond 5 km
//         if (d > 5) continue;

//         // fetch opening hours
//         const oh = await fetchHours(place.place_id);

//         // build custom icon once
//         const iconUrl = await createCustomMarker(
//           PIN_BASE_URL,
//           BRAND_ICONS[brand]
//         );

//         all.push({
//           placeId: place.place_id,
//           position: pos,
//           name,
//           address: addr,
//           distanceKm: d,
//           openingHours: oh,
//           iconUrl,
//           brand,
//         });
//       }
//     }

//     // sort by distance
//     all.sort((a,b)=> a.distanceKm - b.distanceKm);
//     setMarkers(all);
//   }

//   function haversine(a:LatLngLiteral,b:LatLngLiteral) {
//     const toRad = (x:number)=> x * Math.PI/180;
//     const R = 6371;
//     const dLat = toRad(b.lat - a.lat);
//     const dLng = toRad(b.lng - a.lng);
//     const u = Math.sin(dLat/2)**2 + 
//               Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*
//               Math.sin(dLng/2)**2;
//     return R * 2 * Math.asin(Math.sqrt(u));
//   }

//   async function fetchHours(placeId:string):Promise<string|undefined> {
//     const svc = new google.maps.places.PlacesService(mapRef.current!);
//     return new Promise(res => {
//       svc.getDetails({ placeId, fields: ["opening_hours"] }, detail => {
//         const oh = detail.opening_hours;
//         if (!oh?.periods) return res(undefined);
//         const today = (new Date().getDay() + 6)%7; // Sun=0→6, Mon=1→0…Sat=6→5
//         const p = oh.periods.find(x => x.open?.day === today);
//         if (!p?.open) return res(undefined);
//         const fmt = (t:string)=> `${t.slice(0,2)}:${t.slice(2)}`;
//         res(`${fmt(p.open.time!)} – ${fmt(p.close!.time!)}`);
//       });
//     });
//   }

//   async function createCustomMarker(pinUrl:string, iconUrl:string) {
//     const [pin, icon] = await Promise.all([
//       loadImage(pinUrl),
//       loadImage(iconUrl),
//     ]);
//     const canvas = document.createElement("canvas");
//     canvas.width = pin.width;
//     canvas.height = pin.height;
//     const ctx = canvas.getContext("2d")!;
//     ctx.drawImage(pin, 0, 0);

//     const dx = (pin.width - icon.width)/2;
//     const dy = pin.height/3 - icon.height/2;
//     ctx.save();
//     ctx.beginPath();
//     ctx.arc(dx + icon.width/2, dy + icon.height/2, icon.width/2, 0, 2*Math.PI);
//     ctx.clip();
//     ctx.drawImage(icon, dx, dy);
//     ctx.restore();
//     return canvas.toDataURL();
//   }

//   function loadImage(src:string):Promise<HTMLImageElement> {
//     return new Promise((res, rej) => {
//       const img = new Image();
//       img.src = src;
//       img.onload = () => res(img);
//       img.onerror = rej;
//     });
//   }
// }
"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { Store } from "@/lib/types";

// Define libraries outside component to prevent re-renders
const LIBRARIES: ("places" | "marker" | "visualization")[] = ["marker", "visualization"];

// Custom marker configurations
const SUPERMARKET_ICONS = {
  mg: {
    url: "/markers/mg.png",
    scaledSize: { width: 40, height: 40 },
  },
  carrefour: {
    url: "/markers/carrefour.png",
    scaledSize: { width: 40, height: 40 },
  },
  aziza: {
    url: "/markers/aziza.png",
    scaledSize: { width: 40, height: 40 },
  },
  monoprix: {
    url: "/markers/monoprix.png",
    scaledSize: { width: 40, height: 40 },
  },
  default: {
    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    scaledSize: { width: 32, height: 32 },
  },
};

interface MapComponentProps {
  stores: Store[];
  selectedMarker: Store | null;
  onMarkerClick: (store: Store) => void;
  onClosePopup: () => void;
  zoom?: number;
}

const MapComponent = ({
  stores,
  selectedMarker,
  onMarkerClick,
  onClosePopup,
  zoom = 14,
}: MapComponentProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([]);

  // Determine which icon to use based on store name
  const getStoreIcon = useCallback((storeName: string) => {
    const lowerName = storeName.toLowerCase();
    if (lowerName.includes("mg")) return SUPERMARKET_ICONS.mg;
    if (lowerName.includes("carrefour")) return SUPERMARKET_ICONS.carrefour;
    if (lowerName.includes("aziza")) return SUPERMARKET_ICONS.aziza;
    if (lowerName.includes("monoprix")) return SUPERMARKET_ICONS.monoprix;
    return SUPERMARKET_ICONS.default;
  }, []);

  // Calculate center position
  const center = useMemo(() => {
    if (stores.length === 0) return { lat: 36.8065, lng: 10.1815 }; // Default to Algiers
    
    // If we have a selected marker, center on it
    if (selectedMarker) {
      return { lat: selectedMarker.latitude, lng: selectedMarker.longitude };
    }

    // Otherwise calculate center of all stores
    const avgLat = stores.reduce((sum, store) => sum + store.latitude, 0) / stores.length;
    const avgLng = stores.reduce((sum, store) => sum + store.longitude, 0) / stores.length;
    return { lat: avgLat, lng: avgLng };
  }, [stores, selectedMarker]);

  // Load Google Maps script
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Handle script loading errors
  useEffect(() => {
    if (scriptLoadError) {
      setLoadError("Failed to load Google Maps. Please check your internet connection.");
      console.error("Google Maps script load error:", scriptLoadError);
    }
  }, [scriptLoadError]);

  // Handle marker selection and map centering
  useEffect(() => {
    if (selectedMarker && mapRef.current) {
      mapRef.current.panTo({
        lat: selectedMarker.latitude,
        lng: selectedMarker.longitude,
      });
      mapRef.current.setZoom(zoom);
    }
  }, [selectedMarker, zoom]);

  // Initialize markers when map loads
  useEffect(() => {
    if (!mapLoaded || !isLoaded || !window.google?.maps?.marker || stores.length === 0) return;

    // Clear existing markers and info windows
    markers.forEach(marker => marker.map = null);
    infoWindows.forEach(window => window.close());
    setMarkers([]);
    setInfoWindows([]);

    // Create new markers with custom icons
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const newInfoWindows: google.maps.InfoWindow[] = [];

    stores.forEach(store => {
      try {
        // Create marker with custom icon
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: store.latitude, lng: store.longitude },
          map: mapRef.current,
          title: store.nom,
          content: createMarkerContent(store),
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(store),
        });

        // Add click event to show info window
        marker.addListener('click', () => {
          // Close all other info windows
          newInfoWindows.forEach(window => window.close());
          // Open this info window
          infoWindow.open({
            anchor: marker,
            map: mapRef.current,
          });
          // Notify parent component
          onMarkerClick(store);
        });

        newMarkers.push(marker);
        newInfoWindows.push(infoWindow);

        // If this is the selected marker, open its info window immediately
        if (selectedMarker?.id === store.id) {
          infoWindow.open({
            anchor: marker,
            map: mapRef.current,
          });
        }

      } catch (error) {
        console.error("Error creating marker for store:", store.nom, error);
      }
    });

    setMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    return () => {
      // Cleanup on unmount
      newMarkers.forEach(marker => marker.map = null);
      newInfoWindows.forEach(window => window.close());
    };
  }, [mapLoaded, isLoaded, stores, selectedMarker]);

  // Helper function to create marker content
  const createMarkerContent = (store: Store) => {
    const icon = getStoreIcon(store.nom);
    return `
      <div style="transform: translate(-50%, -100%);">
        <img src="${icon.url}" 
             width="${icon.scaledSize.width}" 
             height="${icon.scaledSize.height}"
             alt="${store.nom}"
             style="pointer-events: none;">
      </div>
    `;
  };

  // Helper function to create info window content
  const createInfoWindowContent = (store: Store) => {
    return `
      <div class="p-2 max-w-xs">
        <h3 class="font-bold text-lg">${store.nom}</h3>
        <p class="text-gray-600">${store.adresse}</p>
        <p class="text-gray-600">
          ${store.ville}, ${store.pays}
        </p>
        ${store.telephone ? `<p class="text-blue-600 mt-1">${store.telephone}</p>` : ''}
        <button onclick="window.dispatchEvent(new CustomEvent('close-info-window'))" 
                class="mt-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
          Close
        </button>
      </div>
    `;
  };

  // Handle info window close button
  useEffect(() => {
    const handleClose = () => onClosePopup();
    window.addEventListener('close-info-window', handleClose);
    return () => window.removeEventListener('close-info-window', handleClose);
  }, [onClosePopup]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4 text-center">
        <div className="text-red-500 font-medium text-lg">Map Loading Error</div>
        <div className="text-gray-600">{loadError}</div>
        {scriptLoadError?.message && (
          <div className="text-sm text-gray-500">Technical details: {scriptLoadError.message}</div>
        )}
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reload Map
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg">Loading Supermarket Map...</div>
        <div className="text-sm text-gray-500">Powered by Google Maps</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={center}
        zoom={zoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          mapId: "YOUR_MAP_ID", // Optional: Add your map ID if using styled maps
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
        onLoad={(map) => {
          mapRef.current = map;
          setMapLoaded(true);
        }}
        onError={() => {
          setLoadError("Failed to initialize Google Maps. Please try again later.");
        }}
      >
        {/* InfoWindows are managed via the Google Maps API directly */}
      </GoogleMap>

      {/* Legend for supermarket markers */}
      {mapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-10">
          <div className="font-bold mb-2">Supermarket Legend</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <img src={SUPERMARKET_ICONS.mg.url} width={20} height={20} alt="MG" />
              <span>MG Market</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={SUPERMARKET_ICONS.carrefour.url} width={20} height={20} alt="Carrefour" />
              <span>Carrefour</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={SUPERMARKET_ICONS.aziza.url} width={20} height={20} alt="Aziza" />
              <span>Aziza</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={SUPERMARKET_ICONS.monoprix.url} width={20} height={20} alt="Monoprix" />
              <span>Monoprix</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;