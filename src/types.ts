export type Attraction = {
  Einrichtung: string
  PLZ: string
  Ort: string
  Strasse: string
  Latitude: number
  Longitude: number
  Eintritt: string
  LFP_erforderlich: boolean
  Gutschein_erforderlich: boolean
  Hinweis: string
  Homepage: string
  Telefon: string
}

// mapping from 'id' (based on content) to whether it is a favorite
export type FavoritesMap = Record<string, boolean>

export function explainEintritt(e: string, long: boolean = false): string {
  // based on https://www.landesfamilienpass.de/attraktionen/attraktionen-uebersicht/
  switch (e) {
    case "E/K":
      if (long) {
        return "Erwachsene ermäßigt, Kinder kostenlos";
      }
      else {
        return "ermmäßigt*";
      }
    case "E":
      return "ermäßigt";
    case "K":
      return "kostenlos";
    default:
      return e;
  }
}