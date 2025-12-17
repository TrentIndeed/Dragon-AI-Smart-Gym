import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const MAX_WEIGHT = 380;
const MAX_RATE_LB = 10; // lbs per interval
const RAMP_INTERVAL_MS = 250;
const LENGTH_MAX = 120;

const exerciseOptions = [
  {
    value: 'lat-pulldown',
    label: 'Lat Pulldown',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Lat_pulldown_machine.jpg/640px-Lat_pulldown_machine.jpg',
  },
  {
    value: 'row',
    label: 'Seated Row',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Seated_cable_row_exercise.jpg/640px-Seated_cable_row_exercise.jpg',
  },
  {
    value: 'press',
    label: 'Chest Press',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Chest_press_machine.jpg/640px-Chest_press_machine.jpg',
  },
  {
    value: 'squat',
    label: 'Belt Squat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Reverse_belt_squat.jpg/640px-Reverse_belt_squat.jpg',
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const curveMultiplier = (profile, intensityPct, progress) => {
  const intensity = intensityPct / 100;
  const easedProgress = clamp(progress, 0, 1);

  switch (profile) {
    case 'chain':
      return clamp(1 - intensity * easedProgress, 0.2, 1.2);
    case 'reverse-chain':
      return clamp(1 + intensity * easedProgress, 0.2, 1.6);
    case 'band':
      return clamp(1 + intensity * Math.pow(easedProgress, 2), 0.2, 1.8);
    case 'reverse-band':
      return clamp(1 - intensity * Math.pow(easedProgress, 2), 0.2, 1.2);
    default:
      return 1;
  }
};

const computeVelocityLimit = (force) => {
  if (force <= 0) return 0;
  return Math.min(2.6775, 678.9 / force);
};

function App() {
  const [leftTarget, setLeftTarget] = useState(120);
  const [rightTarget, setRightTarget] = useState(120);
  const [leftResistance, setLeftResistance] = useState(0);
  const [rightResistance, setRightResistance] = useState(0);

  const [lengthTarget, setLengthTarget] = useState(24);
  const [cableLength, setCableLength] = useState(24);
  const [engagementLength, setEngagementLength] = useState(24);
  const [engagementMode, setEngagementMode] = useState(false);

  const [forceProfile, setForceProfile] = useState('linear');
  const [eccentricProfile, setEccentricProfile] = useState('linear');
  const [profileIntensity, setProfileIntensity] = useState(20);
  const [eccentricIntensity, setEccentricIntensity] = useState(20);

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isSetActive, setIsSetActive] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [workoutLog, setWorkoutLog] = useState([]);

  const [selectedExercise, setSelectedExercise] = useState(exerciseOptions[0]);
  const [batteryLevel] = useState(87);
  const [motorStatus, setMotorStatus] = useState('Idle');
  const [isShutdown, setIsShutdown] = useState(false);

  const [graphData, setGraphData] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 30 }, (_, idx) => ({
      time: now - (29 - idx) * 500,
      length: engagementLength,
    }));
  });

  const phaseRef = useRef(0);
  const prevLengthRef = useRef(cableLength);
  const lastDirectionRef = useRef('steady');

  useEffect(() => {
    const interval = setInterval(() => {
      const desiredLeft = engagementMode || isShutdown ? 0 : leftTarget;
      const desiredRight = engagementMode || isShutdown ? 0 : rightTarget;

      setLeftResistance((current) => {
        const delta = desiredLeft - current;
        if (Math.abs(delta) < MAX_RATE_LB) return desiredLeft;
        const step = Math.sign(delta) * MAX_RATE_LB;
        return clamp(current + step, 0, MAX_WEIGHT);
      });

      setRightResistance((current) => {
        const delta = desiredRight - current;
        if (Math.abs(delta) < MAX_RATE_LB) return desiredRight;
        const step = Math.sign(delta) * MAX_RATE_LB;
        return clamp(current + step, 0, MAX_WEIGHT);
      });
    }, RAMP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [leftTarget, rightTarget, engagementMode, isShutdown]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCableLength((prev) => {
        let nextLength = prev;

        if (isSetActive) {
          phaseRef.current += 0.18;
          const amplitude = 10;
          const wave = Math.sin(phaseRef.current);
          nextLength = clamp(
            engagementLength + amplitude + amplitude * wave,
            0,
            LENGTH_MAX
          );
        } else if (isRetracting) {
          nextLength = Math.max(engagementLength, prev - 1);
        } else {
          const delta = lengthTarget - prev;
          if (Math.abs(delta) > 0.5) {
            nextLength = prev + Math.sign(delta) * 0.5;
          }
        }

        if (isRetracting && nextLength <= engagementLength) {
          setIsRetracting(false);
        }

        return Number(nextLength.toFixed(2));
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isSetActive, lengthTarget, engagementLength, isRetracting]);

  useEffect(() => {
    setGraphData((prev) => {
      const next = [...prev, { time: Date.now(), length: cableLength }];
      return next.slice(-120);
    });

    if (isSetActive) {
      const prevLength = prevLengthRef.current;
      const direction = cableLength > prevLength ? 'extending' : cableLength < prevLength ? 'retracting' : lastDirectionRef.current;

      if (direction === 'retracting' && lastDirectionRef.current === 'extending' && Math.abs(prevLength - cableLength) > 0.5) {
        setRepCount((count) => count + 1);
      }

      prevLengthRef.current = cableLength;
      lastDirectionRef.current = direction;
    } else {
      prevLengthRef.current = cableLength;
      lastDirectionRef.current = 'steady';
    }
  }, [cableLength, isSetActive]);

  const lengthRange = useMemo(() => {
    const lengths = graphData.map((p) => p.length);
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    return { min, max, range: Math.max(max - min, 1) };
  }, [graphData]);

  const progress = clamp((cableLength - lengthRange.min) / lengthRange.range, 0, 1);
  const isDescending = lastDirectionRef.current === 'retracting';

  const leftApplied = useMemo(() => {
    const profile = isDescending ? eccentricProfile : forceProfile;
    const intensity = isDescending ? eccentricIntensity : profileIntensity;
    return Math.round(leftResistance * curveMultiplier(profile, intensity, progress));
  }, [eccentricIntensity, eccentricProfile, forceProfile, isDescending, leftResistance, profileIntensity, progress]);

  const rightApplied = useMemo(() => {
    const profile = isDescending ? eccentricProfile : forceProfile;
    const intensity = isDescending ? eccentricIntensity : profileIntensity;
    return Math.round(rightResistance * curveMultiplier(profile, intensity, progress));
  }, [eccentricIntensity, eccentricProfile, forceProfile, isDescending, profileIntensity, progress, rightResistance]);

  const slope = useMemo(() => {
    if (graphData.length < 2) return 0;
    const latest = graphData[graphData.length - 1];
    const previous = graphData[graphData.length - 2];
    const timeDelta = (latest.time - previous.time) / 1000;
    if (timeDelta === 0) return 0;
    return ((latest.length - previous.length) / timeDelta).toFixed(2);
  }, [graphData]);

  const handleStartWorkout = () => {
    setIsShutdown(false);
    setIsWorkoutActive(true);
    setMotorStatus('Motors ready');
  };

  const handleStartSet = () => {
    setIsSetActive(true);
    setRepCount(0);
    phaseRef.current = 0;
    setMotorStatus('Counting reps');
  };

  const handleReset = () => {
    if (isSetActive) {
      const averageWeight = Math.round((leftApplied + rightApplied) / 2);
      const newEntry = {
        exercise: selectedExercise.label,
        set: setCount + 1,
        reps: repCount,
        weight: averageWeight,
      };
      setWorkoutLog((log) => [newEntry, ...log]);
      setSetCount((count) => count + 1);
    }

    setIsSetActive(false);
    setIsRetracting(true);
    setMotorStatus('Retracting @ 1 in/s');
  };

  const handleShutdown = () => {
    setIsShutdown(true);
    setIsWorkoutActive(false);
    setIsSetActive(false);
    setIsRetracting(false);
    setMotorStatus('Safe shutdown');
    setLeftTarget(0);
    setRightTarget(0);
  };

  const handleEngagement = () => {
    if (!engagementMode) {
      setEngagementMode(true);
      setMotorStatus('Engagement length - resistance off');
    } else {
      setEngagementLength(cableLength);
      setEngagementMode(false);
      setMotorStatus('Resistance re-engaging');
    }
  };

  const renderGraphPath = () => {
    if (graphData.length === 0) return '';
    const points = graphData.slice(-60);
    const widths = 320;
    const heights = 140;
    const minY = lengthRange.min;
    const rangeY = lengthRange.range || 1;

    return points
      .map((point, idx) => {
        const x = (idx / Math.max(points.length - 1, 1)) * widths;
        const y = heights - ((point.length - minY) / rangeY) * heights;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="dragon">🐉</div>
          <div>
            <p className="eyebrow">Smart servo cable trainer</p>
            <h1>Dragon Gym</h1>
          </div>
        </div>
        <div className="header-stats">
          <div className="pill">Battery {batteryLevel}%</div>
          <div className={`pill ${isWorkoutActive ? 'online' : ''}`}>
            {motorStatus}
          </div>
          <button className="shutdown" onClick={handleShutdown}>Shutdown</button>
        </div>
      </header>

      <main className="layout">
        <section className="resistance-panel">
          <div className="motor" aria-label="left motor">
            <p className="motor-label">Left Motor</p>
            <div className="weight-display">{leftApplied} lb</div>
            <p className="velocity">Vmax {computeVelocityLimit(leftApplied).toFixed(2)} mph</p>
            <input
              type="range"
              min="0"
              max={MAX_WEIGHT}
              value={leftTarget}
              onChange={(e) => setLeftTarget(Number(e.target.value))}
            />
            <div className="range-meta">
              <span>0 lb</span>
              <span>Target: {leftTarget} lb</span>
              <span>380 lb</span>
            </div>
          </div>

          <div className="motor" aria-label="right motor">
            <p className="motor-label">Right Motor</p>
            <div className="weight-display">{rightApplied} lb</div>
            <p className="velocity">Vmax {computeVelocityLimit(rightApplied).toFixed(2)} mph</p>
            <input
              type="range"
              min="0"
              max={MAX_WEIGHT}
              value={rightTarget}
              onChange={(e) => setRightTarget(Number(e.target.value))}
            />
            <div className="range-meta">
              <span>0 lb</span>
              <span>Target: {rightTarget} lb</span>
              <span>380 lb</span>
            </div>
          </div>
        </section>

        <section className="graph-stack">
          <div className="graph-card">
            <div className="graph-header">
              <div>
                <p className="eyebrow">Cable length</p>
                <h3>{cableLength.toFixed(2)} in</h3>
              </div>
              <div className="graph-metrics">
                <div>
                  <p className="eyebrow">Slope</p>
                  <strong>{slope} in/s</strong>
                </div>
                <div>
                  <p className="eyebrow">Range</p>
                  <strong>{lengthRange.range.toFixed(2)} in</strong>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 340 160" className="chart">
              <defs>
                <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#42a5f5" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#42a5f5" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path d={renderGraphPath()} fill="none" stroke="url(#lineGradient)" strokeWidth="4" />
            </svg>
            <div className="length-slider">
              <label>Manual length (temp) — {lengthTarget.toFixed(1)} in</label>
              <input
                type="range"
                min="0"
                max={LENGTH_MAX}
                value={lengthTarget}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setLengthTarget(next);
                  setCableLength(next);
                }}
              />
            </div>
          </div>

          <div className="control-grid">
            <div className="card">
              <div className="card-header">
                <h4>Workout Status</h4>
                <p className="status">{isSetActive ? 'Set active' : isWorkoutActive ? 'Workout ready' : 'Idle'}</p>
              </div>
              <div className="controls">
                <button onClick={handleStartWorkout} className="primary">Start workout</button>
                <button onClick={handleStartSet} disabled={!isWorkoutActive} className="primary ghost">Start set</button>
                <button onClick={handleReset} className="tertiary">Reset / retract</button>
              </div>
              <div className="metrics">
                <div>
                  <p className="eyebrow">Reps</p>
                  <strong>{repCount}</strong>
                </div>
                <div>
                  <p className="eyebrow">Set</p>
                  <strong>{setCount + 1}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4>Engagement length</h4>
                <p className="status">{engagementMode ? 'Adjusting' : `${engagementLength.toFixed(1)} in baseline`}</p>
              </div>
              <p className="muted">Turns resistance off while you position the start point, then re-engages slowly.</p>
              <button className="primary" onClick={handleEngagement}>
                {engagementMode ? 'Set start point' : 'Adjust engagement'}
              </button>
            </div>

            <div className="card">
              <div className="card-header">
                <h4>Force Curve Profile</h4>
                <p className="status">Real-time concentric</p>
              </div>
              <div className="profile-row">
                <select value={forceProfile} onChange={(e) => setForceProfile(e.target.value)}>
                  <option value="linear">Linear</option>
                  <option value="chain">Chain</option>
                  <option value="reverse-chain">Reverse chain</option>
                  <option value="band">Band</option>
                  <option value="reverse-band">Reverse band</option>
                </select>
                <div className="intensity">
                  <label>Intensity {profileIntensity}%</label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={profileIntensity}
                    onChange={(e) => setProfileIntensity(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="muted">Weight adapts live with cable length; chain modes taper to 20% based on intensity.</p>
            </div>

            <div className="card">
              <div className="card-header">
                <h4>Eccentric Profile</h4>
                <p className="status">Descending only</p>
              </div>
              <div className="profile-row">
                <select value={eccentricProfile} onChange={(e) => setEccentricProfile(e.target.value)}>
                  <option value="linear">Linear</option>
                  <option value="chain">Chain</option>
                  <option value="reverse-chain">Reverse chain</option>
                  <option value="band">Band</option>
                  <option value="reverse-band">Reverse band</option>
                </select>
                <div className="intensity">
                  <label>Intensity {eccentricIntensity}%</label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={eccentricIntensity}
                    onChange={(e) => setEccentricIntensity(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="muted">Applies only on the way down while retracting.</p>
            </div>

            <div className="card">
              <div className="card-header">
                <h4>Workout selector</h4>
                <p className="status">Choose & preview</p>
              </div>
              <select
                value={selectedExercise.value}
                onChange={(e) => {
                  const chosen = exerciseOptions.find((ex) => ex.value === e.target.value);
                  setSelectedExercise(chosen);
                }}
              >
                {exerciseOptions.map((exercise) => (
                  <option key={exercise.value} value={exercise.value}>
                    {exercise.label}
                  </option>
                ))}
              </select>
              <div className="exercise-preview">
                <img src={selectedExercise.image} alt={selectedExercise.label} />
                <p className="eyebrow">Form reference</p>
                <p className="muted">Match the cable travel to the visual guide.</p>
              </div>
            </div>

            <div className="card log">
              <div className="card-header">
                <h4>Workout log</h4>
                <p className="status">After each set</p>
              </div>
              {workoutLog.length === 0 ? (
                <p className="muted">Finish a set to see it logged.</p>
              ) : (
                <ul>
                  {workoutLog.map((entry) => (
                    <li key={`${entry.exercise}-${entry.set}-${entry.reps}`}>
                      <div>
                        <p className="eyebrow">{entry.exercise}</p>
                        <strong>Set {entry.set} · {entry.reps} reps</strong>
                      </div>
                      <span>{entry.weight} lb</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
