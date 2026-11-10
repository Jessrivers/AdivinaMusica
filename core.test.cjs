const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('./core.js');
function songs() { return [P.song({id:'a',owner:'Ana',title:'Uno',artist:'Artista',url:'https://youtu.be/dQw4w9WgXcQ'}),P.song({id:'b',owner:'Luis',title:'Dos',artist:'Otro',url:'https://open.spotify.com/intl-es/track/0VjIjW4GlUZAMYd2vXMi3b'})]; }
test('admite canciones y rechaza enlaces ajenos, playlists y protocolos inseguros', () => {
  assert.equal(P.platform(songs()[0].url),'YouTube'); assert.equal(P.platform(songs()[1].url),'Spotify');
  for(const url of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://youtube.com/playlist?list=abc','https://open.spotify.com/playlist/0VjIjW4GlUZAMYd2vXMi3b','https://evil.test','http://youtu.be/dQw4w9WgXcQ','https://user:pass@youtu.be/dQw4w9WgXcQ']) assert.throws(() => P.platform(url));
});
test('cada sorteo incluye todas las canciones exactamente una vez', () => {
  const input = Array.from({length:40},(_,i)=>i);
  for(let n=0;n<40;n++) { const result=P.shuffle(input); assert.equal(new Set(result).size,40); assert.deepEqual(result.slice().sort((a,b)=>a-b),input); }
  assert.deepEqual(input,Array.from({length:40},(_,i)=>i));
});
test('nombres equivalentes cuentan como una persona y no permiten iniciar solos', () => {
  const entries=songs(); entries[1].owner=' ANA '; assert.equal(P.participants(entries).length,1); assert.throws(()=>P.start(entries));
});
test('puntúa una vez por ronda y excluye al dueño de la canción', () => {
  const entries=songs(), game={order:['a','b'],index:0,revealed:false,awards:[]};
  assert.throws(()=>P.award(game,entries,'Luis','Luis'));
  game.revealed=true; assert.throws(()=>P.award(game,entries,'Ana','')); assert.equal(game.index,0);
  P.award(game,entries,'Luis','Luis'); assert.equal(P.scores(entries,game)[0].points,3);
  assert.throws(()=>P.award(game,entries,'Luis','Luis'));
  game.revealed=true; P.award(game,entries,'',''); assert.equal(game.index,2);
  assert.equal(P.scores(entries,game).find(s=>s.name==='Luis').points,3);
});
test('recupera una ronda revelada y conserva puntos, rechaza estado adulterado', () => {
  const entries=songs(), game={order:['a','b'],index:0,revealed:true,awards:[]};
  P.award(game,entries,'Luis',''); game.revealed=true;
  const raw={version:1,songs:entries,game}; assert.deepEqual(P.restore(JSON.parse(JSON.stringify(raw))),raw);
  assert.throws(()=>P.restore({...raw,game:{...game,order:['a','a']}}));
  assert.throws(()=>P.restore({...raw,game:{...game,awards:[{songWinner:'Ana',ownerWinner:''}]}}));
  assert.throws(()=>P.restore({...raw,game:{...game,index:5}}));
});
