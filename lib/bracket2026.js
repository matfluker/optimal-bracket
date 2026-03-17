// lib/bracket2026.js
//
// The official 2026 NCAA Men's Basketball Tournament bracket.
// This is the FINAL bracket — it persists permanently.
//
// First Four games are represented as "TeamA/TeamB" until resolved.
// The admin panel lets you edit team names if needed.

export const BRACKET_2026 = {
  east: {
    '1':  'Duke',
    '2':  'Connecticut',
    '3':  'Michigan State',
    '4':  'Kansas',
    '5':  "St. John's",
    '6':  'Louisville',
    '7':  'UCLA',
    '8':  'Ohio State',
    '9':  'TCU',
    '10': 'UCF',
    '11': 'South Florida',
    '12': 'Northern Iowa',
    '13': 'Cal Baptist',
    '14': 'North Dakota State',
    '15': 'Furman',
    '16': 'Siena',
  },
  south: {
    '1':  'Florida',
    '2':  'Houston',
    '3':  'Illinois',
    '4':  'Nebraska',
    '5':  'Vanderbilt',
    '6':  'North Carolina',
    '7':  "Saint Mary's",
    '8':  'Clemson',
    '9':  'Iowa',
    '10': 'Texas A&M',
    '11': 'VCU',
    '12': 'McNeese',
    '13': 'Troy',
    '14': 'Penn',
    '15': 'Idaho',
    '16': 'Prairie View/Lehigh',  // First Four
  },
  west: {
    '1':  'Arizona',
    '2':  'Purdue',
    '3':  'Gonzaga',
    '4':  'Arkansas',
    '5':  'Wisconsin',
    '6':  'BYU',
    '7':  'Miami FL',
    '8':  'Villanova',
    '9':  'Utah State',
    '10': 'Missouri',
    '11': 'Texas/NC State',  // First Four
    '12': 'High Point',
    '13': 'Hawaii',
    '14': 'Kennesaw State',
    '15': 'Queens',
    '16': 'LIU',
  },
  midwest: {
    '1':  'Michigan',
    '2':  'Iowa State',
    '3':  'Virginia',
    '4':  'Alabama',
    '5':  'Texas Tech',
    '6':  'Tennessee',
    '7':  'Kentucky',
    '8':  'Georgia',
    '9':  'Saint Louis',
    '10': 'Santa Clara',
    '11': 'Miami OH/SMU',  // First Four
    '12': 'Akron',
    '13': 'Hofstra',
    '14': 'Wright State',
    '15': 'Tennessee State',
    '16': 'UMBC/Howard',  // First Four
  },
}

// First Four games — resolved when winners are known
export const FIRST_FOUR = [
  { region: 'west',    seed: 11, teams: ['Texas', 'NC State'] },
  { region: 'midwest', seed: 11, teams: ['Miami OH', 'SMU'] },
  { region: 'midwest', seed: 16, teams: ['UMBC', 'Howard'] },
  { region: 'south',   seed: 16, teams: ['Prairie View', 'Lehigh'] },
]
