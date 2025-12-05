// utils.js
// ============================================================================
// 1. CONSTANTES Y CONFIGURACIÓN
// ============================================================================

// Dimensiones para el layout del grafo
const NODE_WIDTH = 250;
const Y_SPACING = 65;

// --- PALETA DE COLORES (Temas y Estados) ---
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
    },
    // WONG PALETTE (Accesibilidad para Daltónicos)
    colorblind: {
        aprobada: { bg: '#ffedd5', border: '#d55e00', text: '#9a3412' }, // Vermilion
        disponible: { bg: '#f0f9ff', border: '#56b4e9', text: '#0c4a6e' }, // Sky Blue
        bloqueada: { bg: '#e5e5e5', border: '#000000', text: '#000000' }, // High Contrast
    }
};

// Colores para las conexiones (Edges) en modo estándar
const EDGE_COLORS = {
    standard: '#94a3b8',
    longJump: '#a855f7',
    final: '#ef4444',
    hoverNear: '#3b82f6',
    hoverFar: '#f97316'
};

// Colores de conexiones para modo daltónico
const LINE_COLORS_ACCESSIBLE = {
    final: '#d55e00',   // Vermilion
    cursada: '#777777', // Dark Gray
    active: '#56b4e9'   // Sky Blue
};


// ============================================================================
// 2. ALGORITMOS Y CÁLCULOS AUXILIARES
// ============================================================================

/**
 * Calcula la "Ruta Crítica" (Critical Path) del plan de estudios.
 * Identifica la cadena de materias correlativas más larga que determina
 * la duración mínima de la carrera.
 */
export const calculateCriticalPath = (nodes) => {
    // 1. Mapa de dependencias para acceso rápido
    const nodeMap = new Map(nodes.map(n => [n.id, n.data.originalData]));
    
    // Cache para memoización (evitar recalcular caminos repetidos)
    const memo = {};

    // Función recursiva para buscar la profundidad de un nodo
    const getDepth = (id) => {
        if (id in memo) return memo[id];

        const materia = nodeMap.get(id);
        if (!materia) return 0;

        // Miramos solo 'requiere_para_cursar' porque eso define la cadena de bloqueo real (cursada)
        const requisitos = materia.requiere_para_cursar || [];
        
        if (requisitos.length === 0) {
            memo[id] = 1;
            return 1;
        }

        // Buscamos el requisito que tenga el camino más largo detrás
        let maxDepth = 0;
        for (const reqId of requisitos) {
            maxDepth = Math.max(maxDepth, getDepth(reqId));
        }

        memo[id] = maxDepth + 1;
        return maxDepth + 1;
    };

    // 2. Encontrar el nodo final con el camino más largo (el cuello de botella final)
    let maxPathLength = 0;
    let endNodeId = null;

    nodes.forEach(node => {
        const depth = getDepth(node.id);
        if (depth > maxPathLength) {
            maxPathLength = depth;
            endNodeId = node.id;
        }
    });

    // 3. Reconstruir el camino hacia atrás desde el final
    const criticalPath = new Set();
    let currentId = endNodeId;

    while (currentId) {
        criticalPath.add(currentId);
        const materia = nodeMap.get(currentId);
        const requisitos = materia?.requiere_para_cursar || [];

        if (requisitos.length === 0) break;

        // Moverse al requisito que tiene el mayor depth (el camino crítico)
        // Esto elige la "rama" más larga
        currentId = requisitos.reduce((a, b) => getDepth(a) > getDepth(b) ? a : b);
    }

    return criticalPath; // Retorna un Set con los IDs de la ruta crítica
};


// ============================================================================
// 3. GENERACIÓN DEL GRAFO (NODOS Y EDGES)
// ============================================================================

/**
 * Transforma el JSON plano de materias en nodos y edges compatibles con ReactFlow.
 * Calcula posiciones (x, y) basadas en niveles y columnas.
 */
