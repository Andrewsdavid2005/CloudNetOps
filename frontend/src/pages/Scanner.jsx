import React, { useState, useEffect } from 'react';
import DeviceTable from '../components/DeviceTable';
import { saveAs } from 'file-saver';

// Mock device generator
const generateMockDevice = (id) => ({
  id,
  ip: `192.168.1.${id}`,
  hostname: `device-${id}`,
  status: 'online',
  latency: (Math.random() * 100).toFixed(2),
});

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [devices, setDevices] = useState([]);

  // Simulate scan progress
  useEffect(() => {
    let timer;
    if (scanning && progress < 100) {
      timer = setInterval(() => {
        setProgress((prev) => {
          const next = Math.min(prev + 10, 100);
          // Add a new mock device each step
          if (next % 20 === 0) {
            setDevices((prevDevices) => [...prevDevices, generateMockDevice(prevDevices.length + 1)]);
          }
          if (next === 100) setScanning(false);
          return next;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [scanning, progress]);

  const startScan = () => {
    setDevices([]);
    setProgress(0);
    setScanning(true);
  };

  const exportCSV = () => {
    if (devices.length === 0) return;
    const headers = ['ID', 'IP', 'Hostname', 'Status', 'Latency'];
    const rows = devices.map((d) => [d.id, d.ip, d.hostname, d.status, d.latency]);
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'scan_results.csv');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Network Scanner</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={startScan}
          disabled={scanning}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>
        <div className="w-64 bg-gray-200 dark:bg-gray-700 h-4 rounded overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-width duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300">{progress}%</span>
      </div>

      {devices.length > 0 && (
        <div className="space-y-4">
          <DeviceTable devices={devices} readOnly />
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
