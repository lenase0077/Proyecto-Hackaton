// utils.js

// ============================================================
// CONSTANTES DE CONFIGURACIÓN (como #define en C++)
// ============================================================

// Ancho de cada caja de materia (en píxeles)
const NODE_WIDTH = 180;

// Espacio horizontal entre materias (en píxeles)
// Similar a definir grid spacing en un programa gráfico
const X_SPACING = 250;

// Espacio vertical entre materias (en píxeles)
const Y_SPACING = 150;

// ============================================================
// PALETA DE COLORES PARA LOS TEMAS CLARO/OSCURO
// Similar a definir structs con colores en C++
// ============================================================

const THEME = {
    // Tema claro (modo día)
    light: {
        aprobada: { 
            bg: '#dcfce7',     // Fondo verde claro
            border: '#16a34a', // Borde verde
            text: '#14532d'    // Texto verde oscuro
        },
        disponible: { 
            bg: '#fff',        // Fondo blanco
            border: '#3b82f6', // Borde azul
            text: '#1e293b'    // Texto gris oscuro
        },
        bloqueada: { 
            bg: '#f3f4f6',     // Fondo gris claro
            border: '#e5e7eb', // Borde gris
            text: '#9ca3af'    // Texto gris
        },
    },
    // Tema oscuro (modo noche)
    dark: {
        aprobada: { bg: '#064e3b', border: '#34d399', text: '#ecfdf5' },
        disponible: { bg: '#1e293b', border: '#60a5fa', text: '#f8fafc' },
        bloqueada: { bg: '#1f2937', border: '#374151', text: '#4b5563' },
        defaultText: '#eee'
    }
};

export const getLayoutElements = (materias) => {
    const nodes = [];
    const edges = [];
    
    // Validamos que materias sea un array, si no, devolvemos vacío
    if (!Array.isArray(materias)) return { nodes, edges };

    // ---------------------------------------------------------
    // PASO 1: AGRUPAR MATERIAS POR NIVEL
    // ---------------------------------------------------------
    const materiasPorNivel = {};

    materias.forEach(m => {
        // Si no tiene nivel, asumimos nivel 1 o usamos posY + 1 como fallback
        const nivel = m.nivel || (m.posY ? m.posY + 1 : 1);
        
        if (!materiasPorNivel[nivel]) {
            materiasPorNivel[nivel] = [];
        }
        materiasPorNivel[nivel].push(m);
    });

    // ---------------------------------------------------------
    // PASO 2: CREAR NODOS (POSICIONAMIENTO)
    // ---------------------------------------------------------
    Object.keys(materiasPorNivel).forEach(nivelStr => {
        const nivel = parseInt(nivelStr);
        const listaMaterias = materiasPorNivel[nivel];
        const COLUMNAS_MAX = 4; // Máximo de materias por fila visual

        listaMaterias.forEach((materia, index) => {
            // Cálculo de posición en grilla
            const filaRelativa = Math.floor(index / COLUMNAS_MAX);
            const colRelativa = index % COLUMNAS_MAX;
            
            const x = colRelativa * X_SPACING;
            // Separación vertical mayor entre niveles distintos
            const y = ((nivel - 1) * (Y_SPACING * 1.5)) + (filaRelativa * Y_SPACING);

            nodes.push({
                id: materia.id,
                data: { label: materia.nombre, originalData: materia, clickable: true },
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
                    transition: 'all 0.3s ease'
                },
                type: 'default',
            });

            // ---------------------------------------------------------
            // PASO 3: CREAR EDGES (CONEXIONES)
            // ---------------------------------------------------------
            
            // Edges Finales (Rojos)
            if (materia.requiere_para_final) {
                materia.requiere_para_final.forEach(reqId => {
                    edges.push({
                        id: `e-${reqId}-${materia.id}-final`,
                        source: reqId,
                        target: materia.id,
                        animated: false,
                        type: 'final', // Importante para el filtro
                        style: { stroke: '#ef4444', strokeWidth: 2 }
                    });
                });
            }

            // Edges Cursadas (Grises punteados)
            if (materia.requiere_para_cursar) {
                materia.requiere_para_cursar.forEach(reqId => {
                    // Solo agregamos la flecha de cursada si no existe ya una de final 
                    // (para no encimar flechas, opcional)
                    const tieneFinal = materia.requiere_para_final && materia.requiere_para_final.includes(reqId);
                    
                    if (!tieneFinal) {
                        edges.push({
                            id: `e-${reqId}-${materia.id}-cursada`,
                            source: reqId,
                            target: materia.id,
                            animated: true,
                            type: 'cursar', // Importante para el filtro
                            style: { stroke: '#9ca3af', strokeDasharray: '5,5' },
                        });
                    }
                });
            }
        });
    });

    return { nodes, edges };
};

