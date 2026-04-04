import type { Genre, Level } from '@/lib/types'

const GENRE_KEYWORDS: Array<[Genre, string[]]> = [
  ['Heels', ['heels', 'heel', 'stiletto', 'femme']],
  ['Hip-hop/Street', ['hip hop', 'hiphop', 'hip-hop', 'street', 'breaking', 'breakin', 'bboy', 'bgirl', 'popping', 'locking', 'krump', 'house', 'waacking', 'wacking', 'urban', 'r&b', 'rnb', 'old way', 'vogue', 'voguing']],
  ['K-pop', ['k-pop', 'kpop', 'k pop', 'bts', 'blackpink', 'stray kids', 'twice', 'aespa', 'newjeans', 'studio 808']],
  ['Jazz Funk/Commercial', ['jazz funk', 'jazzfunk', 'commercial', 'stagey', 'funk', 'show jazz']],
  ['Jazz/Musical Theatre', ['musical theatre', 'broadway', 'theatre jazz', 'jazz', 'tap', 'swing', 'fosse', 'bob fosse']],
  ['Afro', ['afro', 'afrobeats', 'afrodance', 'afro house', 'afro fusion', 'afropop', 'amapiano']],
  ['Ballet/Contemporary', ['ballet', 'contemporary', 'modern', 'lyrical', 'barre', 'classical', 'fusion']],
  ['Latin/Salsa/Reggaeton', ['latin', 'salsa', 'reggaeton', 'bachata', 'merengue', 'cumbia', 'mambo', 'rumba', 'samba', 'cha cha', 'zouk', 'kizomba']],
]

const LEVEL_KEYWORDS: Array<[Level, string[]]> = [
  ['ADV/PRO', ['adv/pro', 'advanced/pro', 'advanced pro', 'advanced professional', 'professional']],
  ['INT/ADV', ['int/adv', 'intermediate/advanced', 'int adv', 'advanced']],
  ['BEG/INT', ['beg/int', 'beginner/intermediate', 'beg int', 'beginner', 'beg', 'intermediate', 'inter', 'int']],
]

export function guessGenre(text: string): Genre {
  const lower = text.toLowerCase()
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return genre
  }
  return 'Other'
}

export function guessLevel(text: string): Level {
  const lower = text.toLowerCase()
  for (const [level, keywords] of LEVEL_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return level
  }
  return 'All levels'
}

/** Parse "6:30pm" / "18:30" / "6.30pm" → "18:30" */
export function normalizeTime(raw: string): string {
  if (!raw) return '00:00'
  const match = raw.match(/(\d{1,2})[:\.](\d{2})\s*(am|pm)?/i)
  if (!match) {
    // Try bare hour like "6pm"
    const bare = raw.match(/(\d{1,2})\s*(am|pm)/i)
    if (bare) {
      let h = parseInt(bare[1])
      const ampm = bare[2].toLowerCase()
      if (ampm === 'pm' && h < 12) h += 12
      if (ampm === 'am' && h === 12) h = 0
      return `${String(h).padStart(2, '0')}:00`
    }
    return '00:00'
  }
  let h = parseInt(match[1])
  const m = parseInt(match[2])
  const ampm = match[3]?.toLowerCase()
  if (ampm === 'pm' && h < 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}
