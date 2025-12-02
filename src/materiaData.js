
export const initialNodes = [
  {
    id: '1',
    type: 'input', // Input porque es la primera, no tiene anteriores
    data: { label: 'Análisis Matemático I' },
    position: { x: 250, y: 0 },
    style: { background: '#fff', border: '1px solid #777', width: 180 }
  },
  {
    id: '2',
    data: { label: 'Álgebra y Geometría' },
    position: { x: 50, y: 0 },
    style: { background: '#fff', border: '1px solid #777', width: 180 }
  },
  {
    id: '3',
    data: { label: 'Física I' },
    position: { x: 250, y: 150 }, // Más abajo porque es correlativa
    style: { background: '#eee', border: '1px solid #777', width: 180 } // Gris porque está bloqueada
  },
];

// Definimos las ARISTAS (Las Conexiones/Correlativas)
export const initialEdges = [
  { id: 'e1-3', source: '1', target: '3', animated: true }, // De Análisis I a Física I
];