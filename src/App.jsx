import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const exerciseOptions = [
  {
    value: 'Lat Pulldown',
    label: 'Lat Pulldown',
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200" fill="none"><rect width="320" height="200" rx="18" fill="%23143152"/><path d="M70 140c40-40 140-40 180 0" stroke="%23b2d5ff" stroke-width="12" stroke-linecap="round"/><circle cx="160" cy="70" r="30" fill="%2387c1ff"/><path d="M150 60h20v60h-20z" fill="%23e7f2ff"/></svg>',
  },
  {
    value: 'Bench Press',
    label: 'Bench Press',
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200" fill="none"><rect width="320" height="200" rx="18" fill="%23143152"/><rect x="40" y="90" width="240" height="20" rx="8" fill="%23b2d5ff"/><rect x="150" y="70" width="20" height="60" rx="6" fill="%23e7f2ff"/><circle cx="80" cy="100" r="16" fill="%2387c1ff"/><circle cx="240" cy="100" r="16" fill="%2387c1ff"/></svg>',
  },
  {
    value: 'Deadlift',
    label: 'Deadlift',
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200" fill="none"><rect width="320" height="200" rx="18" fill="%23143152"/><rect x="60" y="120" width="200" height="12" rx="6" fill="%23b2d5ff"/><rect x="150" y="90" width="20" height="70" rx="6" fill="%23e7f2ff"/><circle cx="90" cy="126" r="14" fill="%2387c1ff"/><circle cx="230" cy="126" r="14" fill="%2387c1ff"/></svg>',
  },
]

const forceCurveOptions = [
  { value: 'linear', label: 'Linear (stable load)' },
  { value: 'chain', label: 'Chain (lighter on ascent)' },
  { value: 'reverse-chain', label: 'Reverse Chain (heavier on ascent)' },
  { value: 'band', label: 'Band (exponential increase)' },
  { value: 'reverse-band', label: 'Reverse Band (exponential decrease)' },
]

const initialLength = 42

