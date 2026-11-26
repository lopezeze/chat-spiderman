// logica del chat: estado, llamada a la api y renderizado de mensajes

import { personajes } from './personajes.js';
import {
  crearMensaje,
  formatearHora,
  validarTexto,
  prepararHistorialParaApi,
  parsearHistorialGuardado,
  claveHistorial
} from './utils.js';

// historial en memoria (dura mientras no se recargue la pagina)
const historiales = {};

// ---------- fetching ----------

// manda el historial a la serverless function y devuelve el texto de la respuesta
export async function enviarMensajeAPI(personajeId, mensajes) {
  let respuesta;

  try {
    respuesta = await fetch('/api/functions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personajeId,
        mensajes: prepararHistorialParaApi(mensajes)
      })
    });
  } catch (err) {
    throw new Error('No hay conexión. Revisá tu internet e intentá de nuevo.');
  }

  const data = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(data?.error || 'Algo salió mal al pedir la respuesta.');
  }

  if (!data || typeof data.respuesta !== 'string') {
    throw new Error('La respuesta del servidor vino vacía.');
  }

  return data.respuesta;
}

// ---------- localStorage (extra credit) ----------

function leerStorage(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribirStorage(clave, valor) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // si el navegador bloquea localStorage no pasa nada, sigue en memoria
  }
}

function obtenerHistorial(personajeId) {
  if (!historiales[personajeId]) {
    historiales[personajeId] = parsearHistorialGuardado(leerStorage(claveHistorial(personajeId)));
  }
  return historiales[personajeId];
}

function guardarHistorial(personajeId) {
  const historial = historiales[personajeId] || [];
  escribirStorage(claveHistorial(personajeId), historial.length ? JSON.stringify(historial) : null);
}

// ---------- vista del chat ----------

export function montarChat(contenedor, personajeId) {
  const personaje = personajes[personajeId];
  const historial = obtenerHistorial(personajeId);

  let cargando = false;
  let error = null;

  contenedor.innerHTML = `
    <section class="chatApp" style="--color-personaje: ${personaje.color}">
      <header class="chatHeader">
        <div class="avatar" aria-hidden="true">${personaje.emoji}</div>
        <div class="chatHeader__info">
          <h1 class="chatTitle">${personaje.nombre}</h1>
          <p class="chatSubtitle">
            <span class="guardado" hidden>💾 Historial guardado</span>
            <span class="enLinea">En línea</span>
          </p>
        </div>
        <button class="btnBorrar" type="button" title="Borrar historial">🗑️ <span>Borrar</span></button>
      </header>

      <main class="chatMessages" aria-label="Mensajes" aria-live="polite"></main>

      <form class="chatComposer">
        <input
          class="chatInput"
          type="text"
          placeholder="Escribí un mensaje..."
          aria-label="Escribí tu mensaje"
          maxlength="1000"
          autocomplete="off"
        />
        <button class="chatSend" type="submit">Enviar</button>
      </form>
    </section>
  `;

  const panel = contenedor.querySelector('.chatMessages');
  const form = contenedor.querySelector('.chatComposer');
  const input = contenedor.querySelector('.chatInput');
  const btnEnviar = contenedor.querySelector('.chatSend');
  const btnBorrar = contenedor.querySelector('.btnBorrar');
  const indicadorGuardado = contenedor.querySelector('.guardado');

  function render() {
    panel.innerHTML = '';

    // estado vacio
    if (historial.length === 0 && !cargando && !error) {
      panel.appendChild(crearEstadoVacio(personaje));
    }

    historial.forEach((msj) => panel.appendChild(crearBurbuja(msj, personaje)));

    // estado cargando ("escribiendo...")
    if (cargando) {
      panel.appendChild(crearEscribiendo(personaje));
    }

    // estado error
    if (error) {
      panel.appendChild(crearError(error, reintentar));
    }

    indicadorGuardado.hidden = historial.length === 0;
    btnBorrar.disabled = historial.length === 0 || cargando;
    input.disabled = cargando;
    btnEnviar.disabled = cargando;

    // scroll automatico al ultimo mensaje
    panel.scrollTop = panel.scrollHeight;
  }

  async function pedirRespuesta() {
    cargando = true;
    error = null;
    render();

    try {
      const texto = await enviarMensajeAPI(personajeId, historial);
      historial.push(crearMensaje('model', texto));
      guardarHistorial(personajeId);
    } catch (err) {
      error = err.message;
    } finally {
      cargando = false;
      render();
      input.focus();
    }
  }

  function reintentar() {
    // el mensaje del usuario ya esta en el historial, solo vuelvo a pedir
    pedirRespuesta();
  }

  // el submit del form ya hace que funcione con Enter y con el boton
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cargando) return;

    const texto = validarTexto(input.value);
    if (!texto) return;

    historial.push(crearMensaje('user', texto));
    guardarHistorial(personajeId);
    input.value = '';
    pedirRespuesta();
  });

  btnBorrar.addEventListener('click', () => {
    if (!confirm('¿Seguro que querés borrar la conversación?')) return;
    historial.length = 0;
    error = null;
    guardarHistorial(personajeId);
    render();
  });

  render();
  input.focus();
}

