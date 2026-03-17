// components/Countdown.js
//
// Shown on the main page before the bracket is announced.
// Displays a live countdown clock to Selection Sunday.

import { useState, useEffect } from 'react'

export default function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [targetDate])
  
  if (timeLeft.total <= 0) {
    return (
      <div className="countdown-done">
        <p>The bracket has been announced.</p>
        <p>Check back shortly — the Optimal Bracket is being calculated.</p>
      </div>
    )
  }
  
  return (
    <div className="countdown-container">
      <div className="countdown-label">Optimal Bracket reveals in</div>
      <div className="countdown-clock">
        <div className="countdown-unit">
          <span className="countdown-number">{timeLeft.days}</span>
          <span className="countdown-unit-label">days</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown-unit-label">hours</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="countdown-unit-label">minutes</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="countdown-unit-label">seconds</span>
        </div>
      </div>
      <div className="countdown-note">
        The Optimal Bracket will be revealed after Selection Sunday on March 16.
      </div>
    </div>
  )
}

function getTimeLeft(targetDate) {
  const total = new Date(targetDate) - new Date()
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
  }
}
