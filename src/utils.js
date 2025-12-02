import materias from './data/materias.json';

// Configuración visual
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const X_SPACING = 250;
const Y_SPACING = 150;

/**
 * Transforma el JSON de materias en Nodos y Edges para React Flow
 */
export const getLayoutElements = () => {
  const nodes = [];
  const edges = [];

  // Agrupamos materias por nivel para calcular posiciones Y
  // En tu JSON, el nivel 1 y 2 tienen muchas materias, así que vamos a hacer
  // una grilla inteligente.
  
  const materiasPorNivel = {};
  materias.forEach(m => {
    if (!materiasPorNivel[m.nivel]) materiasPorNivel[m.nivel] = [];
    materiasPorNivel[m.nivel].push(m);
  });

  // Crear Nodos
  Object.keys(materiasPorNivel).forEach(nivelStr => {
    const nivel = parseInt(nivelStr);
    const listaMaterias = materiasPorNivel[nivel];
    
    // Para que no queden todas en una fila kilométrica, hacemos filas de a 4
    const COLUMNAS_MAX = 4;

    listaMaterias.forEach((materia, index) => {
      // Calculamos fila y columna relativa dentro del nivel
      const filaRelativa = Math.floor(index / COLUMNAS_MAX);
      const colRelativa = index % COLUMNAS_MAX;

      // Posición final
      // X: Separación base + columna * espacio
      const x = colRelativa * X_SPACING;
      // Y: (Nivel * espacio grande) + (fila relativa * espacio chico)
      const y = ((nivel - 1) * (Y_SPACING * 3)) + (filaRelativa * Y_SPACING);

      nodes.push({
        id: materia.id,
        data: { 
            label: materia.nombre,
            // Guardamos info extra para saber si está aprobada o no
            estado: 'pendiente', // 'pendiente', 'aprobada', 'habilitada'
            originalData: materia
        },
        position: { x, y },
        style: { 
            background: '#fff', 
            border: '1px solid #777', 
            borderRadius: '8px',
            width: NODE_WIDTH,
            padding: '10px',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        },
        type: 'default', // default tiene inputs y outputs
      });

      // Crear Edges (Conexiones)
      // 1. Líneas sólidas para "Requiere Final" (Bloqueante fuerte)
      materia.requiere_para_final.forEach(reqId => {
        edges.push({
          id: `e-${reqId}-${materia.id}-final`,
          source: reqId,
          target: materia.id,
          animated: false,
          style: { stroke: '#ff0000', strokeWidth: 2 }, // Rojo para finales
          label: 'Final'
        });
      });

      // 2. Líneas punteadas para "Requiere Cursada"
      materia.requiere_para_cursar.forEach(reqId => {
        // Evitamos duplicar si ya existe la de final (que es más fuerte)
        if (!materia.requiere_para_final.includes(reqId)) {
            edges.push({
                id: `e-${reqId}-${materia.id}-cursada`,
                source: reqId,
                target: materia.id,
                animated: true,
                style: { stroke: '#555', strokeDasharray: '5,5' },
            });
        }
      });
    });
  });

  return { nodes, edges };
};

// Función para recalcular colores según estado
export const updateNodeStyles = (nodes, edges, materiasAprobadasIds) => {
    return nodes.map(node => {
        const mat = node.data.originalData;
        const estaAprobada = materiasAprobadasIds.includes(mat.id);

        let newStyle = { ...node.style };
        let iconPrefix = ""; // El icono que agregaremos al texto

        if (estaAprobada) {
            // CASO 1: APROBADA (Tick Verde)
            newStyle.background = '#dcfce7'; // Verde pastel
            newStyle.borderColor = '#16a34a'; // Borde verde fuerte
            newStyle.color = '#14532d'; // Texto verde oscuro
            newStyle.fontWeight = 'bold';
            iconPrefix = "✅ "; 
            
        } else {
            // Verificar correlativas
            // Simplificación: Asumimos que para cursar necesitas tener aprobadas las anteriores
            // En la vida real chequearías "regularizadas", pero para la hackatón sirve esto.
            const correlativasCumplidas = mat.requiere_para_cursar.every(reqId => 
                materiasAprobadasIds.includes(reqId)
            );

            if (correlativasCumplidas) {
                // CASO 2: DISPONIBLE / PENDIENTE (Limpio, sin icono)
                newStyle.background = '#fff'; // Blanco limpio
                newStyle.borderColor = '#3b82f6'; // Borde azul invitando a interactuar
                newStyle.color = '#1e293b';
                newStyle.borderWidth = '2px'; // Un poco más grueso para destacar
                iconPrefix = ""; // Limpio
                
            } else {
                // CASO 3: BLOQUEADA (Cruz Roja)
                newStyle.background = '#f3f4f6'; // Gris apagado
                newStyle.borderColor = '#e5e7eb'; // Borde gris suave
                newStyle.color = '#9ca3af'; // Texto gris (deshabilitado)
                iconPrefix = "❌ ";
            }
        }

        return {
            ...node,
            data: { 
                ...node.data, 
                // Concatenamos el icono al nombre de la materia
                label: `${iconPrefix}${mat.nombre}` 
            },
            style: newStyle
        };
    });
};