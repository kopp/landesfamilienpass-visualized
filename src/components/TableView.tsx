import React, { useEffect, useMemo, useState } from "react";
import { explainEintritt, type Attraction, type FavoritesMap } from "../types";
import { haversineDistanceKm, geocodePlace, makeAttractionId } from "../utils";

type Props = {
  items: Attraction[];
  favorites: FavoritesMap;
  toggleFavorite: (id: string) => void;
};

export default function TableView({ items, favorites, toggleFavorite }: Props) {
  const [query, setQuery] = useState<string>("");
  const [selectedEintritts, setSelectedEintritts] = useState<
    Record<string, boolean>
  >({});
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({});
  const [placeQuery, setPlaceQuery] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showColumnsConfig, setShowColumnsConfig] = useState<boolean>(false);

  const allColumns = useMemo<string[]>(() => {
    const cols = new Set<string>();
    items.forEach((it) => Object.keys(it).forEach((k) => cols.add(k)));
    return Array.from(cols);
  }, [items]);

  const eintrittValues = useMemo<string[]>(() => {
    const s = new Set<string>();
    items.forEach((it) => {
      if (it.Eintritt) s.add(String(it.Eintritt));
    });
    return Array.from(s).sort();
  }, [items]);

  useEffect(() => {
    if (allColumns.length > 0 && Object.keys(visibleCols).length === 0) {
      const obj: Record<string, boolean> = {};
      allColumns.forEach((c) => (obj[c] = true));
      if (Object.prototype.hasOwnProperty.call(obj, "Latitude"))
        obj["Latitude"] = false;
      if (Object.prototype.hasOwnProperty.call(obj, "Longitude"))
        obj["Longitude"] = false;
      setVisibleCols(obj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const selectedKeys = Object.keys(selectedEintritts).filter(
      (k) => selectedEintritts[k],
    );
    if (selectedKeys.length > 0) {
      list = list.filter((it) =>
        selectedKeys.includes(String(it.Eintritt ?? "")),
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
    if (showFavoritesOnly)
      list = list.filter((it) => !!favorites[makeAttractionId(it)]);

    if (sortBy === "distance" && center) {
      list.sort((a: any, b: any) => {
        const da =
          typeof a.Latitude === "number" && typeof a.Longitude === "number"
            ? haversineDistanceKm(
                center.lat,
                center.lon,
                a.Latitude,
                a.Longitude,
              )
            : Number.POSITIVE_INFINITY;
        const db =
          typeof b.Latitude === "number" && typeof b.Longitude === "number"
            ? haversineDistanceKm(
                center.lat,
                center.lon,
                b.Latitude,
                b.Longitude,
              )
            : Number.POSITIVE_INFINITY;
        if (da < db) return sortDir === "asc" ? -1 : 1;
        if (da > db) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sortBy) {
      list.sort((a: any, b: any) => {
        const A = (a[sortBy] ?? "").toString();
        const B = (b[sortBy] ?? "").toString();
        if (A < B) return sortDir === "asc" ? -1 : 1;
        if (A > B) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [
    items,
    query,
    selectedEintritts,
    center,
    radiusKm,
    showFavoritesOnly,
    sortBy,
    sortDir,
    favorites,
  ]);

  function toggleCol(col: string): void {
    setVisibleCols((s) => ({ ...s, [col]: !s[col] }));
  }

  function headerClick(col: string): void {
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
        <fieldset style={{ border: "1px solid #ddd", padding: 8 }}>
          <legend>
            <strong>Nur Attraktionen anzeigen …</strong>
          </legend>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span>... die Favoriten sind</span>
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span>... die Begriff enthalten:</span>
            </label>
            <input
              placeholder="Einrichtung suchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              ... mit Vergünstigung:
              {eintrittValues.map((v) => (
                <label
                  key={v}
                  style={{ display: "flex", gap: 6, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedEintritts[v]}
                    onChange={(e) =>
                      setSelectedEintritts((s) => ({
                        ...s,
                        [v]: e.target.checked,
                      }))
                    }
                  />
                  <span>{explainEintritt(v)}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", padding: 8 }}>
          <legend>
            <strong>Attraktionen in der Nähe finden…</strong>
          </legend>
          <form
            onSubmit={onSearchPlace}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              placeholder="Ort oder Postleitzahl"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
            <input
              placeholder="Radius (km)"
              type="number"
              onChange={(e) =>
                setRadiusKm(e.target.value ? Number(e.target.value) : null)
              }
            />
            <button type="submit">Finden</button>
          </form>
          {center ? (
            <div style={{ marginTop: 8 }}>
              <span>
                Standort: {center.lat.toFixed(4)}, {center.lon.toFixed(4)}.
                &nbsp;
              </span>
              <a
                href="#"
                onClick={() => {
                  setCenter(null);
                  setPlaceQuery("");
                  setRadiusKm(null);
                }}
              >
                Standort löschen
              </a>
            </div>
          ) : null}
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", padding: 8 }}>
          <legend>
            <strong>Spalten ein-/ausblenden…</strong>
          </legend>
          {!showColumnsConfig ? (
            <div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowColumnsConfig(true);
                }}
              >
                Hier klicken, um Spalten zu konfigurieren
              </a>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8 }}>
                Auf einen Spaltenkopf klicken, um danach zu sortieren
              </div>
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
              <div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowColumnsConfig(false);
                  }}
                >
                  Hier klicken, um auszublenden
                </a>
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <div style={{ overflow: "auto", maxHeight: "60vh" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                key={"favorite"}
                style={{
                  borderBottom: "1px solid #ccc",
                }}
              >
                ✭
              </th>
              {center != null ? (
                <th
                  key="distance"
                  onClick={() => headerClick("distance")}
                  style={{ cursor: "pointer", borderBottom: "1px solid #ccc" }}
                >
                  Entfernung (km){" "}
                  {sortBy === "distance" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              ) : null}
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
                  {center ? (
                    <td style={{ padding: "6px 8px" }}>
                      {typeof it.Latitude === "number" &&
                      typeof it.Longitude === "number"
                        ? haversineDistanceKm(
                            center.lat,
                            center.lon,
                            it.Latitude,
                            it.Longitude,
                          ).toFixed(1)
                        : ""}
                    </td>
                  ) : null}
                  {allColumns.map((col) =>
                    visibleCols[col] ? (
                      <td key={col} style={{ padding: "6px 8px" }}>
                        {(() => {
                          const raw = (it as any)[col];
                          if (col === "Homepage" && raw) {
                            const parts = String(raw)
                              .split(/[;,\n]+/)
                              .map((s) => s.trim())
                              .filter(Boolean);
                            return (
                              <div>
                                {parts.map((p, i) => (
                                  <span key={i}>
                                    <a
                                      href={
                                        p.startsWith("http") ? p : `http://${p}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {p}
                                    </a>
                                    {i < parts.length - 1 ? <br /> : null}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          return String(raw ?? "");
                        })()}
                      </td>
                    ) : null,
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
