// ============================================================
// SECCIÓN 1: IMPORTACIONES (como #include en C++)
// ============================================================

// Importamos las herramientas básicas de React
import React, { useState, useEffect, useCallback } from 'react';

// Importamos ReactFlow que es una biblioteca para hacer gráficos
import ReactFlow, {
  Controls,        // Botones de zoom y mover
  Background,      // Fondo con puntitos
  useNodesState,   // Maneja los nodos
  useEdgesState,   // Maneja las conexiones
} from 'reactflow';

// Importamos los estilos CSS de ReactFlow
import 'reactflow/dist/style.css';
import './App.css';

// IMPORTANTE: Importamos el JSON completo y el Selector
import dbMaterias from './data/materias.json'; 
import CarreraSelector from './components/CarreraSelector';

import { 
  getLayoutElements, 
  updateNodeStyles, 
  filterEdgesByMode,
  applyHighlightStyles 
} from './utils';

export default function App() {
  // --- ESTADO ---
  
  // Nuevo estado: Carrera seleccionada (por defecto TUP)
  const [selectedCarrera, setSelectedCarrera] = useState('tup');

  // React Flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Estado de la app
  const [aprobadas, setAprobadas] = useState(() => {
    const saved = localStorage.getItem('materiasAprobadas');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme === 'dark';
  });

  const [viewMode, setViewMode] = useState('todas');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [allEdgesCache, setAllEdgesCache] = useState([]); // Guardamos todas las conexiones originales de la carrera actual

  // Datos de los integrantes
  const teamMembers = [
    { name: "Durazzini Sebastian", linkedin: "https://www.linkedin.com/" },
    { name: "Martinez Alejo", linkedin: "https://www.linkedin.com/" },
    { name: "Raho Daniel", linkedin: "https://www.linkedin.com/" },
    { name: "Serrano Leandro", linkedin: "https://www.linkedin.com/" },
  ];

  // --- EFECTOS ---

  // 1. CARGA DE CARRERA (Similar a cargar un nivel en un juego)
  useEffect(() => {
    console.log("Cargando carrera:", selectedCarrera);
    
    // 1. Obtener los datos crudos del JSON para esa carrera
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    
    // 2. Procesar nodos y conexiones
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutElements(listaMaterias);

    // 3. Actualizar estado
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setAllEdgesCache(layoutEdges); // Guardamos copia de seguridad de las conexiones
    
    // 4. Resetear materias aprobadas al cambiar de carrera
    // (Opcional: podrías guardarlas en localStorage por carrera si quisieras)
    setViewMode('todas');
    
  }, [selectedCarrera, setNodes, setEdges]); // Se ejecuta cuando cambia selectedCarrera

  useEffect(() => {
  localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light');
}, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('materiasAprobadas', JSON.stringify(aprobadas));
  }, [aprobadas]);

  // 2. ACTUALIZAR ESTILOS (Aprobadas / Modo Oscuro)
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Calculamos estilos base (colores por estado)
    const styledNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode);
    
    // Aplicamos estilos de Hover (si hay un nodo seleccionado)
    const { nodes: finalNodes, edges: finalEdges } = applyHighlightStyles(
        styledNodes, 
        // Usamos las conexiones filtradas actuales o el cache
        hoveredNodeId ? edges : filterEdgesByMode(allEdgesCache, viewMode), 
        hoveredNodeId, 
        isDarkMode
    );

    // Solo actualizamos nodos para no causar loops infinitos con edges
    setNodes(prev => {
        // Truco para evitar re-renders si nada cambió visualmente seria comparar,
        // pero por simplicidad actualizamos
        return finalNodes;
    });

  }, [aprobadas, isDarkMode, hoveredNodeId, nodes.length]); // Dependencias

  // 3. FILTRADO DE CONEXIONES
  useEffect(() => {
      if (!hoveredNodeId) {
          const filtered = filterEdgesByMode(allEdgesCache, viewMode);
          setEdges(filtered);
      }
  }, [viewMode, allEdgesCache, hoveredNodeId, setEdges]);


  // --- HANDLERS ---

  const handleCarreraChange = (nuevaCarrera) => {
    setSelectedCarrera(nuevaCarrera);
  };

