import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import dbMaterias from './data/materias.json'; 
import CarreraSelector from './components/CarreraSelector';

import { 
  getLayoutElements, 
  updateNodeStyles, 
  filterEdgesByMode,
  applyHighlightStyles,
  triggerLevelConfetti,
  ACHIEVEMENTS,
  triggerVictoryConfetti
} from './utils'; 

// ============================================
// COMPONENTE ICONO DISCORD
// ============================================
const DiscordLogo = () => (
  <svg 
    width="22" 
    height="22" 
    viewBox="0 -28.5 256 256" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      fillRule="nonzero" 
      d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
    />
  </svg>
);

export default function App() {
  // ============================================
  // ESTADOS (STATE)
  // ============================================
  
  const [selectedCarrera, setSelectedCarrera] = useState(() => {
    return localStorage.getItem('selectedCarrera') || 'tup';
  });
  
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [conteoRegresivo, setConteoRegresivo] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [ritmoEstudio, setRitmoEstudio] = useState(3);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [showAchievements, setShowAchievements] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const saved = localStorage.getItem('unlockedAchievements');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentNotification, setCurrentNotification] = useState(null);
  
  const currentaudioLevel = useRef(null);
  const currentaudioVictory = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [aprobadas, setAprobadas] = useState(() => {
    const saved = localStorage.getItem('materiasAprobadas');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem('appTheme');
      return savedTheme !== 'light'; 
    });

  const [isDyslexic, setIsDyslexic] = useState(() => {
    return localStorage.getItem('dyslexicMode') === 'true';
  });

  const [isColorblind, setIsColorblind] = useState(() => {
    return localStorage.getItem('colorblindMode') === 'true';
  });
  
 // ============================================
  // FUNCIÓN CENTRAL DE DESBLOQUEO
  // ============================================
  const triggerAchievement = (achId) => {
    if (unlockedAchievements.includes(achId)) return;

    const ach = ACHIEVEMENTS.find(a => a.id === achId);
    if (!ach) return;

    setUnlockedAchievements(prev => [...prev, achId]);
    
    setIsClosing(false);
    setCurrentNotification(ach);

    const audio = new Audio('/sounds/Archivement.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio error:", e));

    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setCurrentNotification(null);
        setIsClosing(false); 
      }, 600); 
    }, 4000);
  };

  // ============================================
  // EFECTOS (useEffect)
  // ============================================
  
  useEffect(() => { 
    localStorage.setItem('dyslexicMode', isDyslexic); 
  }, [isDyslexic]);

  useEffect(() => { 
    localStorage.setItem('colorblindMode', isColorblind); 
  }, [isColorblind]);

  useEffect(() => { 
    localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light'); 
  }, [isDarkMode]);

  useEffect(() => { 
    localStorage.setItem('materiasAprobadas', JSON.stringify(aprobadas)); 
  }, [aprobadas]);

  // ============================================
  // MÁS ESTADOS
  // ============================================
  
  const [viewMode, setViewMode] = useState('todas');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [allEdgesCache, setAllEdgesCache] = useState([]);

  useEffect(() => {
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  // ============================================
  // MONITOR DE LOGROS
  // ============================================
  useEffect(() => {
    if (nodes.length === 0) return;

    ACHIEVEMENTS.forEach(ach => {
      if (ach.condition(aprobadas, nodes)) {
          triggerAchievement(ach.id);
      }
    });
  }, [aprobadas, nodes, unlockedAchievements]);

  // ============================================
  // DATOS ESTÁTICOS
  // ============================================
  
  const teamMembers = [
    { name: "Durazzini Sebastian", linkedin: "https://www.linkedin.com/in/sebastian-durazzini/"},
    { name: "Martinez Alejo", linkedin: "https://www.linkedin.com/in/alejo-martinez-olmedo-877004283/" },
    { name: "Raho Daniel", linkedin: "https://www.linkedin.com/in/pablo-daniel-raho-17a611354/" },
    { name: "Serrano Leandro", linkedin: "https://www.linkedin.com/in/leandro-serrano/" },
  ];

  // ============================================
  // EFECTO PARA CARGAR MATERIAS
  // ============================================
  
  useEffect(() => {
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutElements(listaMaterias, isMobile);
    const styledNodes = updateNodeStyles(layoutNodes, layoutEdges, aprobadas, isDarkMode, isColorblind);
    
    const { nodes: finalNodes, edges: finalEdges } = applyHighlightStyles(
        styledNodes, 
        layoutEdges, 
        null, 
        isDarkMode,
        'todas', 
        isColorblind,
        aprobadas
    );
    
    setNodes(finalNodes);
    setEdges(finalEdges);
    setAllEdgesCache(layoutEdges);
    
    setViewMode('todas');

  }, [selectedCarrera, isMobile, setNodes, setEdges, isDarkMode, isColorblind, aprobadas]);

  // ============================================
  // EFECTO RESIZE
  // ============================================
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(prev => {
        if (prev !== mobile) return mobile;
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================
  // EFECTO ESTILOS DINÁMICOS
  // ============================================
  
  useEffect(() => {
    if (nodes.length === 0) return; 
    
    const styledNodes = updateNodeStyles(nodes, edges, aprobadas, isDarkMode, isColorblind);
    
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

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================
  
  const handleCarreraChange = (nuevaCarrera) => {
    setSelectedCarrera(nuevaCarrera);
    localStorage.setItem('selectedCarrera', nuevaCarrera);
  };

  const onNodeClick = useCallback((event, node) => {
    if (!node.data?.clickable) return; 
    
    const matId = node.id; 
    const isUnchecking = aprobadas.includes(matId); 
    let nuevasAprobadas;
    const listaMaterias = dbMaterias[selectedCarrera] || [];
    
    if (isUnchecking) {
        // Desmarcar y recursividad
        const idsAElminar = new Set([matId]); 
        const pilaDeBusqueda = [matId]; 

        while (pilaDeBusqueda.length > 0) {
            const idActual = pilaDeBusqueda.pop(); 

            const dependientes = listaMaterias.filter(m => {
                const reqCursada = m.requiere_para_cursar || [];
                const reqFinal = m.requiere_para_final || [];
                return reqCursada.includes(idActual) || reqFinal.includes(idActual);
            });

            dependientes.forEach(dep => {
                if (aprobadas.includes(dep.id) && !idsAElminar.has(dep.id)) {
                    idsAElminar.add(dep.id);      
                    pilaDeBusqueda.push(dep.id);  
                }
            });
        }

        nuevasAprobadas = aprobadas.filter(id => !idsAElminar.has(id));
        
    } else {
        // Marcar como aprobada
        nuevasAprobadas = [...aprobadas, matId]; 
        
        const listaMaterias = dbMaterias[selectedCarrera] || [];
        const materiaActual = node.data.originalData;
        const nivelActual = materiaActual.nivel || (materiaActual.posY ? materiaActual.posY + 1 : 1);

        const materiasDelNivel = listaMaterias.filter(m => {
            const mNivel = m.nivel || (m.posY ? m.posY + 1 : 1);
            return mNivel === nivelActual;
        });

        const nivelCompleto = materiasDelNivel.every(m => nuevasAprobadas.includes(m.id));
        const carreraCompleta = listaMaterias.every(m => nuevasAprobadas.includes(m.id));

        // --- LÓGICA DE FIESTA Y SONIDO ---
        if (carreraCompleta) {
            // 🏆 GANASTE LA CARRERA
            if (currentaudioLevel.current){
               currentaudioLevel.current.pause();
               currentaudioLevel.current.currentTime = 0;
            }
            if (currentaudioVictory.current){
               currentaudioVictory.current.pause();
               currentaudioVictory.current.currentTime = 0;
            }  

             setTimeout(() => {
                const audioVictory = new Audio('/sounds/victory.mp3');
                currentaudioVictory.current = audioVictory;
                audioVictory.volume = 0.1;
                audioVictory.play().catch(e => console.error(e));
                triggerVictoryConfetti();
             }, 100);

        } else if (nivelCompleto) {
             // ⭐️ COMPLETASTE EL NIVEL
            if (currentaudioLevel.current){
                currentaudioLevel.current.pause();
                currentaudioLevel.current.currentTime = 0;
            }

             setTimeout(() => {
                const audioLevel = new Audio('/sounds/Celebracion-Nivel.mp3');
                currentaudioLevel.current = audioLevel;
                audioLevel.playbackRate = 0.9 + Math.random() * 0.3;
                audioLevel.preservesPitch = false;
                audioLevel.volume = 0.1; 
                audioLevel.play().catch(e => console.error(e));
                triggerLevelConfetti();
             }, 100);

        } else {
             // 🔹 MATERIA INDIVIDUAL
             const audioPop = new Audio('/sounds/pop.mp3');
             audioPop.volume = 0.4;
             audioPop.playbackRate = 0.9 + Math.random() * 0.3;
             audioPop.preservesPitch = false;
             audioPop.play().catch(() => {});
        }
    }
    
    setAprobadas(nuevasAprobadas); 
  }, [aprobadas, selectedCarrera]); 

  
  // ============================================
  // CÁLCULO DE PROGRESO
  // ============================================

  const totalMaterias = nodes.length;
  const aprobadasCount = nodes.filter(n => aprobadas.includes(n.id)).length;
  const porcentaje = totalMaterias > 0 
      ? Math.round((aprobadasCount / totalMaterias) * 100) 
      : 0;


  // ============================================
  // TOOLTIP INTELIGENTE
  // ============================================
  const renderTooltip = () => {
    if (!hoveredNodeId) return null;
    const node = nodes.find(n => n.id === hoveredNodeId);
    if (!node) return null;

    const mat = node.data?.originalData;
    if (!mat) return null;

    const estaAprobada = aprobadas.includes(mat.id);
    if (estaAprobada) return null;

    const faltantes = [];
    
    if (mat.requiere_para_cursar) {
        mat.requiere_para_cursar.forEach(reqId => {
            if (!aprobadas.includes(reqId)) {
                const reqNode = nodes.find(n => n.id === reqId);
                if (reqNode) faltantes.push({ nombre: reqNode.data.label, tipo: 'Cursada' });
            }
        });
    }

    if (mat.requiere_para_final) {
        mat.requiere_para_final.forEach(reqId => {
            if (!aprobadas.includes(reqId)) {
                const reqNode = nodes.find(n => n.id === reqId);
                if (reqNode && !faltantes.some(f => f.nombre === reqNode.data.label)) {
                    faltantes.push({ nombre: reqNode.data.label, tipo: 'Final' });
                }
            }
        });
    }

    if (faltantes.length === 0) return null;

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
  // COMPARTIR EN LINKEDIN
  // ============================================
  const handleShareLinkedIn = () => {
    const nombresCarreras = {
      'tup': 'Tecnicatura Universitaria en Programación',
      'admi': 'Tecnicatura Universitaria en Administración',
      'moldes': 'Tecnicatura en Moldes y Matrices',
      'automotriz': 'Tecnicatura en Industria Automotriz'
    };
    const nombreCarrera = nombresCarreras[selectedCarrera] || 'Mi Carrera UTN';

    const total = nodes.length; 
    const aprobadasCount = aprobadas.length; 
    const porcentaje = total > 0 ? Math.round((aprobadasCount / total) * 100) : 0;

    const logros = nodes
      .filter(n => aprobadas.includes(n.id)) 
      .map(n => n.data.originalData)         
      .sort((a, b) => (b.nivel || 0) - (a.nivel || 0)) 
      .slice(0, 3) 
      .map(m => m.nombre); 

    const siguienteObjetivo = nodes.find(n => {
      if (aprobadas.includes(n.id)) return false; 
      
      const mat = n.data.originalData;
      const reqCursadas = mat.requiere_para_cursar || [];
      const reqFinales = mat.requiere_para_final || [];
      const tieneCursadas = reqCursadas.every(id => aprobadas.includes(id));
      const tieneFinales = reqFinales.every(id => aprobadas.includes(id));
      
      return tieneCursadas && tieneFinales; 
    });

    const texto = `🚀 Progreso Académico: ${nombreCarrera}
    He completado el ${porcentaje}% de mi plan de estudios en la UTN.
    ✅ Materias Aprobadas: ${aprobadasCount} de ${total}

    🏆 Últimos logros desbloqueados:
    ${logros.length > 0 ? logros.map(l => `• ${l}`).join('\n') : '• Iniciando el camino'}

    ${siguienteObjetivo ? `🎯 Próximo objetivo: ${siguienteObjetivo.data.originalData.nombre}` : '🎓 ¡Recta final!'}

    #UTN #Pathfinder #DesarrolloProfesional #Educación #Hackathon`.trim(); 

    navigator.clipboard.writeText(texto).then(async () => {
      setMostrarNotificacion(true); 
      for (let i = 3; i > 0; i--) {
        setConteoRegresivo(i); 
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setConteoRegresivo(0); 
      window.open('https://www.linkedin.com/feed/', '_blank');
      setTimeout(() => setMostrarNotificacion(false), 1000);
    });
  };

  // ============================================
  // EXPORTAR IMAGEN
  // ============================================
  const downloadImage = useCallback(() => {
    const elem = document.querySelector('.react-flow');
    
    if (!elem || !window.htmlToImage) return;

    window.htmlToImage.toPng(elem, {
      backgroundColor: isDarkMode ? '#111827' : '#f8fafc',
      style: {
        width: '100%',
        height: '100%',
      } 
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `Plan-${selectedCarrera}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    }).catch((err) => {
      console.error('Error al exportar imagen:', err);
    });
  }, [isDarkMode, selectedCarrera]);

  // ============================================
  // CÁLCULO MATERIAS DISPONIBLES
  // ============================================

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

  // ============================================
  // MODAL LOGROS
  // ============================================
  const renderAchievementsModal = () => {
    if (!showAchievements) return null;

    const totalLogros = ACHIEVEMENTS.length;
    const logrosDesbloqueados = unlockedAchievements.length; 

    return (
      <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
        <div className="modal-content achievements-modal" onClick={e => e.stopPropagation()}>
          
          <div className="modal-header">
            <h2>🏆 Sala de Trofeos</h2>
            <button className="close-btn" onClick={() => setShowAchievements(false)}>×</button>
          </div>

          <div className="achievements-progress">
             <span>{logrosDesbloqueados} / {totalLogros} Desbloqueados</span>
             <div className="progress-track" style={{width: '100%', marginTop: '5px'}}>
                <div className="progress-fill" style={{width: `${(logrosDesbloqueados/totalLogros)*100}%`}}></div>
             </div>
          </div>

          <div className="achievements-list">
            {ACHIEVEMENTS.map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);

              return (
                <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="ach-icon">{isUnlocked ? ach.icon : '🔒'}</div>
                  <div className="ach-info">
                    <h4>{ach.title}</h4>
                    <p>{ach.description}</p>
                  </div>
                  {isUnlocked && <div className="ach-check">✓</div>}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  };

  // ============================================
  // RENDER (RETURN)
  // ============================================
  
  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} ${isFooterOpen ? 'footer-open' : ''} ${isDyslexic ? 'dyslexic-mode' : ''} ${isColorblind ? 'colorblind-mode' : ''}`}>
      
      {/* HEADER */}
      <div style={{
        padding: '10px 20px',
        background: isDarkMode ? '#1f2937' : '#3b82f6',
        color: 'white',
        display: 'flex', flexDirection: 'column', gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {/* LADO IZQUIERDO: Logo y Título */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                  <svg className="utn-logo-svg" onMouseEnter={() => triggerAchievement('spider_sense')} viewBox="0 0 595.3 699.4" height="45" fill="currentColor" style={{ minWidth: '30px' }}>
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
                
                <div style={{
                  background: 'rgba(34, 197, 94, 0.25)', 
                  border: '1px solid rgba(34, 197, 94, 0.5)', 
                  color: '#86efac', 
                  padding: '0 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  display: 'flex', 
                  alignItems: 'center',
                  height: '35px',
                  whiteSpace: 'nowrap' 
                }} title="Total de finales aprobados">
                  <span>✅ Aprobadas: <strong>{aprobadas.length}</strong></span>
                </div>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.25)', 
                  border: '1px solid rgba(59, 130, 246, 0.5)', 
                  color: '#93c5fd', 
                  padding: '0 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  display: 'flex', 
                  alignItems: 'center',
                  height: '35px',
                  whiteSpace: 'nowrap' 
                }} title="Materias que ya puedes cursar">
                  <span>🚀 Disponibles: <strong>{disponiblesCount}</strong></span>
                </div>

              </div>

              {/* FILA 2: Botones Accesibilidad y DISCORD */}
              <div style={{ display: 'flex', gap: '8px' }}>

                {/* ⭐️ BOTÓN DISCORD ⭐️ */}
                <a 
                  href="https://discord.gg/yNKDGSac9j" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-download"
                  style={{ 
                    color: '#5865F2', 
                    borderColor: 'rgba(88, 101, 242, 0.3)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }} 
                  title="Únete a la comunidad en Discord"
                >
                  <DiscordLogo />
                </a>

                <button 
                  onClick={() => setShowAchievements(true)}
                  className="btn-download"
                  style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }} 
                  title="Ver Logros"
                >
                  🏆
                </button>
              
                <button 
                  onClick={() => setShowCalculator(true)}
                  className="btn-download"
                  style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)' }} 
                  title="Calculadora de Graduación"
                >
                  🔮
                </button>

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
                  {isDarkMode ? '☀️' : '🌙'} 
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
                    {isDyslexic ? '👁️ ON' : '👁️ OFF'}
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
                    {isColorblind ? '🎨 ON' : '🎨 OFF'}
                  </button>
              </div>
            </div>
        </div>

        {/* Selector de Carrera */}
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '5px' }}>
             <CarreraSelector currentCarrera={selectedCarrera} onSelect={handleCarreraChange} />
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div style={{
        padding: '8px 15px',
        background: isDarkMode ? '#0a0f18ff' : '#e4e8ecff',
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
      }}>
        
        <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#d1d5db' : '#252a31ff' }}>Filtros:</span>
        
        {['todas', 'cursar', 'final', 'simplificada'].map((mode) => (
          <button
            key={mode} 
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
          style={{ marginRight: '5px' }} 
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
        <button 
            className="footer-toggle-btn" 
            onClick={() => {
                setIsFooterOpen(!isFooterOpen);
                if (!isFooterOpen) {
                    triggerAchievement('credits_watcher');
                }
            }}
        >
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
              {teamMembers.map((member, index) => (
                <a key={index} href={member.linkedin} target="_blank" rel="noopener noreferrer" className="team-link">
                  {member.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* CALCULADORA (Oráculo) */}
      {showCalculator && (
        <div className="modal-overlay" onClick={() => setShowCalculator(false)}>
          <div className="calculator-card" onClick={e => e.stopPropagation()}>
            
            <div className="calc-header">
              <h3>🔮 Oráculo Académico</h3>
              <button className="close-btn" onClick={() => setShowCalculator(false)}>×</button>
            </div>

            <div className="calc-body">
              {(() => {
                 const aprobadasEstaCarrera = nodes.filter(n => aprobadas.includes(n.id)).length;
                 const totalEstaCarrera = nodes.length;

                 return (
                   <>
                     <p className="calc-intro">
                       Según tu progreso actual ({aprobadasEstaCarrera} aprobadas de {totalEstaCarrera}), 
                       vamos a predecir tu futuro.
                     </p>

                     <div className="slider-container">
                       <label>
                         ¿Cuántas materias aprobarás por cuatrimestre?
                         <span className="ritmo-badge">{ritmoEstudio}</span>
                       </label>
                       
                       <input 
                         type="range" 
                         min="1" 
                         max="6" 
                         step="1" 
                         value={ritmoEstudio}
                         onChange={(e) => setRitmoEstudio(parseInt(e.target.value))}
                         className="ritmo-slider"
                       />
                       
                       <div className="slider-labels">
                         <span>Relax (1)</span>
                         <span>Tryhard (6)</span>
                       </div>
                     </div>

                     <div className="prediction-result">
                        {(() => {
                          const faltantes = totalEstaCarrera - aprobadasEstaCarrera;
                          
                          if (faltantes <= 0) return <div>¡Ya terminaste! 🎉</div>;

                          const cuatrimestresRestantes = Math.ceil(faltantes / ritmoEstudio);
                          const mesesTotales = cuatrimestresRestantes * 6;
                          
                          const fechaFutura = new Date();
                          fechaFutura.setMonth(fechaFutura.getMonth() + mesesTotales);
                          
                          const opcionesFecha = { month: 'long', year: 'numeric' };
                          const fechaTexto = fechaFutura.toLocaleDateString('es-ES', opcionesFecha);
                          const fechaFinal = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

                          return (
                            <>
                              <span className="pred-label">Te recibirías aproximadamente en:</span>
                              <h2 className="pred-date">{fechaFinal}</h2>
                              <span className="pred-details">
                                (Faltan {faltantes} materias = {cuatrimestresRestantes} cuatrimestres)
                              </span>
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
      
      {/* Notificación Flotante */}
      <div className={`toast-notification ${mostrarNotificacion ? 'show' : ''}`}>
        {conteoRegresivo > 0 ? (
           <span>📋 ¡Texto copiado! Redirigiendo a LinkedIn en <strong>{conteoRegresivo}...</strong></span>
        ) : (
           <span>🚀 ¡Listo! Ahora pégalo en tu post (Ctrl + V)</span>
        )}
      </div>

      {/* POPUP DE LOGROS */}
      {currentNotification && (
        <div className={`achievement-popup ${isClosing ? 'closing' : ''}`}> 
          <div className="ach-popup-icon">
            {currentNotification.icon}
          </div>
          <div className="ach-popup-content">
            <div className="ach-popup-header">¡Logro Desbloqueado!</div>
            <h3 className="ach-popup-title">{currentNotification.title}</h3>
            <p className="ach-popup-desc">{currentNotification.description}</p>
          </div>
        </div>
      )}

      {renderTooltip()}
      {renderAchievementsModal()}
    </div>
  );
}