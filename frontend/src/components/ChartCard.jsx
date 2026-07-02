import React from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * Reusable chart component.
 * Props:
 *   - type: 'bar' | 'line' | 'doughnut'
 *   - data: Chart.js data object
 *   - options: optional Chart.js options
 */
export default function ChartCard({ type, data, options }) {
  const chartProps = { data, options };
  return (
    <div className="glass p-4">
      {type === 'bar' && <Bar {...chartProps} />}
      {type === 'line' && <Line {...chartProps} />}
      {type === 'doughnut' && <Doughnut {...chartProps} />}
    </div>
  );
}
