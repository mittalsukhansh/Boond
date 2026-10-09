// components/Controls.jsx - size and sensor-count segmented controls
import React from 'react';
import { Segmented } from './Segmented.jsx';

export function Controls({
  size,
  onSizeChange,
  sensorCount,
  onSensorCountChange,
}) {
  const sizeOptions = [
    { label: 'small', value: 'small' },
    { label: 'medium', value: 'medium' },
    { label: 'large', value: 'large' },
  ];

  const sensorOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
  ];

  return (
    <section className="panel-section">
      <h2 className="section-heading">Leak to inject</h2>
      <Segmented
        label="Leak size"
        options={sizeOptions}
        value={size}
        onChange={onSizeChange}
      />
      <Segmented
        label="Sensors"
        options={sensorOptions}
        value={sensorCount}
        onChange={onSensorCountChange}
      />
    </section>
  );
}
