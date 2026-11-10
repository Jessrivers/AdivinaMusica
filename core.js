(function (root) {
'use strict';
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const key = name => name.trim().normalize('NFC').toLocaleLowerCase('es');
function platform(link) {
  let url; try { url = new URL(link); } catch { throw new Error('Escribe un enlace completo de YouTube o Spotify.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('El enlace debe comenzar con https:// y pertenecer a YouTube o Spotify.');
  const host = url.hostname.toLowerCase();
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    const id = url.pathname === '/watch' ? url.searchParams.get('v') : (/^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(url.pathname) || [])[1];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return 'YouTube';
  }
  if (host === 'youtu.be' && /^\/[a-zA-Z0-9_-]{11}\/?$/.test(url.pathname)) return 'YouTube';
  if (host === 'open.spotify.com' && /^\/(?:intl-[a-z]{2}\/)?track\/[a-zA-Z0-9]{22}\/?$/.test(url.pathname)) return 'Spotify';
  throw new Error('Usa el enlace de un video de YouTube o de una canción de Spotify. No se admiten playlists ni enlaces acortados de Spotify.');
}
function song(data) {
  if (!data || typeof data !== 'object') throw new Error('La canción no tiene un formato válido.');
  const result = { id: clean(data.id, 80) || crypto.randomUUID(), owner: clean(data.owner, 40), title: clean(data.title, 100), artist: clean(data.artist, 100), url: clean(data.url, 1000), story: clean(data.story, 280) };
  if (!result.owner || !result.title || !result.artist) throw new Error('Completa el nombre, la canción y el artista.');
  platform(result.url); return result;
}
function participants(songs) {
  const names = new Map(); songs.forEach(s => { if (!names.has(key(s.owner))) names.set(key(s.owner), s.owner); });
  return Array.from(names.values());
}
function shuffle(items, random = Math.random) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function start(songs) {
  if (songs.length < 2 || participants(songs).length < 2) throw new Error('Necesitas al menos dos personas con una canción cada una.');
  return { order: shuffle(songs.map(s => s.id)), index: 0, revealed: false, awards: [] };
}
function award(game, songs, songWinner, ownerWinner) {
  if (!game || !game.revealed || game.index >= game.order.length) throw new Error('Primero revela la canción.');
  const current = songs.find(s => s.id === game.order[game.index]);
  const eligible = participants(songs).filter(name => key(name) !== key(current.owner));
  for (const winner of [songWinner, ownerWinner]) if (winner && !eligible.includes(winner)) throw new Error('Elige un participante válido.');
  game.awards.push({ songWinner, ownerWinner });
  game.index++; game.revealed = false;
}
function scores(songs, game) {
  const rows = participants(songs).map(name => ({ name, points: 0 }));
  for (const entry of game ? game.awards : []) {
    for (const [winner, points] of [[entry.songWinner, 2], [entry.ownerWinner, 1]]) {
      const row = rows.find(r => r.name === winner); if (row) row.points += points;
    }
  }
  return rows.sort((a,b) => b.points-a.points || a.name.localeCompare(b.name, 'es'));
}
function restore(raw) {
  if (!raw || raw.version !== 1 || !Array.isArray(raw.songs) || raw.songs.length > 200) throw new Error('Archivo de playlist no válido (máximo 200 canciones).');
  const songs = raw.songs.map(song);
  if (new Set(songs.map(s => s.id)).size !== songs.length) throw new Error('Hay identificadores de canciones repetidos.');
  const state = { version: 1, songs, game: null };
  if (raw.game) {
    const g = raw.game;
    if (!Array.isArray(g.order) || g.order.length !== songs.length || new Set(g.order).size !== songs.length || !g.order.every(id => songs.some(s => s.id === id)) || !Number.isInteger(g.index) || g.index < 0 || g.index > songs.length || !Array.isArray(g.awards) || g.awards.length !== g.index || typeof g.revealed !== 'boolean') throw new Error('La partida guardada no es válida.');
    const checked = { order: g.order, index: 0, revealed: false, awards: [] };
    for (const entry of g.awards) { if (!entry || typeof entry.songWinner !== 'string' || typeof entry.ownerWinner !== 'string') throw new Error('Puntuación no válida.'); checked.revealed = true; award(checked, songs, entry.songWinner, entry.ownerWinner); }
    checked.revealed = checked.index < songs.length && g.revealed; state.game = checked;
  }
  return state;
}
const api = { key, platform, song, participants, shuffle, start, award, scores, restore };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Playlist = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
