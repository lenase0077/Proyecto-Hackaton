// ============================================================================
// 1. IMPORTS
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Estilos y Componentes
import './App.css';
import MatrixRain from './components/MatrixRain';
import CarreraSelector from './components/CarreraSelector';

// Datos y Utilidades
import dbMaterias from './data/materias.json';
import { 
  getLayoutElements, 
  updateNodeStyles, 
  filterEdgesByMode,
  applyHighlightStyles,
  triggerLevelConfetti,
  triggerVictoryConfetti,
  ACHIEVEMENTS
} from './utils';

// ============================================================================
// 2. COMPONENTE PRINCIPAL
// ============================================================================

export default function App() {

  // ============================================================================
  // 3. GESTIÓN DE ESTADO (STATE)
  // ============================================================================

  // --- Datos Persistentes ---
  const [selectedCarrera, setSelectedCarrera] = useState(() => localStorage.getItem('selectedCarrera') || 'tup');
  
  const [aprobadas, setAprobadas] = useState(() => {
    const saved = localStorage.getItem('materiasAprobadas');
    return saved ? JSON.parse(saved) : [];
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const saved = localStorage.getItem('unlockedAchievements');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Configuración Visual ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('appTheme');
    return saved !== 'light'; 
  });
  const [isDyslexic, setIsDyslexic] = useState(() => localStorage.getItem('dyslexicMode') === 'true');
  const [isColorblind, setIsColorblind] = useState(() => localStorage.getItem('colorblindMode') === 'true');

  // --- Grafo ---
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [allEdgesCache, setAllEdgesCache] = useState([]);
  const [viewMode, setViewMode] = useState('todas');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // --- UI & Herramientas ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [isMatrixMode, setIsMatrixMode] = useState(false);
  
  // --- Modals y Popups ---
  const [showCalculator, setShowCalculator] = useState(false);
  const [showStats, setShowStats] = useState(false); // <--- ESTE FALTABA Y CAUSABA EL ERROR
  const [showAchievements, setShowAchievements] = useState(false);
  
  const [ritmoEstudio, setRitmoEstudio] = useState(3);
  
  // --- Notificaciones ---
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false); // LinkedIn toast
  const [conteoRegresivo, setConteoRegresivo] = useState(0);

  // --- Tutorial ---
  const [isTutorialActive, setIsTutorialActive] = useState(false);

  // --- Referencias de Audio ---
  const currentaudioLevel = useRef(null);
  const currentaudioVictory = useRef(null);


  // ============================================================================
  // 4. LÓGICA DE NEGOCIO (HELPERS)
  // ============================================================================

  // Cálculos Estadísticos
  const totalMaterias = nodes.length;
  const aprobadasCount = nodes.filter(n => aprobadas.includes(n.id)).length;
  const porcentaje = totalMaterias > 0 ? Math.round((aprobadasCount / totalMaterias) * 100) : 0;

  const disponiblesCount = nodes.filter(n => {
    if (aprobadas.includes(n.id)) return false;
    const mat = n.data?.originalData;
    if (!mat) return false;
    const reqCursadas = mat.requiere_para_cursar || [];
    const reqFinales = mat.requiere_para_final || [];
    const tieneCursadas = reqCursadas.every(id => aprobadas.includes(id));
    const tieneFinales = reqFinales.every(id => aprobadas.includes(id));
    return tieneCursadas && tieneFinales;
  }).length;

  // Frase Motivacional
  const getMotivationalQuote = (porc) => {
    if (porc === 0) return "¡Todo camino de mil millas comienza con un primer paso! 🚀";
    if (porc < 25) return "¡Buen comienzo! La constancia es la clave del éxito. 🌱";
    if (porc < 50) return "¡Vas genial! Estás construyendo tu futuro materia a materia. 🔥";
    if (porc < 75) return "¡Ya pasaste la mitad! Sos imparable, la meta está cerca. 🏃‍♂️";
    if (porc < 100) return "¡Recta final! Nada te detiene, ¡a por ese título! 🎓";
    return "¡FELICITACIONES! Has completado la carrera. ¡Sos leyenda! 🏆";
  };

  // Sistema de Logros
  const triggerAchievement = (achId) => {
    if (unlockedAchievements.includes(achId) || isTutorialActive) return;

    const ach = ACHIEVEMENTS.find(a => a.id === achId);
    if (!ach) return;

    setUnlockedAchievements(prev => [...prev, achId]);
    setIsClosing(false); 
    setCurrentNotification(ach);

    const audio = new Audio('/sounds/Archivement.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 1;
    audio.preservesPitch = false;
    audio.play().catch(() => {});

    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setCurrentNotification(null);
        setIsClosing(false);
      }, 600); 
    }, 4000);
  };


  // ============================================================================
  // 5. EFECTOS (SIDE EFFECTS)
  // ============================================================================

  // Persistencia
  useEffect(() => localStorage.setItem('dyslexicMode', isDyslexic), [isDyslexic]);
  useEffect(() => localStorage.setItem('colorblindMode', isColorblind), [isColorblind]);
  useEffect(() => localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light'), [isDarkMode]);
  useEffect(() => localStorage.setItem('materiasAprobadas', JSON.stringify(aprobadas)), [aprobadas]);
  useEffect(() => localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements)), [unlockedAchievements]);

  // Responsive & Konami
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let keyIndex = 0;
    const handleKeyDown = (e) => {
      if (e.key === konamiCode[keyIndex]) {
        keyIndex++;
        if (keyIndex === konamiCode.length) {
          setIsMatrixMode(p => !p);
          if (!isMatrixMode) { 
              const audio = new Audio('/sounds/matrix.mp3');
              audio.volume = 1.0;
              audio.play().catch(() => {});
          }
          keyIndex = 0;
        }
      } else { keyIndex = 0; }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMatrixMode]);

  // Carga de Carrera y Grafo
  useEffect(() => {
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutElements(listaMaterias, isMobile);
    const styledNodes = updateNodeStyles(layoutNodes, layoutEdges, aprobadas, isDarkMode, isColorblind);
    
    const { nodes: finalNodes, edges: finalEdges } = applyHighlightStyles(
        styledNodes, layoutEdges, null, isDarkMode, 'todas', isColorblind, aprobadas
    );
    
    setNodes(finalNodes);
    setEdges(finalEdges);
    setAllEdgesCache(layoutEdges);
    setViewMode('todas');
  }, [selectedCarrera, isMobile, setNodes, setEdges, isDarkMode, isColorblind, aprobadas]);

  // Actualización Visual Rápida
  useEffect(() => {
    if (nodes.length === 0) return;
    const styledNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode, isColorblind);
    const { nodes: finalNodes, edges: finalEdges } = applyHighlightStyles(
        styledNodes, 
        hoveredNodeId ? edges : filterEdgesByMode(allEdgesCache, viewMode, styledNodes, aprobadas), 
        hoveredNodeId, isDarkMode, viewMode, isColorblind, aprobadas
    );
    setNodes(finalNodes);
    setEdges(finalEdges);
  }, [hoveredNodeId, viewMode]);

  // Monitor Logros Automáticos
  useEffect(() => {
    if (nodes.length === 0) return;
    ACHIEVEMENTS.forEach(ach => {
      if (ach.condition(aprobadas, nodes)) triggerAchievement(ach.id);
    });
  }, [aprobadas, nodes, unlockedAchievements]);

  // Tutorial
  useEffect(() => {
    const tutorialVisto = localStorage.getItem('tutorial_visto_v1');
    if (!tutorialVisto && nodes.length > 0 && window.driver) {
      setIsTutorialActive(true);
      const driver = window.driver.js.driver;

      window.cerrarTutorial = () => {
          localStorage.setItem('tutorial_visto_v1', 'true');
          setIsTutorialActive(false);
          if (window.tourDriver) window.tourDriver.destroy();
      };
      
      const driverObj = driver({
        showProgress: true, animate: true,
        nextBtnText: 'Siguiente ▶️', prevBtnText: 'Anterior', doneBtnText: '¡Comenzar! 🚀',
        steps: [
          { element: '.utn-logo-svg', popover: { title: '¡Bienvenido a UTN Pathfinder!', description: `Tu mapa interactivo para hackear la carrera.<br/><br/><div style="text-align: right;"><button onclick="window.cerrarTutorial()" style="background:transparent;border:none;color:#9ca3af;cursor:pointer;">SALTAR ✕</button></div>` } },
          { element: '#carrera-selector-tour', popover: { title: 'Elige tu destino', description: 'Selecciona tu carrera aquí.' } },
          { element: '.react-flow', popover: { title: 'Mapa Interactivo', description: 'Haz clic para aprobar materias.' } },
          { element: '#btn-calculator-tour', popover: { title: 'Oráculo', description: 'Predice tu fecha de graduación.' } },
          { element: '#btn-critical-tour', popover: { title: '🔥 Ruta Crítica', description: 'El camino más largo de correlativas.' } }
        ],
        onDestroyStarted: () => {
           if (!localStorage.getItem('tutorial_visto_v1')) {
               localStorage.setItem('tutorial_visto_v1', 'true');
               setIsTutorialActive(false);
           }
        }
      });
      window.tourDriver = driverObj;
      setTimeout(() => { driverObj.drive(); }, 1500);
    }
  }, [nodes.length]);


  // ============================================================================
  // 6. HANDLERS
  // ============================================================================

  const handleCarreraChange = (nuevaCarrera) => {
    setSelectedCarrera(nuevaCarrera);
    localStorage.setItem('selectedCarrera', nuevaCarrera);
  };

  const handleShareLinkedIn = () => {
    const nombres = { 'tup': 'TUP', 'admi': 'TUA', 'moldes': 'Moldes', 'automotriz': 'Automotriz' };
    const carrera = nombres[selectedCarrera] || 'UTN';
    const texto = `🚀 Progreso Académico: ${carrera}\nCompletado: ${porcentaje}%\n✅ Materias: ${aprobadasCount}/${totalMaterias}\n\n#UTN #Pathfinder`;
    
    navigator.clipboard.writeText(texto).then(async () => {
      setMostrarNotificacion(true);
      for (let i = 3; i > 0; i--) { setConteoRegresivo(i); await new Promise(r => setTimeout(r, 1000)); }
      setConteoRegresivo(0);
      window.open('https://www.linkedin.com/feed/', '_blank');
      setTimeout(() => setMostrarNotificacion(false), 1000);
    });
  };

  const downloadImage = useCallback(() => {
    const elem = document.querySelector('.react-flow');
    if (!elem || !window.htmlToImage) return;
    window.htmlToImage.toPng(elem, {
      backgroundColor: isDarkMode ? '#111827' : '#f8fafc',
      style: { width: '100%', height: '100%' }
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `Plan-${selectedCarrera}.png`;
      link.href = dataUrl;
      link.click();
    });
  }, [isDarkMode, selectedCarrera]);

  const onNodeClick = useCallback((event, node) => {
    if (!node.data?.clickable) return;
    const matId = node.id;
    const isUnchecking = aprobadas.includes(matId);
    let nuevasAprobadas;
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    
    if (isUnchecking) {
        // Desmarcar en cascada
        const idsAElminar = new Set([matId]);
        const pila = [matId];
        while (pila.length > 0) {
            const idActual = pila.pop();
            const dependientes = listaMaterias.filter(m => 
                (m.requiere_para_cursar || []).includes(idActual) || 
                (m.requiere_para_final || []).includes(idActual)
            );
            dependientes.forEach(dep => {
                if (aprobadas.includes(dep.id) && !idsAElminar.has(dep.id)) {
                    idsAElminar.add(dep.id);
                    pila.push(dep.id);
                }
            });
        }
        nuevasAprobadas = aprobadas.filter(id => !idsAElminar.has(id));
    } else {
        // Marcar
        nuevasAprobadas = [...aprobadas, matId];
        // Efectos
        const mat = node.data.originalData;
        const nivel = mat.nivel || (mat.posY ? mat.posY + 1 : 1);
        const matsNivel = listaMaterias.filter(m => (m.nivel || (m.posY ? m.posY + 1 : 1)) === nivel);
        const nivelCompleto = matsNivel.every(m => nuevasAprobadas.includes(m.id));
        const carreraCompleta = listaMaterias.every(m => nuevasAprobadas.includes(m.id));

        if (carreraCompleta) {
             if (currentaudioVictory.current) { currentaudioVictory.current.pause(); currentaudioVictory.current.currentTime = 0; }
             setTimeout(() => {
                const audio = new Audio('/sounds/victory.mp3');
                currentaudioVictory.current = audio;
                audio.volume = 0.9;
                audio.play().catch(() => {});
                triggerVictoryConfetti();
             }, 100);
        } else if (nivelCompleto) {
             if (currentaudioLevel.current) { currentaudioLevel.current.pause(); currentaudioLevel.current.currentTime = 0; }
             setTimeout(() => {
                const audio = new Audio('/sounds/Celebracion-Nivel.mp3');
                currentaudioLevel.current = audio;
                audio.volume = 0.6;
                audio.play().catch(() => {});
                triggerLevelConfetti();
             }, 100);
        } else {
             const audio = new Audio('/sounds/pop.mp3');
             audio.volume = 0.4;
             audio.playbackRate = 0.9 + Math.random() * 0.3;
             audio.preservesPitch = false;
             audio.play().catch(() => {});
        }
    }
    setAprobadas(nuevasAprobadas);
  }, [aprobadas, selectedCarrera]);


  // ============================================================================
  // 7. RENDER HELPERS
  // ============================================================================

  const renderTooltip = () => {
    if (!hoveredNodeId) return null;
    const node = nodes.find(n => n.id === hoveredNodeId);
    if (!node || !node.data?.originalData || aprobadas.includes(node.id)) return null;

    const mat = node.data.originalData;
    const faltantes = [];
    
    (mat.requiere_para_cursar || []).forEach(reqId => {
        if (!aprobadas.includes(reqId)) {
            const req = nodes.find(n => n.id === reqId);
            if (req) faltantes.push({ nombre: req.data.label, tipo: 'Cursada' });
        }
    });
    (mat.requiere_para_final || []).forEach(reqId => {
        if (!aprobadas.includes(reqId)) {
            const req = nodes.find(n => n.id === reqId);
            if (req && !faltantes.some(f => f.nombre === req.data.label)) {
                faltantes.push({ nombre: req.data.label, tipo: 'Final' });
            }
        }
    });

    if (faltantes.length === 0) return null;

    return (
      <div className="smart-tooltip">
        <div className="tooltip-header"><span className="lock-icon">🔒</span><strong>{mat.nombre}</strong></div>
        <div className="tooltip-divider"></div>
        <p className="tooltip-label">Para desbloquear necesitas:</p>
        <ul className="tooltip-list">{faltantes.map((f, i) => (<li key={i}>• {f.nombre}</li>))}</ul>
      </div>
    );
  };

  const renderStatsModal = () => {
    if (!showStats) return null;
    const aprobadasReales = nodes.filter(n => aprobadas.includes(n.id)).length;
    const bloqueadasNum = totalMaterias - aprobadasReales - disponiblesCount;
    const porcAprobado = totalMaterias > 0 ? Math.round((aprobadasReales / totalMaterias) * 100) : 0;
    const porcDisponible = totalMaterias > 0 ? Math.round((disponiblesCount / totalMaterias) * 100) : 0;
    const porcBloqueado = totalMaterias > 0 ? Math.round((bloqueadasNum / totalMaterias) * 100) : 0;

    return (
      <div className="modal-overlay" onClick={() => setShowStats(false)}>
        <div className="stats-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2>📊 Tablero de Control</h2><button className="close-btn" onClick={() => setShowStats(false)}>×</button></div>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-title">Avance</span>
              <div className="chart-container">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle stroke-blue" strokeDasharray={`${porcAprobado}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="chart-center-text"><span className="chart-percentage">{porcAprobado}%</span></div>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-title">Estado</span>
              <div className="chart-container">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle stroke-green" strokeDasharray={`${porcAprobado}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle stroke-blue" strokeDasharray={`${porcDisponible}, 100`} strokeDashoffset={-porcAprobado} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle stroke-gray" strokeDasharray={`${porcBloqueado}, 100`} strokeDashoffset={-(porcAprobado + porcDisponible)} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="chart-center-text"><span className="chart-percentage">{disponiblesCount}</span><span className="chart-label" style={{fontSize:'0.6rem'}}>Disp.</span></div>
              </div>
            </div>
          </div>
          <div className="motivational-quote">{getMotivationalQuote(porcAprobado)}</div>
        </div>
      </div>
    );
  };

  const renderAchievementsModal = () => {
    if (!showAchievements) return null;
    const unlockedCount = unlockedAchievements.length; 
    return (
      <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
        <div className="modal-content achievements-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2>🏆 Sala de Trofeos</h2><button className="close-btn" onClick={() => setShowAchievements(false)}>×</button></div>
          <div className="achievements-progress"><span>{unlockedCount} / {ACHIEVEMENTS.length} Desbloqueados</span><div className="progress-track" style={{width: '100%', marginTop:'5px'}}><div className="progress-fill" style={{width: `${(unlockedCount/ACHIEVEMENTS.length)*100}%`}}></div></div></div>
          <div className="achievements-list">
            {ACHIEVEMENTS.map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              return (
                <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="ach-icon">{isUnlocked ? ach.icon : '🔒'}</div>
                  <div className="ach-info"><h4>{ach.title}</h4><p>{ach.description}</p></div>
                  {isUnlocked && <div className="ach-check">✓</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };


  // ============================================================================
  // 8. RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} ${isMatrixMode ? 'matrix-mode' : ''} ${isFooterOpen ? 'footer-open' : ''} ${isDyslexic ? 'dyslexic-mode' : ''} ${isColorblind ? 'colorblind-mode' : ''}`}>
      {isMatrixMode && <MatrixRain />}
      
      {/* HEADER */}
      <div className="app-header">
        
        {/* Top: Logo & Menu Burger */}
        <div className="header-top-row">
            <div className="logo-section">
                <svg className="utn-logo-svg" onMouseEnter={() => triggerAchievement('spider_sense')} viewBox="0 0 595.3 699.4" height="40" fill="currentColor" style={{ minWidth: '30px' }}>
                    <path clipRule="evenodd" d="M246.6 0h102v190.8C429.4 168.4 489 94.1 489 6.4h106.3c0 146.5-106.8 268.9-246.6 293.2v4.4h233.9v104.2H368.2c130 31.8 227 149.5 227 289.1H489c0-87.7-59.6-162-140.3-184.4v186.5h-102V512.9c-80.7 22.4-140.3 96.7-140.3 184.4H0C0 557.7 97 440 227 408.2H12.8V304h233.9v-4.4C106.8 275.3 0 152.9 0 6.4h106.3c0 87.7 59.6 162 140.3 184.4z" fillRule="evenodd"/>
                </svg>
                <div className="title-container">
                    <h1>UTN Pathfinder</h1>
                    <p>Hackea tu carrera. Visualiza tu camino</p>
                </div>
            </div>
            <button className="mobile-menu-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                {showMobileMenu ? '✕' : '⚙️'}
            </button>
        </div>

        {/* Right Side: Contadores + Herramientas */}
        <div className={`header-right-side ${showMobileMenu ? 'show' : ''}`}>
              
              <div className="header-row-top"> 
                <div className="counter-pill aprobadas" title="Finales aprobados"><span>✅ <strong>{aprobadas.length}</strong></span></div>
                <div className="counter-pill disponibles" title="Materias disponibles"><span>🚀 <strong>{disponiblesCount}</strong></span></div>
              </div>

              <div className="header-row-bottom">
                <button onClick={() => setShowAchievements(true)} className="btn-download" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', height: '28px', width: '28px', fontSize: '0.9rem' }} title="Ver Logros">🏆</button>
                <button id="btn-calculator-tour" onClick={() => setShowCalculator(true)} className="btn-download" style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)', height: '28px', width: '28px', fontSize: '0.9rem' }} title="Oráculo">🔮</button>
                <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }}></div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tema">{isDarkMode ? '☀️' : '🌙'}</button>
                <button onClick={() => setIsDyslexic(!isDyslexic)} className={`btn-tool ${isDyslexic ? 'active' : ''}`} style={{ fontSize: '0.75rem', padding: '0 8px', height: '28px' }}>👁️ Dislexia</button>
                <button onClick={() => setIsColorblind(!isColorblind)} className={`btn-tool ${isColorblind ? 'active' : ''}`} style={{ fontSize: '0.75rem', padding: '0 8px', height: '28px' }}>🎨 Daltónico</button>
              </div>
        </div>

        {/* Bottom: Selector de Carrera */}
        <div id="carrera-selector-tour" className="carrera-selector-container">
             <CarreraSelector currentCarrera={selectedCarrera} onSelect={handleCarreraChange} />
        </div>
      </div>
      
      {/* BARRA DE FILTROS & ACCIONES */}
      <div style={{ padding: '8px 15px', background: isDarkMode ? '#0a0f18ff' : '#e4e8ecff', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#d1d5db' : '#252a31ff' }}>Filtros:</span>
        {['todas', 'cursar', 'final', 'simplificada'].map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '5px 12px', borderRadius: '15px', border: 'none', background: viewMode === mode ? (mode === 'final' ? '#ef4444' : mode === 'simplificada' ? '#10b981' : '#3b82f6') : (isDarkMode ? '#374151' : '#e2e8f0'), color: viewMode === mode ? 'white' : (isDarkMode ? '#9ca3af' : '#64748b'), cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}

        <button id="btn-critical-tour" title="Ruta Crítica" onClick={() => setViewMode(viewMode === 'critical' ? 'todas' : 'critical')} style={{ padding: '5px 12px', borderRadius: '15px', border: 'none', background: viewMode === 'critical' ? '#ff0033' : (isDarkMode ? '#374151' : '#e2e8f0'), color: viewMode === 'critical' ? 'white' : (isDarkMode ? '#9ca3af' : '#64748b'), cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', fontWeight: 'bold', marginLeft: '5px', boxShadow: viewMode === 'critical' ? '0 0 10px rgba(255,0,51,0.5)' : 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🔥 Ruta Crítica
        </button>

        {/* Barra de Progreso */}
        <div className="progress-section" onClick={() => setShowStats(true)} style={{ cursor: 'pointer' }} title="Ver estadísticas detalladas">
            <span className="progress-text">{aprobadasCount}/{totalMaterias} ({porcentaje}%)</span>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${porcentaje}%` }}></div>
            </div>
        </div>

        <button onClick={handleShareLinkedIn} className="btn-download" style={{ marginRight: '5px' }} title="LinkedIn">
            <svg width="20px" height="20px" viewBox="0 0 382 382" fill="currentColor"><path d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889 C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056 H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806 c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1 s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73 c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079 c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426 c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472 L341.91,330.654L341.91,330.654z"/></svg>
        </button>
        <button onClick={downloadImage} className="btn-download" title="Guardar imagen">📷</button>
      </div>

      {/* ÁREA DEL GRAFO */}
      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length > 0 ? (
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
      <div className="legend-container">
        <div className="legend-item"><div className="legend-dot aprobada"></div><span>Aprobada</span></div>
        <div className="legend-item"><div className="legend-dot disponible"></div><span>Disponible</span></div>
        <div className="legend-item"><div className="legend-dot bloqueada"></div><span>Bloqueada</span></div>
      </div>
      
      {/* FOOTER */}
      <footer className={`app-footer ${isFooterOpen ? 'open' : ''}`}>
        <button className="footer-toggle-btn" onClick={() => { setIsFooterOpen(!isFooterOpen); if (!isFooterOpen) triggerAchievement('credits_watcher'); }}>
          <span style={{ display: 'inline-block', transform: isFooterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', marginRight: '5px' }}>▲</span>
          {isFooterOpen ? 'CERRAR' : 'CRÉDITOS'}
        </button>
        <div className="footer-container">
          <div className="footer-brand">
            <h3>🎓 UTN Pathfinder</h3>
            <p>De los Dynamics Pointers para la UTN.</p>
            <p>Herramienta interactiva diseñada para planificar.</p>
            <span className="copyright">© 2025 - Derechos reservados - Hecho con ❤️</span>
          </div>
          <div className="footer-team">
            <h4>Desarrollado por:</h4>
            <div className="team-grid">
              {[{ name: "Durazzini Sebastian", linkedin: "https://www.linkedin.com/in/sebastian-durazzini/"},
                { name: "Martinez Alejo", linkedin: "https://www.linkedin.com/in/alejo-martinez-olmedo-877004283/" },
                { name: "Raho Daniel", linkedin: "https://www.linkedin.com/in/pablo-daniel-raho-17a611354/" },
                { name: "Serrano Leandro", linkedin: "https://www.linkedin.com/in/leandro-serrano/" }].map((member, index) => (
                <a key={index} href={member.linkedin} target="_blank" rel="noopener noreferrer" className="team-link">{member.name}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* MODALES */}
      
      {/* 1. Calculadora */}
      {showCalculator && (
        <div className="modal-overlay" onClick={() => setShowCalculator(false)}>
          <div className="calculator-card" onClick={e => e.stopPropagation()}>
            <div className="calc-header"><h3>🔮 Oráculo Académico</h3><button className="close-btn" onClick={() => setShowCalculator(false)}>×</button></div>
            <div className="calc-body">
              {(() => {
                 const aprobadasEstaCarrera = nodes.filter(n => aprobadas.includes(n.id)).length;
                 const totalEstaCarrera = nodes.length;
                 return (
                   <>
                     <p className="calc-intro">Progreso: {aprobadasEstaCarrera} de {totalEstaCarrera} aprobadas.</p>
                     <div className="slider-container">
                       <label>Materias por cuatrimestre<span className="ritmo-badge">{ritmoEstudio}</span></label>
                       <input type="range" min="1" max="6" step="1" value={ritmoEstudio} onChange={(e) => setRitmoEstudio(parseInt(e.target.value))} className="ritmo-slider" />
                       <div className="slider-labels"><span>Relax (1)</span><span>Tryhard (6)</span></div>
                     </div>
                     <div className="prediction-result">
                        {(() => {
                          const faltantes = totalEstaCarrera - aprobadasEstaCarrera;
                          if (faltantes <= 0) return <div>¡Ya terminaste! 🎉</div>;
                          const cuatrimestresRestantes = Math.ceil(faltantes / ritmoEstudio);
                          const mesesTotales = cuatrimestresRestantes * 6;
                          const fechaFutura = new Date();
                          fechaFutura.setMonth(fechaFutura.getMonth() + mesesTotales);
                          const fechaFinal = fechaFutura.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                          return (
                            <>
                              <span className="pred-label">Te recibirías en:</span>
                              <h2 className="pred-date">{fechaFinal.charAt(0).toUpperCase() + fechaFinal.slice(1)}</h2>
                              <span className="pred-details">(Faltan {faltantes} materias)</span>
                            </>
                          );
                        })()} 
                     </div>
                   </>
                 );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* 2. Toast LinkedIn */}
      <div className={`toast-notification ${mostrarNotificacion ? 'show' : ''}`}>
        {conteoRegresivo > 0 ? <span>📋 Redirigiendo a LinkedIn en <strong>{conteoRegresivo}...</strong></span> : <span>🚀 ¡Texto copiado!</span>}
      </div>

      {/* 3. Notificación Logro */}
      {currentNotification && (
        <div className={`achievement-popup ${isClosing ? 'closing' : ''}`}> 
          <div className="ach-popup-icon">{currentNotification.icon}</div>
          <div className="ach-popup-content">
            <div className="ach-popup-header">¡Logro Desbloqueado!</div>
            <h3 className="ach-popup-title">{currentNotification.title}</h3>
            <p className="ach-popup-desc">{currentNotification.description}</p>
          </div>
        </div>
      )}

      {/* 4. Render Helpers */}
      {renderStatsModal()}
      {renderTooltip()}
      {renderAchievementsModal()}

    </div>
  );
}