// ---------- piezas de la UI ----------

function crearBurbuja(msj, personaje) {
  const burbuja = document.createElement('div');
  burbuja.className = `message message--${msj.rol === 'user' ? 'user' : 'character'}`;

  const texto = document.createElement('p');
  texto.className = 'message__text';
  texto.textContent = msj.texto; // textContent para que no se pueda inyectar html

  const pie = document.createElement('div');
  pie.className = 'message__meta';

  const hora = document.createElement('time');
  hora.dateTime = msj.fecha;
  hora.textContent = formatearHora(msj.fecha);
  pie.appendChild(hora);

  if (msj.rol === 'model') {
    const btnCopiar = document.createElement('button');
    btnCopiar.type = 'button';
    btnCopiar.className = 'btnCopiar';
    btnCopiar.textContent = 'Copiar';
    btnCopiar.setAttribute('aria-label', `Copiar respuesta de ${personaje.nombre}`);
    btnCopiar.addEventListener('click', () => copiarTexto(msj.texto, btnCopiar));
    pie.appendChild(btnCopiar);
  }

  burbuja.append(texto, pie);
  return burbuja;
}

async function copiarTexto(texto, boton) {
  try {
    await navigator.clipboard.writeText(texto);
    boton.textContent = '¡Copiado!';
  } catch {
    boton.textContent = 'No se pudo copiar';
  }
  setTimeout(() => (boton.textContent = 'Copiar'), 1500);
}

function crearEstadoVacio(personaje) {
  const div = document.createElement('div');
  div.className = 'state state--empty';
  div.innerHTML = `
    <div class="stateContent">
      <div class="avatar avatar--grande" aria-hidden="true">${personaje.emoji}</div>
      <h2>Empezá la conversación</h2>
      <p class="saludo"></p>
    </div>
  `;
  div.querySelector('.saludo').textContent = personaje.saludo;
  return div;
}

function crearEscribiendo(personaje) {
  const div = document.createElement('div');
  div.className = 'message message--character typing';
  div.innerHTML = `
    <span class="typing__dots" aria-hidden="true"><span></span><span></span><span></span></span>
    <span class="typing__text">${personaje.nombre} está escribiendo...</span>
  `;
  return div;
}

function crearError(mensaje, alReintentar) {
  const div = document.createElement('div');
  div.className = 'state state--error';
  div.setAttribute('role', 'alert');
  div.innerHTML = `
    <div class="stateContent">
      <h2>Error al responder</h2>
      <p class="errorTexto"></p>
      <button type="button" class="stateRetry">Reintentar</button>
    </div>
  `;
  div.querySelector('.errorTexto').textContent = mensaje;
  div.querySelector('.stateRetry').addEventListener('click', alReintentar);
  return div;
}
