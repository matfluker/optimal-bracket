// lib/nameOverrides.js
//
// Custom team name mappings stored in data/name-mappings.json.
// These supplement the static TEAM_NAME_MAP in lib/constants/teams.js.
//
// FORMAT:
//   [{ raw, canonical, source, addedAt }]

import fs from 'fs'
import path from 'path'

const FILE_PATH = path.join(process.cwd(), 'data', 'name-mappings.json')

function readFile() {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeFile(overrides) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(overrides, null, 2), 'utf-8')
}

// Get all custom overrides as a lookup map: { rawLower: canonical }
export async function getOverrideMap() {
  const overrides = readFile()
  const map = {}
  for (const o of overrides) {
    map[o.raw.toLowerCase().trim()] = o.canonical
  }
  return map
}

// Get all overrides as a full array (for admin display)
export async function getAllOverrides() {
  return readFile()
}

// Add a new override
export async function addOverride(rawName, canonicalName, source = 'manual') {
  const overrides = readFile()

  const existingIdx = overrides.findIndex(
    o => o.raw.toLowerCase().trim() === rawName.toLowerCase().trim()
  )

  const entry = {
    raw: rawName.trim(),
    canonical: canonicalName.trim(),
    source,
    addedAt: new Date().toISOString(),
  }

  if (existingIdx >= 0) {
    overrides[existingIdx] = entry
  } else {
    overrides.push(entry)
  }

  writeFile(overrides)
  return overrides
}

// Remove an override by raw name
export async function removeOverride(rawName) {
  const overrides = readFile()
  const filtered = overrides.filter(
    o => o.raw.toLowerCase().trim() !== rawName.toLowerCase().trim()
  )
  writeFile(filtered)
  return filtered
}
