import React, { useState } from 'react';
import './CarreraSelector.css';

const carreras = [
  'Ingeniería',
  'Medicina',
  'Derecho',
  'Arquitectura',
  'Psicología',
];

export default function CarreraSelector({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (carrera) => {
    setSelected(carrera);
    if (onSelect) onSelect(carrera);
  };

  return (
    <div className="carrera-selector">
      {carreras.map((carrera) => (
        <button
          key={carrera}
          className={`carrera-btn ${selected === carrera ? 'selected' : ''}`}
          onClick={() => handleSelect(carrera)}
        >
          {carrera}
        </button>
      ))}
    </div>
  );
}