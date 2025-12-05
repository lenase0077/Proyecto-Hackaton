<div align="center">
  <img src="./public/logo.png" alt="UTN Pathfinder Logo" width="120" />

  <h1>🎓 UTN Pathfinder</h1>
  
  <h3>Hackea tu carrera. Visualiza tu camino.</h3>

  <p>
    La herramienta definitiva de planificación académica gamificada.
    <br/>
    <em>Transformando la complejidad de las correlatividades en una experiencia visual intuitiva.</em>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Hackathon%20Ready-success?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Stack-React%20%7C%20Vite-blue?style=for-the-badge" alt="Stack" />
    <img src="https://img.shields.io/badge/Team-The%20Dynamics%20Pointers-blueviolet?style=for-the-badge" alt="Team" />
  </p>
  
  <p>
    <a href="#-el-problema">💡 El Problema</a> •
    <a href="#-nuestra-solución">🚀 Solución</a> •
    <a href="#-funcionalidades-clave">✨ Features</a> •
    <a href="#-ciencia-detrás-del-diseño">🧠 Psicología</a> •
    <a href="#-stack-tecnológico">🛠️ Tecnologías</a> •
    <a href="#-instalación">📦 Instalación</a>
  </p>
</div>

---

## 💡 El Problema: "La Barrera Cognitiva"

Los estudiantes universitarios planifican su futuro basándose en documentos estáticos: PDFs complejos, tablas de Excel interminables o el "boca a boca". Esto genera una **barrera de entrada cognitiva**.

El alumno no logra visualizar las dependencias a largo plazo, lo que lleva a inscribirse en materias "fáciles" descuidando las correlativas críticas, retrasando su graduación innecesariamente.

---

## 🚀 Nuestra Solución

**UTN Pathfinder** no es solo un visor de materias; es una **herramienta de toma de decisiones estratégicas**.

Hemos desarrollado una plataforma interactiva (SPA) que convierte la burocracia académica en un grafo dinámico. Nuestro objetivo es reducir la ansiedad estudiantil y optimizar el tiempo de graduación mediante la visualización de datos y la gamificación.

---

## ✨ Funcionalidades Clave

### 🗺️ Planificación Visual (React Flow)
El corazón del sistema. Un grafo interactivo donde los nodos (materias) se conectan por líneas de dependencia.
* **1 Clic:** Aprueba la materia (Verde).
* **Feedback:** Desbloqueo automático de correlativas disponibles.

### 🔥 La Ruta Crítica (Algoritmo Visual)
Nuestra funcionalidad estrella. Con un solo clic, el sistema analiza el grafo completo y resalta en **Rojo Neón** la cadena de materias que determina la duración mínima de la carrera. Le dice al alumno: *"Esta es tu prioridad número uno"*.

### 🔮 El Oráculo (Calculadora Predictiva)
Más que un simple contador, proyecta tu **fecha exacta de graduación** basándose en tu ritmo real (materias por cuatrimestre), ayudando a establecer metas realistas y gestionar la ansiedad.

### ♿ Accesibilidad Universal (Inclusión Real)
No es un "agregado", es el núcleo del diseño:
* **Modo Dislexia:** Cambia globalmente la tipografía a *OpenDyslexic*.
* **Modo Daltonismo:** Paleta de alto contraste (Vermilion/Sky Blue) + patrones de tramas para no depender solo del color.

### 🎮 Gamificación y "Cultura Dev"
Para mantener el *engagement*, aplicamos el **Modelo Hook**:
* **Logros:** Sistema de trofeos desbloqueables ("Primeros Pasos", "Mitad de Camino").
* **Modo Matrix:** Un *Easter Egg* activable con el *Konami Code* (↑↑↓↓←→←→BA) que transforma la UI en una terminal hacker.
* **Celebración:** Confeti y audio reactivo para reforzar el circuito de recompensa positiva.

---

## 🧠 Ciencia Detrás del Diseño

Nos basamos en principios psicológicos para combatir la deserción:

1.  **Feedback Inmediato (Dopamina):** Cada interacción genera una respuesta visual/auditiva instantánea, evitando la fatiga cognitiva por espera.
2.  **Efecto Zeigarnik:** Al visualizar barras de progreso incompletas, el cerebro siente el impulso natural de completar la tarea.
3.  **Reducción de Carga Cognitiva:** Externalizamos la memoria de trabajo al grafo, permitiendo al estudiante enfocarse en la estrategia y no en recordar reglas.

---

## 🛠️ Stack Tecnológico

Arquitectura **Serverless Frontend** enfocada en performance extrema y privacidad (todo sucede en el navegador del usuario).

<div align="center">

| Core | Visualización | UI / UX | Herramientas |
| :---: | :---: | :---: | :---: |
| <img src="https://skillicons.dev/icons?i=react" width="40"/><br/>**React 18** | <img src="https://reactflow.dev/img/logo.svg" width="40"/><br/>**React Flow** | <img src="https://skillicons.dev/icons?i=css" width="40"/><br/>**CSS3 Puro** | <img src="https://skillicons.dev/icons?i=vite" width="40"/><br/>**Vite** |

</div>

* **Persistencia:** `LocalStorage` (Privacidad total, sin bases de datos externas).
* **Librerías Auxiliares:**
    * `driver.js`: Tutoriales de onboarding.
    * `html-to-image`: Exportación de planes.
    * `canvas-confetti`: Sistema de partículas.

---

## 📦 Instalación

Este proyecto utiliza **Vite**, por lo que es extremadamente rápido de iniciar.

1.  **Clonar el repositorio**
    ```bash
    git clone [https://github.com/usuario/utn-pathfinder.git](https://github.com/usuario/utn-pathfinder.git)
    cd utn-pathfinder
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Correr en local**
    ```bash
    npm run dev
    ```

4.  Abrir `http://localhost:5173` en tu navegador.

---

## 👥 Equipo "The Dynamics Pointers"

Desarrollado con pasión para la **Hackathon 2025**.

| Miembro | Rol | Frase |
| :--- | :--- | :--- |
| **Leandro Serrano** | 🎨 Developer | *"Soy una esponja informática"* |
| **Alejo Martinez** | 🚀 Developer | *"Apasionado por aprender y crecer"* |
| **Sebastian Durazzini** | 💻 Developer | *"La curiosidad fue lo que me trajo hasta aquí"* |
| **Daniel Raho** | 🧠 Developer | *"Refactorizar hoy, escalar mañana"* |

---

<div align="center">
  <p>Hecho con ❤️ para la comunidad estudiantil.</p>
</div>
