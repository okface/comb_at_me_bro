/* Comb At Me Bro — UI Screens. 11 portrait phone frames. */
const { PAL: UP, ROUGH: UR, ROUGH_LIGHT: URL_F } = window.CAMB;
const { QueenBee, BEE_ROLES } = window.CAMB_BEES;
const { WildNestHive } = window.CAMB_HIVE;
const { STRUCTURES } = window.CAMB_STRUCT;

// Phone wrapper — 390x844
function Phone({ children, label }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <div style={{fontSize:10, letterSpacing:'0.12em', color:UP.inkSoft, textTransform:'uppercase'}}>{label}</div>
      <div style={{
        width:390, height:844, border:`1px solid ${UP.ink}`, background:UP.paper,
        position:'relative', overflow:'hidden', flexShrink:0
      }}>{children}</div>
    </div>
  );
}

// Card frame helper — wobbly stroke + ink corners
function CardFrame({ children, w, h, style }) {
  return (
    <div style={{position:'relative', width:w, height:h, ...style}}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{position:'absolute', inset:0, pointerEvents:'none'}}>
        <rect x="2" y="2" width={w-4} height={h-4} fill={UP.paper} stroke={UP.ink} strokeWidth="1.4" filter={URL_F}/>
        {/* corner accents */}
        <g stroke={UP.ink} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d={`M 6,12 L 6,6 L 12,6`}/>
          <path d={`M ${w-6},12 L ${w-6},6 L ${w-12},6`}/>
          <path d={`M 6,${h-12} L 6,${h-6} L 12,${h-6}`}/>
          <path d={`M ${w-6},${h-12} L ${w-6},${h-6} L ${w-12},${h-6}`}/>
        </g>
      </svg>
      <div style={{position:'relative', padding:12}}>{children}</div>
    </div>
  );
}

