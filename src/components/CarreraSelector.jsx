import React, { useState } from 'react';
import './CarreraSelector.css';

const carreras = [
  'Administración',
  'Gestión de la Industria Automotríz',
  'Moldes, Matrices y Dispositivos',
  'Programación',
];

export default function CarreraSelector({ onSelect, isDarkMode }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (carrera) => {
    setSelected(carrera);
    if (onSelect) onSelect(carrera);
  };

  return (
    <div className={`carrera-selector${isDarkMode ? ' dark' : ''}`}>
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