// ---------------------------------------------------------
// FUNCIÓN DE ESTILOS
// ---------------------------------------------------------
export const updateNodeStyles = (nodes, edges, materiasAprobadasIds, isDarkMode = false) => {
    // Seleccionar la paleta de colores según el modo
    // Similar a: ColorPalette palette = isDarkMode ? darkTheme : lightTheme;
    const palette = isDarkMode ? THEME.dark : THEME.light;

    // Recorrer todos los nodos y actualizar sus estilos
    // Similar a: for (auto& node : nodes) { actualizarEstilo(node); }
    return nodes.map(node => {
        const mat = node.data.originalData;
        if (!mat) return node;

        const estaAprobada = materiasAprobadasIds.includes(mat.id);

        let newStyle = { ...node.style };
        let iconPrefix = "";
        let isClickable = false;
        let cssClass = "";

        // CASO 1: MATERIA APROBADA (color verde)
        if (estaAprobada) {
            // CASO 1: APROBADA
            newStyle.background = palette.aprobada.bg;
            newStyle.borderColor = palette.aprobada.border;
            newStyle.color = palette.aprobada.text;
            newStyle.fontWeight = 'bold';
            newStyle.cursor = 'pointer';
            iconPrefix = "✅ ";
            isClickable = true;
            cssClass = "node-approved";

        } else {
            // Verificamos correlativas de cursada
            const reqCursadas = mat.requiere_para_cursar || [];
            const tieneCursadas = reqCursadas.every(reqId => materiasAprobadasIds.includes(reqId));

            const reqFinales = mat.requiere_para_final || [];
            const tieneFinales = reqFinales.every(reqId => materiasAprobadasIds.includes(reqId));
            
            const correlativasCumplidas = tieneCursadas && tieneFinales;

            // CASO 2: MATERIA DISPONIBLE (color azul/blanco)
            if (correlativasCumplidas) {
                // CASO 2: DISPONIBLE
                newStyle.background = palette.disponible.bg;
                newStyle.borderColor = palette.disponible.border;
                newStyle.color = palette.disponible.text;
                newStyle.borderWidth = '2px';
                newStyle.cursor = 'pointer';
                iconPrefix = "";
                isClickable = true;
                cssClass = "node-available";

            } else {
                // CASO 3: BLOQUEADA
                newStyle.background = palette.bloqueada.bg;
                newStyle.borderColor = palette.bloqueada.border;
                newStyle.color = palette.bloqueada.text;
                newStyle.cursor = 'not-allowed';
                iconPrefix = "🔒 "; // Cambié la X por un candado, queda mejor visualmente
                isClickable = false;
                cssClass = "node-blocked";
            }
        }

        // Devolver el nodo actualizado
        return {
            ...node,
            className: cssClass,
            data: {
                ...node.data,
                label: `${iconPrefix}${mat.nombre}`,
                clickable: isClickable
            },
            style: newStyle  // Aplicar nuevos estilos
        };
    });
};

