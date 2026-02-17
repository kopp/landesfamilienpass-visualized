export type Attraction = {
  Einrichtung: string
  PLZ?: string
  Ort_Stadt?: string
  Strasse?: string
  Latitude?: number
  Longitude?: number
  Eintritt?: string | null
  LFP_erforderlich?: boolean | string
  Gutschein_erforderlich?: string | null
  Hinweis?: string | null
  Homepage?: string | null
  Telefon?: string | null
}

export type FavoritesMap = Record<string, boolean>
