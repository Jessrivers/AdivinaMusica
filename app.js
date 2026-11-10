'use strict';
const P = window.Playlist;
const $ = id => document.getElementById(id);
const STORAGE = 'en-tu-playlist-v1';
let state = { version: 1, songs: [], game: null };
let timerInterval = null;
let seconds = 15;
let noticeTimeout;
function notice(message) { $('notice').textContent = message; $('notice').hidden = false; clearTimeout(noticeTimeout); noticeTimeout = setTimeout(() => { $('notice').hidden = true; }, 9000); }
function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); $('save-status').textContent = 'Guardado en este navegador · no se sincroniza entre dispositivos.'; }
  catch { $('save-status').textContent = 'No se pudo guardar. Exporta tu playlist antes de cerrar.'; notice('El navegador no permite guardar la partida. Puedes seguir jugando y exportar las canciones.'); }
}
function element(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
function stopTimer() { clearInterval(timerInterval); timerInterval = null; $('timer-button').textContent = seconds === 0 ? '◷ Repetir 15 s' : '◷ Iniciar 15 s'; }
function resetTimer() { stopTimer(); seconds = 15; $('timer').textContent = '15'; $('timer-button').textContent = '◷ Iniciar 15 s'; }
function tab(name) {
  document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== name; });
  document.querySelectorAll('.steps [data-tab]').forEach(button => { const active = button.dataset.tab === name; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  if (name !== 'game') stopTimer();
  if (name === 'results') renderScores();
}
function allowChange() {
  if (!state.game) return true;
  if (!confirm('Cambiar la playlist terminará la partida y borrará su marcador. ¿Continuar?')) return false;
  state.game = null; resetTimer(); return true;
}
function renderSetup() {
  const names = P.participants(state.songs);
  $('song-count').textContent = state.songs.length + (state.songs.length === 1 ? ' canción' : ' canciones');
  $('participant-summary').textContent = names.length ? names.length + ' personas · ' + names.join(', ') : 'Tu equipo todavía no ha puesto música.';
  $('start').disabled = names.length < 2;
  $('start').textContent = state.game ? 'Reiniciar partida →' : 'Comenzar partida →';
  $('participants').replaceChildren(...names.map(name => { const option = document.createElement('option'); option.value = name; return option; }));
  $('song-list').replaceChildren();
  if (!state.songs.length) {
    const empty = element('div', 'empty-playlist'); empty.append(element('div', 'empty-note', '♫'), element('h3', '', 'Una playlist con personalidad.'), element('p', 'muted', 'Empieza con esa canción que nunca saltas.')); $('song-list').append(empty);
  }
  state.songs.forEach(s => {
    const row = element('div', 'song-row'); const info = element('div', 'song-info');
    info.append(element('strong', '', s.title), element('small', '', s.artist + ' · ' + s.owner + ' · ' + P.platform(s.url)));
    const remove = element('button', 'delete-button', '×'); remove.type = 'button'; remove.setAttribute('aria-label', 'Quitar ' + s.title);
    remove.addEventListener('click', () => { if (!allowChange()) return; state.songs = state.songs.filter(item => item.id !== s.id); persist(); render(); });
    row.append(element('div', 'song-art', '♫'), info, remove); $('song-list').append(row);
  });
}
function currentSong() { return state.game && state.songs.find(s => s.id === state.game.order[state.game.index]); }
function winnerOptions(select, owner) {
  select.replaceChildren(new Option('Nadie / sin puntos', ''));
  P.participants(state.songs).filter(name => P.key(name) !== P.key(owner)).forEach(name => select.add(new Option(name, name)));
}
function renderGame() {
  const g = state.game, song = currentSong();
  $('game-empty').hidden = Boolean(song); $('game-content').hidden = !song;
  if (!song) return;
  $('round-label').textContent = 'RONDA ' + (g.index + 1) + ' / ' + g.order.length;
  $('progress-fill').style.width = ((g.index + 1) / g.order.length * 100) + '%';
  $('track-label').textContent = g.revealed ? 'EL SECRETO ESTABA EN SU PLAYLIST' : 'ESTÁ SONANDO UN SECRETO';
  $('track-title').textContent = g.revealed ? song.title : '¿Te suena?';
  $('track-subtitle').textContent = g.revealed ? song.artist + ' · La eligió ' + song.owner : 'Adivina la canción… y a la persona detrás del play.';
  $('track-story').hidden = !g.revealed;
  $('track-story').textContent = g.revealed ? (song.story ? '“' + song.story + '”' : song.owner + ', ¿por qué elegiste esta canción?') : '';
  $('reveal').hidden = g.revealed; $('awards').hidden = !g.revealed;
  $('timer-button').disabled = g.revealed;
  if (g.revealed) { winnerOptions($('song-winner'), song.owner); winnerOptions($('owner-winner'), song.owner); }
  $('next').textContent = g.index === g.order.length - 1 ? 'Guardar puntos y ver resultados ✦' : 'Guardar puntos y siguiente →';
}
function renderScores() {
  const g = state.game; const finished = Boolean(g && g.index === g.order.length);
  $('result-title').textContent = finished ? 'Ahora se conocen un poco más.' : 'Así va la partida';
  $('result-description').textContent = g ? g.index + ' de ' + g.order.length + ' rondas puntuadas. Los empates comparten lugar.' : 'Inicia una partida para sumar puntos.';
  $('resume').hidden = !g || finished; $('replay').disabled = P.participants(state.songs).length < 2;
  const rows = P.scores(state.songs, g); let rank = 0, previous = null;
  $('score-list').replaceChildren();
  if (!rows.length) $('score-list').append(element('li', 'muted', 'Todavía no hay participantes.'));
  rows.forEach((row, index) => {
    if (row.points !== previous) rank = index + 1; previous = row.points;
    const item = element('li', 'score-row'); const points = element('span', 'score-points', String(row.points)); points.append(element('small', '', 'PTS'));
    item.append(element('span', 'rank', String(rank).padStart(2, '0')), element('span', 'score-name', row.name), points); $('score-list').append(item);
  });
}
function render() { renderSetup(); renderGame(); renderScores(); }
function begin() {
  if (state.game && !confirm('¿Iniciar una nueva partida? Se reiniciará el marcador y se mezclarán las mismas canciones.')) return;
  try { state.game = P.start(state.songs); resetTimer(); persist(); render(); tab('game'); } catch (error) { notice(error.message); }
}
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => tab(button.dataset.tab)));
$('song-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    if (state.songs.length >= 200) throw new Error('Esta playlist ya tiene 200 canciones.');
    const song = P.song(Object.fromEntries(new FormData(event.target)));
    const existing = P.participants(state.songs).find(name => P.key(name) === P.key(song.owner)); if (existing) song.owner = existing;
    if (state.songs.some(s => P.key(s.title) === P.key(song.title) && P.key(s.artist) === P.key(song.artist))) throw new Error('Esa canción ya está en la playlist. Elijan otra para que cada ronda sea diferente.');
    if (!allowChange()) return;
    state.songs.push(song); persist(); render(); event.target.reset(); $('owner').value = song.owner; $('title').focus(); notice('Canción agregada. Su historia espera su turno.');
  } catch (error) { notice(error.message); }
});
$('start').addEventListener('click', begin); $('replay').addEventListener('click', begin);
$('resume').addEventListener('click', () => tab('game'));
$('open-track').addEventListener('click', () => { const song = currentSong(); if (song) window.open(song.url, '_blank', 'noopener,noreferrer'); });
$('timer-button').addEventListener('click', () => {
  if (timerInterval) { stopTimer(); return; }
  if (seconds === 0) seconds = 15;
  const deadline = Date.now() + seconds * 1000; $('timer-button').textContent = '◷ Pausar';
  timerInterval = setInterval(() => { seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); $('timer').textContent = String(seconds); if (!seconds) { stopTimer(); notice('¡Tiempo! Pausa la música y escuchen sus respuestas.'); } }, 200);
});
$('reveal').addEventListener('click', () => { if (!currentSong()) return; state.game.revealed = true; stopTimer(); persist(); renderGame(); });
$('next').addEventListener('click', () => {
  try { P.award(state.game, state.songs, $('song-winner').value, $('owner-winner').value); resetTimer(); persist(); render(); if (state.game.index === state.game.order.length) tab('results'); }
  catch (error) { notice(error.message); }
});
$('export').addEventListener('click', () => {
  if (!state.songs.length) { notice('Agrega al menos una canción antes de exportar.'); return; }
  const blob = new Blob([JSON.stringify({ version: 1, songs: state.songs }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'en-tu-playlist.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('import-button').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('El archivo es demasiado grande. Usa una playlist de menos de 1 MB.');
    const imported = P.restore(JSON.parse(await file.text()));
    const combined = state.songs.slice();
    for (const s of imported.songs) {
      if (combined.some(item => P.key(item.title) === P.key(s.title) && P.key(item.artist) === P.key(s.artist))) continue;
      const owner = P.participants(combined).find(name => P.key(name) === P.key(s.owner));
      combined.push({ ...s, id: crypto.randomUUID(), owner: owner || s.owner });
    }
    if (combined.length > 200) throw new Error('La playlist combinada supera las 200 canciones.');
    const added = combined.length - state.songs.length;
    if (!added) { notice('No hay canciones nuevas para importar.'); return; }
    if (!allowChange()) return;
    state.songs = combined; persist(); render(); notice(added + ' canciones importadas.');
  } catch (error) { notice('No se pudo importar: ' + error.message); } finally { event.target.value = ''; }
});
$('demo').addEventListener('click', () => {
  if (state.songs.length && !confirm('¿Reemplazar la playlist por tres canciones de ejemplo? Exporta antes si quieres conservar la tuya.')) return;
  state = { version: 1, game: null, songs: [
    P.song({ owner: 'Alex', title: 'Never Gonna Give You Up', artist: 'Rick Astley', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', story: 'Porque un buen meme también une al equipo.' }),
    P.song({ owner: 'Dani', title: 'Blinding Lights', artist: 'The Weeknd', url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b', story: 'Mi canción para ponerme de buenas.' }),
    P.song({ owner: 'Sam', title: 'Viva La Vida', artist: 'Coldplay', url: 'https://www.youtube.com/watch?v=dvgZkm1xWPE', story: 'Me recuerda los viajes con amigos.' })
  ] }; resetTimer(); persist(); render(); notice('Ejemplos cargados. ¡Ya puedes probar una partida!');
});
try { const raw = localStorage.getItem(STORAGE); if (raw) state = P.restore(JSON.parse(raw)); }
catch { notice('No se pudo recuperar la partida guardada. Puedes importar una playlist o empezar otra.'); }
render(); if (state.game) tab(currentSong() ? 'game' : 'results');
