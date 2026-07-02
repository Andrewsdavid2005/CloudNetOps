import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable statistic card for the dashboard.
 * Props:
 *  - title: string
 *  - value: number | string
 *  - icon: ReactNode (optional)
 */
export default function StatCard({ title, value, icon }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="glass p-4 flex items-center space-x-3 transition-shadow"
    >
      {icon && <div className="text-2xl opacity-80">{icon}</div>}
      <div>
        <p className="text-sm opacity-70">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </motion.div>
  );
}
