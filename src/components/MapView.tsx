import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { Attraction, FavoritesMap } from "../types";
import { makeAttractionId, geocodePlace } from "../utils";

const DefaultCenter: [number, number] = [48.7, 9.0];

type Props = {
  items: Attraction[];
  favorites: FavoritesMap;
  toggleFavorite: (id: string) => void;
};

function ClusterLayer({ items, favorites, toggleFavorite }: Props) {
  const map = useMap();
  const groupRef = useRef<any | null>(null);

  useEffect(() => {
    if (!map) return;
    if (groupRef.current) {
      groupRef.current.clearLayers();
    } else {
      groupRef.current = (L as any).markerClusterGroup();
      map.addLayer(groupRef.current);
    }

    items.forEach((it) => {
      if (typeof it.Latitude !== "number" || typeof it.Longitude !== "number")
        return;
      const marker = L.marker([it.Latitude, it.Longitude]);
      const id = makeAttractionId(it);
      let isFav = !!favorites[id];
      const popupContent = document.createElement("div");
      popupContent.style.minWidth = "200px";

      // header container: title + star button at top-right
      const headerDiv = document.createElement("div");
      headerDiv.style.position = "relative";
      headerDiv.style.paddingRight = "28px";

      const title = document.createElement("strong");
      title.textContent = it.Einrichtung;
      headerDiv.appendChild(title);

      const btn = document.createElement("button");
      btn.textContent = isFav ? "★" : "☆";
      btn.title = isFav ? "Unstar" : "Star";
      btn.style.position = "absolute";
      btn.style.top = "0";
      btn.style.right = "0";
      btn.style.border = "none";
      btn.style.background = "lightgray";
      btn.style.cursor = "pointer";
      btn.style.fontSize = "18px";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        isFav = !isFav;
        toggleFavorite(id);
        btn.textContent = isFav ? "★" : "☆";
        btn.title = isFav ? "Unstar" : "Star";
      });
      headerDiv.appendChild(btn);

      popupContent.appendChild(headerDiv);

      const details = document.createElement("div");
      details.style.marginTop = "6px";
      details.innerHTML = `
        <div>${it.Strasse ?? ""}</div>
        <div>${it.PLZ ?? ""} ${it.Ort_Stadt ?? ""}</div>
        <div>Eintritt: ${it.Eintritt ?? ""}</div>
      `;
      popupContent.appendChild(details);

      // Homepage (first URL if multiple)
      if (it.Homepage) {
        const hp = (it.Homepage ?? "").split(/[;,\n]+/)[0].trim();
        if (hp) {
          const hpDiv = document.createElement("div");
          hpDiv.style.marginTop = "6px";
          const a = document.createElement("a");
          a.href = hp.startsWith("http") ? hp : `http://${hp}`;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = hp;
          // prevent map from closing popup when clicking the link
          a.addEventListener("click", (e) => e.stopPropagation());
          hpDiv.appendChild(a);
          popupContent.appendChild(hpDiv);
        }
      }

      // Hinweis (show full text)
      if (it.Hinweis) {
        const hintText = String(it.Hinweis);
        const hintContainer = document.createElement("div");
        hintContainer.style.marginTop = "6px";
        const hintFull = document.createElement("div");
        hintFull.textContent = hintText;
        hintContainer.appendChild(hintFull);
        popupContent.appendChild(hintContainer);
      }
      // prevent clicks inside the popup (buttons/links) from closing it or propagating to the map
      L.DomEvent.disableClickPropagation(popupContent);
      L.DomEvent.disableScrollPropagation(popupContent);
      marker.bindPopup(popupContent);
      groupRef.current!.addLayer(marker);
    });

    return () => {
      if (groupRef.current && map) map.removeLayer(groupRef.current);
      groupRef.current = null;
    };
  }, [map, items, favorites, toggleFavorite]);

  return null;
}

function MapReady({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    // move zoom control to bottomright: remove default and add a new one
    const zoomCtrl = L.control.zoom({ position: "bottomright" });
    zoomCtrl.addTo(map);
    return () => {
      try {
        zoomCtrl.remove();
      } catch (e) {
        // ignore
      }
    };
  }, [map, mapRef]);
  return null;
}

export default function MapView({ items, favorites, toggleFavorite }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!placeQuery) return;
    setSearching(true);
    const res = await geocodePlace(placeQuery);
    setSearching(false);
    if (res && mapRef.current) {
      mapRef.current.setView([res.lat, res.lon], 12, { animate: true });
    }
  }

  return (
    <div style={{ height: "70vh", width: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 1000,
          display: "flex",
          gap: 8,
        }}
      >
        <form
          onSubmit={doSearch}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            placeholder="City or postal code"
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            style={{ padding: "6px 8px" }}
          />
          <button style={{ padding: "6px 8px" }} onClick={doSearch}>
            {searching ? "Searching…" : "Go"}
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            />
            <span>Show favorites only</span>
          </label>
        </form>
      </div>

      <MapContainer
        center={DefaultCenter}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClusterLayer
          items={
            showFavoritesOnly
              ? items.filter((it) => !!favorites[makeAttractionId(it)])
              : items
          }
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
        <MapReady mapRef={mapRef} />
      </MapContainer>
    </div>
  );
}
