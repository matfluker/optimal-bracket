// pages/api/admin/teamnames.js
//
// Manages team name overrides stored in data/name-mappings.json.
// GET: returns all overrides
// POST: add or remove an override

import { getAllOverrides, getOverrideMap, addOverride, removeOverride } from '../../../lib/nameOverrides.js'

export default async function handler(req, res) {
  // ── GET: return all overrides ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const [overrides, overrideMap] = await Promise.all([
        getAllOverrides(),
        getOverrideMap(),
      ])

      return res.status(200).json({
        overrides,
        overrideMap,
        count: overrides.length,
      })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // ── POST: add or remove an override ────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, rawName, canonicalName } = req.body

    try {
      if (action === 'add') {
        if (!rawName || !canonicalName) {
          return res.status(400).json({ error: 'rawName and canonicalName required' })
        }
        const overrides = await addOverride(rawName, canonicalName)
        return res.status(200).json({ success: true, overrides })
      }

      if (action === 'remove') {
        if (!rawName) return res.status(400).json({ error: 'rawName required' })
        const overrides = await removeOverride(rawName)
        return res.status(200).json({ success: true, overrides })
      }

      return res.status(400).json({ error: 'action must be "add" or "remove"' })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
