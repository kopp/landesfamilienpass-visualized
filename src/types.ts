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
