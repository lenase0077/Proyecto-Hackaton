// Importamos los datos de las materias desde un archivo JSON
// Similar a leer datos desde un archivo de configuración en C++
import materias from './data/materias.json';

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
        aprobada: { 
            bg: '#064e3b',     // Fondo verde oscuro
            border: '#34d399', // Borde verde claro
            text: '#ecfdf5'    // Texto verde muy claro
        },
        disponible: { 
            bg: '#1e293b',     // Fondo azul oscuro
            border: '#60a5fa', // Borde azul
            text: '#f8fafc'    // Texto blanco
        },
        bloqueada: { 
            bg: '#1f2937',     // Fondo gris oscuro
            border: '#374151', // Borde gris
            text: '#4b5563'    // Texto gris
        },
    }
};

// ============================================================
// FUNCIÓN: getLayoutElements()
// Crea todas las materias (nodos) y conexiones (edges) iniciales
// Similar a una función que inicializa un grafo en C++
// ============================================================

export const getLayoutElements = () => {
    // Crear arrays vacíos para nodos y edges
    // Similar a: vector<Nodo> nodes; vector<Edge> edges;
    const nodes = [];
    const edges = [];
    
    // Usamos un Set para evitar conexiones duplicadas
    // Similar a: unordered_set<string> edgesIds;
    const edgesIds = new Set();
    
    // ------------------------------------------------------------
    // PASO 1: CREAR TODOS LOS NODOS (MATERIAS)
    // ------------------------------------------------------------
    
    // Recorremos todas las materias del JSON
    // Similar a: for (auto& materia : materias) { ... }
    materias.forEach((materia) => {
        // Obtener posición X e Y de la materia
        // Si no tiene posición definida, usar 0
        const posX = materia.posX || 0;
        const posY = materia.posY || 0;
        
        // Calcular posición real en pantalla multiplicando por el espaciado
        // Similar a calcular coordenadas en un grid
        const x = posX * X_SPACING;
        const y = posY * Y_SPACING;
        
        // Crear el objeto nodo (materia) con todas sus propiedades
        // Similar a crear un struct y agregarlo a un vector
        nodes.push({
            id: materia.id,  // Identificador único (como "1", "2", etc.)
            data: { 
                label: materia.nombre,      // Nombre de la materia
                originalData: materia,      // Todos los datos originales
                clickable: true             // Se puede hacer click
            },
            position: { x, y },  // Posición en pantalla
            style: { 
                background: '#fff',         // Fondo blanco por defecto
                border: '1px solid #777',   // Borde gris
                borderRadius: '8px',        // Esquinas redondeadas
                width: NODE_WIDTH,          // Ancho fijo
                padding: '10px',            // Espacio interno
                fontSize: '14px',           // Tamaño del texto
                textAlign: 'center',        // Texto centrado
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', // Sombra sutil
            },
            type: 'default',  // Tipo de nodo (ReactFlow)
        });
    });

    // ------------------------------------------------------------
    // PASO 2: CREAR TODAS LAS CONEXIONES (LÍNEAS ENTRE MATERIAS)
    // ------------------------------------------------------------
    
    // Recorremos las materias nuevamente para crear las conexiones
    materias.forEach((materia) => {
        // Líneas ROJAS para "requiere para final"
        // Estas son conexiones que necesitás para RENDIR el final
        if (materia.requiere_para_final) {
            materia.requiere_para_final.forEach(reqId => {
                // Crear un ID único para esta conexión
                const edgeId = `final-${reqId}-${materia.id}`;
                
                // Verificar que no sea una conexión duplicada
                if (!edgesIds.has(edgeId)) {
                    // Crear la conexión (edge)
                    edges.push({
                        id: edgeId,           // ID único
                        source: reqId,        // Materia origen (la que requiere)
                        target: materia.id,   // Materia destino (la que necesita)
                        type: 'final',        // Tipo: para final
                        style: { 
                            stroke: '#ef4444',  // Color rojo
                            strokeWidth: 3,     // Línea gruesa (3px)
                        }
                    });
                    // Agregar al Set para evitar duplicados
                    edgesIds.add(edgeId);
                }
            });
        }

        // Líneas GRISES para "requiere para cursar"
        // Estas son conexiones que necesitás para ANOTARTE a la materia
        if (materia.requiere_para_cursar) {
            materia.requiere_para_cursar.forEach(reqId => {
                const edgeId = `cursar-${reqId}-${materia.id}`;
                if (!edgesIds.has(edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: reqId,
                        target: materia.id,
                        animated: true,        // Línea animada (punteada en movimiento)
                        type: 'cursar',        // Tipo: para cursar
                        style: { 
                            stroke: '#9ca3af',  // Color gris
                            strokeWidth: 2,     // Línea más delgada (2px)
                            strokeDasharray: '5,5' // Línea punteada: 5px sólido, 5px vacío
                        }
                    });
                    edgesIds.add(edgeId);
                }
            });
        }
    });
    
    // Devolver ambos arrays (nodos y conexiones)
    // Similar a: return make_pair(nodes, edges);
    return { nodes, edges };
};

