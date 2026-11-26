import { describe, test, expect, vi, afterEach } from 'vitest';
import { resolverRuta } from '../src/app.js';
import { enviarMensajeAPI } from '../src/chat.js';
import { crearMensaje } from '../src/utils.js';

describe('resolverRuta (routing)', () => {
  test('la raiz va a /home', () => {
    expect(resolverRuta('/')).toBe('/home');
    expect(resolverRuta('/index.html')).toBe('/home');
  });

  test('reconoce las rutas de la app', () => {
    expect(resolverRuta('/home')).toBe('/home');
    expect(resolverRuta('/chat')).toBe('/chat');
    expect(resolverRuta('/about')).toBe('/about');
    expect(resolverRuta('/personajes')).toBe('/personajes');
  });

  test('ignora la barra del final', () => {
    expect(resolverRuta('/chat/')).toBe('/chat');
  });

  test('una ruta que no existe va a /404', () => {
    expect(resolverRuta('/batman')).toBe('/404');
  });
});

describe('enviarMensajeAPI (fetch mockeado)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('manda el historial a /api/functions y devuelve la respuesta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ respuesta: '¡Hola! Acá Spider-Man.' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const historial = [crearMensaje('user', 'hola')];
    const respuesta = await enviarMensajeAPI('spiderman', historial);

    expect(respuesta).toBe('¡Hola! Acá Spider-Man.');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/functions');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({
      personajeId: 'spiderman',
      mensajes: [{ role: 'user', text: 'hola' }]
    });
  });

  test('si el servidor responde con error tira el mensaje del servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Se hicieron demasiados pedidos' })
      })
    );

    await expect(enviarMensajeAPI('spiderman', [crearMensaje('user', 'hola')])).rejects.toThrow(
      'Se hicieron demasiados pedidos'
    );
  });

  test('si no hay internet tira un error entendible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(enviarMensajeAPI('spiderman', [crearMensaje('user', 'hola')])).rejects.toThrow(
      'No hay conexión'
    );
  });

  test('si la respuesta viene sin texto tira error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await expect(enviarMensajeAPI('spiderman', [crearMensaje('user', 'hola')])).rejects.toThrow();
  });
});