function App() {
  const [leftResistance, setLeftResistance] = useState(140)
  const [rightResistance, setRightResistance] = useState(140)
  const [cables, setCables] = useState({ left: initialLength, right: initialLength })
  const [engagementLength, setEngagementLength] = useState(initialLength)
  const [lengthData, setLengthData] = useState(
    Array.from({ length: 24 }, (_, idx) => ({ time: idx, length: initialLength }))
  )
  const [selectedExercise, setSelectedExercise] = useState(exerciseOptions[0].value)
  const [workoutActive, setWorkoutActive] = useState(false)
  const [setActive, setSetActive] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [battery] = useState(92)
  const [resistanceEnabled, setResistanceEnabled] = useState(true)
  const [engagementMode, setEngagementMode] = useState(false)
  const [forceProfile, setForceProfile] = useState(forceCurveOptions[0].value)
  const [eccentricProfile, setEccentricProfile] = useState(forceCurveOptions[0].value)
  const [forceIntensity, setForceIntensity] = useState(20)
  const [eccentricIntensity, setEccentricIntensity] = useState(20)
  const [workoutLog, setWorkoutLog] = useState([])
  const timeRef = useRef(lengthData.length)
  const cycleRef = useRef(1)

  const averageResistance = useMemo(
    () => Math.round((leftResistance + rightResistance) / 2),
    [leftResistance, rightResistance]
  )

  const appendLengthPoint = (length) => {
    timeRef.current += 1
    setLengthData((prev) => {
      const next = [...prev, { time: timeRef.current, length: Math.max(0, length) }]
      return next.slice(-36)
    })
  }

  const stepCable = (current, baseLength) => {
    const amplitude = 18
    const stepSize = 3.4
    let direction = cycleRef.current
    let next = current + direction * stepSize
    let counted = false

    if (direction === 1 && next >= baseLength + amplitude) {
      next = baseLength + amplitude
      cycleRef.current = -1
    } else if (direction === -1 && next <= baseLength) {
      next = baseLength
      cycleRef.current = 1
      counted = true
    }

    return { next, counted }
  }

  useEffect(() => {
    if (!setActive) return undefined

    const interval = setInterval(() => {
      setCables((prev) => {
        const leftStep = stepCable(prev.left, engagementLength)
        const rightStep = stepCable(prev.right, engagementLength + 0.8)

        if (leftStep.counted) {
          setRepCount((count) => count + 1)
        }

        const averageNext = (leftStep.next + rightStep.next) / 2
        appendLengthPoint(averageNext)

        return { left: leftStep.next, right: rightStep.next }
      })
    }, 750)

    return () => clearInterval(interval)
  }, [setActive, engagementLength])

  const handleManualLength = (value) => {
    setCables({ left: value, right: value + 0.8 })
    if (engagementMode) {
      setEngagementLength(value)
    }
    appendLengthPoint(value + 0.4)
  }

  const handleStartWorkout = () => {
    setWorkoutActive(true)
    setResistanceEnabled(true)
  }

  const handleStartSet = () => {
    setSetActive(true)
    setRepCount(0)
    cycleRef.current = 1
    appendLengthPoint((cables.left + cables.right) / 2)
  }

  const handleReset = () => {
    if (setActive) {
      setWorkoutLog((prev) => [
        ...prev,
        {
          exercise: selectedExercise,
          sets: prev.filter((item) => item.exercise === selectedExercise).length + 1,
          reps: repCount,
          weight: averageResistance,
        },
      ])
    }

    setSetActive(false)
    setWorkoutActive(false)
    setRepCount(0)
    setCables({ left: engagementLength, right: engagementLength })
    appendLengthPoint(engagementLength)
  }

  const toggleEngagement = () => {
    if (!engagementMode) {
      setResistanceEnabled(false)
    } else {
      setResistanceEnabled(true)
      setEngagementLength((cables.left + cables.right) / 2)
    }
    setEngagementMode((mode) => !mode)
  }

  const shutdownResistance = () => {
    setResistanceEnabled(false)
    setSetActive(false)
  }

  const currentSlope = useMemo(() => {
    if (lengthData.length < 2) return 0
    const a = lengthData[lengthData.length - 2]
    const b = lengthData[lengthData.length - 1]
    if (b.time === a.time) return 0
    return Number(((b.length - a.length) / (b.time - a.time)).toFixed(2))
  }, [lengthData])

  const currentRange = useMemo(() => {
    if (!lengthData.length) return 0
    const lengths = lengthData.map((d) => d.length)
    return Math.max(...lengths) - Math.min(...lengths)
  }, [lengthData])

  const velocityCap = (resistance) => Math.min(2.6775, 678.9 / Math.max(1, resistance))

  const selectedExerciseImage = exerciseOptions.find((opt) => opt.value === selectedExercise)?.image

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="dragon">🐉</span>
          <div>
            <p className="brand-eyebrow">Motors ready: {workoutActive ? 'Active' : 'Idle'}</p>
            <h1>Dragon Gym</h1>
          </div>
        </div>
        <div className="header-actions">
          <div className="status-chip">Battery {battery}%</div>
          <div className={`status-chip ${resistanceEnabled ? 'good' : 'warn'}`}>
            Resistance {resistanceEnabled ? 'Engaged' : 'Off'}
          </div>
          <button className="ghost" onClick={shutdownResistance}>
            Shutdown Motors
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="card highlight">
          <div className="section-header">
            <div>
              <p className="eyebrow">Motor Resistance</p>
              <h2>Left &amp; Right Load</h2>
            </div>
            <p className="detail">0 - 500 lb range</p>
          </div>
          <div className="resistance-grid">
            {[{ label: 'Left Motor', value: leftResistance, setter: setLeftResistance },
              { label: 'Right Motor', value: rightResistance, setter: setRightResistance }].map((motor) => (
              <div className="resistance-card" key={motor.label}>
                <div className="resistance-header">
                  <h3>{motor.label}</h3>
                  <span className="resistance-value">{motor.value} lb</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={motor.value}
                  onChange={(e) => motor.setter(Number(e.target.value))}
                />
                <div className="resistance-meta">
                  <p>Max velocity: {velocityCap(motor.value).toFixed(2)} mph</p>
                  <p>Torque window: 1 lb - 380 lb</p>
                </div>
              </div>
            ))}
          </div>
          <div className="force-settings">
            <div>
              <p className="eyebrow">Force Curve Profile</p>
              <select value={forceProfile} onChange={(e) => setForceProfile(e.target.value)}>
                {forceCurveOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="slider-label">
                Intensity ({forceIntensity}%)
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={forceIntensity}
                  onChange={(e) => setForceIntensity(Number(e.target.value))}
                />
              </label>
            </div>
            <div>
              <p className="eyebrow">Eccentric Profile</p>
              <select value={eccentricProfile} onChange={(e) => setEccentricProfile(e.target.value)}>
                {forceCurveOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="slider-label">
                Intensity ({eccentricIntensity}%)
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={eccentricIntensity}
                  onChange={(e) => setEccentricIntensity(Number(e.target.value))}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Cable Control</p>
              <h2>Length &amp; Engagement</h2>
            </div>
            <div className="length-meta">
              <span>Current: {((cables.left + cables.right) / 2).toFixed(1)} in</span>
              <span>Engagement: {engagementLength.toFixed(1)} in</span>
            </div>
          </div>
          <div className="length-grid">
            <div className="length-display">
              <div>
                <p className="eyebrow">Left Cable</p>
                <h3>{cables.left.toFixed(1)} in</h3>
              </div>
              <div>
                <p className="eyebrow">Right Cable</p>
                <h3>{cables.right.toFixed(1)} in</h3>
              </div>
            </div>
            <div className="length-slider">
              <label className="slider-label">
                Manual length (temporary motor control)
                <input
                  type="range"
                  min="18"
                  max="80"
                  step="0.1"
                  disabled={setActive}
                  value={(cables.left + cables.right) / 2}
                  onChange={(e) => handleManualLength(Number(e.target.value))}
                />
              </label>
              <button className={`ghost ${engagementMode ? 'active' : ''}`} onClick={toggleEngagement}>
                {engagementMode ? 'Lock engagement & re-engage weight' : 'Set engagement length'}
              </button>
              <p className="hint">
                Engagement turns resistance off, lets you position the cable, then slowly re-engages at the marked start point.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Repetition Tracking</p>
              <h2>Cable Length Graph</h2>
            </div>
            <div className="graph-meta">
              <span>Slope: {currentSlope} in/tick</span>
              <span>Rep distance: {currentRange.toFixed(1)} in</span>
              <span>Reps counted: {repCount}</span>
            </div>
          </div>
          <div className="chart-shell">
            <svg viewBox="0 0 320 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stroke" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd0ff" />
                  <stop offset="100%" stopColor="#2f6bff" />
                </linearGradient>
                <linearGradient id="fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(125,208,255,0.4)" />
                  <stop offset="100%" stopColor="rgba(47,107,255,0.05)" />
                </linearGradient>
              </defs>
              {lengthData.length > 1 && (
                <>
                  <path
                    className="chart-fill"
                    d={`M0 160 L ${lengthData
                      .map((point, idx) => {
                        const x = (idx / (lengthData.length - 1)) * 320
                        const range = 100
                        const y = 160 - ((point.length - engagementLength + range / 2) / range) * 160
                        return `${x},${Math.min(160, Math.max(0, y))}`
                      })
                      .join(' L ')} L 320 160 Z`}
                    fill="url(#fill)"
                  />
                  <polyline
                    className="chart-line"
                    points={lengthData
                      .map((point, idx) => {
                        const x = (idx / (lengthData.length - 1)) * 320
                        const range = 100
                        const y = 160 - ((point.length - engagementLength + range / 2) / range) * 160
                        return `${x},${Math.min(160, Math.max(0, y))}`
                      })
                      .join(' ')}
                    stroke="url(#stroke)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Workout Flow</p>
              <h2>Status &amp; Controls</h2>
            </div>
            <div className="status-meta">
              <span className={workoutActive ? 'chip positive' : 'chip'}>
                {workoutActive ? 'Motors On' : 'Motors Off'}
              </span>
              <span className={setActive ? 'chip positive' : 'chip'}>
                {setActive ? 'Set Running' : 'Set Idle'}
              </span>
            </div>
          </div>
          <div className="controls">
            <button onClick={handleStartWorkout} className="primary">
              Start Workout (power on)
            </button>
            <button onClick={handleStartSet} className="primary" disabled={!workoutActive}>
              Start Set (count reps)
            </button>
            <button onClick={handleReset} className="ghost">
              Reset &amp; retract cables
            </button>
          </div>
          <div className="selector">
            <div className="dropdown">
              <label className="eyebrow">Workout selector</label>
              <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
                {exerciseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="exercise-card">
              <img src={selectedExerciseImage} alt={selectedExercise} />
              <div>
                <p className="eyebrow">Current Exercise</p>
                <h3>{selectedExercise}</h3>
                <p className="detail">Sets auto-log when you hit reset after a set.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Workout Log</p>
              <h2>Completed Sets</h2>
            </div>
            <p className="detail">Captured on reset</p>
          </div>
          <div className="log-table">
            <div className="log-header">
              <span>Exercise</span>
              <span>Set</span>
              <span>Reps</span>
              <span>Weight</span>
            </div>
            {workoutLog.length === 0 ? (
              <p className="detail">No sets captured yet.</p>
            ) : (
              workoutLog.map((entry, idx) => (
                <div className="log-row" key={`${entry.exercise}-${idx}`}>
                  <span>{entry.exercise}</span>
                  <span>{entry.sets}</span>
                  <span>{entry.reps}</span>
                  <span>{entry.weight} lb</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
