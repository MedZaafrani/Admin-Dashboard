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
"use client";

import { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
  LatLngLiteral,
} from "@react-google-maps/api";

const MAP_LIBS = ["places"] as const;
const PIN_BASE_URL = "/marker-pin.png"; // your pin base image in public/
const BRAND_ICONS: Record<string,string> = {
  Aziza: "/icons/aziza.png",
  Carrefour: "/icons/carrefour.png",
  Monoprix: "/icons/monoprix.png",
  MG: "/icons/mg.png",
};

interface MarkerData {
  placeId: string;
  position: LatLngLiteral;
  name: string;
  address: string;
  distanceKm: number;
  openingHours?: string;
  iconUrl: string;       // dataURL from canvas
  brand: string;
}

export default function MapComponent() {
  const mapRef = useRef<google.maps.Map|null>(null);
  const [currentPos, setCurrentPos] = useState<LatLngLiteral|null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [filtered, setFiltered] = useState<MarkerData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string| null>(null);
  const [activeMarker, setActiveMarker] = useState<MarkerData| null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY||"",
    libraries: MAP_LIBS,
  });

  // 1️⃣ Get user’s location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCurrentPos({ lat: coords.latitude, lng: coords.longitude }),
      () => alert("Location permission needed")
    );
  }, []);

  // 2️⃣ Once we have map & position, fetch places
  useEffect(() => {
    if (isLoaded && currentPos) fetchPlaces();
  }, [isLoaded, currentPos]);

  // 3️⃣ Filter when brand changes
  useEffect(() => {
    setFiltered(
      selectedBrand
        ? markers.filter(m => m.brand === selectedBrand)
        : markers
    );
  }, [selectedBrand, markers]);

  if (loadError) return <p>Map load error</p>;
  if (!isLoaded || !currentPos) return <p>Loading…</p>;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div className="controls">
        <button onClick={()=>setSelectedBrand(null)}>All</button>
        {Object.keys(BRAND_ICONS).map(b => (
          <button key={b} onClick={()=>setSelectedBrand(b)}>
            {b}
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={{ height: "100%", width: "100%" }}
        center={currentPos}
        zoom={13}
        onLoad={map => mapRef.current = map}
      >
        {filtered.map(m => (
          <Marker
            key={m.placeId}
            position={m.position}
            icon={{ url: m.iconUrl, anchor: new google.maps.Point(12,40) }}
            onClick={()=>setActiveMarker(m)}
          />
        ))}

        {activeMarker && (
          <InfoWindow
            position={activeMarker.position}
            onCloseClick={()=>setActiveMarker(null)}
          >
            <div style={{ minWidth: 200 }}>
              <h3>{activeMarker.name}</h3>
              <p>{activeMarker.address}</p>
              <p>{activeMarker.distanceKm.toFixed(1)} km away</p>
              {activeMarker.openingHours && (
                <p>Hours: {activeMarker.openingHours}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );

  // ──────────── Helpers ──────────────────────────────────────────────

  async function fetchPlaces() {
    if (!mapRef.current) return;
    const service = new google.maps.places.PlacesService(mapRef.current);
    const seen = new Set<string>();
    const all: MarkerData[] = [];

    for (const brand of Object.keys(BRAND_ICONS)) {
      const keywords = [brand.toLowerCase()];
      const req: google.maps.places.TextSearchRequest = {
        query: brand,
        location: currentPos!,
        radius: 5000,
        type: "supermarket",
      };

      const resp = await new Promise<google.maps.places.PlaceResult[]>((res)=>{
        service.textSearch(req, (results, status) =>
          res(status === google.maps.places.PlacesServiceStatus.OK && results || [])
        );
      });

      for (const place of resp) {
        if (!place.place_id || seen.has(place.place_id)) continue;
        seen.add(place.place_id);

        const name = place.name ?? "";
        const addr = place.formatted_address ?? "";
        const pos = place.geometry?.location?.toJSON();
        if (!pos) continue;

        // keyword filter
        if (!keywords.some(kw => name.toLowerCase().includes(kw))) continue;

        // distance
        const d = haversine(currentPos!, pos);

        // skip beyond 5 km
        if (d > 5) continue;

        // fetch opening hours
        const oh = await fetchHours(place.place_id);

        // build custom icon once
        const iconUrl = await createCustomMarker(
          PIN_BASE_URL,
          BRAND_ICONS[brand]
        );

        all.push({
          placeId: place.place_id,
          position: pos,
          name,
          address: addr,
          distanceKm: d,
          openingHours: oh,
          iconUrl,
          brand,
        });
      }
    }

    // sort by distance
    all.sort((a,b)=> a.distanceKm - b.distanceKm);
    setMarkers(all);
  }

  function haversine(a:LatLngLiteral,b:LatLngLiteral) {
    const toRad = (x:number)=> x * Math.PI/180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const u = Math.sin(dLat/2)**2 + 
              Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*
              Math.sin(dLng/2)**2;
    return R * 2 * Math.asin(Math.sqrt(u));
  }

  async function fetchHours(placeId:string):Promise<string|undefined> {
    const svc = new google.maps.places.PlacesService(mapRef.current!);
    return new Promise(res => {
      svc.getDetails({ placeId, fields: ["opening_hours"] }, detail => {
        const oh = detail.opening_hours;
        if (!oh?.periods) return res(undefined);
        const today = (new Date().getDay() + 6)%7; // Sun=0→6, Mon=1→0…Sat=6→5
        const p = oh.periods.find(x => x.open?.day === today);
        if (!p?.open) return res(undefined);
        const fmt = (t:string)=> `${t.slice(0,2)}:${t.slice(2)}`;
        res(`${fmt(p.open.time!)} – ${fmt(p.close!.time!)}`);
      });
    });
  }

  async function createCustomMarker(pinUrl:string, iconUrl:string) {
    const [pin, icon] = await Promise.all([
      loadImage(pinUrl),
      loadImage(iconUrl),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = pin.width;
    canvas.height = pin.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(pin, 0, 0);

    const dx = (pin.width - icon.width)/2;
    const dy = pin.height/3 - icon.height/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(dx + icon.width/2, dy + icon.height/2, icon.width/2, 0, 2*Math.PI);
    ctx.clip();
    ctx.drawImage(icon, dx, dy);
    ctx.restore();
    return canvas.toDataURL();
  }

  function loadImage(src:string):Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = () => res(img);
      img.onerror = rej;
    });
  }
}
