import React from 'react';
import './CarreraSelector.css';

// Diccionario de IDs vs Nombres Bonitos + Iconos
const CARRERAS_INFO = {
  'tup': { label: 'TUP - Programación', icon: '💻' },
  'mecanica': { label: 'Ing. Mecánica', icon: '⚙️' },
  'civil': { label: 'Ing. Civil', icon: '🏗️' },
  'automotriz': { label: 'Ind. Automotriz', icon: '🚗' },
  'electrica': { label: 'Ing. Eléctrica', icon: '⚡' }
};

export default function CarreraSelector({ currentCarrera, onSelect }) {
  const careerKeys = Object.keys(CARRERAS_INFO);

  return (
    <div className="carrera-selector">
      {careerKeys.map((key) => {
        const info = CARRERAS_INFO[key];
        const isSelected = currentCarrera === key;
        
        return (
          <button
            key={key}
            className={`carrera-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(key)}
          >
            <span style={{ fontSize: '1.2em' }}>{info.icon}</span>
            <span>{info.label}</span>
            
            {/* Pequeño punto indicador si está seleccionado (opcional) */}
            {isSelected && (
              <div style={{
                width: '6px', 
                height: '6px', 
                background: 'currentColor', 
                borderRadius: '50%',
                marginLeft: '4px'
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}