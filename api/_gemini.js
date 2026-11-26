// funciones para armar el pedido a gemini y leer la respuesta
// las separe de functions.js para poder testearlas facil

export const MAX_MENSAJES = 20; // para no mandar historiales gigantes (tokens)
export const MAX_LARGO_MENSAJE = 1000;

// revisa que lo que manda el front tenga la forma correcta
// devuelve un string con el error o null si esta todo bien
export function validarMensajes(mensajes) {
  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    return 'Tenés que mandar al menos un mensaje';
  }

  for (const msj of mensajes) {
    if (!msj || (msj.role !== 'user' && msj.role !== 'model')) {
      return 'Cada mensaje tiene que tener role "user" o "model"';
    }
    if (typeof msj.text !== 'string' || msj.text.trim() === '') {
      return 'Hay un mensaje sin texto';
    }
    if (msj.text.length > MAX_LARGO_MENSAJE) {
      return `Los mensajes no pueden tener más de ${MAX_LARGO_MENSAJE} caracteres`;
    }
  }

  if (mensajes[mensajes.length - 1].role !== 'user') {
    return 'El último mensaje tiene que ser del usuario';
  }

  return null;
}

// arma el body que pide la api de gemini
// gemini usa "user" y "model" como roles y el texto va adentro de parts
export function armarBodyGemini(systemPrompt, mensajes) {
  const ultimos = mensajes.slice(-MAX_MENSAJES);

  // gemini pide que la conversacion arranque con un mensaje del usuario
  while (ultimos.length && ultimos[0].role !== 'user') {
    ultimos.shift();
  }

  return {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: ultimos.map((msj) => ({
      role: msj.role,
      parts: [{ text: msj.text }]
    })),
    generationConfig: {
      temperature: 0.9, // un poco alta para que el personaje sea mas creativo
      maxOutputTokens: 1024
    }
  };
}

// saca el texto de la respuesta de gemini
// la respuesta viene asi: { candidates: [ { content: { parts: [ { text } ] } } ] }
export function parsearRespuestaGemini(data) {
  const partes = data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(partes)) return null;

  // algunos modelos mandan partes de "thought" (razonamiento), esas las salteo
  const texto = partes
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();

  return limpiarMarkdown(texto) || null;
}

// a veces gemini responde con markdown (*cursiva* o **negrita**) y en el chat
// se ven los asteriscos, asi que los saco y dejo solo el texto
export function limpiarMarkdown(texto) {
  return texto
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '$1$2')
    .replace(/__(.+?)__/g, '$1');
}
