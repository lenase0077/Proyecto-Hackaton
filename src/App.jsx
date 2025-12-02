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
import CarreraSelector from './components/CarreraSelector';

// Inicializamos layout
const { nodes: initialNodes, edges: initialEdges } = getLayoutElements();

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Estado para guardar las materias que el usuario aprobó (IDs)
  const [aprobadas, setAprobadas] = useState([]);

  // Selector de carrera
  const [carrera, setCarrera] = useState('programacion');
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null);

  const handleCarreraChange = (e) => {
    setCarrera(e.target.value);
    // Aquí podrías actualizar los nodos/edges según la carrera elegida
  };

  // Efecto inicial para pintar los nodos correctos al cargar
  useEffect(() => {
    const updatedNodes = updateNodeStyles(nodes, edges, aprobadas);
    setNodes(updatedNodes);
  }, [aprobadas]); // Se ejecuta cada vez que cambia 'aprobadas'

  // Manejador de clic en nodo
  const onNodeClick = useCallback((event, node) => {
    const matId = node.id;
    
    setAprobadas((prev) => {
      // Si ya estaba, la sacamos. Si no, la agregamos.
      if (prev.includes(matId)) {
        return prev.filter(id => id !== matId);
      } else {
        return [...prev, matId];
      }
    });
  }, []);

  return (
    <div className="app-container">
      {/* HEADER TIPO WEB */}
      <header className="main-header">
        <div className="header-content">
          <h1>🎓 UTN Pathfinder</h1>
          <p>Hackea tu carrera. Visualiza tu camino.</p>
        </div>
        <div className="stats-card">
            <span>Aprobadas: <strong>{aprobadas.length}</strong></span>
        </div>
      </header>

      {/* Nueva sección para mostrar la carrera seleccionada */}
      <div>
        <h2>Selecciona tu carrera</h2>
        <CarreraSelector onSelect={setCarreraSeleccionada} />
        {carreraSeleccionada && (
          <div style={{ marginTop: '2rem', fontSize: '1.2rem' }}>
            Has seleccionado: <strong>{carreraSeleccionada}</strong>
          </div>
        )}
      </div>

      {/* ÁREA DEL GRAFO */}
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick} // ¡La magia del clic!
          fitView
          minZoom={0.2}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
      
      {/* INSTRUCCIONES FLOTANTES */}
      <div className="instructions">
        <div className="leyenda-item"><span className="dot verde"></span> Aprobada</div>
        <div className="leyenda-item"><span className="dot amarillo"></span> Disponible</div>
        <div className="leyenda-item"><span className="dot gris"></span> Bloqueada</div>
      </div>
    </div>
  );
}
