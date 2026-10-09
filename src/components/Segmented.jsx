// components/Segmented.jsx - segmented control button group
import React from 'react';

export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="control-group">
      {label && <div className="control-label">{label}</div>}
      <div className="segmented-bar" role="group" aria-label={label}>
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          const isActive = String(value) === String(optValue);

          return (
            <button
              key={String(optValue)}
              type="button"
              className={`segmented-item ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onChange(optValue)}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
