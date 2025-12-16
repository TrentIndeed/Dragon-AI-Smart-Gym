# Dragon Gym

A portrait-oriented React UI for controlling the Dragon AI smart gym motors. The dashboard focuses on touch-friendly weight control, cable length management, live telemetry, and programmable force curves for both concentric and eccentric phases.

## Key Features
- Giant left/right motor resistance displays with rate-limited weight changes and sliders (0–380 lb) tuned for touch.
- Force curve and eccentric profiles (linear, chain/reverse chain, band/reverse band) with adjustable intensity that apply to live resistance.
- Engagement length workflow to safely position cables before re-engaging torque.
- Workout controls for starting workouts/sets, automatic rep counting, and reset behavior that retracts at 1 in/s.
- Real-time cable-length graph, current length readout, and temporary manual cable-length slider until motors are connected.
- Workout selector with exercise imagery and automatic logging after each set.
- Sporty black/blue styling sized for a 1080×1920 touch display.

## Development
1. Install dependencies
   ```bash
   npm install
   ```
2. Run the dev server
   ```bash
   npm run dev
   ```
3. Build for production
   ```bash
   npm run build
   ```
4. Lint the project
   ```bash
   npm run lint
   ```

The dev server binds to `0.0.0.0` by default via `vite.config.js`.
