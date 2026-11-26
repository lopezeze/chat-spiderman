// funciones de transformacion de datos (no tocan el DOM, por eso se pueden testear)

export const MAX_LARGO_MENSAJE = 1000;
export const MAX_HISTORIAL_API = 20;

let contadorIds = 0;

// crea un mensaje con la forma que uso en todo el front
export function crearMensaje(rol, texto, fecha = new Date()) {
  contadorIds++;
  return {
    id: `${fecha.getTime()}-${contadorIds}`,
    rol, // 'user' o 'model'
    texto,
    fecha: fecha.toISOString()
  };
}

// "2026-11-25T22:05:00.000Z" -> "19:05" (en la hora local)
export function formatearHora(fecha) {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';

  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

// devuelve el texto limpio o null si no se puede mandar
export function validarTexto(texto) {
  if (typeof texto !== 'string') return null;

  const limpio = texto.trim();
  if (limpio === '' || limpio.length > MAX_LARGO_MENSAJE) return null;

  return limpio;
}

// pasa el historial del front al formato que espera /api/functions
// solo mando los ultimos mensajes para no gastar tokens de mas
export function prepararHistorialParaApi(mensajes, max = MAX_HISTORIAL_API) {
  return mensajes
    .filter((m) => m.rol === 'user' || m.rol === 'model')
    .slice(-max)
    .map((m) => ({ role: m.rol, text: m.texto }));
}

// lee lo que viene de localStorage sin romper si esta mal guardado
export function parsearHistorialGuardado(json) {
  if (!json) return [];

  try {
    const datos = JSON.parse(json);
    if (!Array.isArray(datos)) return [];

    return datos.filter(
      (m) =>
        m &&
        (m.rol === 'user' || m.rol === 'model') &&
        typeof m.texto === 'string' &&
        typeof m.fecha === 'string'
    );
  } catch {
    return [];
  }
}

export function claveHistorial(personajeId) {
  return `chat-historial-${personajeId}`;
}

// saca el ?personaje=xxx de la url
export function obtenerPersonajeDeUrl(search, personajesValidos, porDefecto) {
  const params = new URLSearchParams(search);
  const id = params.get('personaje');
  return personajesValidos.includes(id) ? id : porDefecto;
}
