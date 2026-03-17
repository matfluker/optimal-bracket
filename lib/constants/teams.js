// lib/constants/teams.js
//
// Different data sources spell team names differently.
// Example: Yahoo says "UConn", TeamRankings says "Connecticut", Odds API says "Connecticut Huskies"
// This table maps every variant to one canonical name that we use everywhere.
//
// HOW TO UPDATE: If a team name isn't matching, add a new line:
//   'How the source spells it': 'Canonical Name',

export const TEAM_NAME_MAP = {
  // ── 2026 Tournament Teams ──────────────────────────────────────────────

  // Connecticut / UConn
  'uconn': 'Connecticut',
  'uconn huskies': 'Connecticut',
  'connecticut huskies': 'Connecticut',
  'connecticut': 'Connecticut',

  // North Carolina
  'unc': 'North Carolina',
  'n. carolina': 'North Carolina',
  'north carolina tar heels': 'North Carolina',
  'north carolina': 'North Carolina',

  // Michigan State
  'michigan st': 'Michigan State',
  'michigan st.': 'Michigan State',
  'michigan state spartans': 'Michigan State',
  'michigan state': 'Michigan State',
  'msu': 'Michigan State',

  // Michigan (2026 Midwest 1-seed)
  'michigan wolverines': 'Michigan',
  'michigan': 'Michigan',

  // Ohio State
  'ohio st': 'Ohio State',
  'ohio st.': 'Ohio State',
  'ohio state buckeyes': 'Ohio State',
  'ohio state': 'Ohio State',

  // Iowa State
  'iowa st': 'Iowa State',
  'iowa st.': 'Iowa State',
  'iowa state cyclones': 'Iowa State',
  'iowa state': 'Iowa State',

  // Utah State
  'utah st': 'Utah State',
  'utah st.': 'Utah State',
  'utah state aggies': 'Utah State',
  'utah state': 'Utah State',

  // NC State
  'nc state': 'NC State',
  'ncst': 'NC State',
  'north carolina state': 'NC State',
  'nc state wolfpack': 'NC State',
  'north carolina state wolfpack': 'NC State',

  // Wright State
  'wright st': 'Wright State',
  'wright st.': 'Wright State',
  'wright state raiders': 'Wright State',
  'wright state': 'Wright State',

  // Kennesaw State
  'kennesaw st': 'Kennesaw State',
  'kennesaw st.': 'Kennesaw State',
  'kennesaw state owls': 'Kennesaw State',
  'kennesaw state': 'Kennesaw State',

  // North Dakota State
  'n. dakota st.': 'North Dakota State',
  'n dakota st': 'North Dakota State',
  'north dakota st': 'North Dakota State',
  'north dakota state bison': 'North Dakota State',
  'north dakota state': 'North Dakota State',
  'ndsu': 'North Dakota State',

  // Tennessee State
  'tennessee st': 'Tennessee State',
  'tennessee st.': 'Tennessee State',
  'tennessee state tigers': 'Tennessee State',
  'tennessee state': 'Tennessee State',

  // Northern Iowa
  'n. iowa': 'Northern Iowa',
  'n iowa': 'Northern Iowa',
  'northern iowa panthers': 'Northern Iowa',
  'northern iowa': 'Northern Iowa',
  'uni': 'Northern Iowa',

  // South Florida
  'south florida bulls': 'South Florida',
  'south florida': 'South Florida',
  'usf': 'South Florida',
  'usf bulls': 'South Florida',

  // Cal Baptist
  'cal baptist': 'Cal Baptist',
  'cal baptist lancers': 'Cal Baptist',
  'california baptist': 'Cal Baptist',
  'cbu': 'Cal Baptist',

  // Texas A&M
  'texas a&m': 'Texas A&M',
  'texas a&m aggies': 'Texas A&M',
  'tamu': 'Texas A&M',

  // Texas Tech
  'texas tech': 'Texas Tech',
  'texas tech red raiders': 'Texas Tech',
  'ttu': 'Texas Tech',

  // Santa Clara
  'santa clara': 'Santa Clara',
  'santa clara broncos': 'Santa Clara',

  // Saint Louis
  'saint louis': 'Saint Louis',
  'st. louis': 'Saint Louis',
  'st louis': 'Saint Louis',
  'saint louis billikens': 'Saint Louis',

  // Miami FL (main campus)
  'miami hurricanes': 'Miami FL',
  'miami (fl)': 'Miami FL',
  'miami fl': 'Miami FL',
  'miami': 'Miami FL',

  // Miami OH
  'miami (oh)': 'Miami OH',
  'miami oh': 'Miami OH',
  'miami ohio': 'Miami OH',
  'miami (ohio)': 'Miami OH',
  'miami redhawks': 'Miami OH',

  // Prairie View A&M
  'prairie view': 'Prairie View',
  'prairie view a&m': 'Prairie View',
  'pvamu': 'Prairie View',
  'pvam': 'Prairie View',

  // High Point
  'high point': 'High Point',
  'high point panthers': 'High Point',

  // ── Abbreviation-heavy schools ──────────────────────────────────────────

  'vcu': 'VCU',
  'virginia commonwealth': 'VCU',
  'virginia commonwealth rams': 'VCU',

  'ucf': 'UCF',
  'central florida': 'UCF',
  'ucf knights': 'UCF',

  'smu': 'SMU',
  'southern methodist': 'SMU',
  'smu mustangs': 'SMU',

  'tcu': 'TCU',
  'texas christian': 'TCU',
  'tcu horned frogs': 'TCU',

  'byu': 'BYU',
  'brigham young': 'BYU',
  'byu cougars': 'BYU',

  'lsu': 'LSU',
  'louisiana state': 'LSU',
  'lsu tigers': 'LSU',

  'umbc': 'UMBC',
  'umbc retrievers': 'UMBC',
  'maryland-baltimore county': 'UMBC',

  'liu': 'LIU',
  'long island': 'LIU',
  'liu sharks': 'LIU',
  'long island university': 'LIU',

  'ucla bruins': 'UCLA',
  'ucla': 'UCLA',

  // ── Saint / St. variants ────────────────────────────────────────────────

  "saint mary's": "Saint Mary's",
  "st. mary's": "Saint Mary's",
  "saint mary's gaels": "Saint Mary's",
  "st mary's": "Saint Mary's",

  "st. john's": "St. John's",
  "saint john's": "St. John's",
  "st john's": "St. John's",
  "st. john's red storm": "St. John's",

  // ── Major programs ──────────────────────────────────────────────────────

  'duke blue devils': 'Duke',
  'duke': 'Duke',
  'kansas jayhawks': 'Kansas',
  'kansas': 'Kansas',
  'kentucky wildcats': 'Kentucky',
  'kentucky': 'Kentucky',
  'villanova wildcats': 'Villanova',
  'villanova': 'Villanova',
  'gonzaga bulldogs': 'Gonzaga',
  'gonzaga': 'Gonzaga',
  'houston cougars': 'Houston',
  'houston': 'Houston',
  'purdue boilermakers': 'Purdue',
  'purdue': 'Purdue',
  'tennessee volunteers': 'Tennessee',
  'tennessee': 'Tennessee',
  'alabama crimson tide': 'Alabama',
  'alabama': 'Alabama',
  'texas longhorns': 'Texas',
  'texas': 'Texas',
  'arizona wildcats': 'Arizona',
  'arizona': 'Arizona',
  'illinois fighting illini': 'Illinois',
  'illinois': 'Illinois',
  'iowa hawkeyes': 'Iowa',
  'iowa': 'Iowa',
  'virginia cavaliers': 'Virginia',
  'virginia': 'Virginia',
  'arkansas razorbacks': 'Arkansas',
  'arkansas': 'Arkansas',
  'florida gators': 'Florida',
  'florida': 'Florida',
  'wisconsin badgers': 'Wisconsin',
  'wisconsin': 'Wisconsin',
  'louisville cardinals': 'Louisville',
  'louisville': 'Louisville',
  'nebraska cornhuskers': 'Nebraska',
  'nebraska': 'Nebraska',
  'clemson tigers': 'Clemson',
  'clemson': 'Clemson',
  'vanderbilt commodores': 'Vanderbilt',
  'vanderbilt': 'Vanderbilt',
  'georgia bulldogs': 'Georgia',
  'georgia': 'Georgia',
  'missouri tigers': 'Missouri',
  'missouri': 'Missouri',
  'mcneese cowboys': 'McNeese',
  'mcneese': 'McNeese',
  'mcneese state': 'McNeese',
  'furman paladins': 'Furman',
  'furman': 'Furman',
}

