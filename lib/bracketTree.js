// lib/bracketTree.js
//
// The bracket is represented as 63 game objects arranged in a tree.
// Each game knows:
//   - which round it's in
//   - which region it belongs to
//   - what two teams are playing (or which two games feed into it)
//
// Round 1 (32 games): teams from the bracket seedings
// Round 2-6 (31 games): teams come from winners of previous round games
//
// GAME ID FORMAT:
//   south_r1_g1  → South region, Round 1, Game 1 (1-seed vs 16-seed)
//   south_r2_g1  → South region, Round 2, Game 1 (winner of g1 vs winner of g2)
//   ff_g1        → Final Four game 1
//   championship → The championship game

import { REGIONS, R1_MATCHUPS } from './constants/teams.js'

// ─── Build Bracket Structure from Import Data ─────────────────────────────────

// Call this after Selection Sunday with the imported team data
// teams = {
//   south: { '1': 'Duke', '2': 'Tennessee', ..., '16': 'Wagner' },
//   east: { ... },
//   midwest: { ... },
//   west: { ... }
// }
export function buildBracketStructure(teams) {
  const games = []

  // Build games for each region
  REGIONS.forEach((region, regionIndex) => {
    const regionTeams = teams[region] || {}

    // Round 1: 8 games using standard seed matchups
    // R1_MATCHUPS = [[1,16], [8,9], [5,12], [4,13], [6,11], [3,14], [7,10], [2,15]]
    R1_MATCHUPS.forEach(([highSeed, lowSeed], gameIndex) => {
      const gameId = `${region}_r1_g${gameIndex + 1}`

      const highTeamName = regionTeams[highSeed.toString()]
      const lowTeamName = regionTeams[lowSeed.toString()]

      // For slash pairs like "Howard/Wagner", use the first name
      const resolvedHigh = highTeamName ? highTeamName.split('/')[0].trim() : '?'
      const resolvedLow = lowTeamName ? lowTeamName.split('/')[0].trim() : '?'

      games.push({
        id: gameId,
        round: 1,
        region,
        gameIndex: gameIndex + 1,
        teamA: {
          seed: highSeed,
          name: resolvedHigh,
          displayName: `${highSeed}. ${resolvedHigh}`,
        },
        teamB: {
          seed: lowSeed,
          name: resolvedLow,
          displayName: `${lowSeed}. ${resolvedLow}`,
        },
        feederGameA: null,
        feederGameB: null,
      })
    })

    // Round 2: 4 games (winners of R1 games)
    for (let i = 0; i < 4; i++) {
      const gameId = `${region}_r2_g${i + 1}`
      const feederA = `${region}_r1_g${i * 2 + 1}`
      const feederB = `${region}_r1_g${i * 2 + 2}`

      games.push({
        id: gameId,
        round: 2,
        region,
        gameIndex: i + 1,
        teamA: null,
        teamB: null,
        feederGameA: feederA,
        feederGameB: feederB,
      })
    }

    // Round 3 (Sweet 16): 2 games
    for (let i = 0; i < 2; i++) {
      const gameId = `${region}_r3_g${i + 1}`
      games.push({
        id: gameId,
        round: 3,
        region,
        gameIndex: i + 1,
        teamA: null,
        teamB: null,
        feederGameA: `${region}_r2_g${i * 2 + 1}`,
        feederGameB: `${region}_r2_g${i * 2 + 2}`,
      })
    }

    // Round 4 (Elite Eight): 1 game per region
    games.push({
      id: `${region}_r4_g1`,
      round: 4,
      region,
      gameIndex: 1,
      teamA: null,
      teamB: null,
      feederGameA: `${region}_r3_g1`,
      feederGameB: `${region}_r3_g2`,
    })
  })

  // Final Four (Round 5): 2 games
  // Semifinal 1: South vs East region winners
  games.push({
    id: 'ff_r5_g1',
    round: 5,
    region: 'final_four',
    gameIndex: 1,
    teamA: null,
    teamB: null,
    feederGameA: 'south_r4_g1',
    feederGameB: 'east_r4_g1',
  })

  // Semifinal 2: Midwest vs West region winners
  games.push({
    id: 'ff_r5_g2',
    round: 5,
    region: 'final_four',
    gameIndex: 2,
    teamA: null,
    teamB: null,
    feederGameA: 'midwest_r4_g1',
    feederGameB: 'west_r4_g1',
  })

  // Championship (Round 6): 1 game
  games.push({
    id: 'championship',
    round: 6,
    region: 'championship',
    gameIndex: 1,
    teamA: null,
    teamB: null,
    feederGameA: 'ff_r5_g1',
    feederGameB: 'ff_r5_g2',
  })

  return {
    games,
    teams,
    createdAt: new Date().toISOString(),
  }
}

// ─── Get All Teams from Structure ────────────────────────────────────────────

// Returns a flat list of all 64 team names in the bracket
export function getAllTeamNames(bracketStructure) {
  const names = new Set()
  bracketStructure.games
    .filter(g => g.round === 1)
    .forEach(game => {
      if (game.teamA?.name) names.add(game.teamA.name)
      if (game.teamB?.name) names.add(game.teamB.name)
    })
  return Array.from(names)
}

// ─── Build Display Layout ─────────────────────────────────────────────────────

// Organize games into display regions for the bracket visual
// Returns games organized by region and round for the frontend
export function buildDisplayLayout(bracketStructure, picks) {
  const layout = {
    left: {  // South and East
      top: buildRegionLayout('south', bracketStructure, picks),
      bottom: buildRegionLayout('east', bracketStructure, picks),
    },
    right: {  // Midwest and West (displayed mirrored)
      top: buildRegionLayout('midwest', bracketStructure, picks),
      bottom: buildRegionLayout('west', bracketStructure, picks),
    },
    finalFour: {
      leftSemifinal: enrichGame(bracketStructure.games.find(g => g.id === 'ff_r5_g1'), picks),
      rightSemifinal: enrichGame(bracketStructure.games.find(g => g.id === 'ff_r5_g2'), picks),
      championship: enrichGame(bracketStructure.games.find(g => g.id === 'championship'), picks),
    }
  }

  return layout
}

function buildRegionLayout(region, bracketStructure, picks) {
  const regionGames = bracketStructure.games.filter(g => g.region === region)
  const rounds = {}

  for (let r = 1; r <= 4; r++) {
    rounds[`r${r}`] = regionGames
      .filter(g => g.round === r)
      .sort((a, b) => a.gameIndex - b.gameIndex)
      .map(game => enrichGame(game, picks))
  }

  return rounds
}

// Add the picked winner to a game object
function enrichGame(game, picks) {
  if (!game) return null
  return {
    ...game,
    pickedWinner: picks?.[game.id] || null,
  }
}
