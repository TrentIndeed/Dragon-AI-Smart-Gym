import { useEffect, useMemo, useRef, useState } from 'react';
import squat from './assets/images/squat.svg';
import row from './assets/images/row.svg';
import press from './assets/images/press.svg';

const exercises = [
  { id: 'squat', name: 'Back Squat', image: squat },
  { id: 'row', name: 'Seated Row', image: row },
  { id: 'press', name: 'Chest Press', image: press },
];

const curveProfiles = [
  { id: 'linear', label: 'Linear', description: 'Even resistance through the whole stroke.' },
  { id: 'chain', label: 'Chain', description: 'Decrease load up to 20% as you rise.' },
  { id: 'reverse-chain', label: 'Reverse Chain', description: 'Increase load up to 20% as you rise.' },
  { id: 'band', label: 'Band', description: 'Exponential increase toward lockout.' },
  { id: 'reverse-band', label: 'Reverse Band', description: 'Logarithmic easing toward lockout.' },
];

const formatVelocity = (force) => {
  const safeForce = Math.min(Math.max(force, 1), 380);
  const velocity = Math.min(2.6775, 678.9 / safeForce);
  return velocity.toFixed(2);
};

const initialGraphPoints = (length) =>
  Array.from({ length: 24 }, (_, idx) => ({
    time: Date.now() - (23 - idx) * 400,
    length,
  }));

