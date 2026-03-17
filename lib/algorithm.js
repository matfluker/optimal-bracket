// lib/algorithm.js
//
// This is the brain of the project.
//
// WHAT IT DOES:
// For each of 24 setting combinations (scoring mode × leverage mode × pool size),
// it fills out a complete 63-game bracket by:
//   1. Looking at each game matchup
//   2. Calculating a "leverage score" for each team
//   3. Picking the winner based on the settings
//
// THE CORE FORMULA:
//   Data Signal    = weighted blend of EvanMiya + KenPom win%
//   Leverage       = (Prediction% - Public%) × Round Points
//   Positive leverage = team is UNDERVALUED, Negative = OVERVALUED

import { ESPN_POINTS, STRAIGHT_POINTS, ROUND_KEYS } from './constants/teams.js'
import { DATA_WEIGHTS } from './constants/weights.js'

// ─── Alpha Calculation ───────────────────────────────────────────────────────

// 12 unique alphas. Higher = favor win probability, lower = favor leverage (upsets).
const ALPHA_TABLE = {
  safe:       { 'Under 25': 0.50, '25-100': 0.40, '100-500': 0.33, '500+': 0.25 },
  balanced:   { 'Under 25': 0.25, '25-100': 0.18, '100-500': 0.12, '500+': 0.05 },
  aggressive: { 'Under 25': 0.08, '25-100': 0.06, '100-500': 0.03, '500+': 0.01 },
}

