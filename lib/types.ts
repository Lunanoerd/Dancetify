export type Genre =
  | 'Hip-hop/Street'
  | 'Ballet/Contemporary'
  | 'K-pop'
  | 'Jazz Funk/Commercial'
  | 'Jazz/Musical Theatre'
  | 'Heels'
  | 'Afro'
  | 'Latin/Salsa/Reggaeton'
  | 'Other'

export type Level = 'BEG/INT' | 'INT/ADV' | 'ADV/PRO' | 'All levels'

export interface DanceClass {
  id: string
  studioName: string
  studioWebsite: string
  bookingUrl: string
  className: string
  instructor: string
  genre: Genre
  level: Level
  dayOfWeek: number  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  classDate?: string | null  // "2026-04-07" — only set for one-off events (Ventures); null = recurring
  startTime: string  // "18:00"
  endTime: string    // "19:30"
  location?: string | null
  price?: string | null
  notes?: string | null
  lastScraped: string
}

export const GENRES: Genre[] = [
  'Hip-hop/Street',
  'Ballet/Contemporary',
  'K-pop',
  'Jazz Funk/Commercial',
  'Jazz/Musical Theatre',
  'Heels',
  'Afro',
  'Latin/Salsa/Reggaeton',
  'Other',
]

export const LEVELS: Level[] = ['BEG/INT', 'INT/ADV', 'ADV/PRO', 'All levels']

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const STUDIO_LOCATIONS: Record<string, { label: string; mapsUrl: string }> = {
  'Playground London':      { label: 'Aldgate East',  mapsUrl: 'https://maps.app.goo.gl/Noy1p2b7bV1ijiih9' },
  'Pineapple Dance Studios':{ label: 'Covent Garden', mapsUrl: 'https://maps.app.goo.gl/vHDt8Tdgr5a3oVfu7' },
  'The Manor LDN':          { label: 'Finsbury Park', mapsUrl: 'https://maps.app.goo.gl/yiYU5ymnaHcKQxMB9' },
  'Base Dance Studios':     { label: 'Vauxhall',      mapsUrl: 'https://maps.app.goo.gl/pXKtR4Gob9EykC7j6' },
  'Ventures Studio':        { label: 'Vauxhall',      mapsUrl: 'https://maps.app.goo.gl/n1AmQzsXJf9Syw7z9' },
  'XY Studio':              { label: 'Holborn',        mapsUrl: 'https://maps.app.goo.gl/4huxFNuLY1xjN5oo6' },
  'Danceworks':             { label: 'Mayfair',        mapsUrl: 'https://share.google/fqITmSVswoZ3xlYqU' },
}

export const GENRE_COLORS: Record<Genre, string> = {
  'Hip-hop/Street':        '#FFAB91',  // pastel orange
  'K-pop':                 '#F48FB1',  // pastel pink
  'Jazz Funk/Commercial':  '#FFE082',  // pastel yellow
  'Jazz/Musical Theatre':  '#80DEEA',  // pastel cyan
  'Afro':                  '#A5D6A7',  // pastel green
  'Ballet/Contemporary':   '#CE93D8',  // lilac/pastel purple
  'Heels':                 '#EF9A9A',  // pastel rose
  'Latin/Salsa/Reggaeton': '#FFCC80',  // pastel amber
  'Other':                 '#B0BEC5',  // pastel grey-blue
}