function App() {
  const [leftResistance, setLeftResistance] = useState(160);
  const [rightResistance, setRightResistance] = useState(160);
  const [motorsReady, setMotorsReady] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(94);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isSetActive, setIsSetActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [targetLength, setTargetLength] = useState(42);
  const [displayLength, setDisplayLength] = useState(42);
  const [graphData, setGraphData] = useState(() => initialGraphPoints(42));
  const [selectedExercise, setSelectedExercise] = useState(exercises[0].id);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [forceCurve, setForceCurve] = useState({ type: 'linear', intensity: 20 });
  const [eccentricCurve, setEccentricCurve] = useState({ type: 'linear', intensity: 20 });
  const [engagementMode, setEngagementMode] = useState(false);
  const [engagementLength, setEngagementLength] = useState(42);
  const savedResistance = useRef({ left: leftResistance, right: rightResistance });
  const repTracking = useRef({ topReached: false });

  useEffect(() => {
    const id = setInterval(() => {
      setDisplayLength((prev) => {
        const delta = targetLength - prev;
        const step = Math.max(-3, Math.min(3, delta / 1.5));
        const next = Math.abs(delta) < 0.3 ? targetLength : parseFloat((prev + step).toFixed(2));

        setGraphData((points) => {
          const nextPoint = { time: Date.now(), length: Math.max(0, next) };
          return [...points.slice(-23), nextPoint];
        });

        return next;
      });
    }, 400);

    return () => clearInterval(id);
  }, [targetLength]);

  useEffect(() => {
    if (!isSetActive || graphData.length < 2) return;
    const lastLength = graphData[graphData.length - 1].length;

    if (!repTracking.current.topReached && lastLength > engagementLength + 6) {
      repTracking.current.topReached = true;
    }

    if (repTracking.current.topReached && lastLength < engagementLength + 2) {
      setRepCount((value) => value + 1);
      repTracking.current.topReached = false;
    }
  }, [graphData, isSetActive, engagementLength]);

  const slope = useMemo(() => {
    if (graphData.length < 2) return 0;
    const [previous, last] = graphData.slice(-2);
    const seconds = (last.time - previous.time) / 1000;
    return seconds ? ((last.length - previous.length) / seconds).toFixed(2) : 0;
  }, [graphData]);

  const distanceTraveled = useMemo(
    () =>
      graphData.reduce((sum, point, index) => {
        if (index === 0) return 0;
        return sum + Math.abs(point.length - graphData[index - 1].length);
      }, 0),
    [graphData],
  );

  const handleShutdown = () => {
    setLeftResistance(0);
    setRightResistance(0);
    setIsWorkoutActive(false);
    setIsSetActive(false);
    setMotorsReady(false);
  };

  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setMotorsReady(true);
  };

  const handleStartSet = () => {
    setIsSetActive(true);
    setRepCount(0);
    repTracking.current.topReached = false;
  };

  const handleReset = () => {
    setIsSetActive(false);
    repTracking.current.topReached = false;
    setTargetLength((prev) => Math.max(0, prev - 10));
  };

  const toggleEngagement = () => {
    if (!engagementMode) {
      savedResistance.current = { left: leftResistance, right: rightResistance };
      setLeftResistance(0);
      setRightResistance(0);
      setEngagementMode(true);
    } else {
      setEngagementLength(displayLength);
      setEngagementMode(false);
      setLeftResistance(savedResistance.current.left);
      setRightResistance(savedResistance.current.right);
    }
  };

  const addLogEntry = () => {
    const exercise = exercises.find((item) => item.id === selectedExercise);
    const averageLoad = Math.round((leftResistance + rightResistance) / 2);
    const nextSetNumber = workoutLog.filter((entry) => entry.exercise === exercise.name).length + 1;
    const entry = {
      id: crypto.randomUUID(),
      exercise: exercise.name,
      set: nextSetNumber,
      reps: repCount || Math.max(1, Math.round(distanceTraveled / 10)),
      weight: averageLoad,
    };
    setWorkoutLog((log) => [entry, ...log]);
    setRepCount(0);
  };

  const effectiveLoadNote = (type, intensity) => {
    switch (type) {
      case 'chain':
        return `Load eases down to ${(100 - intensity).toFixed(0)}% near the top.`;
      case 'reverse-chain':
        return `Load climbs up to ${(100 + intensity).toFixed(0)}% near the top.`;
      case 'band':
        return `Exponential rise to ${(100 + intensity).toFixed(0)}% at lockout.`;
      case 'reverse-band':
        return `Logarithmic drop to ${(100 - intensity).toFixed(0)}% at lockout.`;
      default:
        return 'Stable load throughout the movement.';
    }
  };

  const motorVelocityLeft = formatVelocity(leftResistance);
  const motorVelocityRight = formatVelocity(rightResistance);

  const selectedExerciseData = exercises.find((item) => item.id === selectedExercise);

  return (
    <div className="app">
      <header className="header">
        <div className="logo-group">
          <img src="/dragon.svg" alt="Dragon logo" className="logo" />
          <div>
            <p className="eyebrow">Motors ready: {motorsReady ? 'Yes' : 'No'}</p>
            <h1>Dragon Gym</h1>
          </div>
        </div>
        <div className="header-controls">
          <button className="ghost">Battery {batteryLevel}%</button>
          <button className="secondary" onClick={() => setBatteryLevel((b) => Math.max(0, b - 1))}>
            Refresh
          </button>
          <button className="danger" onClick={handleShutdown}>
            Shutdown Resistance
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="card emphasis">
          <div className="card-header">
            <div>
              <p className="eyebrow">Motor output</p>
              <h2>Resistance Control</h2>
            </div>
            <span className={`pill ${engagementMode ? 'pill-warning' : ''}`}>
              {engagementMode ? 'Engagement length mode' : `Engagement: ${engagementLength.toFixed(1)} in`}
            </span>
          </div>
          <div className="resistance-grid">
            <div className="resistance-column">
              <div className="resistance-value">{leftResistance} lb</div>
              <p className="eyebrow">Left motor</p>
              <input
                type="range"
                min="0"
                max="500"
                value={leftResistance}
                onChange={(e) => setLeftResistance(Number(e.target.value))}
              />
              <p className="hint">Max velocity: {motorVelocityLeft} mph</p>
            </div>
            <div className="resistance-column">
              <div className="resistance-value">{rightResistance} lb</div>
              <p className="eyebrow">Right motor</p>
              <input
                type="range"
                min="0"
                max="500"
                value={rightResistance}
                onChange={(e) => setRightResistance(Number(e.target.value))}
              />
              <p className="hint">Max velocity: {motorVelocityRight} mph</p>
            </div>
          </div>
          <div className="engagement">
            <button className={engagementMode ? 'secondary' : 'primary'} onClick={toggleEngagement}>
              {engagementMode ? 'Lock Engagement Length' : 'Set Engagement Length'}
            </button>
            <p className="hint">
              Turns off resistance so you can set cable slack. Tap again to lock at {engagementLength.toFixed(1)} in.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Workout status</p>
              <h2>Session Controls</h2>
            </div>
            <span className="pill">{isWorkoutActive ? 'Active' : 'Idle'}</span>
          </div>
          <div className="button-row">
            <button className="primary" onClick={handleStartWorkout}>
              Start Workout
            </button>
            <button className="secondary" onClick={handleStartSet}>
              Start Set
            </button>
            <button onClick={handleReset}>Reset</button>
          </div>
          <div className="status-grid">
            <div>
              <p className="eyebrow">Repetitions</p>
              <h3>{repCount}</h3>
            </div>
            <div>
              <p className="eyebrow">Cable length</p>
              <h3>{displayLength.toFixed(1)} in</h3>
            </div>
            <div>
              <p className="eyebrow">Distance this set</p>
              <h3>{distanceTraveled.toFixed(1)} in</h3>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Live telemetry</p>
              <h2>Cable Length Graph</h2>
            </div>
            <span className="pill">Slope {slope} in/s</span>
          </div>
          <div className="graph-panel">
            <svg className="graph" viewBox="0 0 360 200" role="img" aria-label="Cable length graph">
              <polyline
                fill="none"
                stroke="#8ad5ff"
                strokeWidth="4"
                points={graphData
                  .map((point, index) => {
                    const x = (index / Math.max(graphData.length - 1, 1)) * 360;
                    const lengths = graphData.map((item) => item.length);
                    const min = Math.min(...lengths, 0);
                    const max = Math.max(...lengths, 80);
                    const scale = max === min ? 0 : (point.length - min) / (max - min);
                    const y = 190 - scale * 180;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
            <div className="graph-meta">
              <p className="eyebrow">Temporary cable control</p>
              <input
                type="range"
                min="0"
                max="120"
                value={targetLength}
                onChange={(e) => setTargetLength(Number(e.target.value))}
              />
              <p className="hint">Drag to simulate cable position until real motors are connected.</p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Force curve</p>
              <h2>Concentric Profile</h2>
            </div>
            <span className="pill">Intensity {forceCurve.intensity}%</span>
          </div>
          <div className="profile-grid">
            <select
              value={forceCurve.type}
              onChange={(e) => setForceCurve((curve) => ({ ...curve, type: e.target.value }))}
            >
              {curveProfiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
            <label className="slider-label">
              Curve intensity ({forceCurve.intensity}%)
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={forceCurve.intensity}
                onChange={(e) => setForceCurve((curve) => ({ ...curve, intensity: Number(e.target.value) }))}
              />
            </label>
          </div>
          <p className="hint">{effectiveLoadNote(forceCurve.type, forceCurve.intensity)}</p>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Eccentric profile</p>
              <h2>Way Down</h2>
            </div>
            <span className="pill">Intensity {eccentricCurve.intensity}%</span>
          </div>
          <div className="profile-grid">
            <select
              value={eccentricCurve.type}
              onChange={(e) => setEccentricCurve((curve) => ({ ...curve, type: e.target.value }))}
            >
              {curveProfiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
            <label className="slider-label">
              Eccentric intensity ({eccentricCurve.intensity}%)
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={eccentricCurve.intensity}
                onChange={(e) =>
                  setEccentricCurve((curve) => ({ ...curve, intensity: Number(e.target.value) }))
                }
              />
            </label>
          </div>
          <p className="hint">{effectiveLoadNote(eccentricCurve.type, eccentricCurve.intensity)}</p>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Workout selector</p>
              <h2>Exercise Library</h2>
            </div>
            <span className="pill">Image preview</span>
          </div>
          <div className="exercise-panel">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="exercise-select"
            >
              {exercises.map((exercise) => (
                <option value={exercise.id} key={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <div className="exercise-card">
              <img src={selectedExerciseData.image} alt={selectedExerciseData.name} />
              <div>
                <p className="eyebrow">Selected exercise</p>
                <h3>{selectedExerciseData.name}</h3>
                <p className="hint">Swap movements to keep the session fresh.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card full">
          <div className="card-header">
            <div>
              <p className="eyebrow">Workout log</p>
              <h2>Sets & Reps</h2>
            </div>
            <button className="primary" onClick={addLogEntry}>
              Save Set
            </button>
          </div>
          <div className="log-grid">
            <div className="log-meta">
              <p className="hint">
                After each set, tap Save Set to capture exercise, rep count, and average resistance. Entries include the
                set number for each movement automatically.
              </p>
              <div className="status-grid compact">
                <div>
                  <p className="eyebrow">Current exercise</p>
                  <h4>{selectedExerciseData.name}</h4>
                </div>
                <div>
                  <p className="eyebrow">Reps detected</p>
                  <h4>{repCount}</h4>
                </div>
                <div>
                  <p className="eyebrow">Avg resistance</p>
                  <h4>{Math.round((leftResistance + rightResistance) / 2)} lb</h4>
                </div>
              </div>
            </div>
            <div className="log-list">
              {workoutLog.length === 0 ? (
                <p className="hint">Your completed sets will appear here.</p>
              ) : (
                workoutLog.map((entry) => (
                  <div className="log-row" key={entry.id}>
                    <div>
                      <p className="eyebrow">{entry.exercise}</p>
                      <h4>Set {entry.set}</h4>
                    </div>
                    <div className="log-details">
                      <span>{entry.reps} reps</span>
                      <span>{entry.weight} lb</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