export const getLayoutElements = (materias, isMobile = false) => {
    const nodes = [];
    const edges = [];
    
    // CONFIGURACIÓN DINÁMICA DE GRILLA
    const COLUMN_LIMIT = isMobile ? 4 : 20; 
    const CURRENT_X_SPACING = isMobile ? 200 : 265; 
    const CURRENT_NODE_WIDTH = isMobile ? 160 : 200;

    try {
        if (typeof materias === 'string') materias = JSON.parse(materias);
    } catch (e) {
        console.error('getLayoutElements: error parseando JSON', e);
        return { nodes, edges };
    }

    if (!Array.isArray(materias)) return { nodes, edges };

    // 1. MAPA DE NIVELES (Para calcular saltos verticales)
    const nivelMap = {};
    materias.forEach(m => {
        nivelMap[m.id] = m.nivel || (m.posY ? m.posY + 1 : 1);
    });

    // 2. AGRUPAR POR NIVEL (Para organizar filas)
    const materiasPorNivel = {};
    materias.forEach(m => {
        const nivel = m.nivel || (m.posY ? m.posY + 1 : 1);
        if (!materiasPorNivel[nivel]) materiasPorNivel[nivel] = [];
        materiasPorNivel[nivel].push(m);
    });

    // 3. CREAR NODOS Y EDGES
    Object.keys(materiasPorNivel).forEach(nivelStr => {
        const nivel = parseInt(nivelStr);
        const listaMaterias = materiasPorNivel[nivel];
        
        // Calcular offset para centrar el grupo en pantalla (solo desktop)
        const numColumnasNivel = Math.min(listaMaterias.length, COLUMN_LIMIT);
        const ANCHO_GRUPO = (numColumnasNivel - 1) * CURRENT_X_SPACING;
        const offsetX = (isMobile ? 0 : (800 - ANCHO_GRUPO) / 2);
        const START_X = Math.max(0, offsetX);
            
        listaMaterias.forEach((materia, index) => {
            const filaRelativa = Math.floor(index / COLUMN_LIMIT);
            const colRelativa = index % COLUMN_LIMIT;
            
            const x = START_X + (colRelativa * CURRENT_X_SPACING);
            const y = ((nivel - 1) * (Y_SPACING * 2.5)) + (filaRelativa * Y_SPACING);

            // Crear Nodo
            nodes.push({
                id: materia.id,
                data: { label: materia.nombre, originalData: materia, clickable: true },
                position: { x, y },
                style: {
                    background: '#fff', border: '1px solid #777', borderRadius: '8px',
                    width: CURRENT_NODE_WIDTH, padding: '8px', fontSize: isMobile ? '12px' : '14px', textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', transition: 'all 0.3s ease'
                },
                type: 'default',
            });

            // A. Crear Edges de FINAL (Líneas sólidas, rojas/naranjas)
            if (materia.requiere_para_final) {
                materia.requiere_para_final.forEach(reqId => {
                    edges.push({
                        id: `e-${reqId}-${materia.id}-final`,
                        source: reqId, 
                        target: materia.id, 
                        animated: false, 
                        type: 'smoothstep', 
                        data: { tipo: 'final' }, 
                        style: { stroke: EDGE_COLORS.final, strokeWidth: 2 }
                    });
                });
            }

            // B. Crear Edges de CURSADA (Líneas punteadas)
            if (materia.requiere_para_cursar) {
                materia.requiere_para_cursar.forEach(reqId => {
                    // Evitar duplicar si ya existe relación de final (la de final tiene prioridad visual)
                    const tieneFinal = materia.requiere_para_final && materia.requiere_para_final.includes(reqId);
                    if (!tieneFinal) {
                        const nivelSource = nivelMap[reqId] || 0;
                        const nivelTarget = nivel;
                        const distancia = Math.abs(nivelTarget - nivelSource);
                        
                        // Lógica de visualización para saltos grandes (correlativas de hace 2 años)
                        const edgeColor = distancia > 1 ? EDGE_COLORS.longJump : EDGE_COLORS.standard;
                        const edgeWidth = distancia > 1 ? 2 : 1; 

                        edges.push({
                            id: `e-${reqId}-${materia.id}-cursada`,
                            source: reqId, 
                            target: materia.id, 
                            animated: true, 
                            type: 'smoothstep', 
                            data: { tipo: 'cursar' }, 
                            style: { 
                                stroke: edgeColor, 
                                strokeDasharray: '5,5',
                                strokeWidth: edgeWidth
                            },
                        });
                    }
                });
            }
        });
    });

    return { nodes, edges };
};


