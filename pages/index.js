// pages/index.js
//
// The main public page. Shows either:
//   1. A countdown clock (before Selection Sunday)
//   2. The full bracket with controls (after import)
//   3. A "frozen" banner (after tournament starts)

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Countdown from '../components/Countdown'
import Controls from '../components/Controls'
import BracketDisplay from '../components/BracketDisplay'

const DEFAULT_SETTINGS = {
  scoringMode: 'espn',
  leverageMode: 'balanced',
  poolSize: '25-100',
}

export default function Home() {
  const [siteData, setSiteData] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBracket()
  }, [])

  async function fetchBracket() {
    try {
      setLoading(true)
      const res = await fetch('/bracket.json')
      if (!res.ok) {
        setSiteData({ state: 'awaiting_import' })
        return
      }
      const data = await res.json()
      setSiteData(data)
    } catch {
      setSiteData({ state: 'awaiting_import' })
    } finally {
      setLoading(false)
    }
  }

  // Get the combo key for the current settings
  const comboKey = `${settings.scoringMode}_${settings.leverageMode}_${settings.poolSize}`
  const currentPicks = siteData?.picks?.[comboKey] || null
  const currentTooltips = siteData?.tooltips?.[comboKey] || null
  const currentTotalLeverage = siteData?.totalLeverage?.[comboKey] ?? null

  return (
    <>
      <Head>
        <title>Optimal Bracket — 2026 March Madness</title>
        <meta name="description" content="The leverage-based optimal March Madness bracket. Beat your pool by picking the teams the data loves but nobody else is picking." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="header">
          <div className="header-inner">
            <div className="header-logo">
              <span className="logo-text">Optimal Bracket</span>
            </div>
            {siteData?.lastUpdated && (
              <div className="header-meta">
                {siteData.state === 'frozen' ? (
                  <span className="status-frozen">🔒 Final bracket — tournament in progress</span>
                ) : (
                  <span className="status-live">
                    Last updated {formatTime(siteData.lastUpdated)}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="main">

          {/* ── Methodology blurb ────────────────────────────── */}
          <section className="methodology">
            <p>
              In a bracket pool, the goal is to finish with more points than everyone else. That is
              not the same as picking the most correct teams. When you pick a popular favorite and
              they win, most of your pool scores those points too. A pick can be correct and still do
              very little for your standing.
            </p>
            <p>
              The Optimal Bracket measures the gap between what the analytics models say a team will
              do and how often people are actually picking them. The bigger that gap, the more you
              stand to gain when that team wins.{' '}
            </p>
            <p><a href="/how-it-works" className="methodology-link">Learn how this works →</a></p>

          </section>

          {/* ── Legend ───────────────────────────────────────── */}
          {siteData?.state === 'active' && (
            <div className="legend">
              <span className="legend-item">
                <span className="legend-info">Hover any picked team for leverage data</span>
              </span>
            </div>
          )}

          {/* ── Loading ───────────────────────────────────────── */}
          {loading && (
            <div className="state-message">
              <div className="loading-spinner" />
              <p>Loading bracket...</p>
            </div>
          )}

          {/* ── Countdown ────────────────────────────────────── */}
          {!loading && siteData?.state === 'countdown' && (
            <Countdown targetDate={siteData.countdownTarget} />
          )}

          {/* ── Awaiting Import ───────────────────────────────── */}
          {!loading && siteData?.state === 'awaiting_import' && (
            <div className="state-message">
              <p>🏀 The bracket has been announced.</p>
              <p>The Optimal Bracket is being calculated — check back shortly.</p>
            </div>
          )}

          {/* ── Bracket ──────────────────────────────────────── */}
          {!loading && (siteData?.state === 'active' || siteData?.state === 'frozen') && (
            <>
              <ValueSpotlight tooltips={currentTooltips} />
              <Controls settings={settings} onChange={setSettings} />

              {siteData.state === 'frozen' && (
                <div className="frozen-banner">
                  🔒 The tournament has started. This is the final Optimal Bracket, locked in before tip-off.
                </div>
              )}

              <BracketDisplay
                bracket={siteData.bracket}
                picks={currentPicks}
                tooltipData={currentTooltips}
                scoringMode={settings.scoringMode}
                totalLeverage={currentTotalLeverage}
              />
            </>
          )}

        </main>

        <footer className="footer">
          <p>Optimal Bracket uses analytics models and Vegas odds to identify undervalued teams. Not affiliated with Yahoo, ESPN, or the NCAA.</p>
        </footer>

      </div>
    </>
  )
}

const ROUND_LABELS = { r1: 'R64', r2: 'R32', r3: 'S16', r4: 'E8', r5: 'F4', r6: 'NCG' }

function dedupeByTeam(entries, gapFn) {
  const best = {}
  for (const t of entries) {
    const g = gapFn(t)
    if (g > 5 && (best[t.team] == null || g > gapFn(best[t.team]))) {
      best[t.team] = t
    }
  }
  return Object.values(best).sort((a, b) => (b.leverageValue ?? 0) - (a.leverageValue ?? 0)).slice(0, 3)
}

function ValueSpotlight({ tooltips }) {
  if (!tooltips) return null

  const entries = Object.values(tooltips).filter(
    t => t.projectionPct != null && t.publicPct != null
  )

  const undervalued = dedupeByTeam(entries, t => t.projectionPct - t.publicPct)
  const overvalued  = dedupeByTeam(entries, t => t.publicPct - t.projectionPct)

  if (undervalued.length === 0 && overvalued.length === 0) return null

  return (
    <div className="value-spotlight">
      <div className="value-spotlight-col value-spotlight-col--under">
        <div className="value-spotlight-heading">Most Undervalued</div>
        {undervalued.map(t => (
          <div key={t.team} className="value-spotlight-row">
            <span className="value-spotlight-name">{t.team}</span>
            <span className="value-spotlight-stats">
              {ROUND_LABELS[t.round] || t.round} &middot; {t.projectionPct}% model / {t.publicPct}% public
            </span>
            <span className="value-spotlight-gap">{t.leverageValue != null ? `${t.leverageValue.toFixed(1)}pts` : '—'}</span>
          </div>
        ))}
      </div>
      <div className="value-spotlight-col value-spotlight-col--over">
        <div className="value-spotlight-heading">Most Overvalued</div>
        {overvalued.map(t => (
          <div key={t.team} className="value-spotlight-row">
            <span className="value-spotlight-name">{t.team}</span>
            <span className="value-spotlight-stats">
              {ROUND_LABELS[t.round] || t.round} &middot; {t.projectionPct}% model / {t.publicPct}% public
            </span>
            <span className="value-spotlight-gap">{t.leverageValue != null ? `${t.leverageValue.toFixed(1)}pts` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTime(isoString) {
  try {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return isoString
  }
}
