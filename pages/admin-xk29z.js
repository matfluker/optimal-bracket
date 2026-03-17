// pages/admin-xk29z.js
//
// The admin panel — three-step workflow for managing the bracket.
// Only accessible locally (blocked in production by middleware.js).
//
// Step 1: Bracket Teams — confirm 64 teams loaded from bracket2026.js
// Step 2: Import CSV Data — upload Yahoo, EvanMiya, KenPom CSVs
// Step 3: Team Name Matching — verify source names map to bracket teams
// Export: runs algorithm via API, writes public/bracket.json

import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Papa from 'papaparse'
import { BRACKET_2026 } from '../lib/bracket2026.js'

const REGIONS = ['south', 'east', 'midwest', 'west']
const SOURCES = ['yahoo', 'evanmiya', 'kenpom']
const SOURCE_LABELS = { yahoo: 'Yahoo', evanmiya: 'EvanMiya', kenpom: 'KenPom' }
const ROUND_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']
const ROUND_LABELS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']

export default function AdminPanel() {
  // Step 1: Bracket structure
  const [bracketTeams, setBracketTeams] = useState(null)
  const [editTeams, setEditTeams] = useState(null)
  const [editDirty, setEditDirty] = useState(false)
  const [savingBracket, setSavingBracket] = useState(false)

  // Step 2: CSV data — per-source parsed data
  const [sourceData, setSourceData] = useState({
    yahoo: null,
    evanmiya: null,
    kenpom: null,
  })

  // Step 3: Team name matching
  const [activeSourceTab, setActiveSourceTab] = useState('yahoo')
  const [nameOverrides, setNameOverrides] = useState([])

  // General
  const [message, setMessage] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportResult, setExportResult] = useState(null)

  // ─── Load on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    loadBracketTeams()
    loadNameOverrides()
  }, [])

  // ─── Step 1: Load bracket teams ─────────────────────────────────────────

  function bracketToEditMap(bracket) {
    if (!bracket?.games) return null
    const map = {}
    REGIONS.forEach(r => { map[r] = {} })
    bracket.games.filter(g => g.round === 1).forEach(g => {
      if (g.teamA?.name && g.teamA.name !== 'TBD') map[g.region][String(g.teamA.seed)] = g.teamA.name
      if (g.teamB?.name && g.teamB.name !== 'TBD') map[g.region][String(g.teamB.seed)] = g.teamB.name
    })
    return map
  }

  async function loadBracketTeams() {
    try {
      const res = await fetch('/api/bracket')
      if (res.ok) {
        const data = await res.json()
        if (data.bracket) {
          setBracketTeams(data.bracket)
          setEditTeams(bracketToEditMap(data.bracket))
          setEditDirty(false)
          return
        }
      }
    } catch { /* ignore */ }
    // If no bracket.json yet, load from bracket2026.js via import-bracket
    handleLoadBracket()
  }

  function handleEditTeamName(region, seed, value) {
    setEditTeams(prev => ({
      ...prev,
      [region]: { ...prev[region], [seed]: value },
    }))
    setEditDirty(true)
  }

  async function handleSaveBracketEdits() {
    setSavingBracket(true)
    setMessage(null)
    try {
      const res = await fetch('/api/import-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: editTeams }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Bracket updated!' })
        await loadBracketTeams()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save bracket' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setSavingBracket(false)
  }

  async function handleLoadBracket() {
    setMessage(null)
    try {
      const res = await fetch('/api/import-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: BRACKET_2026 }),
      })
      const data = await res.json()
      if (data.success || data.bracket) {
        setMessage({ type: 'success', text: 'Bracket loaded successfully!' })
        // Re-fetch to get the full structure
        const bracketRes = await fetch('/api/bracket')
        if (bracketRes.ok) {
          const bracketData = await bracketRes.json()
          if (bracketData.bracket) {
            setBracketTeams(bracketData.bracket)
            setEditTeams(bracketToEditMap(bracketData.bracket))
            setEditDirty(false)
          }
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load bracket' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  // ─── Step 2: CSV upload and parsing ─────────────────────────────────────

  function handleCSVUpload(source, file) {
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = parseCSVData(results.data)
        setSourceData(prev => ({ ...prev, [source]: parsed }))
        setMessage({ type: 'success', text: `${SOURCE_LABELS[source]}: ${Object.keys(parsed).length} teams loaded from CSV` })
      },
      error: (err) => {
        setMessage({ type: 'error', text: `CSV parse error for ${SOURCE_LABELS[source]}: ${err.message}` })
      },
    })
  }

  function parseCSVData(rows) {
    // Expected CSV columns: Team, R1, R2, R3, R4, R5, R6 (as percentages 0-100)
    // Handles: "21.34%", "21.34", tabs or commas, any case for headers
    const data = {}
    for (const row of rows) {
      const teamName = (row.Team || row.team || row.TEAM || '').trim()
      if (!teamName) continue

      const rounds = {}
      for (const rk of ROUND_KEYS) {
        const upper = rk.toUpperCase()
        let val = row[rk] ?? row[upper] ?? row[rk.charAt(0).toUpperCase() + rk.slice(1)] ?? null
        if (val === null || val === '') continue
        // Strip % sign and whitespace
        val = String(val).replace(/%/g, '').trim()
        if (!isNaN(Number(val))) {
          rounds[rk] = Number(val) / 100  // Convert percentage to decimal
        }
      }
      data[teamName] = rounds
    }
    return data
  }

  function handleFileDrop(source, e) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer?.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      handleCSVUpload(source, file)
    }
  }

  // ─── Step 3: Team name matching ─────────────────────────────────────────

  async function loadNameOverrides() {
    try {
      const res = await fetch('/api/admin/teamnames')
      if (res.ok) {
        const data = await res.json()
        if (data.overrides?.length) {
          setNameOverrides(data.overrides.map(o => ({ raw: o.raw, canonical: o.canonical })))
        }
      }
    } catch { /* ignore */ }
  }

  function handleAssignName(rawName, canonicalName) {
    setNameOverrides(prev => {
      return [
        ...prev.filter(o => o.raw.toLowerCase().trim() !== rawName.toLowerCase().trim()),
        { raw: rawName, canonical: canonicalName },
      ]
    })
    // Persist in background
    fetch('/api/admin/teamnames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', rawName, canonicalName }),
    }).catch(() => {})
  }

  // ─── Helper: get bracket team list ──────────────────────────────────────

  function getBracketTeamList() {
    if (!bracketTeams?.games) return []
    const teams = []
    bracketTeams.games
      .filter(g => g.round === 1)
      .forEach(g => {
        if (g.teamA?.name && g.teamA.name !== 'TBD') {
          teams.push({ id: g.id, name: g.teamA.name, seed: g.teamA.seed, region: g.region, displayName: `${g.teamA.seed}. ${g.teamA.name}` })
        }
        if (g.teamB?.name && g.teamB.name !== 'TBD') {
          teams.push({ id: g.id, name: g.teamB.name, seed: g.teamB.seed, region: g.region, displayName: `${g.teamB.seed}. ${g.teamB.name}` })
        }
      })
    return teams
  }

  // ─── Helper: match source teams to bracket ─────────────────────────────

  function getMatchingData(source) {
    const bracketList = getBracketTeamList()
    const srcData = sourceData[source]

    if (!srcData || bracketList.length === 0) {
      return { matched: [], unassigned: [], matchCount: 0, unmatchedCount: 0 }
    }

    const sourceTeamNames = Object.keys(srcData)
    const overrideMap = {}
    nameOverrides.forEach(o => { overrideMap[o.raw.toLowerCase().trim()] = o.canonical })

    const matched = []
    const usedSourceNames = new Set()

    bracketList.forEach(bt => {
      const name = bt.name
      const nameLower = name.toLowerCase().trim()

      let found = sourceTeamNames.find(sn => sn.toLowerCase().trim() === nameLower)

      if (!found) {
        found = sourceTeamNames.find(sn => {
          const mapped = overrideMap[sn.toLowerCase().trim()]
          return mapped && mapped.toLowerCase().trim() === nameLower
        })
      }

      if (!found) {
        found = sourceTeamNames.find(sn =>
          sn.toLowerCase().includes(nameLower) || nameLower.includes(sn.toLowerCase())
        )
      }

      if (found) {
        usedSourceNames.add(found)
        matched.push({ ...bt, sourceTeam: found, data: srcData[found] })
      } else {
        matched.push({ ...bt, sourceTeam: null, data: null })
      }
    })

    sourceTeamNames.forEach(sn => {
      if (usedSourceNames.has(sn)) return
      const mapped = overrideMap[sn.toLowerCase().trim()]
      if (!mapped) return
      const bracketTeam = matched.find(m => m.name.toLowerCase().trim() === mapped.toLowerCase().trim())
      if (bracketTeam) {
        usedSourceNames.add(sn)
        if (!bracketTeam.data) {
          bracketTeam.sourceTeam = sn
          bracketTeam.data = srcData[sn]
        }
      }
    })

    const unassigned = sourceTeamNames
      .filter(sn => !usedSourceNames.has(sn))
      .map(sn => ({ rawName: sn, data: srcData[sn] }))

    const matchCount = matched.filter(m => m.data).length
    const unmatchedCount = unassigned.length

    return { matched, unassigned, matchCount, unmatchedCount }
  }

  // ─── Export ─────────────────────────────────────────────────────────────

  async function handleExport() {
    setExportLoading(true)
    setExportResult(null)
    try {
      if (!sourceData.yahoo || !sourceData.evanmiya || !sourceData.kenpom) {
        setExportResult({ type: 'error', text: 'Upload all 3 CSVs before exporting.' })
        setExportLoading(false)
        return
      }

      const res = await fetch('/api/admin/export-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bracketStructure: bracketTeams,
          yahoo: sourceData.yahoo,
          evanmiya: sourceData.evanmiya,
          kenpom: sourceData.kenpom,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setExportResult({
          type: 'success',
          text: `Exported! bracket.json updated. ${data.changesFromPrevious} changes from previous export. Commit and push to deploy.`,
          exportedAt: data.exportedAt,
        })
      } else {
        setExportResult({ type: 'error', text: data.error || 'Export failed' })
      }
    } catch (err) {
      setExportResult({ type: 'error', text: err.message })
    }
    setExportLoading(false)
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const bracketList = getBracketTeamList()
  const hasBracket = bracketList.length > 0

  return (
    <>
      <Head><title>Admin — Optimal Bracket</title></Head>
      <div style={styles.page}>
        <h1 style={styles.h1}>Optimal Bracket Admin</h1>

        {message && <p style={{ color: message.type === 'error' ? '#ef4444' : '#22c55e', margin: '8px 0' }}>{message.text}</p>}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1: BRACKET TEAMS
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={styles.section}>
          <h2 style={styles.h2}>
            Step 1: Bracket Teams
            {hasBracket && <span style={styles.badgeGreen}> {bracketList.length} teams loaded</span>}
          </h2>

          {hasBracket && editTeams ? (
            <>
              <div style={styles.regionGrid}>
                {REGIONS.map(region => {
                  const seeds = Object.keys(editTeams[region] || {}).sort((a, b) => Number(a) - Number(b))
                  return (
                    <div key={region} style={styles.regionCol}>
                      <h3 style={styles.regionHeader}>{region.charAt(0).toUpperCase() + region.slice(1)}</h3>
                      {seeds.map(seed => (
                        <div key={seed} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={styles.seed}>{seed}</span>
                          <input
                            value={editTeams[region][seed] || ''}
                            onChange={e => handleEditTeamName(region, seed, e.target.value)}
                            style={styles.editInput}
                          />
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
              {editDirty && (
                <button
                  onClick={handleSaveBracketEdits}
                  disabled={savingBracket}
                  style={{ ...styles.btnSuccess, marginTop: 12 }}
                >
                  {savingBracket ? 'Saving...' : 'Save Team Name Changes'}
                </button>
              )}
            </>
          ) : (
            <div>
              <p>No bracket loaded yet.</p>
              <button onClick={handleLoadBracket} style={styles.btnPrimary}>Load 2026 Bracket</button>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2: IMPORT CSV DATA
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Step 2: Import CSV Data</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            Upload CSVs with columns: Team, R1, R2, R3, R4, R5, R6 (percentages 0-100)
          </p>
          <div style={styles.sourceGrid}>
            {SOURCES.map(source => {
              const data = sourceData[source]
              const teamCount = data ? Object.keys(data).length : 0
              return (
                <div key={source} style={styles.sourceCard}>
                  <h3 style={styles.sourceTitle}>{SOURCE_LABELS[source]}</h3>
                  {data ? (
                    <span style={styles.badgeGreen}>Uploaded ({teamCount} teams)</span>
                  ) : (
                    <span style={styles.badgeYellow}>Not uploaded</span>
                  )}

                  {/* Drop zone */}
                  <div
                    style={styles.dropZone}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={e => handleFileDrop(source, e)}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => handleCSVUpload(source, e.target.files[0])}
                      style={{ display: 'none' }}
                      id={`csv-${source}`}
                    />
                    <label htmlFor={`csv-${source}`} style={styles.dropLabel}>
                      Drop CSV here or click to browse
                    </label>
                  </div>

                  {/* Preview table */}
                  {data && (
                    <div style={styles.previewTable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Team</th>
                            {ROUND_LABELS.map(r => <th key={r} style={styles.th}>{r}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(data).slice(0, 10).map(([team, rounds]) => (
                            <tr key={team}>
                              <td style={styles.td}>{team}</td>
                              {ROUND_KEYS.map(rk => (
                                <td key={rk} style={styles.tdNum}>
                                  {rounds[rk] != null ? `${Math.round(rounds[rk] * 100)}%` : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {teamCount > 10 && (
                        <p style={{ fontSize: 12, color: '#888', padding: '4px 8px' }}>...and {teamCount - 10} more teams</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3: TEAM NAME MATCHING
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Step 3: Team Name Matching</h2>

          <div style={styles.tabBar}>
            {SOURCES.map(s => (
              <button
                key={s}
                onClick={() => setActiveSourceTab(s)}
                style={activeSourceTab === s ? styles.tabActive : styles.tab}
              >
                {SOURCE_LABELS[s]}
              </button>
            ))}
          </div>

          <TeamNameMatchingTable
            source={activeSourceTab}
            matchingData={getMatchingData(activeSourceTab)}
            bracketList={bracketList}
            onAssign={handleAssignName}
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            EXPORT BUTTON
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={styles.exportSection}>
          <button
            onClick={handleExport}
            disabled={exportLoading || !hasBracket}
            style={exportLoading ? { ...styles.btnExport, opacity: 0.6 } : styles.btnExport}
          >
            {exportLoading ? 'Running algorithm across 30 combinations...' : 'Update Bracket & Export'}
          </button>

          {exportResult && (
            <p style={{ color: exportResult.type === 'error' ? '#ef4444' : '#22c55e', marginTop: 8, textAlign: 'center' }}>
              {exportResult.type === 'success' ? '✓ ' : ''}{exportResult.text}
            </p>
          )}
        </section>

      </div>
    </>
  )
}

// ─── Team Name Matching Table Component ──────────────────────────────────────

function TeamNameMatchingTable({ source, matchingData, bracketList, onAssign }) {
  const { matched, unassigned, matchCount, unmatchedCount } = matchingData
  const [assignSelections, setAssignSelections] = useState({})

  if (matched.length === 0) {
    return <p style={{ color: '#888' }}>No data available for {SOURCE_LABELS[source]}. Upload a CSV in Step 2 first.</p>
  }

  return (
    <>
      <p style={{ margin: '8px 0', fontSize: 14 }}>
        <strong>{matchCount}</strong> matched / <strong>{unmatchedCount}</strong> unassigned
        {unmatchedCount === 0 && matchCount > 0 && (
          <span style={{ marginLeft: 8, color: '#22c55e', fontWeight: 500 }}>All teams assigned</span>
        )}
      </p>

      <div style={styles.previewTable}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Display Name</th>
              {ROUND_LABELS.map(r => <th key={r} style={styles.th}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {matched
              .sort((a, b) => {
                const regionOrder = REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region)
                if (regionOrder !== 0) return regionOrder
                return (a.seed || 0) - (b.seed || 0)
              })
              .map(row => {
                const hasData = !!row.data
                return (
                  <tr key={row.displayName} style={hasData ? {} : styles.unmatchedRow}>
                    <td style={styles.td}>{row.region}_{row.seed}</td>
                    <td style={styles.td}>{row.displayName}</td>
                    {ROUND_KEYS.map(rk => (
                      <td key={rk} style={styles.tdNum}>
                        {hasData && row.data[rk] != null ? `${Math.round(row.data[rk] * 100)}%` : '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {unassigned.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px' }}>Unassigned from {SOURCE_LABELS[source]} ({unassigned.length})</h4>
          <div style={styles.previewTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Source Team Name</th>
                  <th style={styles.th}>Assign To</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map(u => (
                  <tr key={u.rawName}>
                    <td style={styles.td}>{u.rawName}</td>
                    <td style={styles.td}>
                      <select
                        value={assignSelections[u.rawName] || ''}
                        onChange={e => setAssignSelections(prev => ({ ...prev, [u.rawName]: e.target.value }))}
                        style={styles.select}
                      >
                        <option value="">— Select bracket team —</option>
                        {bracketList
                          .sort((a, b) => a.displayName.localeCompare(b.displayName))
                          .map(bt => (
                            <option key={bt.displayName} value={bt.name}>{bt.displayName}</option>
                          ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => {
                          if (assignSelections[u.rawName]) {
                            onAssign(u.rawName, assignSelections[u.rawName])
                          }
                        }}
                        disabled={!assignSelections[u.rawName]}
                        style={assignSelections[u.rawName] ? styles.btnSmall : { ...styles.btnSmall, opacity: 0.4 }}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Inline Styles ──────────────────────────────────────────────────────────

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '20px 16px 120px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e5e5e5',
    background: '#0a0a0a',
    minHeight: '100vh',
  },
  h1: { fontSize: 24, marginBottom: 24, borderBottom: '1px solid #333', paddingBottom: 12 },
  h2: { fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  section: { marginBottom: 32, padding: 16, background: '#111', borderRadius: 8, border: '1px solid #222' },
  btnPrimary: {
    padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 6, cursor: 'pointer', fontSize: 14,
  },
  btnSuccess: {
    padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none',
    borderRadius: 6, cursor: 'pointer', fontSize: 14,
  },
  btnSmall: {
    padding: '4px 10px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 4, cursor: 'pointer', fontSize: 12,
  },
  badgeGreen: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    background: '#16a34a22', color: '#22c55e', fontSize: 13, fontWeight: 500,
  },
  badgeYellow: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    background: '#ca8a0422', color: '#eab308', fontSize: 13, fontWeight: 500,
  },
  regionGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
  },
  regionCol: { background: '#1a1a1a', borderRadius: 6, padding: 12 },
  regionHeader: { fontSize: 14, fontWeight: 600, marginBottom: 8, textTransform: 'capitalize', color: '#60a5fa' },
  seed: { display: 'inline-block', width: 24, color: '#888', fontSize: 12, textAlign: 'right', marginRight: 4, flexShrink: 0 },
  editInput: {
    flex: 1, padding: '2px 6px', background: '#222', border: '1px solid #333',
    borderRadius: 4, color: '#e5e5e5', fontSize: 13, minWidth: 0,
  },
  sourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  sourceCard: {
    background: '#1a1a1a', borderRadius: 8, padding: 16, border: '1px solid #2a2a2a',
  },
  sourceTitle: { fontSize: 15, margin: '0 0 8px', fontWeight: 600 },
  dropZone: {
    marginTop: 8, padding: '16px 12px', border: '2px dashed #333', borderRadius: 6,
    textAlign: 'center', cursor: 'pointer',
  },
  dropLabel: {
    color: '#888', fontSize: 13, cursor: 'pointer',
  },
  previewTable: { maxHeight: 400, overflow: 'auto', marginTop: 8, borderRadius: 6, border: '1px solid #2a2a2a' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #333', color: '#888', fontWeight: 500, position: 'sticky', top: 0, background: '#1a1a1a' },
  td: { padding: '4px 8px', borderBottom: '1px solid #1a1a1a' },
  tdNum: { padding: '4px 8px', borderBottom: '1px solid #1a1a1a', textAlign: 'right', fontFamily: 'monospace' },
  unmatchedRow: { background: '#ca8a0411' },
  tabBar: { display: 'flex', gap: 4, marginBottom: 12 },
  tab: {
    padding: '6px 14px', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: 6, color: '#888', cursor: 'pointer', fontSize: 13,
  },
  tabActive: {
    padding: '6px 14px', background: '#2563eb', border: '1px solid #2563eb',
    borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13,
  },
  select: {
    padding: '4px 6px', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: 4, color: '#e5e5e5', fontSize: 12, minWidth: 180,
  },
  exportSection: {
    position: 'sticky', bottom: 0, padding: '16px', marginTop: 16,
    background: '#111', borderRadius: 8, border: '1px solid #333',
    zIndex: 10,
  },
  btnExport: {
    width: '100%', padding: '14px 24px', background: '#7c3aed', color: '#fff',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600,
  },
}
