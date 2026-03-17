// pages/api/admin/export-bracket.js
//
// Accepts source data in POST body, runs the algorithm, writes public/bracket.json.
// Called from the admin panel's "Export" button.

import fs from 'fs'
import path from 'path'
import { getOverrideMap } from '../../../lib/nameOverrides.js'
import { runAllCombinations, generateTooltipData, diffPicks, calculateTotalLeverage } from '../../../lib/algorithm.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { bracketStructure, yahoo, evanmiya, kenpom } = req.body

    if (!bracketStructure) {
      return res.status(400).json({ error: 'No bracket structure provided.' })
    }

    if (!yahoo || !evanmiya || !kenpom) {
      return res.status(400).json({ error: 'All three data sources (yahoo, evanmiya, kenpom) are required.' })
    }

    // Apply name overrides to source data
    const overrideMap = await getOverrideMap()
    const yahooData = applyOverrides(yahoo, overrideMap)
    const evanmiyaData = applyOverrides(evanmiya, overrideMap)
    const kenpomData = applyOverrides(kenpom, overrideMap)

    // Run algorithm for all 24 combinations
    const allCurrentPicks = runAllCombinations(bracketStructure, yahooData, evanmiyaData, kenpomData)

    // Generate tooltips for all combos
    const allTooltips = {}
    const scoringModes = ['espn', 'straight']
    const leverageModes = ['safe', 'balanced', 'aggressive']
    const poolSizes = ['Under 25', '25-100', '100-500', '500+']
    for (const scoringMode of scoringModes) {
      for (const leverageMode of leverageModes) {
        for (const poolSize of poolSizes) {
          const comboKey = `${scoringMode}_${leverageMode}_${poolSize}`
          if (allCurrentPicks[comboKey]) {
            allTooltips[comboKey] = generateTooltipData(
              allCurrentPicks[comboKey],
              bracketStructure,
              yahooData, evanmiyaData, kenpomData,
              { scoringMode, leverageMode, poolSize }
            )
          }
        }
      }
    }

    // Calculate total leverage for all combos
    const allTotalLeverage = {}
    for (const scoringMode of scoringModes) {
      for (const leverageMode of leverageModes) {
        for (const poolSize of poolSizes) {
          const comboKey = `${scoringMode}_${leverageMode}_${poolSize}`
          if (allCurrentPicks[comboKey]) {
            allTotalLeverage[comboKey] = calculateTotalLeverage(
              allCurrentPicks[comboKey], bracketStructure,
              yahooData, evanmiyaData, kenpomData,
              { scoringMode }
            )
          }
        }
      }
    }

    // Compute diffs against previous bracket.json if it exists
    const bracketJsonPath = path.join(process.cwd(), 'public', 'bracket.json')
    let allDiffs = {}
    let changesFromPrevious = 0

    try {
      if (fs.existsSync(bracketJsonPath)) {
        const previousData = JSON.parse(fs.readFileSync(bracketJsonPath, 'utf-8'))
        if (previousData.picks) {
          Object.keys(allCurrentPicks).forEach(comboKey => {
            if (allCurrentPicks[comboKey] && previousData.picks[comboKey]) {
              allDiffs[comboKey] = diffPicks(allCurrentPicks[comboKey], previousData.picks[comboKey], bracketStructure)
              const changes = Object.values(allDiffs[comboKey]).filter(v => v !== 'unchanged')
              changesFromPrevious += changes.length
            }
          })
        }
      }
    } catch {
      // No previous file or invalid
    }

    // Build the output
    const exportedAt = new Date().toISOString()
    const output = {
      state: 'active',
      bracket: bracketStructure,
      picks: allCurrentPicks,
      diffs: allDiffs,
      tooltips: allTooltips,
      totalLeverage: allTotalLeverage,
      lastUpdated: exportedAt,
      locked: false,
      exportedAt,
    }

    // Write to public/bracket.json
    fs.writeFileSync(bracketJsonPath, JSON.stringify(output, null, 2), 'utf-8')

    return res.status(200).json({
      success: true,
      exportedAt,
      totalCombinations: 24,
      changesFromPrevious,
    })

  } catch (error) {
    console.error('Export bracket error:', error)
    return res.status(500).json({ error: error.message })
  }
}

function applyOverrides(sourceData, overrideMap) {
  if (!sourceData || !overrideMap || Object.keys(overrideMap).length === 0) return sourceData
  const remapped = {}
  for (const [rawName, roundData] of Object.entries(sourceData)) {
    const canonical = overrideMap[rawName.toLowerCase().trim()] || rawName
    remapped[canonical] = roundData
  }
  return remapped
}
