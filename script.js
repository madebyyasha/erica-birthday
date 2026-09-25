const scenes=[...document.querySelectorAll('.scene')];
const show=id=>{scenes.forEach(s=>s.classList.toggle('active',s.id===id));};
let audioCtx,micStream,micFrame,started=false;

function tone(freq,start,duration,type='sine',gain=.035){
  if(!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,audioCtx.currentTime+start);
  g.gain.linearRampToValueAtTime(gain,audioCtx.currentTime+start+.02);
  g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+start+duration);
  o.connect(g).connect(audioCtx.destination);o.start(audioCtx.currentTime+start);o.stop(audioCtx.currentTime+start+duration+.04);
}
function pageSound(){[523,659,784].forEach((f,i)=>tone(f,i*.055,.22,'triangle',.018));}
function crashSound(){[180,130,95].forEach((f,i)=>tone(f,i*.035,.3,'sawtooth',.025));}
function happyBirthday(){
  const n={G3:196,A3:220,B3:247,C4:262,D4:294,E4:330,F4:349,G4:392};
  const melody=[['G3',.25],['G3',.25],['A3',.5],['G3',.5],['C4',.5],['B3',1],['G3',.25],['G3',.25],['A3',.5],['G3',.5],['D4',.5],['C4',1],['G3',.25],['G3',.25],['G4',.5],['E4',.5],['C4',.5],['B3',.5],['A3',1],['F4',.25],['F4',.25],['E4',.5],['C4',.5],['D4',.5],['C4',1]];
  let t=.1;melody.forEach(([name,d])=>{tone(n[name],t,d*.85,'triangle',.05);tone(n[name]/2,t,d*.9,'sine',.022);t+=d});
}
function makeFlames(){
  const box=document.querySelector('#flames');box.innerHTML='';
  const positions=[[18,5],[33,1],[49,5],[64,1],[79,6],[12,35],[26,31],[40,36],[55,30],[70,35],[85,31],[8,69],[20,65],[32,70],[44,65],[56,70],[68,65],[80,70],[92,66]];
  positions.forEach(([x,y],i)=>{const f=document.createElement('i');f.className='flame';f.style.cssText=`left:${x}%;top:${y}%;animation-delay:${(i%5)*-.03}s`;box.appendChild(f)});
}
function beginMic(){
  if(!navigator.mediaDevices?.getUserMedia)return;
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    micStream=stream;const analyser=audioCtx.createAnalyser();analyser.fftSize=256;
    audioCtx.createMediaStreamSource(stream).connect(analyser);const data=new Uint8Array(analyser.frequencyBinCount);let strong=0;
    const listen=()=>{analyser.getByteFrequencyData(data);const avg=data.reduce((a,b)=>a+b,0)/data.length;strong=avg>34?strong+1:Math.max(0,strong-1);if(strong>7){extinguish();return}micFrame=requestAnimationFrame(listen)};listen();
  }).catch(()=>{});
}
function extinguish(){
  if(document.querySelector('#cakeScene').dataset.done)return;
  document.querySelector('#cakeScene').dataset.done='1';cancelAnimationFrame(micFrame);micStream?.getTracks().forEach(t=>t.stop());
  [...document.querySelectorAll('.flame')].forEach((f,i)=>setTimeout(()=>f.classList.add('out'),i*25));
  setTimeout(()=>{show('finale');happyBirthday();confetti()},1050);
}
function confetti(){
  const c=document.querySelector('#confetti'),x=c.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);c.width=innerWidth*dpr;c.height=innerHeight*dpr;x.scale(dpr,dpr);
  const colors=['#ffca68','#f45475','#5fd2c4','#fff4d8','#6489ff'];
  const p=Array.from({length:150},()=>({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight,v:2+Math.random()*4,r:3+Math.random()*6,a:Math.random()*6,s:(Math.random()-.5)*.16,c:colors[Math.floor(Math.random()*colors.length)]}));
  let frame=0;(function draw(){x.clearRect(0,0,innerWidth,innerHeight);p.forEach(q=>{q.y+=q.v;q.x+=Math.sin(q.a)*.7;q.a+=q.s;x.save();x.translate(q.x,q.y);x.rotate(q.a);x.fillStyle=q.c;x.fillRect(-q.r,-q.r/2,q.r*2,q.r);x.restore();if(q.y>innerHeight+20)q.y=-20});if(frame++<720)requestAnimationFrame(draw)})();
}
document.querySelector('#startButton').addEventListener('click',()=>{
  if(started)return;started=true;audioCtx=new(window.AudioContext||window.webkitAudioContext)();pageSound();show('walk');
  const walk=document.querySelector('#walk');requestAnimationFrame(()=>walk.classList.add('playing'));
  setTimeout(()=>{walk.classList.add('crash');crashSound()},4100);
  setTimeout(()=>{show('splatScene');crashSound()},4550);
  setTimeout(()=>{makeFlames();show('cakeScene');pageSound();beginMic()},6900);
});
document.querySelector('#blowButton').addEventListener('click',extinguish);
document.querySelector('#replayButton').addEventListener('click',()=>location.reload());
