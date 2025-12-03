// utils.js

// ============================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================

const NODE_WIDTH = 180;
const X_SPACING = 250;
const Y_SPACING = 150;

// ============================================================
// PALETA DE COLORES
// ============================================================

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
    // Tema Daltónico (Agregado por tu colega) - Paleta de Wong
    colorblind: {
        // Aprobada: Naranja Intenso (Vermilion)
        aprobada: { bg: '#ffedd5', border: '#d55e00', text: '#9a3412' },
        // Disponible: Celeste Cielo (Sky Blue)
        disponible: { bg: '#f0f9ff', border: '#56b4e9', text: '#0c4a6e' },
        // Bloqueada: Gris Oscuro/Negro (Alto contraste)
        bloqueada: { bg: '#e5e5e5', border: '#000000', text: '#000000' },
    }
};

// Colores para las líneas según distancia
const EDGE_COLORS = {
    standard: '#94a3b8',   // Gris (Nivel 1 -> Nivel 2)
    longJump: '#a855f7',   // Violeta (Nivel 1 -> Nivel 3+)
    final: '#ef4444',      // Rojo (Finales)
    hoverNear: '#3b82f6',  // Azul (Hover cercano)
    hoverFar: '#f97316'    // Naranja/Rojo (Hover lejano)
};

