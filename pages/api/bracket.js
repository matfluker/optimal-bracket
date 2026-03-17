// pages/api/bracket.js
//
// Simple endpoint that reads public/bracket.json and returns it.
// The frontend can also fetch bracket.json directly as a static file.

import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const bracketJsonPath = path.join(process.cwd(), 'public', 'bracket.json')

    if (!fs.existsSync(bracketJsonPath)) {
      return res.status(200).json({
        state: 'awaiting_import',
        message: 'Bracket not yet exported. Go to the admin panel to export.',
        bracket: null,
        picks: null,
      })
    }

    const data = JSON.parse(fs.readFileSync(bracketJsonPath, 'utf-8'))
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error reading bracket.json:', error)
    return res.status(500).json({ error: 'Failed to load bracket data' })
  }
}