// Normalize a team name to its canonical form.
// Checks KV-backed custom overrides first (set via admin panel),
// then falls back to the static TEAM_NAME_MAP below.
//
// The overrideMap parameter is optional — pass it when you have
// already fetched overrides to avoid redundant KV calls.
// When called without it (e.g. in scrapers), pass an empty object
// and the static map handles normalization alone.
export function normalizeTeamName(rawName, overrideMap = {}) {
  if (!rawName) return rawName
  const lower = rawName.toLowerCase().trim()
  // Custom KV overrides take highest priority
  if (overrideMap[lower]) return overrideMap[lower]
  // Static map second
  return TEAM_NAME_MAP[lower] || toTitleCase(rawName.trim())
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

// Round keys used throughout the app
export const ROUND_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']
export const ROUND_NAMES = {
  r1: 'Round of 64',
  r2: 'Round of 32',
  r3: 'Sweet 16',
  r4: 'Elite Eight',
  r5: 'Final Four',
  r6: 'Championship'
}

// ESPN scoring points per round
export const ESPN_POINTS = { r1: 10, r2: 20, r3: 40, r4: 80, r5: 160, r6: 320 }
export const STRAIGHT_POINTS = { r1: 1, r2: 1, r3: 1, r4: 1, r5: 1, r6: 1 }

// Standard seed matchups in Round 1 (higher seed vs lower seed)
export const R1_MATCHUPS = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]
]

// All regions
export const REGIONS = ['south', 'east', 'midwest', 'west']
