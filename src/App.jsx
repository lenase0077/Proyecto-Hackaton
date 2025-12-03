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
  const [allEdgesCache, setAllEdgesCache] = useState([]); // Guardamos todas las conexiones originales de la carrera actual

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
    if (!node.data?.clickable) return;
    const matId = node.id;
    setAprobadas((prev) => {
      if (prev.includes(matId)) return prev.filter(id => id !== matId);
      return [...prev, matId];
    });
  }, []);

  const handleNodeMouseEnter = useCallback((event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);


  // --- RENDER ---
  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      
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
              <h1 style={{ margin: 0, fontSize: '1.2rem' }}>🎓 UTN Pathfinder</h1>
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
      
      {/* LEYENDA (Misma de antes) */}
      <div style={{
        position: 'absolute', bottom: '15px', left: '15px',
        background: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        padding: '10px 15px', borderRadius: '8px', display: 'flex', gap: '15px',
        fontSize: '0.8rem', color: isDarkMode ? '#f3f4f6' : '#1f2937',
        backdropFilter: 'blur(5px)', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isDarkMode ? '#064e3b' : '#dcfce7', border: `2px solid ${isDarkMode ? '#34d399' : '#16a34a'}` }}></div>
          <span>Aprobada</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isDarkMode ? '#1e293b' : '#fff', border: `2px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'}` }}></div>
          <span>Disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isDarkMode ? '#374151' : '#f3f4f6', border: `2px solid ${isDarkMode ? '#6b7280' : '#9ca3af'}` }}></div>
          <span>Bloqueada</span>
        </div>
      </div>
    </div>
  );
}