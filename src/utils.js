import materias from './data/materias.json';

const NODE_WIDTH = 180;
const X_SPACING = 250;
const Y_SPACING = 150;

const THEME = {
    light: {
        aprobada: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
        disponible: { bg: '#fff', border: '#3b82f6', text: '#1e293b' },
        bloqueada: { bg: '#f3f4f6', border: '#e5e7eb', text: '#9ca3af' },
    },
    dark: {
        aprobada: { bg: '#064e3b', border: '#34d399', text: '#ecfdf5' },
        disponible: { bg: '#1e293b', border: '#60a5fa', text: '#f8fafc' },
        bloqueada: { bg: '#1f2937', border: '#374151', text: '#4b5563' },
    }
};

// Función principal
export const getLayoutElements = () => {
    const nodes = [];
    const edges = [];
    const edgesIds = new Set();
    
    // Crear nodos
    materias.forEach((materia) => {
        const posX = materia.posX || 0;
        const posY = materia.posY || 0;
        
        const x = posX * X_SPACING;
        const y = posY * Y_SPACING;
        
        nodes.push({
            id: materia.id,
            data: { 
                label: materia.nombre, 
                originalData: materia, 
                clickable: true
            },
            position: { x, y },
            style: { 
                background: '#fff', 
                border: '1px solid #777', 
                borderRadius: '8px',
                width: NODE_WIDTH, 
                padding: '10px', 
                fontSize: '14px', 
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
            },
            type: 'default',
        });
    });

    // Crear conexiones
    materias.forEach((materia) => {
        // Líneas para final
        if (materia.requiere_para_final) {
            materia.requiere_para_final.forEach(reqId => {
                const edgeId = `final-${reqId}-${materia.id}`;
                if (!edgesIds.has(edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: reqId,
                        target: materia.id,
                        type: 'final',
                        style: { 
                            stroke: '#ef4444', 
                            strokeWidth: 3,
                        }
                    });
                    edgesIds.add(edgeId);
                }
            });
        }

        // Líneas para cursar
        if (materia.requiere_para_cursar) {
            materia.requiere_para_cursar.forEach(reqId => {
                const edgeId = `cursar-${reqId}-${materia.id}`;
                if (!edgesIds.has(edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: reqId,
                        target: materia.id,
                        animated: true,
                        type: 'cursar',
                        style: { 
                            stroke: '#9ca3af', 
                            strokeWidth: 2,
                            strokeDasharray: '5,5'
                        }
                    });
                    edgesIds.add(edgeId);
                }
            });
        }
    });
    
    return { nodes, edges };
};

// Filtrar edges
export const filterEdgesByMode = (edges, viewMode) => {
    if (viewMode === 'todas') return edges;
    if (viewMode === 'cursar') return edges.filter(e => e.type === 'cursar');
    if (viewMode === 'final') return edges.filter(e => e.type === 'final');
    if (viewMode === 'simplificada') {
        const uniqueEdges = [];
        const seenPairs = new Set();
        
        edges.forEach(edge => {
            const pairKey = `${edge.source}-${edge.target}`;
            if (!seenPairs.has(pairKey)) {
                seenPairs.add(pairKey);
                uniqueEdges.push({
                    ...edge,
                    id: `simple-${edge.source}-${edge.target}`,
                    style: { 
                        stroke: '#3b82f6',
                        strokeWidth: 2,
                        strokeDasharray: '0'
                    },
                    animated: false
                });
            }
        });
        return uniqueEdges;
    }
    return edges;
};

// Actualizar estilos
export const updateNodeStyles = (nodes, edges, materiasAprobadasIds, isDarkMode = false) => {
    const palette = isDarkMode ? THEME.dark : THEME.light;

    return nodes.map(node => {
        const mat = node.data?.originalData;
        if (!mat) return node;
        
        const estaAprobada = materiasAprobadasIds.includes(mat.id);
        let newStyle = { ...node.style };
        let isClickable = false;

        if (estaAprobada) {
            newStyle.background = palette.aprobada.bg; 
            newStyle.borderColor = palette.aprobada.border; 
            newStyle.color = palette.aprobada.text; 
            newStyle.fontWeight = 'bold';
            newStyle.cursor = 'pointer'; 
            isClickable = true; 
        } else {
            const correlativasCumplidas = mat.requiere_para_cursar?.every(reqId => 
                materiasAprobadasIds.includes(reqId)
            ) ?? true;

            if (correlativasCumplidas) {
                newStyle.background = palette.disponible.bg; 
                newStyle.borderColor = palette.disponible.border; 
                newStyle.color = palette.disponible.text;
                newStyle.borderWidth = '2px';
                newStyle.cursor = 'pointer'; 
                isClickable = true; 
            } else {
                newStyle.background = palette.bloqueada.bg; 
                newStyle.borderColor = palette.bloqueada.border; 
                newStyle.color = palette.bloqueada.text; 
                newStyle.cursor = 'not-allowed'; 
                isClickable = false; 
            }
        }

        return {
            ...node,
            data: { 
                ...node.data, 
                label: `${estaAprobada ? '✅ ' : ''}${mat.nombre}`,
                clickable: isClickable
            },
            style: newStyle
        };
    });
};

// NUEVA: Función para aplicar estilos de highlight a nodos y edges
export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false) => {
  if (!hoveredNodeId) {
    return { 
      nodes: nodes.map(node => ({ 
        ...node, 
        className: '',
        selected: false 
      })), 
      edges: edges.map(edge => ({ 
        ...edge, 
        className: '',
        animated: edge.type === 'cursar' // Mantener animación original
      }))
    };
  }

  // Encontrar el nodo hover
  const hoveredNode = nodes.find(n => n.id === hoveredNodeId);
  if (!hoveredNode) {
    return { nodes, edges };
  }

  // 1. Aplicar estilos a los NODOS
  const highlightedNodes = nodes.map(node => {
    const isHovered = node.id === hoveredNodeId;
    const isConnected = edges.some(edge => 
      edge.source === node.id && edge.target === hoveredNodeId ||
      edge.target === node.id && edge.source === hoveredNodeId
    );

    let className = '';
    if (isHovered) {
      className = 'selected-hover';
    } else if (isConnected) {
      className = 'connected';
    }

    return {
      ...node,
      className,
      selected: isHovered,
      style: {
        ...node.style,
        ...(isHovered && {
          borderColor: '#f59e0b',
          borderWidth: '3px',
          boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)'
        }),
        ...(isConnected && !isHovered && {
          borderColor: isDarkMode ? '#60a5fa' : '#3b82f6',
          borderWidth: '2px'
        })
      }
    };
  });

  // 2. Aplicar estilos a los EDGES
  const highlightedEdges = edges.map(edge => {
    const isConnectedToHover = 
      edge.source === hoveredNodeId || 
      edge.target === hoveredNodeId;

    return {
      ...edge,
      className: isConnectedToHover ? 'active' : 'inactive',
      style: {
        ...edge.style,
        ...(isConnectedToHover && {
          strokeWidth: edge.type === 'final' ? 4 : 3,
          opacity: 1
        }),
        ...(!isConnectedToHover && {
          opacity: 0.15
        })
      }
    };
  });

  return { nodes: highlightedNodes, edges: highlightedEdges };
};