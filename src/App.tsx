import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { Attraction, FavoritesMap } from "./types";
import MapView from "./components/MapView";
import TableView from "./components/TableView";

const FAVORITES_KEY = "lfp:favorites:v1";

function loadFavorites(): FavoritesMap {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function saveFavorites(f: FavoritesMap) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(f));
  } catch (err) {
    // ignore
  }
}

export default function App(): JSX.Element {
  const [items, setItems] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "table">("map");
  const [favorites, setFavorites] = useState<FavoritesMap>(() =>
    loadFavorites(),
  );

  useEffect(() => {
    fetch("/public/data/lfp.json")
      .then((r) => r.json())
      .then((j) => setItems(j))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const favoritesCount = useMemo(
    () => Object.keys(favorites).length,
    [favorites],
  );

  return (
    <div id="app-root">
      <header className="app-header">
        <h1>Landesfamilienpass — Attractions</h1>
        <div className="header-controls">
          <button
            onClick={() => setView("map")}
            className={view === "map" ? "active" : ""}
          >
            Map
          </button>
          <button
            onClick={() => setView("table")}
            className={view === "table" ? "active" : ""}
          >
            Table
          </button>
          <div className="fav-count">★ {favoritesCount}</div>
        </div>
      </header>

      <main>
        {loading ? (
          <div>Loading…</div>
        ) : view === "map" ? (
          <MapView
            items={items}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <TableView
            items={items}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
      </main>
    </div>
  );
}
