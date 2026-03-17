// pages/api/import-bracket.js
//
// Called from the admin panel to import/update the bracket structure.
// Builds the bracket tree and writes it to public/bracket.json.

import fs from 'fs'
import path from 'path'
import { buildBracketStructure } from '../../lib/bracketTree.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { teams } = req.body

  // Validate the incoming data
  if (!teams || !teams.south || !teams.east || !teams.midwest || !teams.west) {
    return res.status(400).json({
      error: 'Missing regions. Need: south, east, midwest, west.',
    })
  }

  const regionErrors = []
  for (const region of ['south', 'east', 'midwest', 'west']) {
    const seedCount = Object.keys(teams[region]).length
    if (seedCount < 15) {
      regionErrors.push(`${region}: only ${seedCount} seeds (need at least 15)`)
    }
    const emptySeeds = Object.entries(teams[region])
      .filter(([, name]) => !name || name.trim() === '')
      .map(([seed]) => seed)
    if (emptySeeds.length > 0) {
      regionErrors.push(`${region}: empty team names for seeds ${emptySeeds.join(', ')}`)
    }
  }

  if (regionErrors.length > 0) {
    return res.status(400).json({
      error: 'Bracket validation failed',
      details: regionErrors,
    })
  }

  try {
    const bracketStructure = buildBracketStructure(teams)

    // Read existing bracket.json if it exists, update the bracket structure
    const bracketJsonPath = path.join(process.cwd(), 'public', 'bracket.json')
    let output = {
      state: 'active',
      bracket: bracketStructure,
      picks: {},
      diffs: {},
      tooltips: {},
      totalLeverage: {},
      lastUpdated: new Date().toISOString(),
      locked: false,
    }

    try {
      if (fs.existsSync(bracketJsonPath)) {
        const existing = JSON.parse(fs.readFileSync(bracketJsonPath, 'utf-8'))
        output = { ...existing, bracket: bracketStructure, lastUpdated: new Date().toISOString() }
      }
    } catch { /* ignore */ }

    fs.writeFileSync(bracketJsonPath, JSON.stringify(output, null, 2), 'utf-8')

    return res.status(200).json({
      success: true,
      message: 'Bracket imported successfully!',
      teamsImported: countTeams(teams),
      bracket: bracketStructure,
    })

  } catch (error) {
    return res.status(500).json({ error: 'Failed to import bracket: ' + error.message })
  }
}

function countTeams(teams) {
  let count = 0
  Object.values(teams).forEach(region => {
    count += Object.keys(region).length
  })
  return count
}
