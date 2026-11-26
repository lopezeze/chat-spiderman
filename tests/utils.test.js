import { describe, test, expect } from 'vitest';
import {
  crearMensaje,
  formatearHora,
  validarTexto,
  prepararHistorialParaApi,
  parsearHistorialGuardado,
  claveHistorial,
  obtenerPersonajeDeUrl
} from '../src/utils.js';

describe('crearMensaje', () => {
  test('arma el mensaje con rol, texto y fecha', () => {
    const fecha = new Date('2026-11-25T22:05:00.000Z');
    const msj = crearMensaje('user', 'hola', fecha);

    expect(msj.rol).toBe('user');
    expect(msj.texto).toBe('hola');
    expect(msj.fecha).toBe('2026-11-25T22:05:00.000Z');
    expect(msj.id).toBeTruthy();
  });

  test('dos mensajes creados en el mismo momento tienen ids distintos', () => {
    const fecha = new Date();
    expect(crearMensaje('user', 'a', fecha).id).not.toBe(crearMensaje('user', 'b', fecha).id);
  });
});

describe('formatearHora', () => {
  test('devuelve HH:MM con ceros adelante', () => {
    const fecha = new Date(2026, 10, 25, 9, 5); // hora local
    expect(formatearHora(fecha.toISOString())).toBe('09:05');
  });

  test('si la fecha no es valida devuelve string vacio', () => {
    expect(formatearHora('cualquier cosa')).toBe('');
  });
});

describe('validarTexto', () => {
  test('saca los espacios de los costados', () => {
    expect(validarTexto('   hola spidey  ')).toBe('hola spidey');
  });

  test('no deja mandar mensajes vacios o solo con espacios', () => {
    expect(validarTexto('')).toBeNull();
    expect(validarTexto('    ')).toBeNull();
    expect(validarTexto(undefined)).toBeNull();
  });

  test('no deja mandar mensajes de mas de 1000 caracteres', () => {
    expect(validarTexto('a'.repeat(1001))).toBeNull();
    expect(validarTexto('a'.repeat(1000))).toHaveLength(1000);
  });
});

describe('prepararHistorialParaApi', () => {
  test('transforma los mensajes al formato { role, text }', () => {
    const historial = [crearMensaje('user', 'hola'), crearMensaje('model', '¡Hola! Soy Spider-Man')];

    expect(prepararHistorialParaApi(historial)).toEqual([
      { role: 'user', text: 'hola' },
      { role: 'model', text: '¡Hola! Soy Spider-Man' }
    ]);
  });

  test('manda solo los ultimos N mensajes', () => {
    const historial = Array.from({ length: 30 }, (_, i) => crearMensaje('user', `msj ${i}`));
    const resultado = prepararHistorialParaApi(historial, 20);

    expect(resultado).toHaveLength(20);
    expect(resultado[0].text).toBe('msj 10');
    expect(resultado[19].text).toBe('msj 29');
  });
});

describe('parsearHistorialGuardado', () => {
  test('lee un historial guardado bien', () => {
    const guardado = JSON.stringify([crearMensaje('user', 'hola')]);
    expect(parsearHistorialGuardado(guardado)).toHaveLength(1);
  });

  test('si el json esta roto o vacio devuelve un array vacio', () => {
    expect(parsearHistorialGuardado('{esto no es json')).toEqual([]);
    expect(parsearHistorialGuardado(null)).toEqual([]);
    expect(parsearHistorialGuardado('{"a":1}')).toEqual([]);
  });

  test('descarta mensajes con forma incorrecta', () => {
    const guardado = JSON.stringify([
      crearMensaje('user', 'bien'),
      { rol: 'hacker', texto: 'mal', fecha: 'x' },
      { rol: 'model' }
    ]);
    expect(parsearHistorialGuardado(guardado)).toHaveLength(1);
  });
});

describe('claveHistorial y obtenerPersonajeDeUrl', () => {
  test('cada personaje tiene su propia clave en localStorage', () => {
    expect(claveHistorial('spiderman')).toBe('chat-historial-spiderman');
    expect(claveHistorial('ironman')).not.toBe(claveHistorial('spiderman'));
  });

  test('lee el personaje de la url y usa el principal si no existe', () => {
    const validos = ['spiderman', 'ironman', 'deadpool'];
    expect(obtenerPersonajeDeUrl('?personaje=ironman', validos, 'spiderman')).toBe('ironman');
    expect(obtenerPersonajeDeUrl('?personaje=batman', validos, 'spiderman')).toBe('spiderman');
    expect(obtenerPersonajeDeUrl('', validos, 'spiderman')).toBe('spiderman');
  });
});
