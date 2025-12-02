import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import './App.css';
import { getLayoutElements, updateNodeStyles } from './utils';

const { nodes: initialNodes, edges: initialEdges } = getLayoutElements();

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const [aprobadas, setAprobadas] = useState([]);
  
  // 1. NUEVO ESTADO PARA MODO OSCURO
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 2. Pasamos isDarkMode a la función de estilos
  useEffect(() => {
    const updatedNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode);
    setNodes(updatedNodes);
  }, [aprobadas, isDarkMode]); // Se ejecuta cuando cambian aprobadas O el modo

  const onNodeClick = useCallback((event, node) => {
    if (!node.data.clickable) return;
    
    const matId = node.id;
    setAprobadas((prev) => {
      if (prev.includes(matId)) {
        return prev.filter(id => id !== matId);
      } else {
        return [...prev, matId];
      }
    });
  }, []);

  // Función para alternar modo
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    // 3. Agregamos clase dinámica al contenedor
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="main-header">
        <div className="header-content">
          <h1>🎓 UTN Pathfinder</h1>
          <p>Hackea tu carrera. Visualiza tu camino.</p>
        </div>
        
        <div className="header-actions">
           {/* 4. Botón Toggle */}
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? '😎' : '🌚'}
          </button>
          
          <div className="stats-card">
              <span>Aprobadas: <strong>{aprobadas.length}</strong></span>
          </div>
        </div>
      </header>

      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick} 
          fitView
          minZoom={0.2}
        >
          {/* 5. Cambiamos el color de los puntitos del fondo según el modo */}
          <Background color={isDarkMode ? "#555" : "#aaa"} gap={16} />
          <Controls />
        </ReactFlow>
      </div>
      
      <div className={`instructions ${isDarkMode ? 'dark' : ''}`}>
        <div className="leyenda-item"><span className="dot verde"></span> Aprobada</div>
        <div className="leyenda-item"><span className="dot amarillo"></span> Disponible</div>
        <div className="leyenda-item"><span className="dot gris"></span> Bloqueada</div>
      </div>
    </div>
  );
}