export const getLayoutElements = (materias) => {
    const nodes = [];
    const edges = [];
    
    try {
        if (typeof materias === 'string') materias = JSON.parse(materias);
    } catch (e) {
        console.error('getLayoutElements: error parseando JSON', e);
        return { nodes, edges };
    }

    if (!Array.isArray(materias)) return { nodes, edges };

    // 1. MAPA DE NIVELES (Para calcular distancias rápidamente)
    const nivelMap = {};
    materias.forEach(m => {
        nivelMap[m.id] = m.nivel || (m.posY ? m.posY + 1 : 1);
    });

    // 2. AGRUPAR POR NIVEL
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
        
        // Mantenemos tu configuración de 20 columnas
        const COLUMNAS_MAX = 20; 
        const numColumnasNivel = Math.min(listaMaterias.length, COLUMNAS_MAX);
        const ANCHO_GRUPO = (numColumnasNivel - 1) * X_SPACING;
        const offsetX = (800 - ANCHO_GRUPO) / 2;
        const START_X = Math.max(0, offsetX);
            
        listaMaterias.forEach((materia, index) => {
            const filaRelativa = Math.floor(index / COLUMNAS_MAX);
            const colRelativa = index % COLUMNAS_MAX;
            
            const x = START_X + (colRelativa * X_SPACING);
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

            // --- EDGES ---

            // A. Edges de FINAL (Prioridad Roja)
            if (materia.requiere_para_final) {
                materia.requiere_para_final.forEach(reqId => {
                    edges.push({
                        id: `e-${reqId}-${materia.id}-final`,
                        source: reqId, target: materia.id, animated: false, type: 'final',
                        style: { stroke: EDGE_COLORS.final, strokeWidth: 2 }
                    });
                });
            }

            // B. Edges de CURSADA (Con lógica de distancia)
            if (materia.requiere_para_cursar) {
                materia.requiere_para_cursar.forEach(reqId => {
                    const tieneFinal = materia.requiere_para_final && materia.requiere_para_final.includes(reqId);
                    if (!tieneFinal) {
                        // Calcular distancia
                        const nivelSource = nivelMap[reqId] || 0;
                        const nivelTarget = nivel;
                        const distancia = Math.abs(nivelTarget - nivelSource);

                        // Determinar color por distancia (Si es > 1 es un salto largo)
                        const edgeColor = distancia > 1 ? EDGE_COLORS.longJump : EDGE_COLORS.standard;
                        // Si es salto largo, la línea es un poco más gruesa
                        const edgeWidth = distancia > 1 ? 2 : 1; 

                        edges.push({
                            id: `e-${reqId}-${materia.id}-cursada`,
                            source: reqId, target: materia.id, animated: true, type: 'cursar',
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

// ---------------------------------------------------------
// FUNCIÓN DE ESTILOS (NODOS) - ACTUALIZADA CON DALTÓNISMO
// ---------------------------------------------------------
export const updateNodeStyles = (nodes, edges, materiasAprobadasIds, isDarkMode = false, isColorblind = false) => {
    
    // 1. SELECCIÓN DE PALETA: Si es daltónico, ignora el modo oscuro para priorizar contraste
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
        
        // Lógica visual extra para modo Daltónico (Bordes gruesos/punteados)
        if (isColorblind) {
            newStyle.borderWidth = '3px';
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

export const filterEdgesByMode = (edges, viewMode = 'todas') => {
    if (!Array.isArray(edges)) return [];
    if (viewMode === 'todas') return edges;
    if (viewMode === 'cursar') return edges.filter(e => e.type === 'cursar');
    if (viewMode === 'final') return edges.filter(e => e.type === 'final');
    if (Array.isArray(viewMode)) return edges.filter(e => viewMode.includes(e.type));
    return edges;
};

// ---------------------------------------------------------
// HIGHLIGHT CON LOGICA DE DISTANCIA (AZUL vs ROJO)
// ---------------------------------------------------------
export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false, viewMode = 'todas') => {
    const allNodes = Array.isArray(nodes) ? nodes : [];
    const allEdges = Array.isArray(edges) ? edges : [];
    const edgeIdOf = (edge) => edge.id || `${edge.source}->${edge.target}`;

    // Mapa auxiliar de Nodos para buscar niveles rápido
    const nodeMap = new Map();
    allNodes.forEach(n => nodeMap.set(n.id, n));

    // 1. SIN HOVER
    if (!hoveredNodeId) {
        const visibleEdges = filterEdgesByMode(allEdges, viewMode);
        return {
            nodes: allNodes.map(n => ({ ...n, className: '', style: { ...n.style, opacity: 1 } })),
            edges: allEdges.map(edge => {
                const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === edgeIdOf(edge));
                // Restauramos estilos basándonos en si es final o cursada normal/larga
                return {
                    ...edge,
                    className: '',
                    hidden: !isVisible,
                    animated: isVisible && edge.type === 'cursar',
                    style: { 
                        ...edge.style, 
                        opacity: 1, 
                        strokeWidth: edge.type === 'final' ? 2 : (edge.style.stroke === EDGE_COLORS.longJump ? 2 : 1) 
                    }
                };
            })
        };
    }

    // 2. CON HOVER
    const visibleEdges = filterEdgesByMode(allEdges, viewMode);
    const connectedEdgeIds = new Set();
    const connectedNodeIds = new Set([hoveredNodeId]);

    visibleEdges.forEach(edge => {
        if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
            connectedEdgeIds.add(edgeIdOf(edge));
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        }
    });

    // A. Estilar NODOS
    const highlightedNodes = allNodes.map(node => {
        const isHovered = node.id === hoveredNodeId;
        const isNeighbor = connectedNodeIds.has(node.id);
        let newStyle = { ...node.style };
        let className = '';

        if (isHovered) {
            newStyle.opacity = 1;
            newStyle.borderColor = '#f59e0b'; // Naranja brillante selección
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 2000;
            className = 'selected-hover';
        } else if (isNeighbor) {
            newStyle.opacity = 1;
            newStyle.borderColor = isDarkMode ? '#60a5fa' : '#3b82f6';
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 1500;
            className = 'connected';
        } else {
            newStyle.opacity = 0.2;
            newStyle.zIndex = 1;
        }
        return { ...node, className, style: newStyle };
    });

    // B. Estilar EDGES (Aquí aplicamos tu lógica Cerca/Lejos)
    const highlightedEdges = allEdges.map(edge => {
        const eid = edgeIdOf(edge);
        const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === eid);
        if (!isVisible) return { ...edge, hidden: true };

        const isConnected = connectedEdgeIds.has(eid);
        if (isConnected) {
            // Calcular niveles para el color
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            const sourceLevel = sourceNode?.data?.originalData?.nivel || 0;
            const targetLevel = targetNode?.data?.originalData?.nivel || 0;
            const dist = Math.abs(targetLevel - sourceLevel);

            // LOGICA DE COLOR EN HOVER:
            let highlightColor;
            
            if (edge.type === 'final') {
                highlightColor = EDGE_COLORS.final; // Siempre rojo para finales
            } else if (dist > 1) {
                highlightColor = EDGE_COLORS.hoverFar; // Naranja/Rojo si está lejos
            } else {
                highlightColor = EDGE_COLORS.hoverNear; // Azul si está cerca
            }

            return {
                ...edge,
                hidden: false,
                className: 'active',
                animated: true,
                style: {
                    ...edge.style, // Mantiene dasharray si existe
                    stroke: highlightColor,
                    strokeWidth: 3,
                    opacity: 1,
                    zIndex: 2000
                }
            };
        } else {
            return {
                ...edge,
                hidden: true,
                className: '',
                animated: false,
                style: { ...edge.style, opacity: 0 }
            };
        }
    });

    return { nodes: highlightedNodes, edges: highlightedEdges };
};