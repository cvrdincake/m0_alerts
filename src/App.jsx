import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import StreamAlertBox from './components/StreamAlertBox.jsx';
import AlertBoxDisplay from './components/AlertBoxDisplay.jsx';

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 font-semibold transition-colors ${
    isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-300 hover:text-white hover:bg-purple-600/20'
  }`;

const DashboardShell = () => (
  <div className="flex min-h-screen flex-col bg-slate-950 text-white">
    <header className="border-b border-purple-500/20 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-lg font-bold tracking-tight text-white">M0 AlertBox</p>
          <p className="text-xs text-slate-400">Stream alert control center</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <a
            className="rounded-lg px-4 py-2 font-semibold text-slate-300 transition-colors hover:text-white hover:bg-purple-600/20"
            href="/overlay?test=true"
            target="_blank"
            rel="noreferrer"
          >
            Open Overlay
          </a>
        </nav>
      </div>
    </header>
    <main className="flex-1 overflow-auto">
      <Outlet />
    </main>
  </div>
);

const OverlayPage = () => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const { style } = document.body;
    const previousBackground = style.backgroundColor;
    const previousOverflow = style.overflow;

    style.backgroundColor = 'transparent';
    style.overflow = 'hidden';

    return () => {
      style.backgroundColor = previousBackground;
      style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent text-white">
      <AlertBoxDisplay />
    </div>
  );
};

const App = () => (
  <Routes>
    <Route element={<DashboardShell />}>
      <Route index element={<StreamAlertBox />} />
    </Route>
    <Route path="overlay" element={<OverlayPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
