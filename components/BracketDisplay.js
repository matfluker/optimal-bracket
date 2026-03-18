// components/BracketDisplay.js
//
// ESPN-style bracket display.
//
// DESKTOP: Full 64-team traditional bracket. Left half (South top, East bottom),
//          right half (Midwest top, West bottom), Final Four + Champion center.
//          13 columns total. Absolute positioning within each round column.
//
// MOBILE:  Round tab navigation. Tap any round to see all games in that round
//          as a clean vertical list.

import { useState, useRef } from 'react'
import { ROUND_NAMES, ESPN_POINTS, STRAIGHT_POINTS } from '../lib/constants/teams.js'

const ROUND_LABELS_SHORT = ['R64', 'R32', 'S16', 'E8', 'FF', 'Champ']

// Absolute positioning constants
const SLOT_H = 28          // px height of one team slot
const REGION_H = 16 * SLOT_H  // 448px — height of one region
const REGION_GAP = 16      // px gap between top and bottom region

function getSlotTop(slotIndex, totalSlotsInColumn) {
  // Each slot spans (16 / totalSlotsInColumn) R1-equivalent rows
  const span = 16 / totalSlotsInColumn        // R2=2, R3=4, R4=8, R5=16
  const offset = (span - 1) / 2              // R2=0.5, R3=1.5, R4=3.5, R5=7.5
  return (slotIndex * span + offset) * SLOT_H
}

