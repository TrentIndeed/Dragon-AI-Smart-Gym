import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_RESISTANCE = 380;
const FORCE_STEP = 10;
const FORCE_INTERVAL = 250;
const MAX_CABLE_LENGTH = 120;
const LENGTH_STEP = 0.1; // 1 in / second with 100ms updates

const exercises = [
  'Squat',
  'Deadlift',
  'Lat Pulldown',
  'Chest Press',
  'Seated Row',
  'Shoulder Press'
];

const makeExerciseImage = (name) => {
  const encoded = encodeURIComponent(name);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='280'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='#0a2a4f'/>
        <stop offset='100%' stop-color='#0f5cbf'/>
      </linearGradient>
    </defs>
    <rect width='420' height='280' rx='24' fill='url(#grad)'/>
    <g fill='none' stroke='#7ae0ff' stroke-width='10' stroke-linecap='round'>
      <path d='M40 200 Q140 160 210 200 T380 200'/>
      <path d='M120 90 h180' stroke-width='14' stroke='#b2f1ff'/>
    </g>
    <text x='210' y='155' font-size='48' font-family='Arial' fill='#e4f7ff' text-anchor='middle' font-weight='700'>${encoded}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const profileOptions = [
  { value: 'linear', label: 'Linear' },
  { value: 'chain', label: 'Chain (drop off)' },
  { value: 'reverse-chain', label: 'Reverse Chain' },
  { value: 'band', label: 'Band (exponential up)' },
  { value: 'reverse-band', label: 'Reverse Band' }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const computeMaxVelocity = (force) => {
  const safe = Math.max(force, 1);
  return Math.min(2.6775, 678.9 / safe);
};

const computeMultiplier = (profile, progress, intensity) => {
  const pct = intensity / 100;
  switch (profile) {
    case 'chain':
      return clamp(1 - pct * progress, 0.1, 2);
    case 'reverse-chain':
      return clamp(1 + pct * progress, 0.1, 2.5);
    case 'band': {
      const curve = (Math.exp(progress) - 1) / (Math.E - 1);
      return clamp(1 + pct * curve, 0.1, 3);
    }
    case 'reverse-band': {
      const curve = (Math.exp(progress) - 1) / (Math.E - 1);
      return clamp(1 - pct * curve, 0.1, 2);
    }
    case 'linear':
    default:
      return 1;
  }
};

function ResistanceDisplay({ side, value, target, onChange }) {
  const vmax = computeMaxVelocity(value);
  return (
    <div className="resistance-card">
      <div className="card-header">
        <span className="label">{side} Motor</span>
        <span className="sub">Target {target.toFixed(0)} lb</span>
      </div>
      <div className="resistance-value">{Math.round(value)} lb</div>
      <div className="sub">Max velocity {vmax.toFixed(2)} mph</div>
      <input
        type="range"
        min="0"
        max={MAX_RESISTANCE}
        step="1"
        value={target}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range-labels">
        <span>0 lb</span>
        <span>380 lb</span>
      </div>
    </div>
  );
}

function Header({ onShutdown, motorsReady, battery }) {
  return (
    <header className="header">
      <div className="brand">
        <img src="/dragon.svg" alt="Dragon" className="logo" />
        <div>
          <div className="title">Dragon Gym</div>
          <div className="subtitle">Smart Torque Control</div>
        </div>
      </div>
      <div className="status-pills">
        <div className={`pill ${motorsReady ? 'good' : 'warn'}`}>
          <span className="dot" />
          {motorsReady ? 'Motors Ready' : 'Standby'}
        </div>
        <div className="pill ghost">Battery {battery}%</div>
      </div>
      <button className="shutdown" onClick={onShutdown}>
        Shutdown
      </button>
    </header>
  );
}

function ForceProfileSelector({ title, value, intensity, onChangeProfile, onChangeIntensity }) {
  return (
    <div className="panel">
      <div className="panel-title">{title}</div>
      <select value={value} onChange={(e) => onChangeProfile(e.target.value)}>
        {profileOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label className="slider-label">Curve Intensity: {intensity}%</label>
      <input
        type="range"
        min="0"
        max="60"
        value={intensity}
        onChange={(e) => onChangeIntensity(Number(e.target.value))}
      />
    </div>
  );
}

function WorkoutLog({ log }) {
  return (
    <div className="panel log">
      <div className="panel-title">Workout Log</div>
      {log.length === 0 && <div className="muted">No sets logged yet.</div>}
      {log.map((entry, idx) => (
        <div key={`${entry.exercise}-${idx}`} className="log-row">
          <div>
            <div className="log-exercise">{entry.exercise}</div>
            <div className="muted">Set {entry.set} · {entry.timestamp}</div>
          </div>
          <div className="log-meta">
            <span>{entry.reps} reps</span>
            <span>{entry.weight} lb</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CableGraph({ history }) {
  const points = history.map((p, idx) => {
    const x = (idx / Math.max(1, history.length - 1)) * 100;
    const y = 100 - (p.length / MAX_CABLE_LENGTH) * 100;
    return `${x},${y}`;
  });
  const slope = history.length > 1
    ? (history[history.length - 1].length - history[history.length - 2].length).toFixed(2)
    : '0';
  const min = Math.min(...history.map((h) => h.length));
  const max = Math.max(...history.map((h) => h.length));
  const span = (max - min).toFixed(1);

  return (
    <div className="panel graph">
      <div className="panel-title">Cable Length • Slope {slope} in/tick • Range {span} in</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="graph-svg">
        <polyline points={points.join(' ')} fill="none" stroke="#40c8ff" strokeWidth="2" />
      </svg>
    </div>
  );
}

function App() {
  const [targetLeft, setTargetLeft] = useState(120);
  const [targetRight, setTargetRight] = useState(120);
  const [resistanceLeft, setResistanceLeft] = useState(0);
  const [resistanceRight, setResistanceRight] = useState(0);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [setActive, setSetActive] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [engagementMode, setEngagementMode] = useState(false);
  const [engagementLength, setEngagementLength] = useState(24);
  const [lengthTarget, setLengthTarget] = useState(24);
  const [cableLength, setCableLength] = useState(24);
  const [lengthHistory, setLengthHistory] = useState([{ time: Date.now(), length: 24 }]);
  const [movementDirection, setMovementDirection] = useState('idle');
  const [repCount, setRepCount] = useState(0);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);
  const [forceProfile, setForceProfile] = useState('linear');
  const [eccentricProfile, setEccentricProfile] = useState('linear');
  const [curveIntensity, setCurveIntensity] = useState(20);
  const [eccentricIntensity, setEccentricIntensity] = useState(20);
  const [battery] = useState(92);
  const [motorsReady, setMotorsReady] = useState(false);
  const [simulationTick, setSimulationTick] = useState(0);
  const prevLength = useRef(cableLength);
  const storedResistance = useRef({ left: targetLeft, right: targetRight });
  const setCounter = useRef(1);

  useEffect(() => {
    const readyTimeout = setTimeout(() => setMotorsReady(true), 500);
    return () => clearTimeout(readyTimeout);
  }, []);

  const exerciseImage = useMemo(() => makeExerciseImage(selectedExercise), [selectedExercise]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationTick((t) => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCableLength((prev) => {
      let target = lengthTarget;
      const now = Date.now();

      if (setActive) {
        const amplitude = Math.max(8, lengthTarget * 0.35);
        const oscillation = Math.sin(simulationTick / 6);
        target = engagementLength + amplitude * (0.5 + 0.5 * oscillation);
      }

      if (resetting) {
        target = engagementLength;
      }

      const difference = target - prev;
      const step = clamp(difference, -LENGTH_STEP, LENGTH_STEP);
      const next = clamp(prev + step, 0, MAX_CABLE_LENGTH);
      const direction = step > 0 ? 'up' : step < 0 ? 'down' : movementDirection;
      setMovementDirection(direction);

      setLengthHistory((hist) => {
        const updated = [...hist, { time: now, length: next }];
        return updated.slice(-160);
      });

      if (Math.abs(next - engagementLength) < 0.25 && resetting) {
        setResetting(false);
      }

      const wasUp = prevLength.current < prev;
      const nowDown = direction === 'down';
      if (wasUp && nowDown && setActive) {
        setRepCount((r) => r + 1);
      }
      prevLength.current = prev;

      return next;
    });
  }, [lengthTarget, simulationTick, setActive, resetting, engagementLength, movementDirection]);

  const effectiveMultiplier = useMemo(() => {
    const progress = clamp(cableLength / MAX_CABLE_LENGTH, 0, 1);
    const profile = movementDirection === 'down' ? eccentricProfile : forceProfile;
    const intensity = movementDirection === 'down' ? eccentricIntensity : curveIntensity;
    return computeMultiplier(profile, progress, intensity);
  }, [cableLength, forceProfile, eccentricProfile, curveIntensity, eccentricIntensity, movementDirection]);

  useEffect(() => {
    const interval = setInterval(() => {
      const baseLeft = workoutActive && !engagementMode ? targetLeft : 0;
      const baseRight = workoutActive && !engagementMode ? targetRight : 0;
      const goalLeft = clamp(baseLeft * effectiveMultiplier, 0, MAX_RESISTANCE);
      const goalRight = clamp(baseRight * effectiveMultiplier, 0, MAX_RESISTANCE);

      setResistanceLeft((prev) => {
        const delta = clamp(goalLeft - prev, -FORCE_STEP, FORCE_STEP);
        return Number((prev + delta).toFixed(1));
      });
      setResistanceRight((prev) => {
        const delta = clamp(goalRight - prev, -FORCE_STEP, FORCE_STEP);
        return Number((prev + delta).toFixed(1));
      });
    }, FORCE_INTERVAL);
    return () => clearInterval(interval);
  }, [targetLeft, targetRight, workoutActive, engagementMode, effectiveMultiplier]);

  const handleStartWorkout = () => {
    setWorkoutActive(true);
    setMotorsReady(true);
  };

  const handleStartSet = () => {
    if (!workoutActive) return;
    if (setActive) {
      const weight = Math.round((resistanceLeft + resistanceRight) / 2);
      const entry = {
        exercise: selectedExercise,
        set: setCounter.current++,
        reps: repCount,
        weight,
        timestamp: new Date().toLocaleTimeString()
      };
      setWorkoutLog((prev) => [entry, ...prev].slice(0, 12));
      setRepCount(0);
      setSetActive(false);
    } else {
      setSetActive(true);
    }
  };

  const handleReset = () => {
    setSetActive(false);
    setResetting(true);
    setLengthTarget(engagementLength);
  };

  const handleEngagement = () => {
    if (engagementMode) {
      setEngagementLength(cableLength);
      setLengthTarget(cableLength);
      setEngagementMode(false);
      setTargetLeft(storedResistance.current.left);
      setTargetRight(storedResistance.current.right);
    } else {
      storedResistance.current = { left: targetLeft, right: targetRight };
      setTargetLeft(0);
      setTargetRight(0);
      setEngagementMode(true);
    }
  };

  const handleShutdown = () => {
    setWorkoutActive(false);
    setSetActive(false);
    setResetting(false);
    setTargetLeft(0);
    setTargetRight(0);
  };

  const workoutButtons = (
    <div className="button-row">
      <button className="primary" onClick={handleStartWorkout}>
        Start Workout
      </button>
      <button className={workoutActive ? 'primary ghost' : 'primary disabled'} onClick={handleStartSet} disabled={!workoutActive}>
        {setActive ? 'End Set & Log' : 'Start Set'}
      </button>
      <button className="primary ghost" onClick={handleReset}>
        Reset (1 in/s)
      </button>
    </div>
  );

  return (
    <div className="app">
      <Header onShutdown={handleShutdown} motorsReady={motorsReady} battery={battery} />

      <main className="grid">
        <section className="resistance-grid">
          <ResistanceDisplay side="Left" value={resistanceLeft} target={targetLeft} onChange={setTargetLeft} />
          <ResistanceDisplay side="Right" value={resistanceRight} target={targetRight} onChange={setTargetRight} />
        </section>

        <section className="control-panel">
          <div className="panel">
            <div className="panel-title">Workout Selector</div>
            <div className="selector">
              <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
                {exercises.map((ex) => (
                  <option key={ex}>{ex}</option>
                ))}
              </select>
              <img src={exerciseImage} alt={selectedExercise} className="exercise-image" />
            </div>
          </div>

          {workoutButtons}

          <div className="panel trio">
            <div>
              <div className="panel-title">Engagement Length</div>
              <div className="value">{engagementLength.toFixed(1)} in</div>
              <button className="chip" onClick={handleEngagement}>
                {engagementMode ? 'Confirm Start Point' : 'Set Engagement Length'}
              </button>
            </div>
            <div>
              <div className="panel-title">Cable Length</div>
              <div className="value">{cableLength.toFixed(1)} in</div>
              <label className="slider-label">Adjust length (temp)</label>
              <input
                type="range"
                min="0"
                max={MAX_CABLE_LENGTH}
                step="0.1"
                value={lengthTarget}
                onChange={(e) => setLengthTarget(Number(e.target.value))}
                disabled={setActive}
              />
            </div>
            <div>
              <div className="panel-title">Repetitions</div>
              <div className="value">{repCount}</div>
              <div className="muted">Counts peaks during set</div>
            </div>
          </div>

          <ForceProfileSelector
            title="Force Curve Profile"
            value={forceProfile}
            intensity={curveIntensity}
            onChangeProfile={setForceProfile}
            onChangeIntensity={setCurveIntensity}
          />

          <ForceProfileSelector
            title="Eccentric Profile"
            value={eccentricProfile}
            intensity={eccentricIntensity}
            onChangeProfile={setEccentricProfile}
            onChangeIntensity={setEccentricIntensity}
          />
        </section>

        <section className="graph-panel">
          <CableGraph history={lengthHistory} />
          <WorkoutLog log={workoutLog} />
        </section>
      </main>
    </div>
  );
}

export default App;