// ============================================================================
// 4. LÓGICA DE ESTILOS Y FILTRADO (INTERACCIÓN)
// ============================================================================

/**
 * Filtra qué conexiones se muestran según el modo seleccionado en la UI.
 * (Ej: Ver solo correlativas de cursada, ver solo finales, o vista simplificada)
 */
export const filterEdgesByMode = (edges, viewMode = 'todas', nodes = [], materiasAprobadasIds = []) => {
    if (!Array.isArray(edges)) return [];
    if (viewMode === 'todas') return edges;
    if (viewMode === 'cursar') return edges.filter(e => e.data?.tipo === 'cursar');
    if (viewMode === 'final') return edges.filter(e => e.data?.tipo === 'final');
    
    // MODO SIMPLIFICADA: Algoritmo "Next Step"
    // Muestra solo las líneas que conectan materias "disponibles" con las que desbloquean.
    if (viewMode === 'simplificada') {
        const nodeMap = new Map();
        nodes.forEach(n => nodeMap.set(n.id, n));
        
        // Identificar qué nodos están "Disponibles" (listos para cursar)
        const nodosDisponibles = new Set();
        nodes.forEach(node => {
            const mat = node.data?.originalData;
            if (!mat) return;
            
            const estaAprobada = materiasAprobadasIds.includes(mat.id);
            if (!estaAprobada) {
                const reqCursadas = mat.requiere_para_cursar || [];
                const tieneCursadas = reqCursadas.every(reqId => materiasAprobadasIds.includes(reqId));
                const reqFinales = mat.requiere_para_final || [];
                const tieneFinales = reqFinales.every(reqId => materiasAprobadasIds.includes(reqId));
                
                if (tieneCursadas && tieneFinales) {
                    nodosDisponibles.add(mat.id);
                }
            }
        });
        
        // Filtrar edges: solo los que salen de nodos relevantes
        return edges.filter(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return false;
            
            const sourceMat = sourceNode.data?.originalData;
            const targetMat = targetNode.data?.originalData;
            if (!sourceMat || !targetMat) return false;
            
            const sourceEsDisponibleOAprobado = 
                nodosDisponibles.has(sourceMat.id) || 
                materiasAprobadasIds.includes(sourceMat.id);
            
            return sourceEsDisponibleOAprobado;
        });
    }
    
    // Soporte para array de modos (fallback)
    if (Array.isArray(viewMode)) return edges.filter(e => viewMode.includes(e.data?.tipo));
    return edges;
};


/**
 * Actualiza los estilos ESTÁTICOS de los nodos (Colores base: Aprobada/Disponible/Bloqueada).
 * Se ejecuta cuando cambia el estado de materias aprobadas o el tema.
 */
export const updateNodeStyles = (nodes, edges, materiasAprobadasIds, isDarkMode = false, isColorblind = false) => {
    let palette;
    if (isColorblind) {
        palette = THEME.colorblind;
    } else {
        palette = isDarkMode ? THEME.dark : THEME.light;
    }

    return nodes.map(node => {
        const mat = node.data.originalData;
        if (!mat) return node;

        const estaAprobada = materiasAprobadasIds.includes(mat.id);
        let newStyle = { ...node.style };
        let iconPrefix = "";
        let isClickable = false;
        let cssClass = "";

        if (estaAprobada) {
            newStyle.background = palette.aprobada.bg;
            newStyle.borderColor = palette.aprobada.border;
            newStyle.color = palette.aprobada.text;
            newStyle.fontWeight = 'bold';
            newStyle.cursor = 'pointer';
            iconPrefix = "✅ ";
            isClickable = true;
            cssClass = "node-approved";
        } else {
            const reqCursadas = mat.requiere_para_cursar || [];
            const tieneCursadas = reqCursadas.every(reqId => materiasAprobadasIds.includes(reqId));
            const reqFinales = mat.requiere_para_final || [];
            const tieneFinales = reqFinales.every(reqId => materiasAprobadasIds.includes(reqId));
            const correlativasCumplidas = tieneCursadas && tieneFinales;

            if (correlativasCumplidas) {
                newStyle.background = palette.disponible.bg;
                newStyle.borderColor = palette.disponible.border;
                newStyle.color = palette.disponible.text;
                newStyle.borderWidth = '2px';
                newStyle.cursor = 'pointer';
                iconPrefix = "";
                isClickable = true;
                cssClass = "node-available";
            } else {
                newStyle.background = palette.bloqueada.bg;
                newStyle.borderColor = palette.bloqueada.border;
                newStyle.color = palette.bloqueada.text;
                newStyle.cursor = 'not-allowed';
                iconPrefix = "🔒 "; 
                isClickable = false;
                cssClass = "node-blocked";
            }
        }
        
        // Patrones visuales extra para accesibilidad (Daltónicos)
        if (isColorblind) {
            newStyle.borderWidth = '3px';
            // Bordes punteados para diferenciar por forma/patrón, no solo color
            newStyle.borderStyle = estaAprobada ? 'solid' : (cssClass === "node-blocked" ? 'dashed' : 'solid');
        }

        return {
            ...node,
            className: cssClass,
            data: { ...node.data, label: `${iconPrefix}${mat.nombre}`, clickable: isClickable },
            style: newStyle
        };
    });
};


