import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Scanner from './pages/Scanner';
import { isAuthenticated } from './utils/auth';

export default function App() {
  const [dark, setDark] = React.useState(() => localStorage.getItem('theme') === 'dark');

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const Protected = ({ children }) =>
    isAuthenticated() ? children : <Navigate to="/login" replace />;

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <Sidebar dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col">
          <Navbar dark={dark} setDark={setDark} />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/devices" element={<Protected><Devices /></Protected>} />
              {/* Add login/register routes elsewhere */}
                <Route path="/scanner" element={<Protected><Scanner /></Protected>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
