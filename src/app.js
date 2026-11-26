// logica principal: routing con History API y vistas

import { personajes, listaPersonajes, PERSONAJE_PRINCIPAL } from './personajes.js';
import { obtenerPersonajeDeUrl } from './utils.js';
import { montarChat } from './chat.js';

// rutas de la app
export const rutas = {
  '/home': vistaHome,
  '/personajes': vistaPersonajes,
  '/chat': vistaChat,
  '/about': vistaAbout
};

// devuelve la ruta "normalizada" para un pathname
export function resolverRuta(pathname) {
  if (pathname === '/' || pathname === '' || pathname === '/index.html') return '/home';

  // saco la barra del final por si escriben /chat/
  const limpio = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return rutas[limpio] ? limpio : '/404';
}

// ---------- vistas ----------

function vistaHome(app) {
  const p = personajes[PERSONAJE_PRINCIPAL];

  app.innerHTML = `
    <section class="home" style="--color-personaje: ${p.color}">
      <div class="home__hero">
        <div class="avatar avatar--xl" aria-hidden="true">${p.emoji}</div>
        <p class="home__franquicia">${p.franquicia}</p>
        <h1 class="home__titulo">Chateá con ${p.nombre}</h1>
        <p class="home__frase">"${p.frase}"</p>
        <p class="home__descripcion">${p.descripcion}</p>
        <div class="home__acciones">
          <a href="/chat?personaje=${p.id}" class="btn btn--primary" data-link>Empezar a chatear</a>
          <a href="/personajes" class="btn btn--secondary" data-link>Ver otros personajes</a>
        </div>
      </div>
    </section>
  `;
}

function vistaPersonajes(app) {
  const tarjetas = listaPersonajes
    .map(
      (p) => `
      <article class="tarjeta" style="--color-personaje: ${p.color}">
        <div class="avatar avatar--grande" aria-hidden="true">${p.emoji}</div>
        <h2 class="tarjeta__nombre">${p.nombre}</h2>
        <p class="tarjeta__real">${p.nombreReal}</p>
        <p class="tarjeta__descripcion">${p.descripcion}</p>
        <a href="/chat?personaje=${p.id}" class="btn btn--primary" data-link>Chatear</a>
      </article>
    `
    )
    .join('');

  app.innerHTML = `
    <section class="galeria">
      <h1 class="galeria__titulo">Elegí tu personaje</h1>
      <p class="galeria__sub">Cada uno tiene su propia personalidad (y su propio historial).</p>
      <div class="galeria__grid">${tarjetas}</div>
    </section>
  `;
}

function vistaChat(app) {
  const id = obtenerPersonajeDeUrl(window.location.search, Object.keys(personajes), PERSONAJE_PRINCIPAL);
  montarChat(app, id);
}

function vistaAbout(app) {
  const p = personajes[PERSONAJE_PRINCIPAL];

  app.innerHTML = `
    <section class="about">
      <h1>Sobre el proyecto</h1>
      <p>
        Esta app es una prueba de concepto para <strong>ComicSansCon</strong>: una Single Page Application
        donde podés chatear con personajes de ficción usando inteligencia artificial (Google Gemini).
      </p>

      <h2>El personaje: ${p.nombre}</h2>
      <p>${p.descripcion}</p>
      <p>
        En el chat, ${p.nombreReal} habla como un chico de Queens: hace chistes cuando está nervioso,
        se queja de que no le alcanza la plata y siempre tiene que irse a patrullar. También podés hablar con
        Iron Man y Deadpool desde la sección <a href="/personajes" data-link>Personajes</a>.
      </p>

      <h2>Cómo está hecho</h2>
      <ul>
        <li>HTML, CSS y JavaScript sin frameworks.</li>
        <li>Diseño mobile-first con Flexbox, Grid y media queries (320px, 768px y 1024px).</li>
        <li>Routing SPA con la History API (sin recargar la página).</li>
        <li>Vercel Serverless Function que llama a Gemini, así la API key nunca llega al navegador.</li>
        <li>Tests unitarios con Vitest.</li>
      </ul>

      <p class="about__autor">Hecho por Ezequiel Lopez Perez - Henry WebFT80</p>
    </section>
  `;
}

function vista404(app) {
  app.innerHTML = `
    <section class="state state--error noEncontrado">
      <div class="stateContent">
        <h1>404</h1>
        <p>Esta página no existe. Ni el sentido arácnido la encuentra.</p>
        <a href="/home" class="btn btn--primary" data-link>Volver al inicio</a>
      </div>
    </section>
  `;
}

// ---------- router ----------

function render() {
  const app = document.getElementById('app');
  const ruta = resolverRuta(window.location.pathname);

  // si entran a "/" los mando a /home sin agregar otra entrada al historial
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    history.replaceState(null, '', '/home');
  }

  const vista = rutas[ruta] || vista404;
  vista(app);

  document.body.dataset.ruta = ruta.slice(1);
  marcarLinkActivo(ruta);
  window.scrollTo(0, 0);
}

export function navegar(url) {
  if (url === window.location.pathname + window.location.search) return;
  history.pushState(null, '', url);
  render();
}

function marcarLinkActivo(ruta) {
  document.querySelectorAll('.nav__link').forEach((link) => {
    const activa = new URL(link.href).pathname === ruta;
    link.classList.toggle('nav__link--activo', activa);
    if (activa) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

// ---------- modo oscuro (extra credit) ----------

function iniciarTema() {
  let tema = null;
  try {
    tema = localStorage.getItem('tema');
  } catch {}

  if (!tema) {
    tema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
  aplicarTema(tema);

  document.getElementById('btnTema').addEventListener('click', () => {
    const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
    aplicarTema(nuevo);
    try {
      localStorage.setItem('tema', nuevo);
    } catch {}
  });
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const btn = document.getElementById('btnTema');
  btn.textContent = tema === 'oscuro' ? '☀️' : '🌙';
  btn.setAttribute('aria-label', tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

// ---------- arranque ----------

export function iniciarApp() {
  // intercepto los clicks en links con data-link para no recargar la pagina
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-link]');
    if (!link) return;
    // si abren en otra pestaña (ctrl/cmd + click) dejo que el navegador haga lo suyo
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

    e.preventDefault();
    const url = new URL(link.href);
    navegar(url.pathname + url.search);
  });

  // botones atras / adelante del navegador
  window.addEventListener('popstate', render);

  iniciarTema();
  render();
}

// solo arranca en el navegador (en los tests no hay document)
if (typeof document !== 'undefined' && document.getElementById('app')) {
  iniciarApp();
}