// 1. Title screen
function TitleScreen() {
  return (
    <Phone label="01 · Title">
      <div style={{height:'100%', position:'relative', background:UP.paper, display:'flex', flexDirection:'column', alignItems:'center'}}>
        <svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none" style={{position:'absolute', inset:0}}>
          <rect width="390" height="844" fill={UP.paper}/>
          <rect width="390" height="844" fill={UP.paper} filter="url(#paper-noise)" opacity="0.5"/>
          {/* sun */}
          <circle cx="320" cy="120" r="40" fill={UP.honeyLight} opacity="0.5" filter={URL_F}/>
          <circle cx="320" cy="120" r="28" fill={UP.honey} opacity="0.7" filter={URL_F}/>
        </svg>
        {/* Hand-lettered title */}
        <div style={{marginTop:80, textAlign:'center', position:'relative'}}>
          <div style={{
            fontFamily:'Fraunces, serif', fontWeight:700, fontSize:54,
            letterSpacing:'-0.02em', lineHeight:0.95, color:UP.ink, transform:'rotate(-2deg)'
          }}>COMB</div>
          <div style={{
            fontFamily:'Fraunces, serif', fontWeight:700, fontStyle:'italic', fontSize:44,
            color:UP.honeyDark, transform:'rotate(1deg) translateX(20px)', marginTop:-8
          }}>at me</div>
          <div style={{
            fontFamily:'Fraunces, serif', fontWeight:700, fontSize:54,
            letterSpacing:'-0.02em', color:UP.ink, transform:'rotate(-1deg) translateX(-12px)', marginTop:-12
          }}>BRO</div>
          <div style={{height:2, width:140, background:UP.ink, margin:'14px auto', filter:'url(#rough-1)'}}/>
          <div style={{fontSize:10, letterSpacing:'0.3em', color:UP.inkSoft}}>A QUEEN'S DEFENCE</div>
        </div>
        <div style={{marginTop:40, transform:'translateZ(0)'}}>
          <WildNestHive size={200}/>
        </div>
        <div style={{marginTop:'auto', marginBottom:60, display:'flex', flexDirection:'column', gap:12, width:240}}>
          {[{l:'PLAY', primary:true},{l:'CONTINUE'},{l:'SETTINGS'}].map(b=>(
            <button key={b.l} style={{
              fontFamily:'JetBrains Mono', fontWeight:700, fontSize:13, letterSpacing:'0.15em',
              padding:'14px 0', border:`1.4px solid ${UP.ink}`,
              background: b.primary?UP.honey:UP.paper, color:UP.ink,
              boxShadow: b.primary?`3px 3px 0 ${UP.ink}`:'none',
            }}>{b.l}</button>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// 2. Royal Memory Tree
function MemoryTree() {
  // 7-row honeycomb grid (offset rows)
  const rows = [];
  for (let r=0;r<7;r++) {
    const cols = r%2===0 ? 5 : 4;
    rows.push(Array.from({length:cols}, (_,c)=>({
      r, c,
      unlocked: (r*5 + c) % 3 !== 0,
      icon: ['🍯','🐝','✨','⚡','✦','♥'][(r+c)%6],
    })));
  }
  return (
    <Phone label="02 · Royal Memory">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'18px 18px 12px', borderBottom:`1px solid ${UP.paperShade}`}}>
          <div style={{fontFamily:'Fraunces',fontWeight:700,fontSize:22}}>Royal Memory</div>
          <div style={{fontSize:10, color:UP.inkSoft, letterSpacing:'0.08em'}}>27 / 60 cells unlocked</div>
        </div>
        <div style={{flex:1, padding:'14px 0', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', gap:0}}>
          {rows.map((row,ri)=>(
            <div key={ri} style={{display:'flex', gap:6, marginTop: ri===0?0:-12, transform:`translateX(${ri%2?'24px':'0'})`}}>
              {row.map(cell=>(
                <svg key={`${cell.r}-${cell.c}`} width="56" height="62" viewBox="0 0 56 62">
                  <polygon points="28,3 53,15 53,47 28,59 3,47 3,15"
                    fill={cell.unlocked?UP.honey:UP.paperDark}
                    stroke={UP.ink} strokeWidth="1.4" filter="url(#rough-1)"/>
                  {!cell.unlocked && <polygon points="28,3 53,15 53,47 28,59 3,47 3,15" fill={UP.ink} opacity="0.35"/>}
                  <text x="28" y="36" textAnchor="middle" fontSize="18" opacity={cell.unlocked?1:0.4}>{cell.icon}</text>
                </svg>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:'14px 18px', borderTop:`1px solid ${UP.paperShade}`, background:UP.paper2}}>
          <div style={{fontFamily:'Fraunces', fontSize:13, fontWeight:600}}>Honey Reserves I</div>
          <div style={{fontSize:11, color:UP.inkSoft, marginTop:2}}>+25% honey storage cap. <span style={{color:UP.honeyDark}}>Tap to invest 8 ✨</span></div>
        </div>
      </div>
    </Phone>
  );
}

// 3. Loadout picker
function LoadoutPicker() {
  const boons = [
    { name:'Fast Larvae', desc:'Larvae mature 30% faster.', icon:'🐣' },
    { name:'Royal Wax',  desc:'Walls cost 40% less.',     icon:'🕯' },
    { name:'Sweet Sting', desc:'Strikers crit on 5%.',     icon:'⚡' },
    { name:'Patrol',      desc:'Guards walk further.',     icon:'⚔' },
    { name:'Hardy Comb',  desc:'+15% hive HP.',            icon:'♥' },
    { name:'Bright Eyes', desc:'See 2 waves ahead.',       icon:'👁' },
  ];
  return (
    <Phone label="03 · Loadout">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{padding:18, borderBottom:`1px solid ${UP.paperShade}`}}>
          <div style={{fontFamily:'Fraunces',fontWeight:700,fontSize:22}}>Pack the comb</div>
          <div style={{fontSize:11, color:UP.inkSoft, marginTop:2}}>Pick <b style={{color:UP.honeyDark}}>3 boons</b> to begin your run · 2 / 3 chosen</div>
        </div>
        <div style={{flex:1, padding:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, overflow:'auto'}}>
          {boons.map((b,i)=>{
            const picked = i<2;
            return (
              <div key={b.name} style={{
                border:`1.4px solid ${UP.ink}`, padding:12, background: picked?UP.honey:UP.paper,
                boxShadow: picked?`3px 3px 0 ${UP.ink}`:'none', transform: picked?'translate(-1px,-1px)':'none'
              }}>
                <div style={{fontSize:28, lineHeight:1}}>{b.icon}</div>
                <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:14, marginTop:6}}>{b.name}</div>
                <div style={{fontSize:10, color:UP.inkSoft, marginTop:4, lineHeight:1.4}}>{b.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'14px 18px', borderTop:`1px solid ${UP.paperShade}`, display:'flex', gap:8}}>
          <button style={{flex:1, fontFamily:'JetBrains Mono', fontWeight:700, fontSize:11, padding:'12px 0', border:`1.2px solid ${UP.ink}`, background:UP.paper}}>BACK</button>
          <button style={{flex:2, fontFamily:'Fraunces', fontWeight:700, fontSize:13, padding:'12px 0', border:`1.4px solid ${UP.ink}`, background:UP.honey, boxShadow:`3px 3px 0 ${UP.ink}`}}>BEGIN RUN ▶</button>
        </div>
      </div>
    </Phone>
  );
}

// 4. Between-wave shop
function ShopModal() {
  const rows = BEE_ROLES.slice(0,5);
  return (
    <Phone label="04 · Roles Shop">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{padding:18, display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:`1px solid ${UP.paperShade}`}}>
          <div>
            <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:22}}>Invest in roles</div>
            <div style={{fontSize:10, color:UP.inkSoft, letterSpacing:'0.08em'}}>BETWEEN WAVE 12 + 13</div>
          </div>
          <div style={{fontSize:14, color:UP.honeyDark, fontWeight:700}}>248 🍯</div>
        </div>
        <div style={{flex:1, overflow:'auto', padding:'8px 0'}}>
          {rows.map((r,i)=>{
            const rank = ['I','II','III','IV','V'][i];
            return (
              <div key={r.id} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:`1px dashed ${UP.paperShade}`}}>
                <div style={{width:48, height:48, background:UP.paperDark, border:`1px solid ${UP.ink}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <svg viewBox="0 0 64 64" width="44" height="44" style={{overflow:'visible'}}><r.Bee/></svg>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontFamily:'Fraunces', fontWeight:600, fontSize:13}}>{r.name} <span style={{color:UP.inkSoft}}>· rank {rank}</span></div>
                  <div style={{fontSize:9.5, color:UP.inkSoft, lineHeight:1.4, marginTop:2}}>{r.desc}</div>
                </div>
                <button style={{fontFamily:'JetBrains Mono', fontWeight:700, fontSize:10.5, padding:'8px 10px', border:`1.2px solid ${UP.ink}`, background:UP.honey, flexShrink:0}}>+{15+i*10}🍯</button>
              </div>
            );
          })}
        </div>
        <div style={{padding:'14px 18px', borderTop:`1px solid ${UP.paperShade}`}}>
          <button style={{width:'100%', fontFamily:'Fraunces', fontWeight:700, fontSize:13, padding:'12px 0', border:`1.4px solid ${UP.ink}`, background:UP.paper}}>DONE</button>
        </div>
      </div>
    </Phone>
  );
}

// 5. Build modal
function BuildModal() {
  return (
    <Phone label="05 · Build">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{padding:18, borderBottom:`1px solid ${UP.paperShade}`}}>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:22}}>Build</div>
          <div style={{fontSize:10, color:UP.inkSoft, letterSpacing:'0.08em'}}>TAP TO PLACE · 248 🍯</div>
        </div>
        <div style={{flex:1, padding:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, overflow:'auto'}}>
          {STRUCTURES.map((s,i)=>{
            const sel = i===2;
            return (
              <div key={s.id} style={{border:`1.2px solid ${UP.ink}`, background:sel?UP.honey:UP.paper, padding:8}}>
                <div style={{height:60, background:UP.sage, border:`1px solid ${UP.ink}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                  <svg viewBox="0 0 64 64" width="56" height="56" style={{overflow:'visible'}}><s.Comp/></svg>
                </div>
                <div style={{fontFamily:'Fraunces', fontSize:10.5, fontWeight:600, marginTop:4}}>{s.name}</div>
                <div style={{fontSize:9, color:UP.honeyDark, marginTop:1}}>{s.cost}</div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'14px 18px', borderTop:`1px solid ${UP.paperShade}`, display:'flex', gap:8}}>
          <button style={{flex:1, padding:'12px 0', border:`1.2px solid ${UP.ink}`, background:UP.paper, fontWeight:700, fontSize:11, fontFamily:'JetBrains Mono'}}>CANCEL</button>
          <button style={{flex:2, padding:'12px 0', border:`1.4px solid ${UP.ink}`, background:UP.honey, fontFamily:'Fraunces', fontWeight:700, fontSize:13, boxShadow:`3px 3px 0 ${UP.ink}`}}>PLACE COMB TOWER</button>
        </div>
      </div>
    </Phone>
  );
}

// 6. Boon picker (full-screen)
function BoonPicker() {
  const cards = [
    { icon:'⚔', name:'Stinger Storm', desc:'All Strikers fire +1 dart per cycle.', tier:'COMMON' },
    { icon:'🍯', name:'Sticky Trail', desc:'Foragers leave honey paths that slow.', tier:'RARE' },
    { icon:'✨', name:'Royal Visit', desc:'Queen heals nearby bees once per wave.', tier:'JELLY' },
  ];
  return (
    <Phone label="06 · Boon Picker">
      <div style={{height:'100%', background:UP.ink, display:'flex', flexDirection:'column', color:UP.paper, position:'relative'}}>
        <svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none" style={{position:'absolute', inset:0, opacity:0.15}}>
          <rect width="390" height="844" fill={UP.honey} filter="url(#paper-noise)"/>
        </svg>
        <div style={{padding:'40px 18px 12px', textAlign:'center', position:'relative'}}>
          <div style={{fontSize:11, letterSpacing:'0.3em', color:UP.honey}}>WAVE 12 COMPLETE</div>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:32, marginTop:8}}>Pick one</div>
        </div>
        <div style={{flex:1, display:'flex', flexDirection:'column', gap:14, padding:'14px 18px', justifyContent:'center', position:'relative'}}>
          {cards.map((c,i)=>{
            const colors = ['#A8987C', UP.honey, UP.jelly];
            const dark = i===2;
            return (
              <div key={c.name} style={{
                background: colors[i], color: dark?UP.ink:UP.ink,
                border:`1.4px solid ${UP.paper}`, padding:'18px 16px', position:'relative'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <div style={{width:48, height:48, border:`1.2px solid ${UP.ink}`, background:UP.paper, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>{c.icon}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:9, letterSpacing:'0.1em', opacity:0.7}}>{c.tier}</div>
                    <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:16}}>{c.name}</div>
                  </div>
                </div>
                <div style={{fontSize:11.5, marginTop:8, lineHeight:1.45}}>{c.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'14px 18px', textAlign:'center', position:'relative', fontSize:10, color:UP.honey, letterSpacing:'0.2em', opacity:0.7}}>TAP A CARD TO CLAIM</div>
      </div>
    </Phone>
  );
}

// 7. Pause menu
function PauseMenu() {
  return (
    <Phone label="07 · Pause">
      <div style={{height:'100%', background:UP.paper, position:'relative', display:'flex', flexDirection:'column'}}>
        {/* faded gameplay behind */}
        <div style={{position:'absolute', inset:0, opacity:0.18, pointerEvents:'none'}}>
          <svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
            <rect width="390" height="844" fill={UP.sage}/>
          </svg>
        </div>
        <div style={{position:'absolute', inset:0, background:UP.paper, opacity:0.85}}/>
        <div style={{position:'relative', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'0 32px'}}>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:36, marginBottom:18, transform:'rotate(-1deg)'}}>Paused</div>
          {[
            {l:'RESUME', p:true},
            {l:'RESTART RUN'},
            {l:'SETTINGS'},
            {l:'ABANDON', danger:true},
          ].map(b=>(
            <button key={b.l} style={{
              width:'100%', maxWidth:260,
              fontFamily:'JetBrains Mono', fontWeight:700, fontSize:13, letterSpacing:'0.15em',
              padding:'14px 0', border:`1.4px solid ${b.danger?UP.redInk:UP.ink}`,
              background: b.p?UP.honey:UP.paper, color: b.danger?UP.redInk:UP.ink,
              boxShadow: b.p?`3px 3px 0 ${UP.ink}`:'none'
            }}>{b.l}</button>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// 8. Wave complete summary
function WaveSummary() {
  return (
    <Phone label="08 · Wave Summary">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'40px 18px 12px', textAlign:'center'}}>
          <div style={{fontSize:11, letterSpacing:'0.3em', color:UP.honeyDark}}>WAVE 12 COMPLETE</div>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:30, marginTop:6}}>Hold the line</div>
        </div>
        <div style={{padding:'8px 18px', flex:1}}>
          {[
            ['Wave time', '1:42'],
            ['Bees lost', '3'],
            ['Honey gained', '+96 🍯'],
            ['Larvae matured', '4 🐝'],
            ['Royal Memory earned', '+12 ✨'],
          ].map(([k,v])=>(
            <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px dashed ${UP.paperShade}`, fontSize:12}}>
              <span style={{color:UP.inkSoft}}>{k}</span>
              <span style={{fontFamily:'Fraunces', fontWeight:700}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:18, padding:14, border:`1.4px solid ${UP.ink}`, background:UP.paper2}}>
            <div style={{fontSize:10, letterSpacing:'0.1em', color:UP.inkSoft}}>WAVE BEST: 0:58</div>
            <div style={{fontFamily:'Fraunces', fontStyle:'italic', fontSize:13, marginTop:6, color:UP.ink}}>"The Spider barely touched the comb."</div>
          </div>
        </div>
        <div style={{padding:'14px 18px', borderTop:`1px solid ${UP.paperShade}`}}>
          <button style={{width:'100%', padding:'14px 0', border:`1.4px solid ${UP.ink}`, background:UP.honey, fontFamily:'Fraunces', fontWeight:700, fontSize:13, boxShadow:`3px 3px 0 ${UP.ink}`}}>READY · WAVE 13 ▶</button>
        </div>
      </div>
    </Phone>
  );
}

// 9. Run complete (win)
function RunWin() {
  return (
    <Phone label="09 · Run · Win">
      <div style={{height:'100%', background:UP.honey, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column'}}>
        {[20,90,160,250,330].map((x,i)=>(
          <div key={i} style={{position:'absolute', left:x, bottom:0, animation:`cb-petal 3s ease-out infinite`, animationDelay:`${i*0.4}s`, transformOrigin:`${x}px 844px`}}>
            <svg width="20" height="30" viewBox="0 0 20 30">
              <path d="M 10,30 q -6,-10 0,-22 q 6,12 0,22 z" fill={UP.jelly} stroke={UP.ink} strokeWidth="0.8" filter={URL_F}/>
            </svg>
          </div>
        ))}
        <div style={{textAlign:'center', padding:'80px 24px 24px'}}>
          <div style={{fontSize:11, letterSpacing:'0.3em', color:UP.ink}}>RUN COMPLETE</div>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:38, marginTop:12, color:UP.ink, lineHeight:1.05, transform:'rotate(-1deg)'}}>QUEEN<br/>VICTORIOUS</div>
        </div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div className="cb-breathe">
            <QueenBee expression="calm" size={180}/>
          </div>
        </div>
        <div style={{padding:'18px 18px 28px', display:'flex', flexDirection:'column', gap:10}}>
          <div style={{textAlign:'center', fontSize:11, color:UP.rustDark, letterSpacing:'0.08em'}}>+148 ROYAL MEMORY · 30 / 30 WAVES</div>
          <button style={{padding:'14px 0', border:`1.4px solid ${UP.ink}`, background:UP.rust, color:UP.paper, fontFamily:'Fraunces', fontWeight:700, fontSize:13, boxShadow:`3px 3px 0 ${UP.ink}`}}>HEAT MODE — TRY +1 ▶</button>
          <button style={{padding:'12px 0', border:`1.2px solid ${UP.ink}`, background:UP.paper, fontFamily:'JetBrains Mono', fontWeight:700, fontSize:11}}>RETURN TO MEMORY</button>
        </div>
      </div>
    </Phone>
  );
}

// 10. Run complete (lose)
function RunLose() {
  return (
    <Phone label="10 · Run · Lose">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{textAlign:'center', padding:'70px 24px 12px'}}>
          <div style={{fontSize:11, letterSpacing:'0.3em', color:UP.rustDark}}>HIVE FELL · WAVE 18</div>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontStyle:'italic', fontSize:30, marginTop:10, color:UP.ink, lineHeight:1.1}}>The comb is silent.</div>
        </div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{transform:'rotate(8deg)', filter:'grayscale(0.4)', opacity:0.85}}>
            <WildNestHive size={200} hp={0.15} idleBees={false}/>
          </div>
        </div>
        <div style={{padding:'12px 18px'}}>
          {[
            ['Waves cleared', '17 / 30'],
            ['Bees lost', '42'],
            ['Royal Memory earned', '+38 ✨'],
          ].map(([k,v])=>(
            <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px dashed ${UP.paperShade}`, fontSize:12}}>
              <span style={{color:UP.inkSoft}}>{k}</span>
              <span style={{fontFamily:'Fraunces', fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{padding:'18px 18px 28px', display:'flex', flexDirection:'column', gap:8}}>
          <button style={{padding:'14px 0', border:`1.4px solid ${UP.ink}`, background:UP.honey, fontFamily:'Fraunces', fontWeight:700, fontSize:13, boxShadow:`3px 3px 0 ${UP.ink}`}}>TRY AGAIN ▶</button>
          <button style={{padding:'12px 0', border:`1.2px solid ${UP.ink}`, background:UP.paper, fontFamily:'JetBrains Mono', fontWeight:700, fontSize:11}}>RETURN TO MEMORY</button>
        </div>
      </div>
    </Phone>
  );
}

// 11. Settings
function Settings() {
  const Row = ({k, v}) => (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px dashed ${UP.paperShade}`, fontSize:12}}>
      <span>{k}</span>
      <span style={{fontFamily:'JetBrains Mono', fontWeight:700, color:UP.honeyDark}}>{v}</span>
    </div>
  );
  return (
    <Phone label="11 · Settings">
      <div style={{height:'100%', background:UP.paper, display:'flex', flexDirection:'column'}}>
        <div style={{padding:18, borderBottom:`1px solid ${UP.paperShade}`}}>
          <div style={{fontFamily:'Fraunces',fontWeight:700,fontSize:22}}>Settings</div>
        </div>
        <div style={{flex:1, padding:'4px 18px', overflow:'auto'}}>
          <div style={{fontFamily:'Fraunces', fontSize:11, fontStyle:'italic', color:UP.inkSoft, marginTop:14}}>AUDIO</div>
          <Row k="Music"     v="◐ ◐ ◐ ◐ ○"/>
          <Row k="SFX"       v="◐ ◐ ◐ ◐ ◐"/>
          <Row k="Haptics"   v="ON"/>
          <div style={{fontFamily:'Fraunces', fontSize:11, fontStyle:'italic', color:UP.inkSoft, marginTop:18}}>DISPLAY</div>
          <Row k="Language"  v="ENGLISH"/>
          <Row k="Color-blind palette" v="OFF"/>
          <Row k="Reduce motion" v="OFF"/>
          <Row k="Large icons" v="OFF"/>
          <div style={{fontFamily:'Fraunces', fontSize:11, fontStyle:'italic', color:UP.inkSoft, marginTop:18}}>ACCOUNT</div>
          <Row k="Cloud save" v="ON"/>
          <Row k="Reset progress" v="—"/>
        </div>
      </div>
    </Phone>
  );
}

const UI_SCREENS = [
  { id:'title', name:'Title', Comp: TitleScreen },
  { id:'memory', name:'Royal Memory', Comp: MemoryTree },
  { id:'loadout', name:'Loadout', Comp: LoadoutPicker },
  { id:'shop', name:'Roles Shop', Comp: ShopModal },
  { id:'build', name:'Build', Comp: BuildModal },
  { id:'boon', name:'Boon Picker', Comp: BoonPicker },
  { id:'pause', name:'Pause', Comp: PauseMenu },
  { id:'wave', name:'Wave Summary', Comp: WaveSummary },
  { id:'win', name:'Run Win', Comp: RunWin },
  { id:'lose', name:'Run Lose', Comp: RunLose },
  { id:'settings', name:'Settings', Comp: Settings },
];

window.CAMB_UI = { UI_SCREENS };
