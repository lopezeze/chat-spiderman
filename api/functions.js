// Vercel Serverless Function
// hace de "proxy" entre el front y gemini, asi la API key nunca llega al navegador
// el front hace POST /api/functions con { personajeId, mensajes: [{ role, text }] }

import { obtenerPrompt } from './_personajes.js';
import { validarMensajes, armarBodyGemini, parsearRespuestaGemini } from './_gemini.js';

const MODELO_POR_DEFECTO = 'gemini-3.5-flash-lite';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido, usá POST' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // console.log('falta la GEMINI_API_KEY en el .env')
    return res.status(500).json({ error: 'El servidor no tiene configurada la API key' });
  }

  const { personajeId, mensajes } = req.body || {};

  const systemPrompt = obtenerPrompt(personajeId);
  if (!systemPrompt) {
    return res.status(400).json({ error: 'Ese personaje no existe' });
  }

  const errorValidacion = validarMensajes(mensajes);
  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  const modelo = process.env.GEMINI_MODEL || MODELO_POR_DEFECTO;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // la key va en el header y no en la url
      },
      body: JSON.stringify(armarBodyGemini(systemPrompt, mensajes))
    });

    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      // console.log('error de gemini', respuesta.status, data)
      if (respuesta.status === 429) {
        return res.status(429).json({ error: 'Se hicieron demasiados pedidos, esperá un momento y probá de nuevo' });
      }
      return res.status(502).json({ error: 'Gemini devolvió un error' });
    }

    const texto = parsearRespuestaGemini(data);
    if (!texto) {
      return res.status(502).json({ error: 'Gemini no devolvió una respuesta válida' });
    }

    return res.status(200).json({ respuesta: texto });
  } catch (err) {
    // console.log(err)
    return res.status(500).json({ error: 'No se pudo conectar con Gemini' });
  }
}