const onNodeClick = useCallback((event, node) => {
    // Si la materia está bloqueada o no es clickeable, salimos
    if (!node.data?.clickable) return;
    
    const matId = node.id;
    const yaEstabaAprobada = aprobadas.includes(matId);

    // --- LÓGICA DE ESTADO (Primero actualizamos la lista) ---
    // Usamos una variable temporal 'nuevasAprobadas' para poder verificar la victoria al instante
    let nuevasAprobadas;
    
    if (yaEstabaAprobada) {
        // Si ya estaba, la quitamos
        nuevasAprobadas = aprobadas.filter(id => id !== matId);
    } else {
        // Si no estaba, la agregamos
        nuevasAprobadas = [...aprobadas, matId];
        
        // --- EFECTO 1: POP (Siempre que aprobamos una materia individual) ---
        const audioPop = new Audio('/sounds/pop.mp3'); 
        audioPop.volume = 0.5; 
        audioPop.playbackRate = 0.8 + Math.random() * 0.4;
        audioPop.preservesPitch = false;

        audioPop.play().catch(e => console.error("Error audio pop:", e));
        
        // --- EFECTO 2: VICTORIA (Solo si completamos TODA la carrera) ---
        // 1. Obtenemos el total de materias de la carrera actual
        const totalMaterias = nodes.filter(n => n.type !== 'input').length; // Filtramos por si acaso
        // O más directo si tu JSON solo tiene materias:
        // const totalMaterias = nodes.length;

        // 2. Comparamos si ya tenemos todas
        if (nuevasAprobadas.length === totalMaterias) {
             console.log("¡CARRERA COMPLETADA!");
             
             // A. Música de Victoria
             const audioVictory = new Audio('/sounds/victory.mp3'); // Asegúrate que el nombre coincida
             audioVictory.volume = 0.6;
             audioVictory.play().catch(e => console.error("Error audio victory:", e));

             // B. Súper Confeti Espectacular (Explosión lateral)
             if (window.confetti) {
                // Disparamos confeti por 3 segundos
                const duration = 3000;
                const end = Date.now() + duration;

                (function frame() {
                  // Lanza confeti desde la izquierda y derecha
                  window.confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b']
                  });
                  window.confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b']
                  });

                  if (Date.now() < end) {
                    requestAnimationFrame(frame);
                  }
                }());
             }
        }
    }

    // Finalmente actualizamos el estado de React
    setAprobadas(nuevasAprobadas);

  }, [aprobadas, nodes]);

  const handleNodeMouseEnter = useCallback((event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // --- RENDER ---
  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} ${isFooterOpen ? 'footer-open' : ''}`}>
      
      {/* HEADER */}
      <div style={{
        padding: '10px 20px',
        background: isDarkMode ? '#1f2937' : '#3b82f6',
        color: 'white',
        display: 'flex',
        flexDirection: 'column', // Cambiado a columna para acomodar el selector
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                  <svg
                   className="utn-logo-svg" imageRendering="optimizeQuality" shapeRendering="geometricPrecision" textRendering="geometricPrecision" viewBox="0 0 595.3 699.4" xmlns="http://www.w3.org/2000/svg" height="45" fill="currentColor" style={{ minWidth: '30px' }}>
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
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '35px', height: '35px', borderRadius: '50%',
                  cursor: 'pointer', fontSize: '1rem'
                }}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '5px 10px', borderRadius: '6px', fontSize: '0.9rem'
              }}>
                <span>Aprobadas: <strong>{aprobadas.length}</strong></span>
              </div>
            </div>
        </div>

        {/* SELECTOR DE CARRERA INTEGRADO */}
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '5px' }}>
             <CarreraSelector 
                currentCarrera={selectedCarrera} 
                onSelect={handleCarreraChange} 
             />
        </div>
      </div>

      {/* CONTROLES DE VISTA */}
      <div style={{
        padding: '8px 15px',
        background: isDarkMode ? '#111827' : '#f1f5f9',
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#d1d5db' : '#4b5563' }}>
          Filtros:
        </span>
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

      {/* GRÁFICO */}
      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            fitView
            minZoom={0.1}
          >
            <Background color={isDarkMode ? "#4b5563" : "#cbd5e1"} gap={20} variant="dots"/>
            <Controls position="bottom-right" />
          </ReactFlow>
        ) : (
          <div style={{ 
             display: 'flex', flexDirection: 'column',
             justifyContent: 'center', alignItems: 'center', 
             height: '100%', color: isDarkMode ? '#fff' : '#000' 
          }}>
            <h3>No hay datos para esta carrera aún</h3>
            <p>Selecciona otra o agrega materias en el JSON.</p>
          </div>
        )}
      </div>
      
      {/* LEYENDA*/}
      <div className="legend-container">
        <div className="legend-item">
          <div className="legend-dot aprobada"></div>
          <span>Aprobada</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot disponible"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot bloqueada"></div>
          <span>Bloqueada</span>
        </div>
      </div>
      
      {/*========== INICIO DE FOOTER DESPLEGABLE==========*/}
      <footer className={`app-footer ${isFooterOpen ? 'open' : ''}`}>
        
        {/* BOTÓN PESTAÑA*/}
        <button 
          className="footer-toggle-btn"
          onClick={() => setIsFooterOpen(!isFooterOpen)}
        >
          <span style={{ 
            display: 'inline-block', 
            transform: isFooterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            marginRight: '5px'
          }}>▲</span>
          {isFooterOpen ? 'CERRAR' : 'CRÉDITOS'}
        </button>

        <div className="footer-container">
          
          {/* SECCIÓN IZQUIERDA*/}
          <div className="footer-brand">
            <h3>🎓 UTN Pathfinder</h3>
            <p>De los Dinamics Pointers para la UTN.</p>
            <p>Herramienta interactiva diseñada para planificar y visualizar el flujo de correlatividad de manera inteligente</p>
            <span className="copyright">© 2025 - Todos los derechos reservados - Hecho con ❤️ para la comunidad</span>
          </div>

          {/* SECCIÓN DERECHA*/}
          <div className="footer-team">
            <h4>Desarrollado por:</h4>
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <a 
                  key={index} 
                  href={member.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="team-link"
                >
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