// Función auxiliar para filtrar (necesaria para que App.jsx no se rompa)
export const filterEdgesByMode = (edges, viewMode) => {
    if (viewMode === 'todas') return edges;
    if (viewMode === 'cursar') return edges.filter(e => e.type === 'cursar');
    if (viewMode === 'final') return edges.filter(e => e.type === 'final');
    // ... simplificada logic ...
    return edges;
};

// Función auxiliar para highlight (necesaria para que App.jsx no se rompa)
export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false) => {
    // 1. Si no hay mouse encima de nada, devolvemos todo normal (limpio)
    if (!hoveredNodeId) {
        return { 
            nodes: nodes.map(node => ({ 
                ...node, 
                className: '',        // Sin clases extra
                selected: false,
                style: { ...node.style, opacity: 1 } // Opacidad total
            })), 
            edges: edges.map(edge => ({ 
                ...edge, 
                className: '',
                animated: edge.type === 'cursar', // Restauramos animación de cursada
                style: { ...edge.style, opacity: 1, strokeWidth: edge.type === 'final' ? 2 : 1 }
            }))
        };
    }

    // 2. Si hay un nodo seleccionado, identificamos sus conexiones
    const connectedNodeIds = new Set();
    const connectedEdgeIds = new Set();

    edges.forEach(edge => {
        // Si el edge sale o entra al nodo seleccionado
        if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
            connectedEdgeIds.add(edge.id);
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        }
    });

    // 3. Aplicamos estilos a los NODOS
    const highlightedNodes = nodes.map(node => {
        // ¿Es el nodo donde está el mouse?
        const isHovered = node.id === hoveredNodeId;
        // ¿Es un vecino directo?
        const isNeighbor = connectedNodeIds.has(node.id);

        let newStyle = { ...node.style };
        let className = '';

        if (isHovered) {
            // Estilo para el nodo PRINCIPAL (Naranja/Dorado)
            newStyle.borderColor = '#f59e0b'; 
            newStyle.borderWidth = '3px';
            newStyle.boxShadow = '0 0 15px rgba(245, 158, 11, 0.5)';
            newStyle.zIndex = 2000; // Traer al frente
            newStyle.opacity = 1;
            className = 'selected-hover';

        } else if (isNeighbor) {
            // Estilo para los VECINOS (Azul brillante)
            newStyle.borderColor = isDarkMode ? '#60a5fa' : '#2563eb';
            newStyle.borderWidth = '2px';
            newStyle.boxShadow = isDarkMode ? '0 0 10px rgba(96, 165, 250, 0.3)' : '0 0 10px rgba(37, 99, 235, 0.3)';
            newStyle.opacity = 1;
            newStyle.zIndex = 1500;
            className = 'connected';

        } else {
            // Estilo para los NO RELACIONADOS (Opacos/Apagados)
            newStyle.opacity = 0.2; // Se vuelven casi invisibles
            newStyle.borderColor = isDarkMode ? '#374151' : '#e5e7eb';
            newStyle.zIndex = 1;
        }

        return {
            ...node,
            className,
            style: newStyle
        };
    });

    // 4. Aplicamos estilos a las CONEXIONES (Edges)
    const highlightedEdges = edges.map(edge => {
        // ¿Esta conexión sale o llega al nodo seleccionado?
        const isConnectedToHover = connectedEdgeIds.has(edge.id);

        return {
            ...edge,
            className: isConnectedToHover ? 'active' : 'inactive',
            animated: isConnectedToHover ? true : false, // Animamos si está activa
            style: {
                ...edge.style,
                // Si está conectada: Opaca y gruesa. Si no: muy transparente
                opacity: isConnectedToHover ? 1 : 0.05, 
                strokeWidth: isConnectedToHover ? 3 : 1,
                stroke: isConnectedToHover 
                    ? (edge.type === 'final' ? '#ef4444' : (isDarkMode ? '#fff' : '#000')) // Color resaltado
                    : edge.style.stroke, // Color original si está apagada
                zIndex: isConnectedToHover ? 2000 : 0
            }
        };
    });

    return { nodes: highlightedNodes, edges: highlightedEdges };
};