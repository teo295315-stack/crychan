// CONFIGURACIÓN DE CONEXIÓN A SUPABASE
const SB_URL = "https://eqrqpzwdkvtnhbmzgxjq.supabase.co";
const SB_KEY = "sb_publishable_z298DmGKzSJzJbzLv17s3g_QL1hcAqi";

// VARIABLES DE CONTROL DE REGLAS
const MAX_TABLONES_PERMITIDOS = 6;
const CICLO_RESET_DIAS = 3;

// REFERENCIAS A ELEMENTOS DEL DOM (HTML)
const boardsList = document.getElementById("boardsList");
const addBoardBtn = document.getElementById("addBoardBtn");
const boardPanel = document.getElementById("boardPanel");
const boardNameInput = document.getElementById("boardNameInput");
const createBoardBtn = document.getElementById("createBoardBtn");
const cancelBoardBtn = document.getElementById("cancelBoardBtn");
const cooldownTimer = document.getElementById("cooldownTimer"); // El mini-temporizador

/**
 * FUNCIÓN PARA CARGAR Y RENDERIZAR LOS TABLONES
 */
async function loadBoards() {
    console.log("Iniciando carga de tablones desde Supabase...");
    try {
        const respuesta = await fetch(`${SB_URL}/rest/v1/publicaciones?select=junta`, {
            headers: { 
                'apikey': SB_KEY, 
                'Authorization': `Bearer ${SB_KEY}` 
            }
        });
        const datos = await respuesta.json();
        
        // Extraer nombres únicos y filtrar nulos
        const nombresTablones = [...new Set(datos.map(item => item.junta))].filter(n => n !== null);
        
        console.log("Tablones encontrados:", nombresTablones.length);
        
        // Limpiar la lista visual antes de recargar
        if (boardsList) boardsList.innerHTML = "";
        
        nombresTablones.forEach(nombre => {
            const enlace = document.createElement("a");
            enlace.className = "board-item";
            enlace.textContent = `/${nombre}/`;
            enlace.href = `board.html?board=${encodeURIComponent(nombre)}`;
            if (boardsList) boardsList.appendChild(enlace);
        });

        // Controlar si se permite añadir más tablones (Límite de 6)
        if (addBoardBtn) {
            if (nombresTablones.length >= MAX_TABLONES_PERMITIDOS) {
                addBoardBtn.style.display = "none"; // Escondemos el botón si llegamos al límite
                console.warn("Límite de tablones alcanzado.");
            } else {
                addBoardBtn.style.display = "block";
            }
        }

    } catch (error) {
        console.error("Error crítico al cargar tablones:", error);
    }
}

/**
 * LÓGICA DEL TEMPORIZADOR DE RESET (3 DÍAS)
 */
function actualizarTemporizadorReset() {
    if (!cooldownTimer) return;
    // Calculamos el ciclo de 3 días en milisegundos
    const msPorCiclo = CICLO_RESET_DIAS * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    
    // Calculamos cuánto falta para el próximo múltiplo de 3 días desde el inicio de la era Unix
    const tiempoRestante = msPorCiclo - (ahora % msPorCiclo);

    const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
    const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

    // Mostramos el tiempo en el div de la esquina
    cooldownTimer.classList.remove("hidden");
    cooldownTimer.innerHTML = `Reset en: ${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

// Iniciar el reloj cada segundo
setInterval(actualizarTemporizadorReset, 1000);

/**
 * LÓGICA PARA CREAR TABLÓN
 */
if (createBoardBtn) {
    createBoardBtn.onclick = async () => {
        const nombreNuevo = boardNameInput ? boardNameInput.value.trim() : "";
        
        if (!nombreNuevo) {
            alert("Por favor, escribe un nombre para el tablón.");
            return;
        }

        console.log("Intentando crear tablón:", nombreNuevo);

        const postInicial = { 
            junta: nombreNuevo, 
            contenido: `Tablón /${nombreNuevo}/ creado. Bienvenido a CryChan.` 
        };

        try {
            const res = await fetch(`${SB_URL}/rest/v1/publicaciones`, {
                method: 'POST',
                headers: {
                    'apikey': SB_KEY,
                    'Authorization': `Bearer ${SB_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postInicial)
            });

            if (res.ok) {
                if (boardPanel) boardPanel.classList.add("hidden");
                if (boardNameInput) boardNameInput.value = "";
                loadBoards(); // Recargamos la lista
            }
        } catch (err) {
            alert("Error al conectar con Supabase. Asegúrate de que el proyecto no esté pausado.");
        }
    };
}

// BOTONES DE INTERFAZ
if (addBoardBtn && boardPanel) {
    addBoardBtn.onclick = () => boardPanel.classList.remove("hidden");
}
if (cancelBoardBtn && boardPanel && boardNameInput) {
    cancelBoardBtn.onclick = () => {
        boardPanel.classList.add("hidden");
        boardNameInput.value = "";
    };
}

// DONACIONES
const donateBtn = document.getElementById("donateBtn");
const donateText = document.querySelector(".donate-text");
if (donateBtn && donateText) {
    donateBtn.onclick = () => {
        donateText.classList.toggle("hidden");
        window.open("https://www.paypal.me/HOLAadamsinadamsito", "_blank");
    };
}

// --- LÓGICA AGREGADA PARA CONTROLAR EL USERNAME ---
const usernameInput = document.getElementById("usernameInput");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const cancelUsernameBtn = document.getElementById("cancelUsernameBtn");

if (usernameInput) {
    if (localStorage.getItem("custom_username")) {
        usernameInput.value = localStorage.getItem("custom_username");
    }

    if (saveUsernameBtn) {
        saveUsernameBtn.onclick = () => {
            const nombre = usernameInput.value.trim();
            if (nombre) {
                localStorage.setItem("custom_username", nombre);
            }
        };
    }

    if (cancelUsernameBtn) {
        cancelUsernameBtn.onclick = () => {
            usernameInput.value = "";
            localStorage.removeItem("custom_username");
        };
    }
}

// CARGA INICIAL
loadBoards();
actualizarTemporizadorReset();

// Función para convertir la clave pública VAPID
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Función que ejecutas cuando el usuario activa las notificaciones
async function solicitarPermisoNotificaciones() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Este navegador no soporta notificaciones Push.');
        return;
    }

    const permiso = await Notification.requestPermission();
    
    if (permiso === 'granted') {
        const registro = await navigator.serviceWorker.ready;
        
        // Tu clave pública real integrada
        const vapidPublicKey = 'BIlgSBHIVVWwaypLTp8nSY0NFqxvRBZB1_p800UoShwkodKbF62xSlSFgf6idJ221HsIrzDug23cAUyCu71Cg_o'; 
        
        // Suscribir obligando al flag visible para Android
        const suscripcion = await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        console.log('Suscripción generada con éxito:', suscripcion);
        
        // Enviar la suscripción a tu backend
        await fetch('/.netlify/functions/enviar', {
            method: 'POST',
            body: JSON.stringify(suscripcion),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}