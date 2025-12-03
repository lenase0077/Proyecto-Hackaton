import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import './App.css';
import { getLayoutElements, updateNodeStyles, filterEdgesByMode } from './utils';

// Inicializar elementos del layout
const { nodes: initialNodes, edges: allEdges } = getLayoutElements();

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [aprobadas, setAprobadas] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('todas');
  
  // NUEVO: Estado para nodo hover
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // 1. Inicializar
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(filterEdgesByMode(allEdges, 'todas'));
  }, []);

  // 2. Actualizar estilos
  useEffect(() => {
    if (nodes.length === 0) return;
    const updatedNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode);
    setNodes(updatedNodes);
  }, [aprobadas, isDarkMode, nodes.length]);

  // 3. Cambiar modo de vista
  useEffect(() => {
    const filteredEdges = filterEdgesByMode(allEdges, viewMode);
    setEdges(filteredEdges);
  }, [viewMode]);

  // NUEVA: Función para manejar hover sobre nodos
  const handleNodeMouseEnter = useCallback((event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // NUEVA: Filtrar edges para mostrar (con highlight)
  const getFilteredEdges = useCallback(() => {
    if (!hoveredNodeId) return edges;
    
    // Filtrar edges que están conectados al nodo hover
    return edges.filter(edge => 
      edge.source === hoveredNodeId || edge.target === hoveredNodeId
    );
  }, [edges, hoveredNodeId]);

  const onNodeClick = useCallback((event, node) => {
    if (!node.data?.clickable) return;
    
    const matId = node.id;
    setAprobadas((prev) => {
      if (prev.includes(matId)) {
        return prev.filter(id => id !== matId);
      } else {
        return [...prev, matId];
      }
    });
  }, []);

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* HEADER */}
      <div style={{
        padding: '10px 20px',
        background: isDarkMode ? '#1f2937' : '#3b82f6',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>🎓 UTN Pathfinder</h1>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
            {hoveredNodeId ? 'Mostrando conexiones de la materia seleccionada' : 'Visualiza tu carrera'}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '0.9rem'
          }}>
            <span>Aprobadas: <strong>{aprobadas.length}</strong></span>
          </div>
        </div>
      </div>

      {/* CONTROLES DE VISTA */}
      <div style={{
        padding: '8px 15px',
        background: isDarkMode ? '#111827' : '#f1f5f9',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: '0.9rem',
          color: isDarkMode ? '#d1d5db' : '#4b5563',
          marginRight: '5px'
        }}>
          Mostrar:
        </span>
        
        {['todas', 'cursar', 'final', 'simplificada'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '5px 12px',
              borderRadius: '15px',
              border: 'none',
              background: viewMode === mode 
                ? (mode === 'final' ? '#ef4444' : mode === 'simplificada' ? '#10b981' : '#3b82f6')
                : (isDarkMode ? '#374151' : '#e2e8f0'),
              color: viewMode === mode ? 'white' : (isDarkMode ? '#9ca3af' : '#64748b'),
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            {mode === 'todas' ? 'Todas' : 
             mode === 'cursar' ? 'Para Cursar' : 
             mode === 'final' ? 'Para Final' : 
             'Simplificada'}
          </button>
        ))}
        
        {/* Indicador de modo hover */}
        {hoveredNodeId && (
          <button
            onClick={() => setHoveredNodeId(null)}
            style={{
              marginLeft: 'auto',
              padding: '5px 12px',
              borderRadius: '15px',
              border: 'none',
              background: '#f59e0b',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>✕</span>
            Mostrar todas
          </button>
        )}
      </div>

      {/* GRÁFO */}
      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={hoveredNodeId ? getFilteredEdges() : edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            fitView
            minZoom={0.2}
            elementsSelectable={true}
          >
            <Background 
              color={isDarkMode ? "#4b5563" : "#cbd5e1"} 
              gap={20} 
              variant="dots"
            />
            <Controls position="bottom-right" />
          </ReactFlow>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: isDarkMode ? '#fff' : '#000'
          }}>
            Cargando...
          </div>
        )}
      </div>

      {/* LEYENDA */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '15px',
        background: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        padding: '10px 15px',
        borderRadius: '8px',
        display: 'flex',
        gap: '15px',
        fontSize: '0.8rem',
        color: isDarkMode ? '#f3f4f6' : '#1f2937',
        backdropFilter: 'blur(5px)',
        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: isDarkMode ? '#064e3b' : '#dcfce7',
            border: `2px solid ${isDarkMode ? '#34d399' : '#16a34a'}`
          }}></div>
          <span>Aprobada</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: isDarkMode ? '#1e293b' : '#fff',
            border: `2px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'}`
          }}></div>
          <span>Disponible</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: isDarkMode ? '#374151' : '#f3f4f6',
            border: `2px solid ${isDarkMode ? '#6b7280' : '#9ca3af'}`
          }}></div>
          <span>Bloqueada</span>
        </div>
        
        {/* NUEVO: Indicador de modo hover */}
        {hoveredNodeId && (
          <div style={{ 
            marginLeft: '10px',
            paddingLeft: '15px',
            borderLeft: `2px solid ${isDarkMode ? '#f59e0b' : '#f59e0b'}`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              color: isDarkMode ? '#f59e0b' : '#d97706'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isDarkMode ? '#f59e0b' : '#fbbf24',
                border: `2px solid ${isDarkMode ? '#f59e0b' : '#d97706'}`
              }}></div>
              <span>Materia seleccionada</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}