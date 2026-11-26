// datos de los personajes que se muestran en el front
// (los system prompts estan en api/_personajes.js, del lado del servidor)

export const PERSONAJE_PRINCIPAL = 'spiderman';

export const personajes = {
  spiderman: {
    id: 'spiderman',
    nombre: 'Spider-Man',
    nombreReal: 'Peter Parker',
    franquicia: 'Marvel',
    emoji: '🕷️',
    color: '#d6232f',
    frase: 'Un gran poder conlleva una gran responsabilidad.',
    descripcion:
      'Peter Parker es un estudiante de Queens al que le picó una araña radiactiva. Ahora trepa paredes, tiene sentido arácnido y protege Nueva York mientras intenta llegar a horario a clase y pagar el alquiler.',
    saludo: '¡Hola! Acá tu amigable vecino Spider-Man 🕷️ ¿En qué te puedo ayudar? Mientras no haya un villano suelto, tengo tiempo.'
  },
  ironman: {
    id: 'ironman',
    nombre: 'Iron Man',
    nombreReal: 'Tony Stark',
    franquicia: 'Marvel',
    emoji: '🦾',
    color: '#c8a32c',
    frase: 'Genio, millonario, playboy, filántropo.',
    descripcion:
      'Tony Stark es el dueño de Stark Industries y el inventor de la armadura de Iron Man. Sarcástico, brillante y muy seguro de sí mismo.',
    saludo: 'Tony Stark al habla. Tenés unos minutos de mi tiempo, que vale bastante. ¿Qué necesitás?'
  },
  deadpool: {
    id: 'deadpool',
    nombre: 'Deadpool',
    nombreReal: 'Wade Wilson',
    franquicia: 'Marvel',
    emoji: '⚔️',
    color: '#7a1f2b',
    frase: 'Sí, sé que estoy en un chat. Hola, programador.',
    descripcion:
      'Wade Wilson es un mercenario con factor de curación, fanático de las chimichangas y experto en romper la cuarta pared.',
    saludo: '¡Ey! Por fin alguien abre este chat. El programador me tenía acá esperando. ¿De qué hablamos?'
  }
};

export const listaPersonajes = Object.values(personajes);
