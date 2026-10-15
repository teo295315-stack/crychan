// CONFIGURACIÓN DE CONEXIÓN A SUPABASE (Protegido contra duplicados)
if (typeof SB_URL === 'undefined') {
    var SB_URL = "https://eqrqpzwdkvtnhbmzgxjq.supabase.co";
    var SB_KEY = "sb_publishable_z298DmGKzSJzJbzLv17s3g_QL1hcAqi";
}

// VARIABLES DE CONTROL DE REGLAS
const MAX_TABLONES_PERMITIDOS = 6;
const CICLO_RESET_DIAS = 3;

/**
 * FUNCIÓN PARA CARGAR Y RENDERIZAR LOS TABLONES
 */
async function loadBoards() {
    console.log("Iniciando carga de tablones desde Supabase...");
    const boardsList = document.getElementById("boardsList");
    const addBoardBtn = document.getElementById("addBoardBtn");

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
                addBoardBtn.style.display = "none";
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
    const cooldownTimer = document.getElementById("cooldownTimer");
    if (!cooldownTimer) return;
    
    const msPorCiclo = CICLO_RESET_DIAS * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    const tiempoRestante = msPorCiclo - (ahora % msPorCiclo);

    const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
    const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

    cooldownTimer.classList.remove("hidden");
    cooldownTimer.innerHTML = `Reset en: ${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

setInterval(actualizarTemporizadorReset, 1000);

/**
 * LÓGICA PARA CREAR TABLÓN
 */
const createBoardBtn = document.getElementById("createBoardBtn");
const boardPanel = document.getElementById("boardPanel");
const boardNameInput = document.getElementById("boardNameInput");
const cancelBoardBtn = document.getElementById("cancelBoardBtn");
const addBoardBtnInit = document.getElementById("addBoardBtn");

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
                loadBoards();
            }
        } catch (err) {
            alert("Error al conectar con Supabase. Asegúrate de que el proyecto no esté pausado.");
        }
    };
}

// BOTONES DE INTERFAZ
if (addBoardBtnInit && boardPanel) {
    addBoardBtnInit.onclick = () => boardPanel.classList.remove("hidden");
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

// Función para activar notificaciones (Optimizada y protegida)
async function solicitarPermisoNotificaciones() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Este navegador no soporta notificaciones Push.');
        return;
    }

    const btnNotis = document.querySelector(".btn-notis");
    if (btnNotis) {
        btnNotis.disabled = true;
        btnNotis.textContent = "⏳ Activando...";
    }

    try {
        const permiso = await Notification.requestPermission();
        
        if (permiso === 'granted') {
            const registro = await navigator.serviceWorker.ready;
            const vapidPublicKey = 'BIlgSBHIVVWwaypLTp8nSY0NFqxvRBZB1_p800UoShwkodKbF62xSlSFgf6idJ221HsIrzDug23cAUyCu71Cg_o'; 
            
            // Limpiar suscripciones obsoletas previas
            const suscripcionExistente = await registro.pushManager.getSubscription();
            if (suscripcionExistente) {
                await suscripcionExistente.unsubscribe();
            }

            // Crear nueva suscripción
            const suscripcion = await registro.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            console.log('Suscripción generada con éxito:', suscripcion);
            
            // Guardar en localStorage para uso inmediato
            localStorage.setItem('crychan_push_sub', JSON.stringify(suscripcion));

            // Enviar al servidor Netlify
            const res = await fetch('/.netlify/functions/enviar', {
                method: 'POST',
                body: JSON.stringify({ subscription: suscripcion }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                if (btnNotis) {
                    btnNotis.textContent = "🔔 Notificaciones Activadas";
                    btnNotis.style.background = "#28a745";
                }
            } else {
                console.warn("Respuesta no OK de Netlify:", res.status);
                if (btnNotis) {
                    btnNotis.disabled = false;
                    btnNotis.textContent = "🔔 Reintentar Activar";
                }
            }
        } else {
            alert("Permiso de notificaciones denegado.");
            if (btnNotis) {
                btnNotis.disabled = false;
                btnNotis.textContent = "🔔 Activar Notificaciones";
            }
        }
    } catch (err) {
        console.error("Error al suscribir:", err);
        if (btnNotis) {
            btnNotis.disabled = false;
            btnNotis.textContent = "🔔 Reintentar Activar";
        }
    }
}
