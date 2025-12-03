import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import dbMaterias from './data/materias.json'; 
import CarreraSelector from './components/CarreraSelector';

import { 
  getLayoutElements, 
  updateNodeStyles, 
  filterEdgesByMode,
  applyHighlightStyles 
} from './utils';

export default function App() {
  const [selectedCarrera, setSelectedCarrera] = useState('tup');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [aprobadas, setAprobadas] = useState(() => {
    const saved = localStorage.getItem('materiasAprobadas');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('appTheme') === 'dark';
  });

  // ESTADO DISLEXIA
  const [isDyslexic, setIsDyslexic] = useState(() => {
    return localStorage.getItem('dyslexicMode') === 'true';
  });

  //ESTADO DALTONISMO
  const [isColorblind, setIsColorblind] = useState(() => {
    return localStorage.getItem('colorblindMode') === 'true';
  });
  
  // Guardar preferencias
  useEffect(() => { localStorage.setItem('dyslexicMode', isDyslexic); }, [isDyslexic]);
  useEffect(() => { localStorage.setItem('colorblindMode', isColorblind); }, [isColorblind]);
  useEffect(() => { localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('materiasAprobadas', JSON.stringify(aprobadas)); }, [aprobadas]);

  const [viewMode, setViewMode] = useState('todas');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [allEdgesCache, setAllEdgesCache] = useState([]);

  const teamMembers = [
    { name: "Durazzini Sebastian", linkedin: "https://www.linkedin.com/" },
    { name: "Martinez Alejo", linkedin: "https://www.linkedin.com/" },
    { name: "Raho Daniel", linkedin: "https://www.linkedin.com/" },
    { name: "Serrano Leandro", linkedin: "https://www.linkedin.com/" },
  ];

  useEffect(() => {
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutElements(listaMaterias);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setAllEdgesCache(layoutEdges);
    setViewMode('todas');
  }, [selectedCarrera, setNodes, setEdges]);

  // Actualización de Estilos (Ahora incluye isColorblind)
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Le pasamos isColorblind a la función de estilos
    const styledNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode, isColorblind);
    
    const { nodes: finalNodes, edges: finalEdges } = applyHighlightStyles(
        styledNodes,
        filterEdgesByMode(allEdgesCache, viewMode),
        hoveredNodeId,
        isDarkMode,
        viewMode
    );

    setNodes(finalNodes);
    setEdges(finalEdges);

  }, [aprobadas, isDarkMode, isColorblind, hoveredNodeId, nodes.length]); // Agregamos isColorblind a dependencias

  useEffect(() => {
      if (!hoveredNodeId) {
          const filtered = filterEdgesByMode(allEdgesCache, viewMode);
          setEdges(filtered);
      }
  }, [viewMode, allEdgesCache, hoveredNodeId, setEdges]);

  const handleCarreraChange = (nuevaCarrera) => setSelectedCarrera(nuevaCarrera);

  const onNodeClick = useCallback((event, node) => {
    if (!node.data?.clickable) return;
    const matId = node.id;
    let nuevasAprobadas;
    if (aprobadas.includes(matId)) {
        nuevasAprobadas = aprobadas.filter(id => id !== matId);
    } else {
        nuevasAprobadas = [...aprobadas, matId];
        new Audio('/sounds/pop.mp3').play().catch(() => {});
        const totalMaterias = nodes.filter(n => n.type !== 'input').length;
        if (nuevasAprobadas.length === totalMaterias) {
             new Audio('/sounds/victory.mp3').play().catch(() => {});
             if (window.confetti) window.confetti();
        }
    }
    setAprobadas(nuevasAprobadas);
  }, [aprobadas, nodes]);

  return (
    // Agregamos la clase colorblind-mode si está activo
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} ${isFooterOpen ? 'footer-open' : ''} ${isDyslexic ? 'dyslexic-mode' : ''} ${isColorblind ? 'colorblind-mode' : ''}`}>
      
      {/* HEADER */}
      <div style={{
        padding: '10px 20px',
        background: isDarkMode ? '#1f2937' : '#3b82f6',
        color: 'white',
        display: 'flex', flexDirection: 'column', gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                  <svg className="utn-logo-svg" viewBox="0 0 595.3 699.4" height="45" fill="currentColor" style={{ minWidth: '30px' }}>
                      <path clipRule="evenodd" d="M246.6 0h102v190.8C429.4 168.4 489 94.1 489 6.4h106.3c0 146.5-106.8 268.9-246.6 293.2v4.4h233.9v104.2H368.2c130 31.8 227 149.5 227 289.1H489c0-87.7-59.6-162-140.3-184.4v186.5h-102V512.9c-80.7 22.4-140.3 96.7-140.3 184.4H0C0 557.7 97 440 227 408.2H12.8V304h233.9v-4.4C106.8 275.3 0 152.9 0 6.4h106.3c0 87.7 59.6 162 140.3 184.4z" fillRule="evenodd"/>
                  </svg>
                  <h1 style={{ margin: 0, fontSize: '1.3rem', lineHeight: 1 }}>UTN Pathfinder</h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                Hackea tu carrera. Visualiza tu camino
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  width: '35px', height: '35px', borderRadius: '50%',
                  cursor: 'pointer', fontSize: '1.1rem'
                }}
                title="Modo Oscuro"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '0.9rem'
                  }}>
                    <span>Aprobadas: <strong>{aprobadas.length}</strong></span>
                  </div>

                  {/* CONTENEDOR DE BOTONES ACCESIBILIDAD */}
                  <div style={{ display: 'flex', gap: '5px' }}>
                      {/* Botón Dislexia */}
                      <button
                        onClick={() => setIsDyslexic(!isDyslexic)}
                        style={{
                           background: isDyslexic ? '#f59e0b' : 'transparent',
                           border: '1px solid rgba(255,255,255,0.4)', color: 'white',
                           borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem',
                           cursor: 'pointer', fontWeight: 'bold'
                        }}
                        title="Fuente para dislexia"
                      >
                        {isDyslexic ? '👁️ Dislexia ON' : '👁️ Dislexia'}
                      </button>

                      {/* NUEVO: Botón Daltonismo */}
                      <button
                        onClick={() => setIsColorblind(!isColorblind)}
                        style={{
                           background: isColorblind ? '#f59e0b' : 'transparent',
                           border: '1px solid rgba(255,255,255,0.4)', color: 'white',
                           borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem',
                           cursor: 'pointer', fontWeight: 'bold'
                        }}
                        title="Modo alto contraste para daltonismo"
                      >
                        {isColorblind ? '🎨 Daltónico ON' : '🎨 Daltónico'}
                      </button>
                  </div>

              </div>
            </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '5px' }}>
             <CarreraSelector currentCarrera={selectedCarrera} onSelect={handleCarreraChange} />
        </div>
      </div>

      <div style={{
        padding: '8px 15px',
        background: isDarkMode ? '#111827' : '#f1f5f9',
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#d1d5db' : '#4b5563' }}>Filtros:</span>
        {['todas', 'cursar', 'final', 'simplificada'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '5px 12px', borderRadius: '15px', border: 'none',
              background: viewMode === mode 
                ? (mode === 'final' ? '#ef4444' : mode === 'simplificada' ? '#10b981' : '#3b82f6')
                : (isDarkMode ? '#374151' : '#e2e8f0'),
              color: viewMode === mode ? 'white' : (isDarkMode ? '#9ca3af' : '#64748b'),
              cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={(e, n) => setHoveredNodeId(n.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            fitView minZoom={0.1}
          >
            <Background color={isDarkMode ? "#4b5563" : "#cbd5e1"} gap={20} variant="dots"/>
            <Controls position="bottom-right" />
          </ReactFlow>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: isDarkMode ? '#fff' : '#000' }}>
            <h3>No hay datos para esta carrera aún</h3>
            <p>Selecciona otra o agrega materias en el JSON.</p>
          </div>
        )}
      </div>
      
      {/* LEYENDA (se adapta con CSS al modo daltónico) */}
      <div className="legend-container">
        <div className="legend-item"><div className="legend-dot aprobada"></div><span>Aprobada</span></div>
        <div className="legend-item"><div className="legend-dot disponible"></div><span>Disponible</span></div>
        <div className="legend-item"><div className="legend-dot bloqueada"></div><span>Bloqueada</span></div>
      </div>
      
      <footer className={`app-footer ${isFooterOpen ? 'open' : ''}`}>
        <button className="footer-toggle-btn" onClick={() => setIsFooterOpen(!isFooterOpen)}>
          <span style={{ display: 'inline-block', transform: isFooterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', marginRight: '5px' }}>▲</span>
          {isFooterOpen ? 'CERRAR' : 'CRÉDITOS'}
        </button>

        <div className="footer-container">
          <div className="footer-brand">
            <h3>🎓 UTN Pathfinder</h3>
            <p>De los Dinamics Pointers para la UTN.</p>
            <p>Herramienta interactiva diseñada para planificar y visualizar el flujo de correlatividad de manera inteligente</p>
            <span className="copyright">© 2025 - Todos los derechos reservados - Hecho con ❤️ para la comunidad</span>
          </div>

          <div className="footer-team">
            <h4>Desarrollado por:</h4>
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <a key={index} href={member.linkedin} target="_blank" rel="noopener noreferrer" className="team-link">
                  {member.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}