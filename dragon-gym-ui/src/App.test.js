import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Dragon Gym header', () => {
  render(<App />);
  const heading = screen.getByText(/Dragon Gym/i);
  expect(heading).toBeInTheDocument();
});