export default function BracketDisplay({ bracket, picks, tooltipData, scoringMode, totalLeverage }) {
  const [mobileRound, setMobileRound] = useState(1)
  const [tooltip, setTooltip] = useState(null)
  const [highlightedSlotIds, setHighlightedSlotIds] = useState(null)
  const bracketRef = useRef(null)

  if (!bracket || !picks) {
    return (
      <div className="bracket-empty">
        <div className="loading-spinner" />
        <p>Loading bracket data...</p>
      </div>
    )
  }

  const games = (bracket?.games || []).filter(g => g.round >= 1)

  // Build seed lookup: "Duke" → "1. Duke"
  const seedMap = {}
  games
    .filter(g => g.round === 1)
    .forEach(game => {
      if (game.teamA?.name && game.teamA?.displayName) seedMap[game.teamA.name] = game.teamA.displayName
      if (game.teamB?.name && game.teamB?.displayName) seedMap[game.teamB.name] = game.teamB.displayName
    })

  // Build feeder lookup: gameId → the next-round game that this game's winner feeds into
  // e.g. "south_r1_g1" → "south_r2_g1"
  const nextGameFor = {}
  // Build feeder map: gameId → { round, feederA, feederB }
  const feederMap = {}
  games.forEach(game => {
    if (game.feederGameA) nextGameFor[game.feederGameA] = game.id
    if (game.feederGameB) nextGameFor[game.feederGameB] = game.id
    feederMap[game.id] = {
      round: game.round,
      feederA: game.feederGameA || null,
      feederB: game.feederGameB || null,
    }
  })

  function displayName(teamName) {
    return seedMap[teamName] || teamName || ''
  }

  const getGames = (region, round) =>
    games
      .filter(g => g.region === region && g.round === round)
      .sort((a, b) => a.gameIndex - b.gameIndex)

  const getAllRoundGames = (round) =>
    games.filter(g => g.round === round).sort((a, b) => {
      const regionOrder = { south: 0, east: 1, midwest: 2, west: 3, final_four: 4, championship: 5 }
      return (regionOrder[a.region] ?? 9) - (regionOrder[b.region] ?? 9) || a.gameIndex - b.gameIndex
    })

  const handleTeamHover = (e, teamName, roundKey, gameId) => {
    if (!teamName) return
    const tip = tooltipData?.[`${gameId}_winner`]
    const rect = e.currentTarget.getBoundingClientRect()
    const bracketRect = bracketRef.current?.getBoundingClientRect()
    const midpoint = bracketRect ? bracketRect.left + bracketRect.width / 2 : window.innerWidth / 2
    const isRightSide = rect.left > midpoint
    setTooltip({
      displayName: teamName,
      roundKey,
      x: isRightSide ? rect.left - 270 : rect.right + 10,
      y: rect.top - 10,
      ...(tip || {}),
    })

    // Highlight the two feeder slots from the previous round
    const gameInfo = feederMap[gameId]
    if (gameInfo) {
      if (gameInfo.round === 1) {
        // R1 game: highlight both team slots in the R1 column (prefixed to avoid Col 2 bleed)
        setHighlightedSlotIds(new Set(['r1:' + gameId]))
      } else {
        // R2+: highlight the two feeder game slots in the previous column
        const feeders = new Set()
        if (gameInfo.feederA) feeders.add(gameInfo.feederA)
        if (gameInfo.feederB) feeders.add(gameInfo.feederB)
        setHighlightedSlotIds(feeders.size > 0 ? feeders : null)
      }
    } else {
      setHighlightedSlotIds(null)
    }
  }

  const handleTeamLeave = () => {
    setTooltip(null)
    setHighlightedSlotIds(null)
  }

  // Final Four winners
  const ff1Winner = picks?.['ff_r5_g1']
  const ff2Winner = picks?.['ff_r5_g2']
  const champion = picks?.['championship']

  return (
    <div className="bracket-wrapper">

      {/* ── TOTAL LEVERAGE SCORE ──────────────────────────────────────── */}
      {totalLeverage != null && (
        <div style={{
          textAlign: 'center', padding: '8px 16px', marginBottom: 12,
          background: totalLeverage >= 0 ? '#16a34a22' : '#dc262622',
          borderRadius: 8, border: `1px solid ${totalLeverage >= 0 ? '#16a34a44' : '#dc262644'}`,
        }}>
          <span style={{ fontSize: 14, color: '#888' }}>Leverage vs. the Field: </span>
          <strong style={{ fontSize: 18, color: totalLeverage >= 0 ? '#22c55e' : '#ef4444' }}>
            {totalLeverage >= 0 ? '+' : ''}{totalLeverage.toFixed(1)} pts
          </strong>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            If all your picks win, you gain this many more points than a bracket following the crowd
          </div>
        </div>
      )}

      {/* ── DESKTOP BRACKET ─────────────────────────────────────────────── */}
      <div className="bracket-desktop" ref={bracketRef}>
        <div className="bracket-body">

          {/* ── LEFT HALF: cols 1–6 (South top, East bottom) ── */}
          <div className="bracket-half left-half" style={{ display: 'flex' }}>
            {/* Col 1: Left R1 — 16 team rows per region */}
            <div className="round-col">
              <RegionR1 region="south" getGames={getGames} picks={picks} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionR1 region="east" getGames={getGames} picks={picks} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 2: R2 — 8 slots per region (R1 winners) */}
            <div className="round-col">
              <RegionAdvancing region="south" sourceRound={1} totalSlots={8} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionAdvancing region="east" sourceRound={1} totalSlots={8} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 3: R3 — 4 slots per region (R2 winners) */}
            <div className="round-col">
              <RegionAdvancing region="south" sourceRound={2} totalSlots={4} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionAdvancing region="east" sourceRound={2} totalSlots={4} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 4: R4 — 2 slots per region (R3 winners) */}
            <div className="round-col">
              <RegionAdvancing region="south" sourceRound={3} totalSlots={2} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionAdvancing region="east" sourceRound={3} totalSlots={2} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 5: Left R5 — Final Four semifinal (R4 winners), each centered on its region */}
            <div className="round-col">
              <div
                className={`team-row ff-team ${ff1Winner === picks['south_r4_g1'] ? 'team-winner' : ff1Winner ? 'team-loser' : ''}${highlightedSlotIds?.has('south_r4_g1') ? ' slot-highlighted' : ''}`}
                onMouseEnter={picks['south_r4_g1'] ? e => handleTeamHover(e, picks['south_r4_g1'], 'r5', 'south_r4_g1') : undefined}
                onMouseLeave={picks['south_r4_g1'] ? handleTeamLeave : undefined}
                style={{ position: 'absolute', top: getSlotTop(0, 1), left: 0, right: 0, height: SLOT_H, cursor: picks['south_r4_g1'] ? 'pointer' : 'default' }}
              >
                <span className="team-name">{displayName(picks['south_r4_g1'])}</span>
              </div>
              <div
                className={`team-row ff-team ${ff1Winner === picks['east_r4_g1'] ? 'team-winner' : ff1Winner ? 'team-loser' : ''}${highlightedSlotIds?.has('east_r4_g1') ? ' slot-highlighted' : ''}`}
                onMouseEnter={picks['east_r4_g1'] ? e => handleTeamHover(e, picks['east_r4_g1'], 'r5', 'east_r4_g1') : undefined}
                onMouseLeave={picks['east_r4_g1'] ? handleTeamLeave : undefined}
                style={{ position: 'absolute', top: REGION_H + REGION_GAP + getSlotTop(0, 1), left: 0, right: 0, height: SLOT_H, cursor: picks['east_r4_g1'] ? 'pointer' : 'default' }}
              >
                <span className="team-name">{displayName(picks['east_r4_g1'])}</span>
              </div>
            </div>

            {/* Col 6: Left R6 — winner of left FF semifinal */}
            <div className="round-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                {ff1Winner && (
                  <div
                    className={`team-row ff-team ${champion === ff1Winner ? 'team-winner' : champion ? 'team-loser' : 'team-winner'}${highlightedSlotIds?.has('ff_r5_g1') ? ' slot-highlighted' : ''}`}
                    onMouseEnter={e => handleTeamHover(e, ff1Winner, 'r6', 'ff_r5_g1')}
                    onMouseLeave={handleTeamLeave}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="team-name">{displayName(ff1Winner)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Col 7: CHAMPION ── */}
          <div className="champion-col">
            <div
              className="champion-box"
              onMouseEnter={champion ? e => handleTeamHover(e, champion, 'r6', 'championship') : undefined}
              onMouseLeave={champion ? handleTeamLeave : undefined}
              style={{ cursor: champion ? 'pointer' : 'default' }}
            >
              <div className="champion-label">Champion</div>
              <div className="champion-name">{displayName(champion)}</div>
            </div>
          </div>

          {/* ── RIGHT HALF: cols 8–13 (Midwest top, West bottom) ── */}
          <div className="bracket-half right-half half-right" style={{ display: 'flex', flexDirection: 'row-reverse' }}>
            {/* Col 13: Right R1 — 16 team rows per region */}
            <div className="round-col">
              <RegionR1 region="midwest" getGames={getGames} picks={picks} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionR1 region="west" getGames={getGames} picks={picks} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 12: R2 — 8 slots per region (R1 winners) */}
            <div className="round-col">
              <RegionAdvancing region="midwest" sourceRound={1} totalSlots={8} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionAdvancing region="west" sourceRound={1} totalSlots={8} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 11: R3 — 4 slots per region (R2 winners) */}
            <div className="round-col">
              <RegionAdvancing region="midwest" sourceRound={2} totalSlots={4} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionAdvancing region="west" sourceRound={2} totalSlots={4} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 10: R4 — 2 slots per region (R3 winners) */}
            <div className="round-col">
              <RegionAdvancing region="midwest" sourceRound={3} totalSlots={2} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={0} />
              <RegionAdvancing region="west" sourceRound={3} totalSlots={2} getGames={getGames} picks={picks} displayName={displayName} nextGameFor={nextGameFor} onHover={handleTeamHover} onLeave={handleTeamLeave} highlightedSlotIds={highlightedSlotIds} offsetY={REGION_H + REGION_GAP} />
            </div>

            {/* Col 9: Right R5 — Final Four semifinal (R4 winners), each centered on its region */}
            <div className="round-col">
              <div
                className={`team-row ff-team ${ff2Winner === picks['midwest_r4_g1'] ? 'team-winner' : ff2Winner ? 'team-loser' : ''}${highlightedSlotIds?.has('midwest_r4_g1') ? ' slot-highlighted' : ''}`}
                onMouseEnter={picks['midwest_r4_g1'] ? e => handleTeamHover(e, picks['midwest_r4_g1'], 'r5', 'midwest_r4_g1') : undefined}
                onMouseLeave={picks['midwest_r4_g1'] ? handleTeamLeave : undefined}
                style={{ position: 'absolute', top: getSlotTop(0, 1), left: 0, right: 0, height: SLOT_H, cursor: picks['midwest_r4_g1'] ? 'pointer' : 'default' }}
              >
                <span className="team-name">{displayName(picks['midwest_r4_g1'])}</span>
              </div>
              <div
                className={`team-row ff-team ${ff2Winner === picks['west_r4_g1'] ? 'team-winner' : ff2Winner ? 'team-loser' : ''}${highlightedSlotIds?.has('west_r4_g1') ? ' slot-highlighted' : ''}`}
                onMouseEnter={picks['west_r4_g1'] ? e => handleTeamHover(e, picks['west_r4_g1'], 'r5', 'west_r4_g1') : undefined}
                onMouseLeave={picks['west_r4_g1'] ? handleTeamLeave : undefined}
                style={{ position: 'absolute', top: REGION_H + REGION_GAP + getSlotTop(0, 1), left: 0, right: 0, height: SLOT_H, cursor: picks['west_r4_g1'] ? 'pointer' : 'default' }}
              >
                <span className="team-name">{displayName(picks['west_r4_g1'])}</span>
              </div>
            </div>

            {/* Col 8: Right R6 — winner of right FF semifinal */}
            <div className="round-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                {ff2Winner && (
                  <div
                    className={`team-row ff-team ${champion === ff2Winner ? 'team-winner' : champion ? 'team-loser' : 'team-winner'}${highlightedSlotIds?.has('ff_r5_g2') ? ' slot-highlighted' : ''}`}
                    onMouseEnter={e => handleTeamHover(e, ff2Winner, 'r6', 'ff_r5_g2')}
                    onMouseLeave={handleTeamLeave}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="team-name">{displayName(ff2Winner)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE BRACKET ──────────────────────────────────────────────── */}
      <div className="bracket-mobile">
        <div className="mobile-tabs">
          {[1, 2, 3, 4, 5, 6].map(r => (
            <button
              key={r}
              className={`mobile-tab ${mobileRound === r ? 'active' : ''}`}
              onClick={() => setMobileRound(r)}
            >
              {ROUND_LABELS_SHORT[r - 1]}
            </button>
          ))}
        </div>

        <div className="mobile-games">
          {getAllRoundGames(mobileRound).map(game => (
            <MobileGameCard
              key={game.id}
              game={game}
              round={mobileRound}
              picks={picks}
              tooltipData={tooltipData}
            />
          ))}
        </div>
      </div>

      {/* ── TOOLTIP ─────────────────────────────────────────────────────── */}
      {tooltip && (
        <Tooltip tooltip={tooltip} />
      )}
    </div>
  )
}

