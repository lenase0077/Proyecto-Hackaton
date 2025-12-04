import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import dbMaterias from './data/materias.json'; // C++: #include "materias.json" (pero en JS se importa como módulo)
import CarreraSelector from './components/CarreraSelector';

// SIN IMPORT DE THEME TOGGLE (Porque lo haremos directo aquí)
// C++: Esto sería como un comentario normal //

import { 
  getLayoutElements, 
  updateNodeStyles, 
  filterEdgesByMode,
  applyHighlightStyles,
  triggerLevelConfetti,
  triggerVictoryConfetti
} from './utils'; // C++: #include "utils.h" con varias funciones

// C++: Esta función App() es como tu main(), pero en React los componentes son funciones que devuelven HTML (JSX)
export default function App() {
  // ============================================
  // ESTADOS (STATE) - Similar a variables miembro en una clase C++
  // ============================================
  
  // useState es como declarar una variable + su setter
  // El callback inicial es como un constructor que lee de localStorage
  const [selectedCarrera, setSelectedCarrera] = useState(() => {
    // C++: string selectedCarrera = localStorage.getItem(...) || "tup";
    return localStorage.getItem('selectedCarrera') || 'tup';
  });

  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [conteoRegresivo, setConteoRegresivo] = useState(0);
  
  // useNodesState/useEdgesState son hooks personalizados de reactflow
  // C++: Sería como tener vector<Node> nodes con sus funciones de modificación
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Estado para detectar si es móvil
  // C++: bool isMobile = (window.innerWidth < 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Estado para materias aprobadas con inicialización desde localStorage
  // C++: vector<string> aprobadas; // con datos cargados desde archivo
  const [aprobadas, setAprobadas] = useState(() => {
    const saved = localStorage.getItem('materiasAprobadas');
    return saved ? JSON.parse(saved) : []; // C++: Parsear un JSON sería como deserializar
  });

  // Estado para modo oscuro
  // C++: bool isDarkMode = (localStorage.getItem("appTheme") == "dark");
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem('appTheme');
      // Si dice 'light', es light. Si dice 'dark' O si no existe (null), es dark.
      return savedTheme !== 'light'; 
    });

  // Estado para modo disléxico
  const [isDyslexic, setIsDyslexic] = useState(() => {
    return localStorage.getItem('dyslexicMode') === 'true';
  });

  // ESTADO DALTONISMO
  const [isColorblind, setIsColorblind] = useState(() => {
    return localStorage.getItem('colorblindMode') === 'true';
  });
  
  // ============================================
  // EFECTOS (useEffect) - Similar a listeners o código que se ejecuta cuando cambian variables
  // ============================================
  
  // useEffect es como un observador: "Cuando isDyslexic cambie, haz esto"
  // C++: Sería como tener un observer pattern o código en un setter
  useEffect(() => { 
    localStorage.setItem('dyslexicMode', isDyslexic); 
  }, [isDyslexic]); // El array [isDyslexic] dice: "ejecuta esto solo cuando isDyslexic cambie"

  useEffect(() => { 
    localStorage.setItem('colorblindMode', isColorblind); 
  }, [isColorblind]);

  useEffect(() => { 
    localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light'); 
  }, [isDarkMode]);

  useEffect(() => { 
    localStorage.setItem('materiasAprobadas', JSON.stringify(aprobadas)); 
  }, [aprobadas]); // C++: Serializar el vector a JSON cuando cambie

  // ============================================
  // MÁS ESTADOS
  // ============================================
  
  const [viewMode, setViewMode] = useState('todas'); // C++: string viewMode = "todas";
  const [hoveredNodeId, setHoveredNodeId] = useState(null); // C++: string* hoveredNodeId = nullptr;
  const [isFooterOpen, setIsFooterOpen] = useState(false); // C++: bool isFooterOpen = false;
  const [allEdgesCache, setAllEdgesCache] = useState([]); // C++: vector<Edge> allEdgesCache;

  // ============================================
  // DATOS ESTÁTICOS (como un array constante en C++)
  // ============================================
  
  const teamMembers = [
    { name: "Durazzini Sebastian", linkedin: "https://www.linkedin.com/" },
    { name: "Martinez Alejo", linkedin: "https://www.linkedin.com/" },
    { name: "Raho Daniel", linkedin: "https://www.linkedin.com/" },
    { name: "Serrano Leandro", linkedin: "https://www.linkedin.com/" },
  ];

  // ============================================
  // EFECTO PARA CARGAR MATERIAS AL CAMBIAR CARRERA O TAMAÑO PANTALLA
  // ============================================
  
  useEffect(() => {
    // C++: Esto se ejecutaría en un constructor o método onCarreraChange()
    const listaMaterias = dbMaterias[selectedCarrera] || []; // C++: Acceso a mapa/JSON
    
    // AHORA PASAMOS isMobile A LA FUNCIÓN
    // C++: getLayoutElements sería una función que devuelve una struct {nodes, edges}
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutElements(listaMaterias, isMobile);
    
    setNodes(layoutNodes); // C++: this->nodes = layoutNodes;
    setEdges(layoutEdges);
    setAllEdgesCache(layoutEdges);
    setViewMode('todas');
  }, [selectedCarrera, isMobile, setNodes, setEdges]); // Dependencias: si cambian, se re-ejecuta

  // ============================================
  // EFECTO PARA DETECTAR CAMBIOS DE TAMAÑO DE VENTANA
  // ============================================
  
  useEffect(() => {
    // C++: Esto sería como un event listener en una GUI
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      // Solo actualizamos si cambia la categoría (para no renderizar a cada pixel)
      setIsMobile(prev => {
        if (prev !== mobile) return mobile;
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    // C++: IMPORTANTE: El return es como un destructor - limpia el event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Array vacío [] = "ejecuta solo una vez al montar el componente"

  // ============================================
  // EFECTO PARA ACTUALIZAR ESTILOS DE NODOS Y LÍNEAS
  // ============================================
  
  useEffect(() => {
    if (nodes.length === 0) return; // C++: if (nodes.empty()) return;
    
    // 1. Estilos de Nodos (como aplicar estilos CSS dinámicamente)
    const styledNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode, isColorblind);
    
    // 2. Estilos de Líneas
    const { nodes: finalNodes, edges: finalEdges } = applyHighlightStyles(
        styledNodes, 
        hoveredNodeId ? edges : filterEdgesByMode(allEdgesCache, viewMode, styledNodes, aprobadas), 
        hoveredNodeId,
        isDarkMode,
        viewMode,
        isColorblind,
        aprobadas
    );
    
    setNodes(finalNodes);
    setEdges(finalEdges);

  }, [aprobadas, isDarkMode, isColorblind, hoveredNodeId, nodes.length, viewMode]);
  // C++: Observa estas variables y cuando cambian, re-ejecuta

  // ============================================
  // MANEJADORES DE EVENTOS (Event handlers)
  // ============================================
  
  const handleCarreraChange = (nuevaCarrera) => {
    // C++: void handleCarreraChange(string nuevaCarrera) { ... }
    setSelectedCarrera(nuevaCarrera);
    localStorage.setItem('selectedCarrera', nuevaCarrera);
  };

  // useCallback es como memoizar una función para no recrearla en cada render
  // C++: Sería como tener una función miembro constante
  const onNodeClick = useCallback((event, node) => {
    // C++: void onNodeClick(Event event, Node node) { ... }
    if (!node.data?.clickable) return; // C++: if (!node.data || !node.data->clickable) return;
    
    const matId = node.id; // C++: string matId = node.id;
    
    // Chequeamos si la estamos desmarcando
    const isUnchecking = aprobadas.includes(matId); // C++: find(aprobadas.begin(), aprobadas.end(), matId)
    let nuevasAprobadas;
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    
    if (isUnchecking) {
        // ========== LÓGICA PARA DESMARCAR (y desmarcar dependientes) ==========
        // C++: Esto es como un algoritmo de búsqueda en grafos
        // 1. Iniciamos un Set con la materia que acabamos de clickear
        const idsAElminar = new Set([matId]); // C++: unordered_set<string> idsAEliminar = {matId};
        
        // 2. Usamos una pila para buscar recursivamente hacia adelante
        const pilaDeBusqueda = [matId]; // C++: stack<string> pilaDeBusqueda; pilaDeBusqueda.push(matId);

        while (pilaDeBusqueda.length > 0) {
            const idActual = pilaDeBusqueda.pop(); // C++: string idActual = pilaDeBusqueda.top(); pilaDeBusqueda.pop();

            // Buscamos todas las materias que requieren 'idActual' (para cursar o final)
            const dependientes = listaMaterias.filter(m => {
                // C++: filter sería como copy_if con una condición lambda
                const reqCursada = m.requiere_para_cursar || [];
                const reqFinal = m.requiere_para_final || [];
                return reqCursada.includes(idActual) || reqFinal.includes(idActual);
            });

            dependientes.forEach(dep => {
                // Si la dependiente está aprobada y no la hemos marcado para borrar aún...
                if (aprobadas.includes(dep.id) && !idsAElminar.has(dep.id)) {
                    idsAElminar.add(dep.id);      // La marcamos para borrar
                    pilaDeBusqueda.push(dep.id);  // La agregamos a la pila para buscar SUS hijas
                }
            });
        }

        // 3. Filtramos: Nos quedamos solo con las que NO están en el Set de eliminar
        nuevasAprobadas = aprobadas.filter(id => !idsAElminar.has(id));
        // C++: copy_if(aprobadas.begin(), aprobadas.end(), back_inserter(nuevasAprobadas), 
        //        [&](const string& id){ return idsAEliminar.find(id) == idsAEliminar.end(); });
        
    } else {
        // ========== LÓGICA PARA MARCAR COMO APROBADA ==========
        nuevasAprobadas = [...aprobadas, matId]; // C++: vector<string> nuevasAprobadas = aprobadas; nuevasAprobadas.push_back(matId);
        
        // DATOS PARA CALCULAR NIVELES
        const listaMaterias = dbMaterias[selectedCarrera] || [];
        const materiaActual = node.data.originalData;
        
        // Calculamos nivel actual
        const nivelActual = materiaActual.nivel || (materiaActual.posY ? materiaActual.posY + 1 : 1);

        // Filtramos materias de ese nivel
        const materiasDelNivel = listaMaterias.filter(m => {
            const mNivel = m.nivel || (m.posY ? m.posY + 1 : 1);
            return mNivel === nivelActual;
        });

        // Verificaciones
        const nivelCompleto = materiasDelNivel.every(m => nuevasAprobadas.includes(m.id));
        const carreraCompleta = listaMaterias.every(m => nuevasAprobadas.includes(m.id));

        // --- LÓGICA DE FIESTA Y SONIDO ---
        if (carreraCompleta) {
             // 🏆 GANASTE LA CARRERA
             setTimeout(() => {
                const audioVictory = new Audio('/sounds/victory.mp3');
                audioVictory.volume = 0.6; // Volumen controlado
                audioVictory.play().catch(e => console.error(e));
                
                triggerVictoryConfetti(); // Lluvia con colores del tema
             }, 100);

        } else if (nivelCompleto) {
             // ⭐️ COMPLETASTE EL NIVEL
             setTimeout(() => {
                const audioLevel = new Audio('/sounds/Celebracion-Nivel.mp3');

                audioLevel.playbackRate = 0.9 + Math.random() * 0.3; // Pequeña variación
                audioLevel.preservesPitch = false;
                audioLevel.volume = 0.6; // Volumen controlado
                audioLevel.play().catch(e => console.error(e));
                
                triggerLevelConfetti();   // Explosión Dorada
             }, 100);

        } else {
             // 🔹 MATERIA INDIVIDUAL (Pop con Pitch Variable)
             const audioPop = new Audio('/sounds/pop.mp3');
             audioPop.volume = 0.4; // Más suave
             // Variación aleatoria de tono (0.9 a 1.1) para que suene orgánico
             audioPop.playbackRate = 0.9 + Math.random() * 0.3;
             audioPop.preservesPitch = false;
             audioPop.play().catch(() => {});
        }
    }
    
    setAprobadas(nuevasAprobadas); // C++: this->aprobadas = nuevasAprobadas;
  }, [aprobadas, selectedCarrera]); // Dependencias: esta función se recrea si aprobadas o selectedCarrera cambian

  
  // ============================================
  // CÁLCULO DE PROGRESO
  // ============================================

  const totalMaterias = nodes.length;
  const aprobadasCount = nodes.filter(n => aprobadas.includes(n.id)).length;
  const porcentaje = totalMaterias > 0 
      ? Math.round((aprobadasCount / totalMaterias) * 100) 
      : 0;


  // ============================================
  // LÓGICA DEL TOOLTIP INTELIGENTE
  // ============================================
  const renderTooltip = () => {
    // 1. Si no hay hover o el nodo no existe, no mostramos nada
    if (!hoveredNodeId) return null;
    const node = nodes.find(n => n.id === hoveredNodeId);
    if (!node) return null;

    const mat = node.data?.originalData;
    if (!mat) return null;

    // 2. Si la materia YA está aprobada o disponible, no mostramos el tooltip de bloqueo
    // (Opcional: podrías mostrar info extra aquí si quisieras)
    const estaAprobada = aprobadas.includes(mat.id);
    if (estaAprobada) return null;

    // 3. Calculamos qué falta
    const faltantes = [];
    
    // Revisamos cursadas requeridas
    if (mat.requiere_para_cursar) {
        mat.requiere_para_cursar.forEach(reqId => {
            if (!aprobadas.includes(reqId)) {
                // Buscamos el nombre de la materia faltante
                const reqNode = nodes.find(n => n.id === reqId);
                if (reqNode) faltantes.push({ nombre: reqNode.data.label, tipo: 'Cursada' });
            }
        });
    }

    // Revisamos finales requeridos
    if (mat.requiere_para_final) {
        mat.requiere_para_final.forEach(reqId => {
            if (!aprobadas.includes(reqId)) {
                const reqNode = nodes.find(n => n.id === reqId);
                // Evitamos duplicados si falta cursada y final de la misma
                if (reqNode && !faltantes.some(f => f.nombre === reqNode.data.label)) {
                    faltantes.push({ nombre: reqNode.data.label, tipo: 'Final' });
                }
            }
        });
    }

    // 4. Si no falta nada (está disponible), no mostramos tooltip
    if (faltantes.length === 0) return null;

    // 5. Renderizamos la tarjeta
    return (
      <div className="smart-tooltip">
        <div className="tooltip-header">
            <span className="lock-icon">🔒</span> 
            <strong>{mat.nombre}</strong>
        </div>
        <div className="tooltip-divider"></div>
        <p className="tooltip-label">Para desbloquear necesitas:</p>
        <ul className="tooltip-list">
            {faltantes.map((f, i) => (
                <li key={i}>
                    • {f.nombre}
                </li>
            ))}
        </ul>
      </div>
    );
  };

  // ============================================
  //  FUNCIÓN COMPARTIR EN LINKEDIN
  // ============================================
  const handleShareLinkedIn = () => {
    // 1. Buscamos el nombre de la carrera actual
    const nombresCarreras = {
      'tup': 'Tecnicatura Universitaria en Programación',
      'admi': 'Tecnicatura Universitaria en Administración',
      'moldes': 'Tecnicatura en Moldes y Matrices',
      'automotriz': 'Tecnicatura en Industria Automotriz'
    };
    // Si no encuentra la carrera, usa un nombre genérico
    const nombreCarrera = nombresCarreras[selectedCarrera] || 'Mi Carrera UTN';

    // 2. Calculamos las estadísticas matemáticas
    const total = nodes.length; // Cantidad total de nodos (materias)
    const aprobadasCount = aprobadas.length; // Cantidad que ya aprobaste
    // Calculamos porcentaje (evitando dividir por cero)
    const porcentaje = total > 0 ? Math.round((aprobadasCount / total) * 100) : 0;

    // 3. Buscamos tus "Mejores Logros" (Materias de nivel más alto aprobadas)
    const logros = nodes
      .filter(n => aprobadas.includes(n.id)) // Solo miramos las aprobadas
      .map(n => n.data.originalData)         // Sacamos la info útil (nombre, nivel)
      .sort((a, b) => (b.nivel || 0) - (a.nivel || 0)) // Ordenamos de Mayor a Menor Nivel
      .slice(0, 3) // Nos quedamos solo con las 3 primeras (las más difíciles)
      .map(m => m.nombre); // Nos quedamos solo con el nombre

    // 4. Buscamos tu "Próximo Desafío" (Materia disponible pero NO aprobada)
    const siguienteObjetivo = nodes.find(n => {
      if (aprobadas.includes(n.id)) return false; // Si ya la aprobé, no cuenta
      
      const mat = n.data.originalData;
      // Verificamos si tengo las correlativas para cursarla
      const reqCursadas = mat.requiere_para_cursar || [];
      const reqFinales = mat.requiere_para_final || [];
      const tieneCursadas = reqCursadas.every(id => aprobadas.includes(id));
      const tieneFinales = reqFinales.every(id => aprobadas.includes(id));
      
      return tieneCursadas && tieneFinales; // Devuelve true si está "Disponible"
    });

    // 5. Armamos el texto profesional con emojis
    // \n significa "salto de línea" (enter)
    const texto = `🚀 Progreso Académico: ${nombreCarrera}
    He completado el ${porcentaje}% de mi plan de estudios en la UTN.
    ✅ Materias Aprobadas: ${aprobadasCount} de ${total}

    🏆 Últimos logros desbloqueados:
    ${logros.length > 0 ? logros.map(l => `• ${l}`).join('\n') : '• Iniciando el camino'}

    ${siguienteObjetivo ? `🎯 Próximo objetivo: ${siguienteObjetivo.data.originalData.nombre}` : '🎓 ¡Recta final!'}

    #UTN #Pathfinder #DesarrolloProfesional #Educación #Hackathon`.trim(); // .trim() borra espacios vacíos al inicio y final

    // 2. TEMPORIZADOR
    navigator.clipboard.writeText(texto).then(async () => {
      
      setMostrarNotificacion(true); // Mostramos el cartel

      // Iniciamos un bucle de 3 pasos (3, 2, 1)
      for (let i = 3; i > 0; i--) {
        setConteoRegresivo(i); // Actualizamos el número en pantalla
        // Esperamos 1 segundo (1000 milisegundos) antes de seguir
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Cuando termina el bucle (llega a 0):
      setConteoRegresivo(0); // Reseteamos numero
      
      // ABRIMOS LINKEDIN
      window.open('https://www.linkedin.com/feed/', '_blank');

      // Ocultamos el cartelito un segundo después de abrir, para limpiar
      setTimeout(() => setMostrarNotificacion(false), 1000);

    });
  };

  // ============================================
  // FUNCIÓN EXPORTAR IMAGEN (Versión CDN)
  // ============================================
  const downloadImage = useCallback(() => {
    // Buscamos el div que contiene el grafo
    const elem = document.querySelector('.react-flow');
    
    if (!elem || !window.htmlToImage) return;

    // Usamos la variable global window.htmlToImage
    window.htmlToImage.toPng(elem, {
      backgroundColor: isDarkMode ? '#111827' : '#f8fafc', // Forzamos el color de fondo
      style: {
        width: '100%',
        height: '100%',
      } 
    }).then((dataUrl) => {
      // Creamos un link fantasma para descargar
      const link = document.createElement('a');
      link.download = `Plan-${selectedCarrera}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    }).catch((err) => {
      console.error('Error al exportar imagen:', err);
    });
  }, [isDarkMode, selectedCarrera]);

  // ============================================
  // CÁLCULO DE MATERIAS DISPONIBLES
  // ============================================

const disponiblesCount = nodes.filter(n => {
    // 1. Si ya está aprobada, no cuenta como "disponible" (ya la hiciste)
    if (aprobadas.includes(n.id)) return false;
    
    const mat = n.data?.originalData;
    if (!mat) return false;
    
    // 2. Revisamos si cumples todos los requisitos
    const reqCursadas = mat.requiere_para_cursar || [];
    const reqFinales = mat.requiere_para_final || [];
    
    const tieneCursadas = reqCursadas.every(id => aprobadas.includes(id));
    const tieneFinales = reqFinales.every(id => aprobadas.includes(id));
    
    // 3. Si tienes todo, está disponible
    return tieneCursadas && tieneFinales;
  }).length;



  // ============================================
  // RENDER (RETURN) - Esto es lo que se dibuja en pantalla
  // ============================================
  // C++: En una GUI de C++ sería como el método paint() o render()
  
  return (
    // El className dinámico es como tener clases CSS condicionales
    // C++: Sería como string className = "app-container " + (isDarkMode ? "dark-mode " : "") + ...
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} ${isFooterOpen ? 'footer-open' : ''} ${isDyslexic ? 'dyslexic-mode' : ''} ${isColorblind ? 'colorblind-mode' : ''}`}>
      
      {/* HEADER */}
      {/* Esto es JSX: parece HTML pero es JavaScript */}
      <div style={{
        padding: '10px 20px',
        background: isDarkMode ? '#1f2937' : '#3b82f6', // Estilos inline condicionales
        color: 'white',
        display: 'flex', flexDirection: 'column', gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {/* LADO IZQUIERDO: Logo y Título */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                  {/* SVG del logo - esto es como un widget gráfico en C++ */}
                  <svg className="utn-logo-svg" viewBox="0 0 595.3 699.4" height="45" fill="currentColor" style={{ minWidth: '30px' }}>
                      <path clipRule="evenodd" d="M246.6 0h102v190.8C429.4 168.4 489 94.1 489 6.4h106.3c0 146.5-106.8 268.9-246.6 293.2v4.4h233.9v104.2H368.2c130 31.8 227 149.5 227 289.1H489c0-87.7-59.6-162-140.3-184.4v186.5h-102V512.9c-80.7 22.4-140.3 96.7-140.3 184.4H0C0 557.7 97 440 227 408.2H12.8V304h233.9v-4.4C106.8 275.3 0 152.9 0 6.4h106.3c0 87.7 59.6 162 140.3 184.4z" fillRule="evenodd"/>
                  </svg>
                  <h1 style={{ margin: 0, fontSize: '1.3rem', lineHeight: 1 }}>UTN Pathfinder</h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                Hackea tu carrera. Visualiza tu camino
              </p>
            </div>
            
            {/* LADO DERECHO: Botones y Controles */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              
              {/* FILA 1: Botón Tema + Contador Aprobadas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                
                {/* 1. Botón Dark Mode (A la izquierda) */}
                {/* onClick es como un event handler en C++: button->onClick = [this]{ setIsDarkMode(!isDarkMode); }; */}
                

                {/* 2. Contador (A la derecha) */}
                <div style={{
                  background: 'rgba(34, 197, 94, 0.25)', // Verde transparente
                  border: '1px solid rgba(34, 197, 94, 0.5)', // Borde verde sutil
                  color: '#86efac', // Texto verde claro brillante
                  padding: '0 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  display: 'flex', 
                  alignItems: 'center',
                  height: '35px',
                  whiteSpace: 'nowrap' // Para que no se rompa el texto en móviles
                }} title="Total de finales aprobados">
                  <span>✅ Aprobadas: <strong>{aprobadas.length}</strong></span>
                </div>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.25)', // Fondo azulado transparente
                  border: '1px solid rgba(59, 130, 246, 0.5)', // Borde sutil
                  color: '#93c5fd', // Texto celeste claro (se lee bien en dark y light)
                  padding: '0 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  display: 'flex', 
                  alignItems: 'center',
                  height: '35px',
                  whiteSpace: 'nowrap' // Que no se rompa el texto
                }} title="Materias que ya puedes cursar">
                  <span>🚀 Disponibles: <strong>{disponiblesCount}</strong></span>
                </div>

              </div>

              {/* FILA 2: Botones Accesibilidad (Bajados) */}
              
              <div style={{ display: 'flex', gap: '8px' }}>

                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', 
                    border: 'none', 
                    color: 'white',
                    width: '35px', 
                    height: '35px', 
                    borderRadius: '50%',
                    cursor: 'pointer', 
                    fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1
                  }}
                  title={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
                >
                  {isDarkMode ? '☀️' : '🌙'} {/* Texto condicional del botón */}
                </button>
                
                  <button
                    onClick={() => setIsDyslexic(!isDyslexic)}
                    style={{
                       background: isDyslexic ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                       border: '1px solid rgba(255,255,255,0.3)', color: 'white',
                       borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem',
                       cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                    }}
                    title="Fuente para dislexia"
                  >
                    {isDyslexic ? '👁️ Dislexia ON' : '👁️ Dislexia OFF'}
                  </button>

                  <button
                    onClick={() => setIsColorblind(!isColorblind)}
                    style={{
                       background: isColorblind ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                       border: '1px solid rgba(255,255,255,0.3)', color: 'white',
                       borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem',
                       cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                    }}
                    title="Modo alto contraste para daltonismo"
                  >
                    {isColorblind ? '🎨 Daltonismo ON' : '🎨 Daltonismo OFF'}
                  </button>
              </div>
            </div>
        </div>

        {/* Selector de Carrera */}
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '5px' }}>
             {/* CarreraSelector es como un widget/componente personalizado */}
             {/* currentCarrera y onSelect son "props" (parámetros del componente) */}
             {/* C++: Sería como CarreraSelector selector(currentCarrera, onSelectFunction); */}
             <CarreraSelector currentCarrera={selectedCarrera} onSelect={handleCarreraChange} />
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div style={{
        padding: '8px 15px',
        background: isDarkMode ? '#0a0f18ff' : '#e4e8ecff',
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
      }}>
        
        {/* Mapear un array a elementos JSX - similar a un for loop en C++ que crea botones */}
        <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#d1d5db' : '#252a31ff' }}>Filtros:</span>
        
        {/* Mapear un array a elementos JSX - similar a un for loop en C++ que crea botones */}
        {['todas', 'cursar', 'final', 'simplificada'].map((mode) => (
          <button
            key={mode} // key es como un ID único para React (necesario en listas)
            onClick={() => setViewMode(mode)}
            style={{
              padding: '5px 12px', borderRadius: '15px', border: 'none',
              background: viewMode === mode 
                ? (mode === 'final' ? '#ef4444' : mode === 'simplificada' ? '#10b981' : '#3b82f6')
                : (isDarkMode ? '#374151' : '#e2e8f0'),
              color: viewMode === mode ? 'white' : (isDarkMode ? '#9ca3af' : '#64748b'),
              cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
            }}
          >
            {/* mode.charAt(0).toUpperCase() + mode.slice(1) = poner primera letra mayúscula */}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}

        <div className="progress-section">
            <span className="progress-text">
                {aprobadasCount}/{totalMaterias} ({porcentaje}%)
            </span>
            <div className="progress-track" title={`${porcentaje}% Completado`}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${porcentaje}%` }}
                ></div>
            </div>
        </div>

        <button 
          onClick={handleShareLinkedIn}
          className="btn-download"
          style={{ marginRight: '5px' }} // Separación con la cámara
          title="Copiar resumen para LinkedIn"
        >
        <svg 
            width="20px" 
            height="20px" 
            viewBox="0 0 382 382" 
            fill="currentColor" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889 C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056 H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806 c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1 s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73 c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079 c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426 c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472 L341.91,330.654L341.91,330.654z"/>
          </svg>

        </button>

        <button 
              onClick={downloadImage}
              className="btn-download"
              title="Guardar imagen"
            >
              📷
          </button>
      </div>

      {/* ÁREA PRINCIPAL DEL GRAFO */}
      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length > 0 ? (
          // Conditional rendering: si hay nodos, mostrar ReactFlow, sino mensaje
          // C++: if (nodes.size() > 0) { dibujarGrafo(); } else { dibujarMensaje(); }
          
          // ReactFlow es como un widget de gráfico/como un QGraphicsView en Qt
          <ReactFlow
            nodes={nodes} edges={edges}
            
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={(e, n) => setHoveredNodeId(n.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            fitView minZoom={0.1}

            nodesDraggable={false} nodesConnectable={false}
          >
            <Background color={isDarkMode ? "#4b5563" : "#cbd5e1"} gap={20} variant="dots"/>
            <Controls position="bottom-right" />
          </ReactFlow>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: isDarkMode ? '#fff' : '#000' }}>
            <h3>No hay datos para esta carrera aún</h3>
            <p>Selecciona otra o agrega materias en el JSON.</p>
          </div>
        )}
      </div>
      
      {/* LEYENDA */}
      {/* className es como class en HTML pero en JSX */}
      <div className="legend-container">
        <div className="legend-item"><div className="legend-dot aprobada"></div><span>Aprobada</span></div>
        <div className="legend-item"><div className="legend-dot disponible"></div><span>Disponible</span></div>
        <div className="legend-item"><div className="legend-dot bloqueada"></div><span>Bloqueada</span></div>
      </div>
      
      {/* FOOTER (PIE DE PÁGINA) */}
      <footer className={`app-footer ${isFooterOpen ? 'open' : ''}`}>
        <button className="footer-toggle-btn" onClick={() => setIsFooterOpen(!isFooterOpen)}>
          <span style={{ display: 'inline-block', transform: isFooterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', marginRight: '5px' }}>▲</span>
          {isFooterOpen ? 'CERRAR' : 'CRÉDITOS'}
        </button>

        <div className="footer-container">
          <div className="footer-brand">
            <h3>🎓 UTN Pathfinder</h3>
            <p>De los Dynamics Pointers para la UTN.</p>
            <p>Herramienta interactiva diseñada para planificar y visualizar el flujo de correlatividad de manera inteligente</p>
            <span className="copyright">© 2025 - Todos los derechos reservados - Hecho con ❤️ para la comunidad</span>
          </div>

          <div className="footer-team">
            <h4>Desarrollado por:</h4>
            <div className="team-grid">
              {/* Mapear el array teamMembers a enlaces */}
              {teamMembers.map((member, index) => (
                <a key={index} href={member.linkedin} target="_blank" rel="noopener noreferrer" className="team-link">
                  {member.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      {/*Notificación Flotante*/}

      <div className={`toast-notification ${mostrarNotificacion ? 'show' : ''}`}>
        {conteoRegresivo > 0 ? (
           // MENSAJE DURANTE LA CUENTA REGRESIVA
           <span>📋 ¡Texto copiado! Redirigiendo a LinkedIn en <strong>{conteoRegresivo}...</strong></span>
        ) : (
           // MENSAJE FINAL (O POR DEFECTO)
           <span>🚀 ¡Listo! Ahora pégalo en tu post (Ctrl + V)</span>
        )}
      </div>

      {renderTooltip()}
    </div>
  );
  // Fin del return y de la función App
}