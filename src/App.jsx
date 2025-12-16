import { useEffect, useMemo, useState } from 'react';
import './App.css';

const exerciseOptions = [
  {
    name: 'Lat Pulldown',
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Cable Row',
    image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Chest Press',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Tricep Extension',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Bicep Curl',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80',
  },
];

const forceCurveProfiles = [
  { value: 'linear', label: 'Linear (constant resistance)' },
  { value: 'chain', label: 'Chain (downward -20% linear)' },
  { value: 'reverse-chain', label: 'Reverse Chain (upward +20% linear)' },
  { value: 'band', label: 'Band (upward +20% exponential)' },
  { value: 'reverse-band', label: 'Reverse Band (downward -20% logarithmic)' },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateMaxVelocity(forceLbf) {
  const safeForce = clamp(forceLbf || 1, 1, 380);
  return Math.min(2.6775, 678.9 / safeForce);
}

function formatVelocity(value) {
  return `${value.toFixed(2)} mph`;
}

export default function App() {
  const [leftResistance, setLeftResistance] = useState(180);
  const [rightResistance, setRightResistance] = useState(180);
  const [selectedExercise, setSelectedExercise] = useState(exerciseOptions[0]);
  const [isWorkoutOn, setIsWorkoutOn] = useState(false);
  const [isSetActive, setIsSetActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [cableLength, setCableLength] = useState(48);
  const [lengthHistory, setLengthHistory] = useState(() => []);
  const [direction, setDirection] = useState(1);
  const [engagementMode, setEngagementMode] = useState(false);
  const [engagementLength, setEngagementLength] = useState(36);
  const [storedResistance, setStoredResistance] = useState({ left: 180, right: 180 });
  const [forceCurve, setForceCurve] = useState('linear');
  const [eccentricCurve, setEccentricCurve] = useState('linear');
  const [forceIntensity, setForceIntensity] = useState(20);
  const [eccentricIntensity, setEccentricIntensity] = useState(20);
  const [batteryLevel] = useState(87);
  const [motorReady, setMotorReady] = useState(true);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [currentSlope, setCurrentSlope] = useState(0);
  const [rangeOfMotion, setRangeOfMotion] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLengthHistory((prev) => {
        const last = prev[prev.length - 1]?.length ?? cableLength;
        const movement = isSetActive ? direction * 6 : 0;
        const nextLength = clamp(last + movement + (Math.random() - 0.5) * 1.5, 12, 120);

        if (nextLength >= 118 || nextLength <= 14) {
          setDirection((d) => -d);
          if (isSetActive) {
            setRepCount((r) => r + 1);
          }
        }

        const trimmed = [...prev.slice(-140), { time: Date.now(), length: nextLength }];
        if (trimmed.length > 2) {
          const lastPoint = trimmed[trimmed.length - 1];
          const prevPoint = trimmed[trimmed.length - 2];
          const slope = lastPoint.length - prevPoint.length;
          setCurrentSlope(slope);

          const lengths = trimmed.map((p) => p.length);
          const motion = Math.max(...lengths) - Math.min(...lengths);
          setRangeOfMotion(motion);
        }
        return trimmed;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [cableLength, direction, isSetActive]);

  useEffect(() => {
    if (!isSetActive) {
      setLengthHistory((prev) => [...prev.slice(-50), { time: Date.now(), length: cableLength }]);
    }
  }, [cableLength, isSetActive]);

  const handleStartWorkout = () => {
    setIsWorkoutOn(true);
    setMotorReady(true);
  };

  const handleStartSet = () => {
    if (!isWorkoutOn) return;
    setRepCount(0);
    setIsSetActive(true);
  };

  const handleReset = () => {
    setIsSetActive(false);
    setIsWorkoutOn(false);
    setDirection(1);
    setCableLength((len) => clamp(len - 10, 12, 120));
    setMotorReady(false);

    setWorkoutLog((log) => [
      {
        id: crypto.randomUUID(),
        exercise: selectedExercise.name,
        reps: repCount,
        weight: Math.round((leftResistance + rightResistance) / 2),
        time: new Date().toLocaleTimeString(),
      },
      ...log,
    ]);
  };

  const toggleEngagement = () => {
    if (!engagementMode) {
      setStoredResistance({ left: leftResistance, right: rightResistance });
      setLeftResistance(0);
      setRightResistance(0);
      setEngagementMode(true);
      setIsSetActive(false);
    } else {
      setLeftResistance(storedResistance.left);
      setRightResistance(storedResistance.right);
      setEngagementMode(false);
    }
  };

  const forceCurveLabel = useMemo(() => forceCurveProfiles.find((p) => p.value === forceCurve)?.label, [forceCurve]);
  const eccentricLabel = useMemo(
    () => forceCurveProfiles.find((p) => p.value === eccentricCurve)?.label,
    [eccentricCurve],
  );

  const latestLength = lengthHistory[lengthHistory.length - 1]?.length ?? cableLength;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <div className="dragon">🐉</div>
          <div>
            <p className="eyebrow">Smart Servo Gym</p>
            <h1>Dragon Gym</h1>
          </div>
        </div>
        <div className="status">
          <div className={`pill ${motorReady ? 'ready' : 'standby'}`}>{motorReady ? 'Motors Ready' : 'Standby'}</div>
          <div className="pill ghost">Battery {batteryLevel}%</div>
          <button className="ghost danger">Shutdown</button>
        </div>
      </header>

      <main className="layout">
        <section className="panel hero">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Resistance Control</p>
              <h2>Motor Load</h2>
            </div>
            <div className="tag">0 - 500 lb</div>
          </div>
          <div className="resistance-grid">
            {[{ side: 'Left', value: leftResistance, setter: setLeftResistance }, { side: 'Right', value: rightResistance, setter: setRightResistance }].map((motor) => {
              const velocity = calculateMaxVelocity(motor.value);
              return (
                <div key={motor.side} className="resistance-card">
                  <div className="card-head">
                    <div>
                      <p className="eyebrow">{motor.side} motor</p>
                      <h3>{motor.value.toFixed(0)} lb</h3>
                    </div>
                    <div className="velocity">{formatVelocity(velocity)}</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={motor.value}
                    onChange={(e) => motor.setter(Number(e.target.value))}
                  />
                  <div className="range-meta">
                    <span>1.79 mph @ 380 lb</span>
                    <span>2.67 mph @ 254 lb</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="engagement">
            <div>
              <p className="eyebrow">Engagement Length</p>
              <h4>{engagementLength.toFixed(0)} in</h4>
              <p className="muted">Disable load to find the perfect starting point.</p>
            </div>
            <div className="engagement-actions">
              <input
                type="range"
                min="12"
                max="120"
                value={engagementLength}
                onChange={(e) => setEngagementLength(Number(e.target.value))}
              />
              <button className={engagementMode ? 'primary ghost' : 'primary'} onClick={toggleEngagement}>
                {engagementMode ? 'Re-engage Resistance' : 'Set Engagement Length'}
              </button>
            </div>
          </div>
        </section>

        <section className="panel graph">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Live cable length</p>
              <h2>Rep Trace</h2>
            </div>
            <div className="tag ghost">Slope {currentSlope.toFixed(2)} / Dist {rangeOfMotion.toFixed(1)} in</div>
          </div>
          <div className="graph-area">
            <svg viewBox="0 0 320 160" preserveAspectRatio="none">
              {lengthHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  points={lengthHistory
                    .map((p, idx) => {
                      const x = (idx / Math.max(1, lengthHistory.length - 1)) * 320;
                      const y = 160 - ((p.length - 10) / 110) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}
              <defs>
                <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#7ec8ff" />
                  <stop offset="100%" stopColor="#5ad1ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="graph-meta">
              <div>
                <p className="eyebrow">Current length</p>
                <h3>{latestLength.toFixed(1)} in</h3>
              </div>
              <div>
                <p className="eyebrow">Repetition slope</p>
                <h4>{currentSlope > 0 ? 'Positive / concentric' : 'Negative / eccentric'}</h4>
              </div>
              <div>
                <p className="eyebrow">Range of motion</p>
                <h4>{rangeOfMotion.toFixed(1)} in</h4>
              </div>
            </div>
          </div>
          <div className="length-slider">
            <div>
              <p className="eyebrow">Temporary cable length control</p>
              <h4>{cableLength.toFixed(1)} in</h4>
            </div>
            <input
              type="range"
              min="12"
              max="120"
              value={cableLength}
              onChange={(e) => setCableLength(Number(e.target.value))}
            />
          </div>
        </section>

        <section className="panel actions">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Workout status</p>
              <h2>Session Controls</h2>
            </div>
            <div className="tag ghost">Vertical 1080 x 1920</div>
          </div>
          <div className="controls">
            <button className={`primary ${isWorkoutOn ? 'ghost' : ''}`} onClick={handleStartWorkout}>
              Start Workout
            </button>
            <button disabled={!isWorkoutOn} className="primary" onClick={handleStartSet}>
              Start Set
            </button>
            <button className="ghost" onClick={handleReset}>
              Reset / Retract
            </button>
          </div>
          <div className="stat-grid">
            <div className="stat">
              <p className="eyebrow">Reps</p>
              <h3>{repCount}</h3>
            </div>
            <div className="stat">
              <p className="eyebrow">Workout</p>
              <h3>{isWorkoutOn ? 'Active' : 'Off'}</h3>
            </div>
            <div className="stat">
              <p className="eyebrow">Set state</p>
              <h3>{isSetActive ? 'Counting' : 'Idle'}</h3>
            </div>
          </div>
        </section>

        <section className="panel grid-two">
          <div>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Force Curve</p>
                <h2>Concentric Profile</h2>
              </div>
              <div className="tag ghost">Intensity {forceIntensity}%</div>
            </div>
            <p className="muted">Set how load evolves with cable length.</p>
            <div className="selector">
              <select value={forceCurve} onChange={(e) => setForceCurve(e.target.value)}>
                {forceCurveProfiles.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min="0"
                max="80"
                value={forceIntensity}
                onChange={(e) => setForceIntensity(Number(e.target.value))}
              />
            </div>
            <p className="small-chip">{forceCurveLabel}</p>
          </div>

          <div>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Eccentric</p>
                <h2>Lowering Profile</h2>
              </div>
              <div className="tag ghost">Intensity {eccentricIntensity}%</div>
            </div>
            <p className="muted">Applies only on the way down for controlled returns.</p>
            <div className="selector">
              <select value={eccentricCurve} onChange={(e) => setEccentricCurve(e.target.value)}>
                {forceCurveProfiles.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min="0"
                max="80"
                value={eccentricIntensity}
                onChange={(e) => setEccentricIntensity(Number(e.target.value))}
              />
            </div>
            <p className="small-chip">{eccentricLabel}</p>
          </div>
        </section>

        <section className="panel grid-two">
          <div>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Workout</p>
                <h2>Exercise Selector</h2>
              </div>
            </div>
            <div className="selector">
              <select
                value={selectedExercise.name}
                onChange={(e) => {
                  const next = exerciseOptions.find((opt) => opt.name === e.target.value);
                  if (next) setSelectedExercise(next);
                }}
              >
                {exerciseOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="exercise-card">
              <img src={selectedExercise.image} alt={selectedExercise.name} />
              <div>
                <p className="eyebrow">Movement</p>
                <h4>{selectedExercise.name}</h4>
                <p className="muted">Visual reference for setup and target muscle pattern.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Log</p>
                <h2>Recent Sets</h2>
              </div>
            </div>
            <div className="log">
              {workoutLog.length === 0 && <p className="muted">Complete a set to see history.</p>}
              {workoutLog.map((item) => (
                <div key={item.id} className="log-row">
                  <div>
                    <p className="eyebrow">{item.exercise}</p>
                    <strong>{item.reps} reps @ {item.weight} lb</strong>
                  </div>
                  <span className="muted">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
