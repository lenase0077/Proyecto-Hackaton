import React, { useEffect, useRef } from 'react';

const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Ocupar toda la pantalla
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Caracteres estilo Matrix (Katakana + Latinos)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const splitLetters = letters.split('');

    const fontSize = 14;
    const columns = canvas.width / fontSize;

    // Array para las gotas (una por columna)
    const drops = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      // Fondo negro translúcido para dejar estela (el efecto "fade")
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Texto Verde Hacker
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = splitLetters[Math.floor(Math.random() * splitLetters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reiniciar la gota al azar para que no caigan todas igual
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33); // ~30 FPS

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, // Detrás de los nodos pero delante del fondo gris
        opacity: 0.8,
        pointerEvents: 'none' // Para poder clickear a través de la lluvia
      }}
    />
  );
};

export default MatrixRain;