// ============================================================
// FUNCIÓN: filterEdgesByMode()
// Filtra las conexiones según el modo de vista seleccionado
// Similar a una función que filtra elementos de un vector
// ============================================================

export const filterEdgesByMode = (edges, viewMode) => {
    // Modo "todas": mostrar todas las conexiones
    if (viewMode === 'todas') return edges;
    
    // Modo "cursar": mostrar solo conexiones para cursar
    if (viewMode === 'cursar') return edges.filter(e => e.type === 'cursar');
    
    // Modo "final": mostrar solo conexiones para final
    if (viewMode === 'final') return edges.filter(e => e.type === 'final');
    
    // Modo "simplificada": mostrar solo una conexión por par de nodos
    // (evita mostrar dos líneas entre las mismas materias)
    if (viewMode === 'simplificada') {
        // Array para conexiones únicas
        const uniqueEdges = [];
        // Set para verificar pares ya vistos
        const seenPairs = new Set();
        
        // Recorrer todas las conexiones
        edges.forEach(edge => {
            // Crear una clave única para el par de nodos
            const pairKey = `${edge.source}-${edge.target}`;
            
            // Si no hemos visto este par antes, agregarlo
            if (!seenPairs.has(pairKey)) {
                seenPairs.add(pairKey);
                
                // Crear una nueva conexión unificada
                uniqueEdges.push({
                    ...edge,  // Copiar todas las propiedades originales
                    id: `simple-${edge.source}-${edge.target}`,  // Nuevo ID
                    style: { 
                        stroke: '#3b82f6',  // Color azul para modo simplificado
                        strokeWidth: 2,      // Grosor estándar
                        strokeDasharray: '0' // Línea sólida (sin punteado)
                    },
                    animated: false  // Sin animación
                });
            }
        });
        return uniqueEdges;
    }
    
    // Por defecto, devolver todas las conexiones
    return edges;
};

// ============================================================
// FUNCIÓN: updateNodeStyles()
// Actualiza los colores de las materias según su estado
// Similar a una función que cambia atributos de objetos gráficos
// ============================================================

export const updateNodeStyles = (nodes, edges, materiasAprobadasIds, isDarkMode = false) => {
    // Seleccionar la paleta de colores según el modo
    // Similar a: ColorPalette palette = isDarkMode ? darkTheme : lightTheme;
    const palette = isDarkMode ? THEME.dark : THEME.light;

    // Recorrer todos los nodos y actualizar sus estilos
    // Similar a: for (auto& node : nodes) { actualizarEstilo(node); }
    return nodes.map(node => {
        // Obtener los datos originales de la materia
        const mat = node.data?.originalData;
        if (!mat) return node;  // Si no hay datos, devolver el nodo sin cambios
        
        // Verificar si esta materia está aprobada
        // Similar a: bool estaAprobada = find(aprobadas, mat.id) != aprobadas.end();
        const estaAprobada = materiasAprobadasIds.includes(mat.id);
        
        // Crear una copia del estilo actual para modificarlo
        let newStyle = { ...node.style };
        let isClickable = false;

        // CASO 1: MATERIA APROBADA (color verde)
        if (estaAprobada) {
            newStyle.background = palette.aprobada.bg;      // Fondo verde
            newStyle.borderColor = palette.aprobada.border; // Borde verde
            newStyle.color = palette.aprobada.text;         // Texto verde
            newStyle.fontWeight = 'bold';                   // Texto en negrita
            newStyle.cursor = 'pointer';                    // Manito al pasar mouse
            isClickable = true;                             // Se puede hacer click
            
        } else {
            // CASO 2 y 3: Verificar si se pueden cursar las correlativas
            
            // Verificar si TODAS las materias requeridas para cursar están aprobadas
            // Similar a: all_of(requiere_para_cursar.begin(), requiere_para_cursar.end(), [&](id){...})
            const correlativasCumplidas = mat.requiere_para_cursar?.every(reqId => 
                materiasAprobadasIds.includes(reqId)
            ) ?? true;  // Si no requiere nada, se considera cumplido

            // CASO 2: MATERIA DISPONIBLE (color azul/blanco)
            if (correlativasCumplidas) {
                newStyle.background = palette.disponible.bg;      // Fondo
                newStyle.borderColor = palette.disponible.border; // Borde azul
                newStyle.color = palette.disponible.text;         // Texto
                newStyle.borderWidth = '2px';                     // Borde más grueso
                newStyle.cursor = 'pointer';                      // Manito
                isClickable = true;                               // Click habilitado
                
            } else {
                // CASO 3: MATERIA BLOQUEADA (color gris)
                newStyle.background = palette.bloqueada.bg;      // Fondo gris
                newStyle.borderColor = palette.bloqueada.border; // Borde gris
                newStyle.color = palette.bloqueada.text;         // Texto gris
                newStyle.cursor = 'not-allowed';                 // Cursor prohibido
                isClickable = false;                             // Click deshabilitado
            }
        }

        // Devolver el nodo actualizado
        return {
            ...node,  // Copiar todas las propiedades originales
            data: { 
                ...node.data, 
                label: `${estaAprobada ? '✅ ' : ''}${mat.nombre}`, // Agregar emoji si está aprobada
                clickable: isClickable  // Actualizar si es clickeable
            },
            style: newStyle  // Aplicar nuevos estilos
        };
    });
};

