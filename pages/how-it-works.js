// pages/how-it-works.js
// "How It Works" article page explaining leverage, pick value, and the blended score.

import Head from 'next/head'
import Link from 'next/link'

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works — Optimal Bracket</title>
        <meta
          name="description"
          content="How the Optimal Bracket uses leverage, pick value, and the blended score to find the best picks for your pool."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="header">
          <div className="header-inner">
            <div className="header-logo">
              <Link href="/" className="logo-text" style={{ textDecoration: 'none', color: 'inherit' }}>
                Optimal Bracket
              </Link>
            </div>
            <Link href="/" className="article-back-link">
              ← Back to bracket
            </Link>
          </div>
        </header>

        <main className="article-page">
          <div className="article-container">

            <h1 className="article-title">How It Works</h1>
            <p className="article-subtitle">
              The math and strategy behind the Optimal Bracket.
            </p>

            {/* ── Section 1: The Strategy ─────────────────────── */}
            <section className="article-section">
              <h2 className="article-h2">The Strategy</h2>

              <p className="article-p">
                Most people fill out a bracket trying to pick the most games correctly. That is understandable, but it is not the real goal.
              </p>

              <p className="article-p">
                In a bracket pool, the goal is to finish with more points than everyone else. That is not always the same as making the safest pick in every game.
              </p>

              <p className="article-p">
                When you pick a popular favorite and they win, you get the points, but so does most of your pool. You were right, but you did not gain much. A pick can be correct and still do very little for your standing.
              </p>

              <p className="article-p">
                The biggest moves happen when you get points from teams that the public is not picking as often. If a team wins and only a small share of your pool had them, that result helps your bracket much more. That is where leverage comes from.
              </p>

              <p className="article-p">
                In this model, that leverage is called Pick Value.
              </p>

              <p className="article-p">
                Pick Value measures how much a winning pick is expected to help your bracket relative to the public. It combines a team's chance to win, the number of points available in that round, and how many people are not picking that team.
              </p>

              <p className="article-p">
                This bracket is not just asking, "Who is most likely to win?" It is also asking, "If I pick this team to win, how many more expected points can that outcome add to my bracket compared to the public?"
              </p>
            </section>

            {/* ── Section 2: The Math ──────────────────────────── */}
            <section className="article-section">
              <h2 className="article-h2">How the Math Works</h2>

              <h3 className="article-h3">Pick Value</h3>

              <p className="article-p">
                Pick Value answers a simple question:
              </p>

              <p className="article-callout">
                If I pick this team to win, how many more expected points can that outcome add to my bracket compared to the public?
              </p>

              <p className="article-p">
                That is what leverage means here.
              </p>

              <div className="formula-box">
                <div className="formula-title">Pick Value Formula</div>
                <div className="formula-equation">
                  Pick Value = Projection% &times; Round Points &times; (1 &minus; Public Pick%)
                </div>
                <p className="formula-legend-header">What each part means</p>
                <ul className="formula-legend">
                  <li><strong>Projection%</strong> — the model's estimated chance that the team wins the round</li>
                  <li><strong>Round Points</strong> — how many points a correct pick is worth in that round</li>
                  <li><strong>(1 &minus; Public Pick%)</strong> — the share of the pool that does not have that team; those are the brackets you gain on if the team wins</li>
                </ul>
              </div>

              <h3 className="article-h3">What Pick Value is measured in</h3>

              <p className="article-p">
                Pick Value is measured in expected points above the public field.
              </p>

              <p className="article-p">
                So if a team has a Pick Value of 14.8, that does not mean you are guaranteed 14.8 points. It means that, on average, this pick is worth 14.8 expected points of advantage relative to the public once you account for both the chance of the pick being right and how many brackets you would gain on if it is.
              </p>

              <p className="article-p">
                A higher Pick Value means the pick is expected to do more for your bracket. A lower Pick Value means the pick is either less likely to hit, less useful against the field, or both.
              </p>

              <h3 className="article-h3">Example</h3>

              <p className="article-p">Say a team has:</p>
              <ul className="article-list">
                <li>45% chance to win the Sweet 16</li>
                <li>40 points available in that round</li>
                <li>18% public pick rate</li>
              </ul>

              <p className="article-p">Then:</p>
              <p className="article-p">
                Pick Value = 0.45 &times; 40 &times; (1 &minus; 0.18) = <strong>14.8</strong>
              </p>

              <p className="article-p">
                That 14.8 means this pick is worth 14.8 expected points of advantage versus the public.
              </p>

              <p className="article-p">Now compare that with the favorite in the same game:</p>
              <ul className="article-list">
                <li>55% chance to win</li>
                <li>40 points available</li>
                <li>72% public pick rate</li>
              </ul>

              <p className="article-p">
                Pick Value = 0.55 &times; 40 &times; (1 &minus; 0.72) = <strong>6.2</strong>
              </p>

              <p className="article-p">
                That 6.2 means the favorite is worth only 6.2 expected points of advantage versus the public.
              </p>

              <p className="article-p">
                So even though the favorite is more likely to win, the other team does more for your bracket if it hits because far fewer people have them.
              </p>

              <p className="article-p">
                That is what Pick Value captures in a single number.
              </p>

              <h3 className="article-h3">Why not use Pick Value by itself?</h3>

              <p className="article-p">
                Because Pick Value is only part of the picture.
              </p>

              <p className="article-p">
                A team can have strong Pick Value because the public is overlooking them, but that does not automatically make them the best pick. If the other team has a much higher chance to win, there is still a real cost to passing on that expected value.
              </p>

              <p className="article-p">
                That is why the algorithm does not use Pick Value alone. It uses a second measure called Blended Score.
              </p>

              <h3 className="article-h3">The Blended Score</h3>

              <p className="article-p">
                The Blended Score is the final number used to choose between the two teams in a matchup. The team with the higher Blended Score gets the pick.
              </p>

              <p className="article-p">It combines two ideas:</p>
              <ul className="article-list">
                <li><strong>Expected value</strong> — how many points the pick is worth on average, ignoring the public</li>
                <li><strong>Pick Value</strong> — how many expected points the pick adds to your bracket relative to the field</li>
              </ul>

              <div className="formula-box">
                <div className="formula-title">Blended Score Formula</div>
                <div className="formula-equation">
                  Score = &alpha; &times; (Projection% &times; Points) + (1 &minus; &alpha;) &times; Pick Value
                </div>
                <p className="formula-legend-header">What each part means</p>
                <ul className="formula-legend">
                  <li>
                    <strong>Projection% &times; Points</strong> — this is the pick's raw expected value; it answers: how many points is this pick worth on average?
                  </li>
                  <li>
                    <strong>Pick Value</strong> — this is the pick's relative value against the field; it answers: how much is this pick expected to help my bracket compared to the public?
                  </li>
                  <li>
                    <strong>&alpha; (alpha)</strong> — this is the weighting between those two ideas; alpha is determined by the user's settings, combining the scoring format, risk appetite, and pool size into one strategy value
                  </li>
                </ul>
              </div>

              <h3 className="article-h3">What the Blended Score is measured in</h3>

              <p className="article-p">
                The Blended Score is also measured in expected points.
              </p>

              <p className="article-p">More specifically, it is a decision score in expected point value that combines:</p>
              <ul className="article-list">
                <li>expected points from simply being right</li>
                <li>expected point advantage over the field</li>
              </ul>

              <p className="article-p">
                So if one team has a higher Blended Score than the other, it means that team is expected to do more for your bracket overall once both accuracy and public pick behavior are considered.
              </p>

              <p className="article-p">In practical terms, the Blended Score answers this question:</p>

              <p className="article-callout">
                Which pick gives my bracket the better overall outcome?
              </p>

              <p className="article-p">
                Not just the safer outcome. Not just the more unique outcome. The better overall outcome.
              </p>
            </section>

            {/* ── Section 3: The Three Controls ───────────────── */}
            <section className="article-section">
              <h2 className="article-h2">The Three Controls</h2>

              <h3 className="article-h3">Scoring Format</h3>

              <p className="article-p">
                Pick based on which format your pool uses.
              </p>

              <div className="visual-table-wrap">
                <table className="visual-table">
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>ESPN Points</th>
                      <th>Straight Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Round of 64</td><td>10</td><td>1</td></tr>
                    <tr><td>Round of 32</td><td>20</td><td>1</td></tr>
                    <tr><td>Sweet 16</td><td>40</td><td>1</td></tr>
                    <tr><td>Elite 8</td><td>80</td><td>1</td></tr>
                    <tr><td>Final Four</td><td>160</td><td>1</td></tr>
                    <tr><td>Championship</td><td className="table-highlight">320</td><td>1</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="article-p">
                In ESPN scoring, the champion pick is worth 320 points — more than all of Round 1 combined. That shifts the strategy toward protecting the late rounds. In Straight scoring, every correct pick is worth the same, so early-round upsets matter more.
              </p>

              <h3 className="article-h3">Risk Appetite</h3>

              <p className="article-p">
                Controls how aggressively the algorithm favors leverage over raw win probability (adjusts alpha).
              </p>

              <ul className="article-list">
                <li><strong>Safe</strong> — mostly picks favorites, fewer upsets, bracket looks more conventional</li>
                <li><strong>Balanced</strong> — mixes win probability and leverage, some strategic upsets</li>
                <li><strong>Aggressive</strong> — leans hard into undervalued teams, higher upside, higher variance</li>
              </ul>

              <h3 className="article-h3">Pool Size</h3>

              <p className="article-p">
                The larger your pool, the more you need to separate yourself from the crowd. This also adjusts alpha.
              </p>

              <ul className="article-list">
                <li><strong>Under 25</strong> — less need to differentiate, favor the likely winners</li>
                <li><strong>25–100</strong> — some contrarian picks help, but do not go too far out on a limb</li>
                <li><strong>100–500</strong> — you need meaningful differentiation to finish in the money</li>
                <li><strong>500+</strong> — maximum leverage strategy, significant upsets required to rise above the field</li>
              </ul>

              {/* Visual: Pool Size x Risk Appetite grid */}
              <div className="article-visual">
                <p className="visual-label">How Pool Size and Risk Appetite combine to set alpha</p>
                <div className="alpha-grid">
                  <div className="alpha-grid-header-row">
                    <div className="alpha-grid-corner" />
                    <div className="alpha-grid-col-label">Safe</div>
                    <div className="alpha-grid-col-label">Balanced</div>
                    <div className="alpha-grid-col-label">Aggressive</div>
                  </div>
                  <div className="alpha-grid-row">
                    <div className="alpha-grid-row-label">Under 25</div>
                    <div className="alpha-grid-cell alpha-cell-high">&alpha; &asymp; 0.85</div>
                    <div className="alpha-grid-cell alpha-cell-med">&alpha; &asymp; 0.65</div>
                    <div className="alpha-grid-cell alpha-cell-low">&alpha; &asymp; 0.40</div>
                  </div>
                  <div className="alpha-grid-row">
                    <div className="alpha-grid-row-label">25–100</div>
                    <div className="alpha-grid-cell alpha-cell-high">&alpha; &asymp; 0.75</div>
                    <div className="alpha-grid-cell alpha-cell-med">&alpha; &asymp; 0.50</div>
                    <div className="alpha-grid-cell alpha-cell-low">&alpha; &asymp; 0.30</div>
                  </div>
                  <div className="alpha-grid-row">
                    <div className="alpha-grid-row-label">100–500</div>
                    <div className="alpha-grid-cell alpha-cell-high">&alpha; &asymp; 0.60</div>
                    <div className="alpha-grid-cell alpha-cell-med">&alpha; &asymp; 0.38</div>
                    <div className="alpha-grid-cell alpha-cell-low">&alpha; &asymp; 0.20</div>
                  </div>
                  <div className="alpha-grid-row">
                    <div className="alpha-grid-row-label">500+</div>
                    <div className="alpha-grid-cell alpha-cell-high">&alpha; &asymp; 0.45</div>
                    <div className="alpha-grid-cell alpha-cell-med">&alpha; &asymp; 0.25</div>
                    <div className="alpha-grid-cell alpha-cell-low">&alpha; &asymp; 0.12</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Section 4: Using the Dashboard ──────────────── */}
            <section className="article-section">
              <h2 className="article-h2">Using the Dashboard</h2>

              <ul className="article-list">
                <li><strong>Hover any picked team</strong> to see its leverage breakdown: model projection %, public pick %, pick value, and whether the model sees it as undervalued or overvalued.</li>
                <li><strong>The controls update the bracket live</strong> — try switching between Safe and Aggressive to see how picks change, especially in later rounds.</li>
                <li><strong>Total Leverage</strong> displayed below the bracket shows whether your current settings lean contrarian or follow the crowd overall.</li>
                <li><strong>Start with Balanced / 25–100</strong> as a baseline, then adjust from there based on your pool.</li>
              </ul>
            </section>

            <div className="article-footer-nav">
              <Link href="/" className="article-back-link">
                ← Back to bracket
              </Link>
            </div>

          </div>
        </main>

        <footer className="footer">
          <p>Optimal Bracket uses analytics models and Vegas odds to identify undervalued teams. Not affiliated with Yahoo, ESPN, or the NCAA.</p>
        </footer>

      </div>
    </>
  )
}
