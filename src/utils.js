import materias from './data/materias.json';

const NODE_WIDTH = 180;
const X_SPACING = 250;
const Y_SPACING = 150;

// --- PALETA DE COLORES ---
const THEME = {
    light: {
        aprobada: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
        disponible: { bg: '#fff', border: '#3b82f6', text: '#1e293b' },
        bloqueada: { bg: '#f3f4f6', border: '#e5e7eb', text: '#9ca3af' },
        defaultText: '#333'
    },
    dark: {
        aprobada: { bg: '#064e3b', border: '#34d399', text: '#ecfdf5' }, // Verde oscuro fondo, texto claro
        disponible: { bg: '#1e293b', border: '#60a5fa', text: '#f8fafc' }, // Azul oscuro fondo, texto blanco
        bloqueada: { bg: '#1f2937', border: '#374151', text: '#4b5563' }, // Gris muy oscuro
        defaultText: '#eee'
    }
};

export const getLayoutElements = () => {
  // ... (Esta parte de getLayoutElements NO CAMBIA, déjala igual que antes)
  // Solo copio el inicio para contexto, pero mantén la lógica de posiciones igual.
  const nodes = [];
  const edges = [];
  const materiasPorNivel = {};
  
  // ... (Mantén tu lógica de forEach y calculo de X, Y aquí) ...
  // COPIA PEGA TU FUNCIÓN getLayoutElements ANTERIOR AQUÍ COMPLETA
  // (Para ahorrar espacio en el chat, asumo que mantienes la lógica de posiciones)
  
  materias.forEach(m => {
    if (!materiasPorNivel[m.nivel]) materiasPorNivel[m.nivel] = [];
    materiasPorNivel[m.nivel].push(m);
  });

  Object.keys(materiasPorNivel).forEach(nivelStr => {
    const nivel = parseInt(nivelStr);
    const listaMaterias = materiasPorNivel[nivel];
    const COLUMNAS_MAX = 4;

    listaMaterias.forEach((materia, index) => {
      const filaRelativa = Math.floor(index / COLUMNAS_MAX);
      const colRelativa = index % COLUMNAS_MAX;
      const x = colRelativa * X_SPACING;
      const y = ((nivel - 1) * (Y_SPACING * 2.5)) + (filaRelativa * Y_SPACING);

      nodes.push({
        id: materia.id,
        data: { label: materia.nombre, originalData: materia, clickable: true },
        position: { x, y },
        style: { 
            background: '#fff', border: '1px solid #777', borderRadius: '8px',
            width: NODE_WIDTH, padding: '10px', fontSize: '14px', textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', transition: 'all 0.3s ease'
        },
        type: 'default',
      });

      materia.requiere_para_final.forEach(reqId => {
        edges.push({
          id: `e-${reqId}-${materia.id}-final`, source: reqId, target: materia.id,
          animated: false, style: { stroke: '#ef4444', strokeWidth: 2 }, label: '' 
        });
      });

      materia.requiere_para_cursar.forEach(reqId => {
        if (!materia.requiere_para_final.includes(reqId)) {
            edges.push({
                id: `e-${reqId}-${materia.id}-cursada`, source: reqId, target: materia.id,
                animated: true, style: { stroke: '#9ca3af', strokeDasharray: '5,5' },
            });
        }
      });
    });
  });

  return { nodes, edges };
};

// --- MODIFICAMOS ESTA FUNCIÓN ---
// Ahora recibe isDarkMode (default false)
export const updateNodeStyles = (nodes, edges, materiasAprobadasIds, isDarkMode = false) => {
    
    // Seleccionamos la paleta
    const palette = isDarkMode ? THEME.dark : THEME.light;

    return nodes.map(node => {
        const mat = node.data.originalData;
        const estaAprobada = materiasAprobadasIds.includes(mat.id);

        let newStyle = { ...node.style };
        let iconPrefix = ""; 
        let isClickable = false; 

        if (estaAprobada) {
            // CASO 1: APROBADA
            newStyle.background = palette.aprobada.bg; 
            newStyle.borderColor = palette.aprobada.border; 
            newStyle.color = palette.aprobada.text; 
            newStyle.fontWeight = 'bold';
            newStyle.cursor = 'pointer'; 
            iconPrefix = "✅ "; 
            isClickable = true; 
            
        } else {
            const correlativasCumplidas = mat.requiere_para_cursar.every(reqId => 
                materiasAprobadasIds.includes(reqId)
            );

            if (correlativasCumplidas) {
                // CASO 2: DISPONIBLE
                newStyle.background = palette.disponible.bg; 
                newStyle.borderColor = palette.disponible.border; 
                newStyle.color = palette.disponible.text;
                newStyle.borderWidth = '2px';
                newStyle.cursor = 'pointer'; 
                iconPrefix = ""; 
                isClickable = true; 
                
            } else {
                // CASO 3: BLOQUEADA
                newStyle.background = palette.bloqueada.bg; 
                newStyle.borderColor = palette.bloqueada.border; 
                newStyle.color = palette.bloqueada.text; 
                newStyle.cursor = 'not-allowed'; 
                iconPrefix = "❌ ";
                isClickable = false; 
            }
        }

        return {
            ...node,
            data: { 
                ...node.data, 
                label: `${iconPrefix}${mat.nombre}`,
                clickable: isClickable
            },
            style: newStyle
        };
    });
};