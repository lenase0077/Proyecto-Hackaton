// utils.js

// ============================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================

const NODE_WIDTH = 250;
const Y_SPACING = 65;

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
    // WONG PALETTE (Accesibilidad)
    colorblind: {
        aprobada: { bg: '#ffedd5', border: '#d55e00', text: '#9a3412' }, // Vermilion
        disponible: { bg: '#f0f9ff', border: '#56b4e9', text: '#0c4a6e' }, // Sky Blue
        bloqueada: { bg: '#e5e5e5', border: '#000000', text: '#000000' }, // High Contrast
    }
};

// Colores estándar y de lógica de distancias
const EDGE_COLORS = {
    standard: '#94a3b8',
    longJump: '#a855f7',
    final: '#ef4444',
    hoverNear: '#3b82f6',
    hoverFar: '#f97316'
};

// Colores específicos para modo daltónico
const LINE_COLORS_ACCESSIBLE = {
    final: '#d55e00',   // Vermilion
    cursada: '#777777', // Dark Gray
    active: '#56b4e9'   // Sky Blue
};

// ============================================================
// GENERACIÓN DE LAYOUT (Nodos y Edges)
// ============================================================

export const getLayoutElements = (materias, isMobile = false) => {
    const nodes = [];
    const edges = [];
    
    // CONFIGURACIÓN DINÁMICA
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

    // 1. MAPA DE NIVELES
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
        
        const numColumnasNivel = Math.min(listaMaterias.length, COLUMN_LIMIT);
        const ANCHO_GRUPO = (numColumnasNivel - 1) * CURRENT_X_SPACING;
        const offsetX = (isMobile ? 0 : (800 - ANCHO_GRUPO) / 2);
        const START_X = Math.max(0, offsetX);
            
        listaMaterias.forEach((materia, index) => {
            const filaRelativa = Math.floor(index / COLUMN_LIMIT);
            const colRelativa = index % COLUMN_LIMIT;
            
            const x = START_X + (colRelativa * CURRENT_X_SPACING);
            const y = ((nivel - 1) * (Y_SPACING * 2.5)) + (filaRelativa * Y_SPACING);

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

            // A. Edges de FINAL
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

            // B. Edges de CURSADA
            if (materia.requiere_para_cursar) {
                materia.requiere_para_cursar.forEach(reqId => {
                    const tieneFinal = materia.requiere_para_final && materia.requiere_para_final.includes(reqId);
                    if (!tieneFinal) {
                        const nivelSource = nivelMap[reqId] || 0;
                        const nivelTarget = nivel;
                        const distancia = Math.abs(nivelTarget - nivelSource);
                        
                        // Lógica de visualización para saltos grandes
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

// ---------------------------------------------------------
// FUNCIÓN DE ESTILOS (NODOS) - Soporta Colorblind
// ---------------------------------------------------------
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
        
        // Patrones visuales para daltónicos
        if (isColorblind) {
            newStyle.borderWidth = '3px';
            // Bordes punteados para bloqueadas
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

// ---------------------------------------------------------
// FILTRO (Mira data.tipo)
// ---------------------------------------------------------
export const filterEdgesByMode = (edges, viewMode = 'todas', nodes = [], materiasAprobadasIds = []) => {
    if (!Array.isArray(edges)) return [];
    if (viewMode === 'todas') return edges;
    if (viewMode === 'cursar') return edges.filter(e => e.data?.tipo === 'cursar');
    if (viewMode === 'final') return edges.filter(e => e.data?.tipo === 'final');
    
    // MODO SIMPLIFICADA: mostrar solo líneas que conectan disponibles con lo que desbloquean
    if (viewMode === 'simplificada') {
        // Crear mapa de nodos para acceso rápido
        const nodeMap = new Map();
        nodes.forEach(n => nodeMap.set(n.id, n));
        
        // Identificar qué nodos están disponibles (no aprobados pero con correlativas cumplidas)
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
        
        // Filtrar edges: solo los que salen de nodos disponibles o aprobados
        return edges.filter(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            
            if (!sourceNode || !targetNode) return false;
            
            const sourceMat = sourceNode.data?.originalData;
            const targetMat = targetNode.data?.originalData;
            
            if (!sourceMat || !targetMat) return false;
            
            // Incluir si el source es disponible o aprobado, y va hacia el target
            const sourceEsDisponibleOAprobado = 
                nodosDisponibles.has(sourceMat.id) || 
                materiasAprobadasIds.includes(sourceMat.id);
            
            return sourceEsDisponibleOAprobado;
        });
    }
    
    if (Array.isArray(viewMode)) return edges.filter(e => viewMode.includes(e.data?.tipo));
    return edges;
};

// ---------------------------------------------------------
// HIGHLIGHT ACTUALIZADO (Logic Main + Accessibility Head)
// ---------------------------------------------------------
export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false, viewMode = 'todas', isColorblind = false, materiasAprobadasIds = []) => {
    const allNodes = Array.isArray(nodes) ? nodes : [];
    const allEdges = Array.isArray(edges) ? edges : [];
    const edgeIdOf = (edge) => edge.id || `${edge.source}->${edge.target}`;

    // Mapa para calcular distancias en modo standard
    const nodeMap = new Map();
    allNodes.forEach(n => nodeMap.set(n.id, n));

    // 1. SIN HOVER
    if (!hoveredNodeId) {
        const visibleEdges = filterEdgesByMode(allEdges, viewMode, allNodes, materiasAprobadasIds);
        
        // En modo simplificada, identificar nodos conectados
        let connectedNodeIds = new Set();
        if (viewMode === 'simplificada') {
            visibleEdges.forEach(edge => {
                connectedNodeIds.add(edge.source);
                connectedNodeIds.add(edge.target);
            });
        }
        
        return {
            nodes: allNodes.map(n => {
                let nodeStyle = { ...n.style, opacity: 1 };
                let hidden = false;
                
                // En modo simplificada, ocultar nodos no conectados
                if (viewMode === 'simplificada' && !connectedNodeIds.has(n.id)) {
                    nodeStyle.opacity = 0.1;
                    hidden = true;
                }
                
                return { ...n, className: '', style: nodeStyle, hidden };
            }),
            edges: allEdges.map(edge => {
                const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === edgeIdOf(edge));
                const isFinal = edge.data?.tipo === 'final';
                
                // Determinamos color base según modo
                let strokeColor;
                if (isColorblind) {
                    strokeColor = isFinal ? LINE_COLORS_ACCESSIBLE.final : LINE_COLORS_ACCESSIBLE.cursada;
                } else {
                    // Mantenemos colores originales si no es colorblind
                    strokeColor = edge.style.stroke; 
                }

                return {
                    ...edge,
                    className: '',
                    hidden: !isVisible,
                    animated: isVisible && !isFinal,
                    style: { 
                        ...edge.style, 
                        opacity: 1, 
                        stroke: strokeColor,
                        strokeWidth: isFinal ? 2 : (edge.style.stroke === EDGE_COLORS.longJump ? 2 : 1) 
                    }
                };
            })
        };
    }

    // 2. CON HOVER
    const visibleEdges = filterEdgesByMode(allEdges, viewMode, allNodes, materiasAprobadasIds);
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
        let hidden = false;

        if (isHovered) {
            newStyle.opacity = 1;
            newStyle.borderColor = isColorblind ? '#d55e00' : '#f59e0b';
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 2000;
            className = 'selected-hover';
        } else if (isNeighbor) {
            newStyle.opacity = 1;
            // Vecinos en azul/celeste
            newStyle.borderColor = isColorblind ? '#56b4e9' : (isDarkMode ? '#60a5fa' : '#3b82f6');
            newStyle.borderWidth = '3px';
            newStyle.zIndex = 1500;
            className = 'connected';
        } else {
            newStyle.opacity = 0.2;
            newStyle.zIndex = 1;
            // En modo simplificada, ocultar completamente los nodos no conectados en hover
            if (viewMode === 'simplificada') {
                newStyle.opacity = 0.1;
                hidden = false;
            }
        }
        return { ...node, className, style: newStyle, hidden };
    });

    // B. Estilar EDGES
    const highlightedEdges = allEdges.map(edge => {
        const eid = edgeIdOf(edge);
        const isVisible = visibleEdges.some(ve => edgeIdOf(ve) === eid);
        if (!isVisible) return { ...edge, hidden: true };

        const isConnected = connectedEdgeIds.has(eid);
        
        if (isConnected) {
            let highlightColor;

            if (isColorblind) {
                // Modo accesible simple: Rojo/Naranja para final, Celeste para activo
                highlightColor = edge.data?.tipo === 'final' 
                    ? LINE_COLORS_ACCESSIBLE.final 
                    : LINE_COLORS_ACCESSIBLE.active;
            } else {
                // Modo standard complejo: Distancias y saltos
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
                ...edge,
                hidden: false,
                className: 'active',
                animated: true,
                style: {
                    ...edge.style,
                    stroke: highlightColor,
                    strokeWidth: 3,
                    opacity: 1,
                    zIndex: 2000
                }
            };
        } else {
            return {
                ...edge,
                hidden: true, // Ocultar no conectados en hover para limpieza
                className: '',
                animated: false,
                style: { ...edge.style, opacity: 0 }
            };
        }
    });

    return { nodes: highlightedNodes, edges: highlightedEdges };
};

// ============================================================
// FUNCIONES DE CELEBRACIÓN (CONFETTI)
// ============================================================

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
// Colores: AZUL, VERDE, NARANJA (Tema UTN Pathfinder)
export const triggerVictoryConfetti = () => {
    if (!window.confetti) return;
    
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#3b82f6', '#10b981', '#f59e0b']; // Los colores de tu app
  
    (function frame() {
      window.confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      window.confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
  
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
};