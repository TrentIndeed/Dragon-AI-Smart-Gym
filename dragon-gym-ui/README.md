# Dragon AI Smart Gym

Dragon Gym is a touchscreen-friendly React interface for a dual-motor smart cable trainer. It highlights live resistance for each motor, adapts weight with custom force and eccentric profiles, and visualizes cable length in real time for vertical 1080x1920 displays.

## Getting started

```bash
cd dragon-gym-ui
npm install
npm start
```

## Key features
- Giant left/right motor readouts with ramped resistance (10 lb every 0.25s) up to 380 lb.
- Touch-ready sliders for weight, force curve intensity, eccentric control, and temporary cable length.
- Real-time cable-length line chart with slope and range readouts plus rep counting during sets.
- Engagement-length workflow that disables resistance while the start point is set, then re-engages smoothly.
- Workout controls for starting workouts/sets, retracting at 1 in/s, and logging completed sets by exercise.
- Workout selector with exercise imagery for quick reference.
