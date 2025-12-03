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
    
    // Si recibes un string JSON, intentar parsearlo
    try {
        if (typeof materias === 'string') materias = JSON.parse(materias);
    } catch (e) {
        console.error('getLayoutElements: error parseando JSON de materias', e);
        return { nodes, edges };
    }

    // Validamos que materias sea un array, si no, devolvemos vacío
    if (!Array.isArray(materias)) {
        console.warn('getLayoutElements: se esperaba un array de materias');
        return { nodes, edges };
    }

    // ---------------------------------------------------------
    // PASO 1: AGRUPAR MATERIAS POR NIVEL
    // ---------------------------------------------------------
    const materiasPorNivel = {};

    materias.forEach(m => {
        // Si no tiene nivel, asumimos nivel 1 o usamos posY + 1 como fallback
        const nivel = m.nivel || (m.posY ? m.posY + 1 : 1);
        // <-- QUITAR LA REDECLARACIÓN QUE BORRABA EL OBJETO
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
        
        // 1. Usaremos un máximo de 4 columnas para el diseño actual.
        const COLUMNAS_MAX = 20; // Máximo de materias por fila visual

        // --- CÁLCULO DE CENTRADO HORIZONTAL (Añadido) ---
        // Calcula cuántas columnas realmente usará la primera fila del nivel
        const numColumnasNivel = Math.min(listaMaterias.length, COLUMNAS_MAX);
        
        // 1. Calcular el ancho total del grupo que se mostrará en la primera línea.
        const ANCHO_GRUPO = (numColumnasNivel - 1) * X_SPACING;
        
        // 2. Calcular el desplazamiento X necesario para centrar.
        // Usamos 800px como punto de referencia.
        const offsetX = (800 - ANCHO_GRUPO) / 2;
        const START_X = Math.max(0, offsetX);
            

            listaMaterias.forEach((materia, index) => {
            // Cálculo de posición en grilla
            const filaRelativa = Math.floor(index / COLUMNAS_MAX);
            const colRelativa = index % COLUMNAS_MAX;
            
            // 1. Posición X: Usa el desplazamiento calculado para centrar.
            const x = START_X + (colRelativa * X_SPACING);
            
        // 2. Posición Y: AUMENTAR el factor de 1.5 a 2.5 para separar los niveles.
        // Esto es la clave para resolver el solapamiento.
        const y = ((nivel - 1) * (Y_SPACING * 2.5)) + (filaRelativa * Y_SPACING);

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
export const filterEdgesByMode = (edges, viewMode = 'todas') => {
    if (!Array.isArray(edges)) return [];

    if (viewMode === 'todas') return edges;
    if (viewMode === 'cursar') return edges.filter(e => e.type === 'cursar');
    if (viewMode === 'final') return edges.filter(e => e.type === 'final');

    // si viewMode es un set/array de tipos permitidos
    if (Array.isArray(viewMode)) return edges.filter(e => viewMode.includes(e.type));
    return edges;
};

// Función auxiliar para highlight (resalta nodo y sus conexiones según filtro de modo)
// utils.js

export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false, viewMode = 'todas') => {
    const allNodes = Array.isArray(nodes) ? nodes : [];
    const allEdges = Array.isArray(edges) ? edges : [];

    const edgeIdOf = (edge) => edge.id || `${edge.source}->${edge.target}`;

    // 1. SIN HOVER: Restauramos todo a la normalidad
    if (!hoveredNodeId) {
        const visibleEdges = filterEdgesByMode(allEdges, viewMode);
        return {
            nodes: allNodes.map(n => ({ 
                ...n, 
                className: '', 
                style: { ...n.style, opacity: 1 } 
            })),
            edges: allEdges.map(edge => {
                const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === edgeIdOf(edge));
                return {
                    ...edge,
                    className: '', // Sin clases extra
                    hidden: !isVisible,
                    animated: isVisible && edge.type === 'cursar',
                    style: {
                        ...edge.style,
                        opacity: 1,
                        strokeWidth: edge.type === 'final' ? 2 : 1,
                        stroke: edge.type === 'final' ? '#ef4444' : '#9ca3af'
                    }
                };
            })
        };
    }

    // 2. CON HOVER: Calculamos conexiones
    const visibleEdges = filterEdgesByMode(allEdges, viewMode);
    const connectedEdgeIds = new Set();
    const connectedNodeIds = new Set([hoveredNodeId]);

    visibleEdges.forEach(edge => {
        const eid = edgeIdOf(edge);
        if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
            connectedEdgeIds.add(eid);
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        }
    });

    // 3. Estilos de NODOS
    const highlightedNodes = allNodes.map(node => {
        const isHovered = node.id === hoveredNodeId;
        const isNeighbor = connectedNodeIds.has(node.id);
        let newStyle = { ...node.style };
        let className = '';

        if (isHovered) {
            newStyle.opacity = 1;
            newStyle.borderColor = '#f59e0b';
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 2000;
            className = 'selected-hover';
        } else if (isNeighbor) {
            newStyle.opacity = 1;
            newStyle.borderColor = isDarkMode ? '#60a5fa' : '#3b82f6';
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 1500;
            className = 'connected'; // Opcional, si quieres estilar vecinos en CSS
        } else {
            newStyle.opacity = 0.2; // Nodos no relacionados opacos
            newStyle.zIndex = 1;
        }

        return { ...node, className, style: newStyle };
    });

    // 4. Estilos de EDGES (LÍNEAS) - ¡AQUÍ ESTABA EL FALLO!
    const highlightedEdges = allEdges.map(edge => {
        const eid = edgeIdOf(edge);
        const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === eid);
        
        // Si no pasa el filtro de vista, se oculta
        if (!isVisible) return { ...edge, hidden: true };

        const isConnected = connectedEdgeIds.has(eid);

        if (isConnected) {
            // A) LÍNEA ACTIVA (Conectada)
            const activeColor = edge.type === 'final' 
                ? '#ef4444' 
                : (isDarkMode ? '#60a5fa' : '#3b82f6');

            return {
                ...edge,
                hidden: false,
                className: 'active', // <--- CLAVE: Activa la clase del CSS
                animated: true,
                style: {
                    ...edge.style,
                    stroke: activeColor,
                    strokeWidth: 3,
                    opacity: 1,
                    zIndex: 2000
                }
            };
        } else {
            // B) LÍNEA INACTIVA (El resto)
            return {
                ...edge,
                hidden: false,
                className: 'inactive', // <--- CLAVE: Activa la opacidad 0.15 del CSS
                animated: false,
                style: {
                    ...edge.style,
                    // Forzamos un color muy sutil para que desaparezca visualmente
                    stroke: isDarkMode ? '#374151' : '#e5e7eb', 
                    strokeWidth: 1,
                    zIndex: 0
                    // NOTA: La opacidad ya la maneja la clase .inactive en App.css
                }
            };
        }
    });

    return { nodes: highlightedNodes, edges: highlightedEdges };
};