/**
 * Actualiza los estilos DINÁMICOS (Highlighting) de nodos y edges.
 * Maneja: Hover, Ruta Crítica y Opacidad en modo Simplificado.
 */
export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false, viewMode = 'todas', isColorblind = false, materiasAprobadasIds = []) => {
    const allNodes = Array.isArray(nodes) ? nodes : [];
    const allEdges = Array.isArray(edges) ? edges : [];
    const edgeIdOf = (edge) => edge.id || `${edge.source}->${edge.target}`;

    // Mapa auxiliar
    const nodeMap = new Map();
    allNodes.forEach(n => nodeMap.set(n.id, n));

    // Si estamos en modo crítico, calculamos la ruta
    let criticalPathIds = new Set();
    if (viewMode === 'critical') {
        criticalPathIds = calculateCriticalPath(nodes);
    }

    // --- ESCENARIO 1: SIN HOVER (Estado Base o Modos Globales) ---
    if (!hoveredNodeId) {
        const visibleEdges = filterEdgesByMode(allEdges, viewMode, allNodes, materiasAprobadasIds);
        
        // Para modo simplificada, pre-calculamos nodos con conexiones visibles
        let connectedNodeIds = new Set();
        if (viewMode === 'simplificada') {
            visibleEdges.forEach(edge => {
                connectedNodeIds.add(edge.source);
                connectedNodeIds.add(edge.target);
            });
        }
        
        return {
        nodes: allNodes.map(n => {
            // Reset de estilos base
            let nodeStyle = { ...n.style };
            nodeStyle.opacity = 1; 
            nodeStyle.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
            nodeStyle.borderWidth = isColorblind ? '3px' : '1px';
            
            let hidden = false;

            // Lógica Modo Crítico (Highlight Rojo)
            if (viewMode === 'critical') {
                if (criticalPathIds.has(n.id)) {
                    nodeStyle.opacity = 1;
                    nodeStyle.borderColor = '#ff0033'; 
                    nodeStyle.boxShadow = '0 0 15px rgba(255, 0, 51, 0.6)';
                    nodeStyle.borderWidth = '3px';
                    nodeStyle.zIndex = 1000;
                } else {
                    nodeStyle.opacity = 0.1; // Oscurecer el resto
                    nodeStyle.borderColor = '#555';
                    nodeStyle.boxShadow = 'none';
                }
            } 
            
            // Lógica Modo Simplificado (Ocultar nodos sueltos)
            if (viewMode === 'simplificada' && !connectedNodeIds.has(n.id)) {
                nodeStyle.opacity = 0.1;
                hidden = true;
            }
            
            return { ...n, className: '', style: nodeStyle, hidden };
        }),
        edges: allEdges.map(edge => {
            const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === edgeIdOf(edge));
            const isFinal = edge.data?.tipo === 'final';
            
            let newStyle = { ...edge.style, opacity: 1 };
            let animated = isVisible && !isFinal;
            let hidden = !isVisible;
            
            if (viewMode === 'critical') {
                // Modo Ruta Crítica: Solo mostrar edges que conectan nodos críticos Y son de cursada
                hidden = false; // Mostramos todos pero manipulamos opacidad
                const isCriticalEdge = criticalPathIds.has(edge.source) && 
                                    criticalPathIds.has(edge.target) && 
                                    edge.data?.tipo === 'cursar';

                if (isCriticalEdge) {
                    newStyle.opacity = 1;
                    newStyle.stroke = '#ff0033';
                    newStyle.strokeWidth = 3;
                    newStyle.zIndex = 1000;
                    animated = true; 
                } else {
                    newStyle.opacity = 0.05; // Ghost edges
                    newStyle.stroke = '#555';
                    animated = false;
                }
            } else {
                // Modo Normal / Colorblind
                let strokeColor;
                if (isColorblind) {
                    strokeColor = isFinal ? LINE_COLORS_ACCESSIBLE.final : LINE_COLORS_ACCESSIBLE.cursada;
                } else {
                    strokeColor = edge.style.stroke; 
                }
                newStyle.stroke = strokeColor;
                newStyle.strokeWidth = isFinal ? 2 : (edge.style.stroke === EDGE_COLORS.longJump ? 2 : 1);
            }

            return { ...edge, className: '', hidden: hidden, animated: animated, style: newStyle };
        })
        };
    }

    // --- ESCENARIO 2: CON HOVER (Usuario pasa el mouse por un nodo) ---
    const visibleEdges = filterEdgesByMode(allEdges, viewMode, allNodes, materiasAprobadasIds);
    const connectedEdgeIds = new Set();
    const connectedNodeIds = new Set([hoveredNodeId]);

    // Buscar vecinos inmediatos
    visibleEdges.forEach(edge => {
        if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
            connectedEdgeIds.add(edgeIdOf(edge));
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        }
    });

    // A. Highlight NODOS
    const highlightedNodes = allNodes.map(node => {
        const isHovered = node.id === hoveredNodeId;
        const isNeighbor = connectedNodeIds.has(node.id);
        let newStyle = { ...node.style };
        let className = '';
        let hidden = false;

        if (isHovered) {
            newStyle.opacity = 1;
            newStyle.borderColor = isColorblind ? '#d55e00' : '#f59e0b';
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 2000;
            className = 'selected-hover';
        } else if (isNeighbor) {
            newStyle.opacity = 1;
            newStyle.borderColor = isColorblind ? '#56b4e9' : (isDarkMode ? '#60a5fa' : '#3b82f6');
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 1500;
            className = 'connected';
        } else {
            // Nodos no relacionados se desvanecen
            newStyle.opacity = 0.2;
            newStyle.zIndex = 1;
            if (viewMode === 'simplificada') {
                newStyle.opacity = 0.1;
                hidden = false;
            }
        }
        return { ...node, className, style: newStyle, hidden };
    });

    // B. Highlight EDGES
    const highlightedEdges = allEdges.map(edge => {
        const eid = edgeIdOf(edge);
        const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === eid);
        if (!isVisible) return { ...edge, hidden: true };

        const isConnected = connectedEdgeIds.has(eid);
        
        if (isConnected) {
            let highlightColor;
            if (isColorblind) {
                highlightColor = edge.data?.tipo === 'final' 
                    ? LINE_COLORS_ACCESSIBLE.final 
                    : LINE_COLORS_ACCESSIBLE.active;
            } else {
                // Cálculo de distancia para degradado visual
                const sourceNode = nodeMap.get(edge.source);
                const targetNode = nodeMap.get(edge.target);
                const sourceLevel = sourceNode?.data?.originalData?.nivel || 0;
                const targetLevel = targetNode?.data?.originalData?.nivel || 0;
                const dist = Math.abs(targetLevel - sourceLevel);

                if (edge.data?.tipo === 'final') {
                    highlightColor = EDGE_COLORS.final; 
                } else if (dist > 1) {
                    highlightColor = EDGE_COLORS.hoverFar;
                } else {
                    highlightColor = EDGE_COLORS.hoverNear;
                }
            }

            return {
                ...edge, hidden: false, className: 'active', animated: true,
                style: { ...edge.style, stroke: highlightColor, strokeWidth: 3, opacity: 1, zIndex: 2000 }
            };
        } else {
            return {
                ...edge, hidden: true, className: '', animated: false,
                style: { ...edge.style, opacity: 0 }
            };
        }
    });

    return { nodes: highlightedNodes, edges: highlightedEdges };
};


