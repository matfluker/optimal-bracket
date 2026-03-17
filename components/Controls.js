// components/Controls.js
//
// The control panel shown above the bracket.
// Lets users switch between:
//   - ESPN scoring vs Straight scoring
//   - Safe / Balanced / Aggressive leverage mode
//   - Floor slider (5%, 10%, 15%, 20%, 25%)

export default function Controls({ settings, onChange }) {
  const { scoringMode, leverageMode, poolSize = '25-100' } = settings

  const setScoring = (mode) => onChange({ ...settings, scoringMode: mode })
  const setLeverage = (mode) => onChange({ ...settings, leverageMode: mode })
  const setPoolSize = (val) => onChange({ ...settings, poolSize: val })
  
  return (
    <div className="controls">
      
      {/* Scoring Mode */}
      <div className="control-group">
        <label className="control-label">Scoring Format</label>
        <div className="toggle-group">
          <button
            className={`toggle-btn ${scoringMode === 'espn' ? 'active' : ''}`}
            onClick={() => setScoring('espn')}
            title="ESPN: 10/20/40/80/160/320 points per round. Championship pick is worth 320 points."
          >
            ESPN
          </button>
          <button
            className={`toggle-btn ${scoringMode === 'straight' ? 'active' : ''}`}
            onClick={() => setScoring('straight')}
            title="Straight: 1 point per correct pick, every round equal weight."
          >
            Straight
          </button>
        </div>
        <div className="control-hint">
          {scoringMode === 'espn' 
            ? 'ESPN: 10 → 20 → 40 → 80 → 160 → 320 pts. Champion pick is king.'
            : 'Straight: 1 pt per correct pick. Every round matters equally.'
          }
        </div>
      </div>
      
      {/* Leverage Mode */}
      <div className="control-group">
        <label className="control-label">Risk Appetite</label>
        <div className="toggle-group">
          <button
            className={`toggle-btn leverage-btn ${leverageMode === 'safe' ? 'active' : ''}`}
            onClick={() => setLeverage('safe')}
            title="Fewer upsets, sticks closer to favorites"
          >
            Safe
          </button>
          <button
            className={`toggle-btn leverage-btn ${leverageMode === 'balanced' ? 'active' : ''}`}
            onClick={() => setLeverage('balanced')}
            title="Balances win probability with differentiation"
          >
            Balanced
          </button>
          <button
            className={`toggle-btn leverage-btn ${leverageMode === 'aggressive' ? 'active' : ''}`}
            onClick={() => setLeverage('aggressive')}
            title="Leans into undervalued picks for higher upside"
          >
            Aggressive
          </button>
        </div>
        <div className="control-hint">
          {leverageMode === 'safe' && 'Safe: Fewer upsets, sticks closer to the favorites.'}
          {leverageMode === 'balanced' && 'Balanced: Mixes win probability with pool differentiation.'}
          {leverageMode === 'aggressive' && 'Aggressive: Leans into undervalued picks for higher upside and more risk.'}
        </div>
      </div>
      
      {/* Pool Size */}
      <div className="control-group">
        <label className="control-label">Pool Size</label>
        <select
          className="pool-size-select"
          value={poolSize}
          onChange={(e) => setPoolSize(e.target.value)}
        >
          <option value="Under 25">Under 25</option>
          <option value="25-100">25-100</option>
          <option value="100-500">100-500</option>
          <option value="500+">500+</option>
        </select>
        <div className="control-hint">
          {poolSize === 'Under 25' && 'Small pool: less pressure to differentiate, favor the best teams.'}
          {poolSize === '25-100' && 'Medium pool: some differentiation helps you stand out.'}
          {poolSize === '100-500' && 'Large pool: you need contrarian picks to move up.'}
          {poolSize === '500+' && 'Massive pool: maximum differentiation to rise above the crowd.'}
        </div>
      </div>

    </div>
  )
}
