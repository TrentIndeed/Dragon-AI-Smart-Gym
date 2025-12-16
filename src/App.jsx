import { useEffect, useMemo, useRef, useState } from 'react'

const exerciseLibrary = {
  'lat-pulldown': {
    name: 'Lat Pulldown',
    image:
      'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=600&q=80',
  },
  'seated-row': {
    name: 'Seated Row',
    image:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80',
  },
  'chest-press': {
    name: 'Chest Press',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
  },
  'bicep-curl': {
    name: 'Bicep Curl',
    image:
      'https://images.unsplash.com/photo-1501453978855-9860b7ad09b0?auto=format&fit=crop&w=600&q=80',
  },
}

const profileLabels = {
  linear: 'Linear: even resistance throughout the stroke.',
  chain: 'Chain: resistance tapers to 20% on the way up.',
  'reverse-chain': 'Reverse chain: resistance ramps up 20% on the way up.',
  band: 'Band: resistance grows exponentially by 20% upward.',
  'reverse-band': 'Reverse band: resistance softens exponentially upward.',
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const formatVelocity = (force) => {
  const safeForce = Math.max(force, 1)
  const velocity = Math.min(2.6775, 678.9 / safeForce)
  return velocity.toFixed(2)
}

const describeProfile = (profile, intensity) => {
  const base = profileLabels[profile]
  const adjusted = intensity === 20 ? '' : ` Adjusted by ${intensity}% for this set.`
  return `${base}${adjusted}`
}

const calcSlope = (data) => {
  if (data.length < 2) return 0
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  return latest.length - prev.length
}

const calcRange = (data) => {
  if (!data.length) return 0
  const lengths = data.map((d) => d.length)
  return Math.max(...lengths) - Math.min(...lengths)
}

const formatDistance = (distance) => `${distance.toFixed(1)} in`

function App() {
  const [leftResistance, setLeftResistance] = useState(180)
  const [rightResistance, setRightResistance] = useState(180)
  const [cableLength, setCableLength] = useState(42)
  const [workoutActive, setWorkoutActive] = useState(false)
  const [setActive, setSetActive] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [graphData, setGraphData] = useState([{ time: 0, length: cableLength }])
  const [selectedExercise, setSelectedExercise] = useState('lat-pulldown')
  const [workoutLog, setWorkoutLog] = useState([])
  const [battery, setBattery] = useState(92)
  const [shutdown, setShutdown] = useState(false)
  const [engagementMode, setEngagementMode] = useState(false)
  const [savedResistance, setSavedResistance] = useState({ left: 0, right: 0 })
  const [forceProfile, setForceProfile] = useState('linear')
  const [eccentricProfile, setEccentricProfile] = useState('linear')
  const [profileIntensity, setProfileIntensity] = useState(20)
  const [eccentricIntensity, setEccentricIntensity] = useState(20)

  const lastSlope = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setBattery((prev) => clamp(prev - 0.01, 15, 100))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setGraphData((prev) => {
        const nextTime = prev[prev.length - 1].time + 1
        const oscillation = setActive ? Math.sin(nextTime / 1.2) * 8 : Math.sin(nextTime / 2.5) * 2
        const length = clamp(cableLength + oscillation, 10, 120)
        const updated = [...prev, { time: nextTime, length }]
        return updated.slice(-35)
      })
    }, setActive ? 500 : 900)

    return () => clearInterval(interval)
  }, [cableLength, setActive])

  useEffect(() => {
    if (!setActive) return
    const slope = calcSlope(graphData)
    if (lastSlope.current > 0 && slope < 0) {
      setRepCount((count) => count + 1)
    }
    lastSlope.current = slope
  }, [graphData, setActive])

  const latestLength = useMemo(
    () => (graphData.length ? graphData[graphData.length - 1].length : cableLength),
    [graphData, cableLength],
  )

  const handleStartWorkout = () => {
    setShutdown(false)
    setWorkoutActive(true)
  }

  const handleStartSet = () => {
    setRepCount(0)
    setSetActive(true)
  }

  const handleReset = () => {
    setSetActive(false)
    setRepCount(0)
    setGraphData([{ time: 0, length: Math.max(8, cableLength - 6) }])
    setCableLength((prev) => clamp(prev - 2, 8, 120))
  }

  const handleShutdown = () => {
    setShutdown(true)
    setWorkoutActive(false)
    setSetActive(false)
    setLeftResistance(0)
    setRightResistance(0)
  }

  const handleEngagementToggle = () => {
    if (!engagementMode) {
      setSavedResistance({ left: leftResistance, right: rightResistance })
      setLeftResistance(0)
      setRightResistance(0)
    } else {
      setLeftResistance(savedResistance.left)
      setRightResistance(savedResistance.right)
    }
    setEngagementMode((mode) => !mode)
  }

  const handleLogSet = () => {
    const entry = {
      exercise: exerciseLibrary[selectedExercise].name,
      reps: repCount || Math.round(calcRange(graphData)),
      weight: Math.round((leftResistance + rightResistance) / 2),
      setNumber: workoutLog.length + 1,
    }
    setWorkoutLog((prev) => [...prev, entry])
    setRepCount(0)
    setSetActive(false)
  }

  const slope = calcSlope(graphData)
  const range = calcRange(graphData)

  const velocityLeft = formatVelocity(leftResistance)
  const velocityRight = formatVelocity(rightResistance)

  const intensityHint = (intensity) => `20% base adjusted to ${intensity}%`

  const currentExercise = exerciseLibrary[selectedExercise]

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <div className="logo">🐉</div>
          <div>
            <p className="eyebrow">Dragon Gym</p>
            <h1>Smart Cable Coach</h1>
          </div>
        </div>
        <div className="header-status">
          <button className="ghost" onClick={handleShutdown}>
            Shutdown
          </button>
          <div className={`status-dot ${workoutActive && !shutdown ? 'ok' : 'idle'}`}>
            {shutdown ? 'Resistance off' : workoutActive ? 'Motors ready' : 'Standby'}
          </div>
          <div className="pill">Battery {battery.toFixed(0)}%</div>
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Load control</p>
              <h2>Resistance output</h2>
            </div>
            <div className="badge">0 - 500 lb</div>
          </div>
          <div className="resistance-grid">
            {[{ label: 'Left Motor', value: leftResistance, setter: setLeftResistance, velocity: velocityLeft }, { label: 'Right Motor', value: rightResistance, setter: setRightResistance, velocity: velocityRight }].map((motor) => (
              <div key={motor.label} className="resistance-card">
                <div className="resistance-header">
                  <h3>{motor.label}</h3>
                  <span className="pill subtle">Vmax {motor.velocity} mph</span>
                </div>
                <div className="resistance-value">
                  <span>{motor.value.toFixed(0)}</span>
                  <small>lbf</small>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="1"
                  value={motor.value}
                  onChange={(e) => motor.setter(Number(e.target.value))}
                />
                {motor.value > 380 && <p className="note">Motor envelope: 380 lb max for rated speed.</p>}
              </div>
            ))}
          </div>
          <div className="engagement">
            <div>
              <h3>Engagement length</h3>
              <p className="subtext">
                Turn off resistance, dial the cable to your start length, then gently bring the weight back on.
              </p>
            </div>
            <div className="engagement-actions">
              <button className={engagementMode ? 'secondary' : ''} onClick={handleEngagementToggle}>
                {engagementMode ? 'Exit engagement' : 'Set engagement length'}
              </button>
              {engagementMode && <span className="pill">Resistance temporarily off</span>}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Live tracking</p>
              <h2>Cable length graph</h2>
            </div>
            <div className="pill">Stroke range {formatDistance(range)}</div>
          </div>
          <div className="graph">
            <svg viewBox="0 0 320 140" role="img" aria-label="Cable length over time">
              <polyline
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                points={graphData
                  .map((point, idx) => {
                    const x = (idx / (graphData.length - 1 || 1)) * 320
                    const y = 140 - (point.length / 140) * 120 - 10
                    return `${x},${clamp(y, 0, 140)}`
                  })
                  .join(' ')}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7dd2ff" />
                  <stop offset="100%" stopColor="#4fa3ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="graph-readout">
              <div>
                <p className="label">Current length</p>
                <h3>{latestLength.toFixed(1)} in</h3>
              </div>
              <div>
                <p className="label">Slope</p>
                <h3>{slope.toFixed(2)} in/s</h3>
              </div>
              <div>
                <p className="label">Rep distance</p>
                <h3>{formatDistance(range)}</h3>
              </div>
            </div>
          </div>
          <div className="length-control">
            <div>
              <h3>Cable length control</h3>
              <p className="subtext">Temporary slider until motors are connected.</p>
            </div>
            <div className="length-slider">
              <input
                type="range"
                min="10"
                max="120"
                value={cableLength}
                onChange={(e) => setCableLength(Number(e.target.value))}
              />
              <div className="pill">{cableLength.toFixed(0)} in</div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Session control</p>
              <h2>Workout status</h2>
            </div>
            <div className="pill accent">Touch-friendly controls</div>
          </div>
          <div className="status-grid">
            <button className="primary" onClick={handleStartWorkout} disabled={workoutActive && !shutdown}>
              Start workout
            </button>
            <button className="primary" onClick={handleStartSet} disabled={!workoutActive}>
              Start set
            </button>
            <button className="ghost" onClick={handleReset}>
              Reset & retract
            </button>
          </div>
          <div className="status-metrics">
            <div className="metric">
              <p className="label">Set active</p>
              <h3>{setActive ? 'Counting reps' : 'Idle'}</h3>
            </div>
            <div className="metric">
              <p className="label">Repetitions</p>
              <h3>{repCount}</h3>
            </div>
            <div className="metric">
              <p className="label">Motor state</p>
              <h3>{shutdown ? 'Resistance off' : workoutActive ? 'Ready' : 'Standby'}</h3>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Adaptive strength</p>
              <h2>Force & eccentric profiles</h2>
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-card">
              <div className="profile-header">
                <h3>Force curve</h3>
                <span className="pill subtle">{intensityHint(profileIntensity)}</span>
              </div>
              <select value={forceProfile} onChange={(e) => setForceProfile(e.target.value)}>
                <option value="linear">Linear</option>
                <option value="chain">Chain</option>
                <option value="reverse-chain">Reverse chain</option>
                <option value="band">Band</option>
                <option value="reverse-band">Reverse band</option>
              </select>
              <label className="slider-label">Intensity</label>
              <input
                type="range"
                min="10"
                max="60"
                value={profileIntensity}
                onChange={(e) => setProfileIntensity(Number(e.target.value))}
              />
              <p className="subtext">{describeProfile(forceProfile, profileIntensity)}</p>
            </div>
            <div className="profile-card">
              <div className="profile-header">
                <h3>Eccentric profile</h3>
                <span className="pill subtle">{intensityHint(eccentricIntensity)}</span>
              </div>
              <select value={eccentricProfile} onChange={(e) => setEccentricProfile(e.target.value)}>
                <option value="linear">Linear</option>
                <option value="chain">Chain</option>
                <option value="reverse-chain">Reverse chain</option>
                <option value="band">Band</option>
                <option value="reverse-band">Reverse band</option>
              </select>
              <label className="slider-label">Intensity</label>
              <input
                type="range"
                min="10"
                max="60"
                value={eccentricIntensity}
                onChange={(e) => setEccentricIntensity(Number(e.target.value))}
              />
              <p className="subtext">{describeProfile(eccentricProfile, eccentricIntensity)} Only applied on the way down.</p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Workout builder</p>
              <h2>Exercise selector</h2>
            </div>
            <div className="pill">Preview images</div>
          </div>
          <div className="selector">
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
              {Object.entries(exerciseLibrary).map(([key, exercise]) => (
                <option key={key} value={key}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <div className="exercise-preview">
              <img src={currentExercise.image} alt={`${currentExercise.name} reference`} />
              <div>
                <p className="label">Selected</p>
                <h3>{currentExercise.name}</h3>
                <p className="subtext">Match your cable height and grips, then tap start set.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Progress</p>
              <h2>Workout log</h2>
            </div>
            <button className="secondary" onClick={handleLogSet} disabled={!workoutActive}>
              Log set
            </button>
          </div>
          <div className="log-list">
            {workoutLog.length === 0 && <p className="subtext">Complete a set to populate your session log.</p>}
            {workoutLog.map((entry) => (
              <div key={entry.setNumber} className="log-item">
                <div>
                  <p className="label">{entry.exercise}</p>
                  <h3>Set {entry.setNumber}</h3>
                </div>
                <div className="log-meta">
                  <span className="pill subtle">{entry.reps} reps</span>
                  <span className="pill subtle">{entry.weight} lb</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