function calculateAlpha(poolSize, riskAppetite) {
  return ALPHA_TABLE[riskAppetite]?.[poolSize] ?? 0.18
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

// Run the algorithm for all 24 combinations at once
// Returns: { comboKey: { gameId: winnerTeamName, ... }, ... }
export function runAllCombinations(bracketStructure, yahooData, evanmiyaData, kenpomData) {
  const results = {}

  const scoringModes = ['espn', 'straight']
  const leverageModes = ['safe', 'balanced', 'aggressive']
  const poolSizes = ['Under 25', '25-100', '100-500', '500+']
  const floor = 0.10 // hardcoded 10% minimum win probability

  for (const scoringMode of scoringModes) {
    for (const leverageMode of leverageModes) {
      for (const poolSize of poolSizes) {
        const comboKey = `${scoringMode}_${leverageMode}_${poolSize}`
        results[comboKey] = runSingleBracket(
          bracketStructure,
          yahooData,
          evanmiyaData,
          kenpomData,
          { scoringMode, leverageMode, floor, poolSize }
        )
      }
    }
  }

  return results
}

// Run the algorithm for one specific setting combination
// Returns: { gameId: winnerTeamName, ... }
function runSingleBracket(bracketStructure, yahooData, evanmiyaData, kenpomData, settings) {
  const { scoringMode, leverageMode, floor, poolSize } = settings
  const pointValues = scoringMode === 'espn' ? ESPN_POINTS : STRAIGHT_POINTS

  const picks = {}

  for (let roundNum = 1; roundNum <= 6; roundNum++) {
    const roundKey = `r${roundNum}`
    const roundPoints = pointValues[roundKey]
    const games = getGamesForRound(bracketStructure, roundNum, picks)

    for (const game of games) {
      const { gameId, teamA, teamB } = game

      if (!teamA || !teamB) {
        picks[gameId] = null
        continue
      }

      const winner = pickGameWinner(
        teamA, teamB, roundKey, roundPoints,
        yahooData, evanmiyaData, kenpomData,
        leverageMode, floor, poolSize
      )

      picks[gameId] = winner
    }
  }

  return picks
}

// ─── Pick a Single Game Winner ────────────────────────────────────────────────

function pickGameWinner(teamA, teamB, roundKey, roundPoints, yahooData, evanmiyaData, kenpomData, leverageMode, floor, poolSize) {
  const dataA = getTeamRoundData(teamA, roundKey, yahooData, evanmiyaData, kenpomData)
  const dataB = getTeamRoundData(teamB, roundKey, yahooData, evanmiyaData, kenpomData)

  // Floor check
  const aClears = dataA.dataWinPct >= floor
  const bClears = dataB.dataWinPct >= floor

  if (!aClears && !bClears) {
    return dataA.dataWinPct >= dataB.dataWinPct ? teamA : teamB
  }

  if (!aClears) return teamB
  if (!bClears) return teamA

  // Both teams clear the floor — alpha-blended scoring
  const alpha = calculateAlpha(poolSize, leverageMode)

  const evA = dataA.dataWinPct * roundPoints
  const leverageWeightedEvA = dataA.dataWinPct * roundPoints * (1 - dataA.publicPickPct)
  const blendedA = alpha * evA + (1 - alpha) * leverageWeightedEvA

  const evB = dataB.dataWinPct * roundPoints
  const leverageWeightedEvB = dataB.dataWinPct * roundPoints * (1 - dataB.publicPickPct)
  const blendedB = alpha * evB + (1 - alpha) * leverageWeightedEvB

  return blendedA >= blendedB ? teamA : teamB
}

// ─── Get Data for a Specific Team + Round ────────────────────────────────────

function getTeamRoundData(teamName, roundKey, yahooData, evanmiyaData, kenpomData) {
  const publicPickPct = yahooData?.[teamName]?.[roundKey] ?? 0.5

  const evanmiyaWin = evanmiyaData?.[teamName]?.[roundKey] ?? null
  const kenpomWin   = kenpomData?.[teamName]?.[roundKey] ?? null

  let weightedSum = 0
  let totalWeight = 0

  if (evanmiyaWin !== null) {
    weightedSum += evanmiyaWin * DATA_WEIGHTS.evanmiya
    totalWeight += DATA_WEIGHTS.evanmiya
  }
  if (kenpomWin !== null) {
    weightedSum += kenpomWin * DATA_WEIGHTS.kenpom
    totalWeight += DATA_WEIGHTS.kenpom
  }

  const dataWinPct = totalWeight > 0 ? weightedSum / totalWeight : 0.05

  return {
    dataWinPct,
    publicPickPct,
    evanmiyaWin,
    kenpomWin,
    sourcesUsed: [
      evanmiyaWin !== null ? 'evanmiya' : null,
      kenpomWin !== null ? 'kenpom' : null,
    ].filter(Boolean),
  }
}

// ─── Get Games for a Round ────────────────────────────────────────────────────

function getGamesForRound(bracketStructure, roundNum, previousPicks) {
  if (!bracketStructure) return []

  if (roundNum === 1) {
    return bracketStructure.games
      .filter(g => g.round === 1)
      .map(g => ({
        gameId: g.id,
        teamA: g.teamA?.name && g.teamA.name !== 'TBD' ? g.teamA.name : null,
        teamB: g.teamB?.name && g.teamB.name !== 'TBD' ? g.teamB.name : null,
      }))
  }

  const gamesThisRound = bracketStructure.games.filter(g => g.round === roundNum)
  const games = []

  for (const game of gamesThisRound) {
    const teamA = previousPicks[game.feederGameA] || null
    const teamB = previousPicks[game.feederGameB] || null

    games.push({
      gameId: game.id,
      teamA,
      teamB,
    })
  }

  return games
}

// ─── Generate Tooltip Data ───────────────────────────────────────────────────

// Signal line: how the team's model projection compares to public pick rate
function generateSignalLine(teamName, dataWinPct, publicPickPct) {
  const threshold = 0.05
  if (dataWinPct > publicPickPct + threshold) {
    return `${teamName} is undervalued. The public is passing on them more than the models suggest.`
  }
  if (publicPickPct > dataWinPct + threshold) {
    return `${teamName} is overvalued. Public confidence is higher than the models back up.`
  }
  return 'Models and public mostly agree here.'
}

// Differentiation line: how picking this team affects pool standing
function generateDifferentiationLine(teamName, opponent, publicPickPct, opponentPublicPct) {
  if (opponent && opponentPublicPct > 0.5) {
    return `Most of the pool will pick ${opponent}. A ${teamName} win moves you up fast.`
  }
  if (publicPickPct > 0.5) {
    return 'Popular pick. Correct here but it will not separate you.'
  }
  return 'The models back the upset more than the crowd does.'
}

// For each picked winner, generate the data shown in the hover tooltip
// Returns: { `${gameId}_winner`: { team, round, ... } }
export function generateTooltipData(picks, bracketStructure, yahooData, evanmiyaData, kenpomData, settings = {}) {
  const tooltips = {}
  const { scoringMode = 'espn', poolSize = '25-100', leverageMode = 'balanced' } = settings
  const pointValues = scoringMode === 'espn' ? ESPN_POINTS : STRAIGHT_POINTS

  bracketStructure.games
    .sort((a, b) => a.round - b.round)
    .forEach(game => {
      const winnerName = picks[game.id]
      if (!winnerName) return

      const roundKey = `r${game.round}`
      const roundPoints = pointValues[roundKey] || 0
      const data = getTeamRoundData(winnerName, roundKey, yahooData, evanmiyaData, kenpomData)

      // Determine opponent in this game
      let opponent = null
      if (game.round === 1) {
        const teamAName = game.teamA?.name
        const teamBName = game.teamB?.name
        opponent = winnerName === teamAName ? teamBName : teamAName
      } else {
        const teamA = picks[game.feederGameA] || null
        const teamB = picks[game.feederGameB] || null
        opponent = winnerName === teamA ? teamB : teamA
      }

      // Get opponent data
      const opponentData = opponent
        ? getTeamRoundData(opponent, roundKey, yahooData, evanmiyaData, kenpomData)
        : null

      // Part 1: Signal line
      const signalLine = generateSignalLine(winnerName, data.dataWinPct, data.publicPickPct)

      // Blended pick value for winner and opponent
      const alpha = calculateAlpha(poolSize, leverageMode)
      const ev = data.dataWinPct * roundPoints
      const leverageWeightedEv = data.dataWinPct * roundPoints * (1 - data.publicPickPct)
      const pickValue = alpha * ev + (1 - alpha) * leverageWeightedEv

      let opponentPickValue = null
      if (opponentData) {
        const oppEv = opponentData.dataWinPct * roundPoints
        const oppLeverageWeightedEv = opponentData.dataWinPct * roundPoints * (1 - opponentData.publicPickPct)
        opponentPickValue = alpha * oppEv + (1 - alpha) * oppLeverageWeightedEv
      }

      // Opportunity cost: what you gain by picking this team over the opponent
      const pickEdge = opponentPickValue !== null
        ? Math.round((pickValue - opponentPickValue) * 10) / 10
        : null

      // Part 3: Differentiation line
      const differentiationLine = generateDifferentiationLine(
        winnerName, opponent, data.publicPickPct,
        opponentData ? opponentData.publicPickPct : 0
      )

      tooltips[`${game.id}_winner`] = {
        team: winnerName,
        round: roundKey,
        signalLine,
        projectionPct: Math.round(data.dataWinPct * 100),
        publicPct: Math.round(data.publicPickPct * 100),
        pointsIfCorrect: roundPoints,
        pickValue: Math.round(pickValue * 10) / 10,
        opponent: opponent || null,
        opponentProjectionPct: opponentData ? Math.round(opponentData.dataWinPct * 100) : null,
        opponentPublicPct: opponentData ? Math.round(opponentData.publicPickPct * 100) : null,
        opponentPickValue: opponentPickValue !== null ? Math.round(opponentPickValue * 10) / 10 : null,
        pickEdge,
        differentiationLine,
      }
    })

  return tooltips
}

// ─── Calculate Total Leverage ────────────────────────────────────────────────

// Sums (dataWinPct - publicPickPct) × roundPoints across all 63 picks.
// Positive = your bracket leans into undervalued teams; negative = you're following the crowd.
export function calculateTotalLeverage(picks, bracketStructure, yahooData, evanmiyaData, kenpomData, settings) {
  if (!picks || !bracketStructure) return 0

  const pointValues = settings.scoringMode === 'espn' ? ESPN_POINTS : STRAIGHT_POINTS
  let total = 0

  bracketStructure.games.forEach(game => {
    const winnerName = picks[game.id]
    if (!winnerName) return

    const roundKey = `r${game.round}`
    const roundPoints = pointValues[roundKey]
    const data = getTeamRoundData(winnerName, roundKey, yahooData, evanmiyaData, kenpomData)
    total += (data.dataWinPct - data.publicPickPct) * roundPoints
  })

  return Math.round(total * 10) / 10
}

// ─── Diff Two Bracket Picks ──────────────────────────────────────────────────

export function diffPicks(currentPicks, previousPicks, bracketStructure) {
  if (!previousPicks || !currentPicks || !bracketStructure) return {}

  const diff = {}
  const currentAdvancement = getTeamAdvancement(currentPicks, bracketStructure)
  const previousAdvancement = getTeamAdvancement(previousPicks, bracketStructure)

  Object.keys(currentAdvancement).forEach(team => {
    const currentRound = currentAdvancement[team]
    const previousRound = previousAdvancement[team] ?? 0

    if (currentRound > previousRound) {
      diff[team] = 'improved'
    } else if (currentRound < previousRound) {
      diff[team] = 'declined'
    } else {
      diff[team] = 'unchanged'
    }
  })

  return diff
}

function getTeamAdvancement(picks, bracketStructure) {
  const advancement = {}

  bracketStructure.games.forEach(game => {
    const winner = picks[game.id]
    if (winner) {
      const currentBest = advancement[winner] ?? 0
      advancement[winner] = Math.max(currentBest, game.round)
    }
  })

  return advancement
}

// ─── Admin Panel Summary ─────────────────────────────────────────────────────

export function generateChangeSummary(allCurrentPicks, allPreviousPicks, bracketStructure) {
  const summary = {}

  Object.keys(allCurrentPicks).forEach(comboKey => {
    const current = allCurrentPicks[comboKey]
    const previous = allPreviousPicks[comboKey]

    if (!current) {
      summary[comboKey] = { changeCount: 0, changes: [], status: 'no_data' }
      return
    }

    if (!previous) {
      summary[comboKey] = { changeCount: 0, changes: [], status: 'first_run' }
      return
    }

    const changes = []

    bracketStructure.games.forEach(game => {
      const currentWinner = current[game.id]
      const previousWinner = previous[game.id]

      if (currentWinner && previousWinner && currentWinner !== previousWinner) {
        const roundKey = `r${game.round}`
        const roundNames = { r1: 'R64', r2: 'R32', r3: 'S16', r4: 'E8', r5: 'FF', r6: 'Champ' }
        changes.push({
          round: roundNames[roundKey] || roundKey,
          from: previousWinner,
          to: currentWinner,
          region: game.region,
        })
      }
    })

    summary[comboKey] = {
      changeCount: changes.length,
      changes,
      status: 'updated',
    }
  })

  return summary
}