// ─── Region R1: 16 individual team slots ──────────────────────────────────────

function RegionR1({ region, getGames, picks, onHover, onLeave, highlightedSlotIds, offsetY }) {
  const r1Games = getGames(region, 1)

  const r1Slots = r1Games.flatMap((game, gameIdx) => [
    { team: game.teamA, slotIdx: gameIdx * 2,     isWinner: picks[game.id] === game.teamA?.name, gameId: game.id },
    { team: game.teamB, slotIdx: gameIdx * 2 + 1, isWinner: picks[game.id] === game.teamB?.name, gameId: game.id },
  ])

  return (
    <>
      {r1Slots.map(slot => {
        const isHighlighted = highlightedSlotIds?.has('r1:' + slot.gameId)
        return (
          <div
            key={`${region}_r1_slot_${slot.slotIdx}`}
            style={{ position: 'absolute', top: offsetY + slot.slotIdx * SLOT_H, left: 0, right: 0, height: SLOT_H }}
          >
            <div
              className={`team-row ${slot.isWinner ? 'team-winner' : 'team-loser'}${isHighlighted ? ' slot-highlighted' : ''}`}
              onMouseEnter={slot.isWinner ? e => onHover(e, slot.team?.name, 'r1', slot.gameId) : undefined}
              onMouseLeave={slot.isWinner ? onLeave : undefined}
            >
              <span className="team-name">{slot.team?.displayName || slot.team?.name || ''}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── Region Advancing (R2–R5): shows winners from the previous round ─────────
// sourceRound = the round whose winners are displayed (e.g. 1 for the R2 column)
// totalSlots = number of slots in this column per region (8, 4, 2, or 1)

function RegionAdvancing({ region, sourceRound, totalSlots, getGames, picks, displayName, nextGameFor, onHover, onLeave, highlightedSlotIds, offsetY }) {
  const sourceGames = getGames(region, sourceRound)

  return (
    <>
      {sourceGames.map((game, i) => {
        const winner = picks[game.id]
        // Did this team win their next game? If not, they're a loser in this column.
        const nextGameId = nextGameFor[game.id]
        const wonNext = winner && nextGameId && picks[nextGameId] === winner
        const slotClass = !winner ? '' : wonNext ? 'team-winner' : 'team-loser'
        const isHighlighted = highlightedSlotIds?.has(game.id)
        return (
          <div
            key={game.id}
            style={{ position: 'absolute', top: offsetY + getSlotTop(i, totalSlots), left: 0, right: 0, height: SLOT_H }}
          >
            <div
              className={`team-row ${slotClass}${isHighlighted ? ' slot-highlighted' : ''}`}
              onMouseEnter={winner ? e => onHover(e, winner, `r${sourceRound + 1}`, game.id) : undefined}
              onMouseLeave={winner ? onLeave : undefined}
              style={{ cursor: winner ? 'pointer' : 'default' }}
            >
              <span className="team-name">{displayName(winner)}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── Mobile Game Card ─────────────────────────────────────────────────────────

function MobileGameCard({ game, round, picks, tooltipData }) {
  const pickedWinner = picks?.[game.id]
  const roundKey = `r${round}`

  const regionLabels = {
    south: 'South', east: 'East', midwest: 'Midwest', west: 'West',
    final_four: 'Final Four', championship: 'Championship'
  }

  if (round === 1) {
    const teamA = game.teamA
    const teamB = game.teamB
    const winnerA = pickedWinner === teamA?.name
    const winnerB = pickedWinner === teamB?.name

    return (
      <div className="mobile-game-card">
        <div className="mobile-game-region">{regionLabels[game.region] || game.region}</div>
        <MobileTeamRow team={teamA} isWinner={winnerA} />
        <div className="mobile-vs">vs</div>
        <MobileTeamRow team={teamB} isWinner={winnerB} />
        {pickedWinner && (
          <div className="mobile-pick-label">
            Pick: <strong>{pickedWinner}</strong>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mobile-game-card">
      <div className="mobile-game-region">{regionLabels[game.region] || game.region}</div>
      <div className="mobile-game-header">{ROUND_NAMES[roundKey]}</div>
      {pickedWinner && (
        <div className="mobile-advancing">
          {pickedWinner}
        </div>
      )}
    </div>
  )
}

function MobileTeamRow({ team, isWinner }) {
  if (!team) return null
  return (
    <div className={`mobile-team-row ${isWinner ? 'mobile-winner' : 'mobile-loser'}`}>
      <span className="mobile-seed">{team.seed}</span>
      <span className="mobile-name">{team.displayName || team.name || ''}</span>
      {isWinner && <span className="mobile-tick">✓</span>}
    </div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ tooltip }) {
  const { displayName, roundKey, signalLine, projectionPct, publicPct,
          pointsIfCorrect, leverageValue, pickValue,
          opponent, opponentProjectionPct, opponentPublicPct, opponentLeverageValue, opponentPickValue, pickEdge,
          differentiationLine } = tooltip

  return (
    <div
      className="bracket-tooltip"
      style={{ left: Math.max(10, Math.min(tooltip.x, window.innerWidth - 270)), top: tooltip.y }}
    >
      <div className="tt-name">{displayName}</div>
      <div className="tt-round">{ROUND_NAMES[roundKey] || roundKey}</div>

      {/* Part 1: Signal line */}
      {signalLine && (
        <div className="tt-reason"><em>{signalLine}</em></div>
      )}

      {projectionPct != null && (
        <>
          {/* Part 2: Head-to-head comparison */}
          <div className="tt-comparison">
            <div className="tt-comparison-header">
              <span className="tt-comparison-team tt-comparison-team--picked">{displayName}</span>
              <span className="tt-comparison-vs">vs</span>
              <span className="tt-comparison-team tt-comparison-team--passed">{opponent || '—'}</span>
            </div>
            <div className="tt-comparison-row">
              <span className="tt-comparison-val">{projectionPct}%</span>
              <span className="tt-comparison-label">Projection</span>
              <span className="tt-comparison-val">{opponentProjectionPct != null ? `${opponentProjectionPct}%` : '—'}</span>
            </div>
            <div className="tt-comparison-row">
              <span className="tt-comparison-val">{publicPct}%</span>
              <span className="tt-comparison-label">Public pick</span>
              <span className="tt-comparison-val">{opponentPublicPct != null ? `${opponentPublicPct}%` : '—'}</span>
            </div>
            <div className="tt-comparison-row">
              <span className="tt-comparison-val">{leverageValue != null ? `${leverageValue.toFixed(1)}pts` : '—'}</span>
              <span className="tt-comparison-label">Pick value</span>
              <span className="tt-comparison-val">{opponentLeverageValue != null ? `${opponentLeverageValue.toFixed(1)}pts` : '—'}</span>
            </div>
            <div className="tt-comparison-row">
              <span className="tt-comparison-val">{pickValue != null ? `${pickValue.toFixed(1)}pts` : '—'}</span>
              <span className="tt-comparison-label">Blended Score</span>
              <span className="tt-comparison-val">{opponentPickValue != null ? `${opponentPickValue.toFixed(1)}pts` : '—'}</span>
            </div>
          </div>

          {/* Opportunity cost summary */}
          {pickEdge != null && (
            <div className={`tt-pick-edge ${pickEdge >= 0 ? 'positive' : 'negative'}`}>
              {pickEdge >= 0
                ? `+${pickEdge.toFixed(1)} Blended Score edge over ${opponent}`
                : `${pickEdge.toFixed(1)} Blended Score — ${opponent} scores higher`
              }
            </div>
          )}

          {/* Points if correct */}
          {pointsIfCorrect != null && (
            <div className="tt-row">
              <span className="tt-label">Points if correct</span>
              <span className="tt-val">{pointsIfCorrect}pts</span>
            </div>
          )}

          {/* Part 3: Differentiation line */}
          {differentiationLine && (
            <div className="tt-reason">{differentiationLine}</div>
          )}

        </>
      )}
    </div>
  )
}
