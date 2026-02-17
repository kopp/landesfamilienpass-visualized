import React, { useMemo, useState } from "react";
import type { Attraction, FavoritesMap } from "../types";
import { haversineDistanceKm, geocodePlace, makeAttractionId } from "../utils";

type Props = {
  items: Attraction[];
  favorites: FavoritesMap;
  toggleFavorite: (id: string) => void;
};

export default function TableView({ items, favorites, toggleFavorite }: Props) {
  const [query, setQuery] = useState("");
  const [eintrittFilter, setEintrittFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({});
  const [placeQuery, setPlaceQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  const allColumns = useMemo(() => {
    const cols = new Set<string>();
    items.forEach((it) => Object.keys(it).forEach((k) => cols.add(k)));
    return Array.from(cols);
  }, [items]);

  // initialize visible columns
  React.useEffect(() => {
    if (allColumns.length && Object.keys(visibleCols).length === 0) {
      const obj: Record<string, boolean> = {};
      allColumns.forEach((c) => (obj[c] = true));
      setVisibleCols(obj);
    }
  }, [allColumns]);

  async function onSearchPlace(e?: React.FormEvent) {
    e?.preventDefault();
    if (!placeQuery) return;
    const res = await geocodePlace(placeQuery);
    if (res) setCenter(res);
  }

  const filtered = useMemo(() => {
    let list = items.slice();
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((it) =>
        (it.Einrichtung ?? "").toLowerCase().includes(q),
      );
    }
    if (eintrittFilter) {
      list = list.filter(
        (it) => (it.Eintritt ?? "").toString() === eintrittFilter,
      );
    }
    if (center && radiusKm != null) {
      list = list.filter((it) => {
        if (typeof it.Latitude !== "number" || typeof it.Longitude !== "number")
          return false;
        const d = haversineDistanceKm(
          center.lat,
          center.lon,
          it.Latitude,
          it.Longitude,
        );
        return d <= radiusKm;
      });
    }
    if (sortBy) {
      list.sort((a: any, b: any) => {
        const A = (a[sortBy] ?? "").toString();
        const B = (b[sortBy] ?? "").toString();
        if (A < B) return sortDir === "asc" ? -1 : 1;
        if (A > B) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [items, query, eintrittFilter, sortBy, sortDir, center, radiusKm]);

  function toggleCol(col: string) {
    setVisibleCols((s) => ({ ...s, [col]: !s[col] }));
  }

  function headerClick(col: string) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}
      >
        <input
          placeholder="Search Einrichtung..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          placeholder="Eintritt exact"
          value={eintrittFilter}
          onChange={(e) => setEintrittFilter(e.target.value)}
        />
        <form onSubmit={onSearchPlace} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Place or postal code"
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
          />
          <input
            placeholder="radius km"
            type="number"
            onChange={(e) =>
              setRadiusKm(e.target.value ? Number(e.target.value) : null)
            }
          />
          <button type="submit">Locate</button>
        </form>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Columns:</strong>
        {allColumns.map((c) => (
          <label key={c} style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={!!visibleCols[c]}
              onChange={() => toggleCol(c)}
            />{" "}
            {c}
          </label>
        ))}
      </div>

      <div style={{ overflow: "auto", maxHeight: "60vh" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th></th>
              {allColumns.map((col) =>
                visibleCols[col] ? (
                  <th
                    key={col}
                    onClick={() => headerClick(col)}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid #ccc",
                    }}
                  >
                    {col}{" "}
                    {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                ) : null,
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((it, idx) => {
              const id = makeAttractionId(it);
              return (
                <tr key={id + idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 6 }}>
                    <button onClick={() => toggleFavorite(id)}>
                      {favorites[id] ? "★" : "☆"}
                    </button>
                  </td>
                  {allColumns.map(
                    (col) =>
                      visibleCols[col] && (
                        <td key={col} style={{ padding: "6px 8px" }}>
                          {String((it as any)[col] ?? "")}
                        </td>
                      ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