// ============================================================================
// 5. GAMIFICACIÓN Y EFECTOS VISUALES
// ============================================================================

// --- Efectos de Confetti ---

// Efecto 1: Explosión pequeña (para completar Nivel/Año)
export const triggerLevelConfetti = () => {
    if (!window.confetti) return;
    
    window.confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }, // Desde abajo
        colors: ['#ffd700', '#ffffff'], // Dorado y Blanco
        disableForReducedMotion: true
    });
};
  
// Efecto 2: Lluvia masiva (para Final de Carrera)
export const triggerVictoryConfetti = () => {
    if (!window.confetti) return;
    
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#3b82f6', '#10b981', '#f59e0b']; // Azul, Verde, Naranja (Marca de la App)
  
    (function frame() {
      window.confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
      window.confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
  
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
};

// --- Lista de Logros (Data) ---

export const ACHIEVEMENTS = [
    {
        id: 'first_step',
        title: 'Primeros Pasos',
        description: 'Aprobaste tu primera materia.',
        icon: '🌱',
        condition: (aprobadas, nodes) => aprobadas.length >= 1

    },
    {
        id: 'getting_started',
        title: 'En Marcha',
        description: 'Aprobaste 3 materias.',
        icon: '🚀',
        condition: (aprobadas, nodes) => aprobadas.length >= 3
    },
    {
        id: 'warm_up',
        title: 'Calentando Motores',
        description: 'Aprobaste 5 materias.',
        icon: '🔥',
        condition: (aprobadas, nodes) => aprobadas.length >= 5
    },
    {
        id: 'on_a_roll',
        title: 'Imparable',
        description: 'Aprobaste 10 materias.',
        icon: '💨',
        condition: (aprobadas, nodes) => aprobadas.length >= 10
    },
    {
        id: 'halfway',
        title: 'Mitad de Camino',
        description: 'Alcanzaste el 50% de la carrera.',
        icon: '🏃',
        // Calcula porcentaje real basado en nodos cargados
        condition: (aprobadas, nodes) => {
            const aprobadasEstaCarrera = nodes.filter(n => aprobadas.includes(n.id)).length;
            return (aprobadasEstaCarrera / nodes.length) >= 0.5;
        }
    },
    {
        id: 'graduate',
        title: '¡Recibido!',
        description: 'Completaste todas las materias.',
        icon: '🎓',
        condition: (aprobadas, nodes) => {
            const aprobadasEstaCarrera = nodes.filter(n => aprobadas.includes(n.id)).length;
            return aprobadasEstaCarrera === nodes.length && nodes.length > 0;
        }
    },
    // Logros ocultos o accionables por click
    { id: 'spider_sense', title: 'Sentido Arácnido', description: 'Encontraste el secreto en el logo.', icon: '🕷️', condition: () => false },
    { id: 'credits_watcher', title: 'Honor a quien honor merece', description: 'Revisaste los créditos del equipo.', icon: '👏', condition: () => false },
    { id: 'the_chosen_one', title: 'El Elegido', description: 'Tomaste la pastilla roja y despertaste de la simulación.', icon: '💊', condition: () => false },
    { id: 'analist', title: 'El Analista', description: 'Descubriste la opcion de estadisticas avanzadas.', icon: '📊', condition: () => false },
    { id: 'the_dojo', title: 'El Dojo', description: 'Iniciaste en el dojo de la comunidad.', icon: '🐱‍👤', condition: () => false },
    { id: 'workman', title: 'Trabajador', description: 'Utilizaste la herramienta de linkedIn', icon: '💼', condition: () => false },
    { id: 'photographer', title: 'Fotógrafo', description: 'Utilizaste la herramienta de captura de pantalla', icon: '📸', condition: () => false },
    { id: 'the_prophecy', title: 'La Profecía', description: 'Quisiste ver el futuro utilizando la herramienta de proyección de cursada', icon: '🔮', condition: () => false },
    { id: 'priorities', title: 'Prioridades', description: 'Verificaste que materias pueden atrasarte la graduación', icon: '⏳', condition: () => false }
];