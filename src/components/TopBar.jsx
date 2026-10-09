// components/TopBar.jsx - top bar header with project title and non-dismissible simulated data badge
import React from 'react';

export function TopBar() {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h1 className="brand-title">Boond</h1>
        <span className="brand-tagline">Leak detection, intermittent supply</span>
      </div>
      <div className="simulated-badge">
        Simulated data
      </div>
    </header>
  );
}