// ============================================================
// FUNCIÓN: applyHighlightStyles()
// Aplica efectos de resaltado cuando el mouse está sobre una materia
// Similar a una función que cambia colores de elementos en hover
// ============================================================

export const applyHighlightStyles = (nodes, edges, hoveredNodeId, isDarkMode = false) => {
    // Si no hay ninguna materia con hover, quitar todos los efectos
    if (!hoveredNodeId) {
        return { 
            nodes: nodes.map(node => ({ 
                ...node, 
                className: '',        // Sin clase especial
                selected: false       // No seleccionado
            })), 
            edges: edges.map(edge => ({ 
                ...edge, 
                className: '',        // Sin clase especial
                animated: edge.type === 'cursar' // Restaurar animación original
            }))
        };
    }

    // Buscar la materia que tiene el mouse encima
    // Similar a: auto hoveredNode = find_if(nodes, [&](n){ return n.id == hoveredNodeId; });
    const hoveredNode = nodes.find(n => n.id === hoveredNodeId);
    if (!hoveredNode) {
        return { nodes, edges };  // Si no existe, devolver sin cambios
    }

    // ------------------------------------------------------------
    // PASO 1: APLICAR ESTILOS A LOS NODOS (MATERIAS)
    // ------------------------------------------------------------
    
    const highlightedNodes = nodes.map(node => {
        // Verificar si este nodo es el que tiene hover
        const isHovered = node.id === hoveredNodeId;
        
        // Verificar si este nodo está conectado al nodo con hover
        const isConnected = edges.some(edge => 
            (edge.source === node.id && edge.target === hoveredNodeId) ||
            (edge.target === node.id && edge.source === hoveredNodeId)
        );

        // Determinar qué clase CSS aplicar
        let className = '';
        if (isHovered) {
            className = 'selected-hover';      // Clase para nodo con hover
        } else if (isConnected) {
            className = 'connected';           // Clase para nodos conectados
        }

        // Devolver el nodo con estilos actualizados
        return {
            ...node,
            className,        // Clase CSS para estilos especiales
            selected: isHovered,  // Marcar como seleccionado
            style: {
                ...node.style,  // Mantener estilos originales
                // Si tiene hover: borde naranja y efecto de sombra
                ...(isHovered && {
                    borderColor: '#f59e0b',  // Naranja
                    borderWidth: '3px',      // Borde más grueso
                    boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)'  // Sombra naranja
                }),
                // Si está conectado (pero no es el hover): borde azul
                ...(isConnected && !isHovered && {
                    borderColor: isDarkMode ? '#60a5fa' : '#3b82f6',  // Azul según tema
                    borderWidth: '2px'  // Borde un poco más grueso
                })
            }
        };
    });

    // ------------------------------------------------------------
    // PASO 2: APLICAR ESTILOS A LOS EDGES (CONEXIONES)
    // ------------------------------------------------------------
    
    const highlightedEdges = edges.map(edge => {
        // Verificar si esta conexión está relacionada con el nodo con hover
        const isConnectedToHover = 
            edge.source === hoveredNodeId || 
            edge.target === hoveredNodeId;

        return {
            ...edge,
            // Clase CSS según si está conectada al hover
            className: isConnectedToHover ? 'active' : 'inactive',
            style: {
                ...edge.style,  // Mantener estilos originales
                // Si está conectada al hover: más visible
                ...(isConnectedToHover && {
                    strokeWidth: edge.type === 'final' ? 4 : 3,  // Más gruesa
                    opacity: 1  // Totalmente visible
                }),
                // Si NO está conectada al hover: casi transparente
                ...(!isConnectedToHover && {
                    opacity: 0.15  // Muy transparente
                })
            }
        };
    });

    // Devolver ambos arrays actualizados
    return { nodes: highlightedNodes, edges: highlightedEdges };
};