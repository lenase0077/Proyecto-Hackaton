import React from 'react';
import './CarreraSelector.css';

const CARRERAS_INFO = {
  'tup': { label: 'TUP - Programación', icon: '💻' },
  'admi': { label: 'TUA - Administración', icon: '📑' },
  'moldes': { label: 'TSMMYD - Moldes y Matrices', icon: '🔨' },
  'automotriz': { label: 'TSGIA - Automotriz', icon: '🚗' },
};

export default function CarreraSelector({ currentCarrera, onSelect }) {
  const careerKeys = Object.keys(CARRERAS_INFO);

  return (
    <div className="selector-wrapper">
      
      {/* =============================================
          VISTA MÓVIL: DROPDOWN (<select>)
          Solo visible en pantallas chicas
         ============================================= */}
      <div className="mobile-selector">
        <label htmlFor="carrera-select" className="mobile-label">Carrera:</label>
        <div className="select-container">
            <select 
              id="carrera-select"
              value={currentCarrera} 
              onChange={(e) => onSelect(e.target.value)}
              className="carrera-dropdown"
            >
              {careerKeys.map((key) => (
                <option key={key} value={key}>
                  {CARRERAS_INFO[key].icon} {CARRERAS_INFO[key].label}
                </option>
              ))}
            </select>
            {/* Flechita decorativa */}
            <span className="select-arrow">▼</span>
        </div>
      </div>

      {/* =============================================
          VISTA ESCRITORIO: BOTONES (Píldoras)
          Solo visible en pantallas grandes (> 768px)
         ============================================= */}
      <div className="desktop-selector">
        {careerKeys.map((key) => {
          const info = CARRERAS_INFO[key];
          const isSelected = currentCarrera === key;
          
          return (
            <button
              key={key}
              className={`carrera-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(key)}
            >
              <span className="carrera-icon">{info.icon}</span>
              <span>{info.label}</span>
              {isSelected && <div className="indicator-dot" />}
            </button>
          );
        })}
      </div>

    </div>
  );
}