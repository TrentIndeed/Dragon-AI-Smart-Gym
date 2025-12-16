# Dragon Gym

A blue-themed touch-friendly React UI for the Dragon smart gym. It targets a vertical 1080×1920 display and provides motor resistance controls, live cable-length tracing, workout session tools, force/eccentric curve profiles, and an exercise log.

## Getting Started

```bash
npm install
npm run dev
```

The development server defaults to http://localhost:5173.

## Key Features
- Dual motor resistance sliders (0–500 lb) with velocity limits for the Delta ECM-B3M-E21315SS1 (1.79 mph @ 380 lb, 2.67 mph @ 254 lb, Vmax = min(2.6775, 678.9/force)).
- Engagement length workflow that disables load for repositioning before re-engaging resistance.
- Live cable-length graph with slope and range-of-motion summary plus temporary length slider until motors are connected.
- Workout controls (start workout, start set, reset/retract) with rep counter and session status indicators.
- Force Curve and Eccentric Profile selectors with intensity controls (linear, chain/reverse chain, band/reverse band patterns).
- Workout selector with reference imagery and a log that captures sets, reps, and weight after each reset.
