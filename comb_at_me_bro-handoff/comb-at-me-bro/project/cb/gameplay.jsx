/* Comb At Me Bro — Gameplay screen.
   Top-down combat view. Phone frame 390x844.
   Two states: 'calm' (between waves) + 'chaos' (mid-wave w/ enemies + VFX).
*/
const { PAL: GP, ROUGH: GR, ROUGH_LIGHT: GRL } = window.CAMB;
const { BEE_ROLES, QueenBee } = window.CAMB_BEES;
const { ENEMY_BY_ID } = window.CAMB_ENEMIES;
const { STRUCT_BY_ID } = window.CAMB_STRUCT;

function gpEnemy(id) { return ENEMY_BY_ID[id]; }
function gpStruct(id) { return STRUCT_BY_ID[id]; }

// HUD pill
function HudPill({ children, w='auto', bg=GP.paper }) {
  return (
    <div style={{
      background:bg, border:`1.2px solid ${GP.ink}`,
      padding:'4px 10px', fontFamily:'JetBrains Mono', fontWeight:700, fontSize:11,
      color:GP.ink, letterSpacing:'0.05em', display:'inline-flex', alignItems:'center', gap:6,
      boxShadow:`2px 2px 0 ${GP.ink}`, width:w
    }}>{children}</div>
  );
}

// HP bar (top of screen, full hive)
function HiveHpBar({ pct=0.7, label='HIVE' }) {
  return (
    <div style={{position:'relative', flex:1}}>
      <div style={{fontSize:8.5, letterSpacing:'0.2em', color:GP.inkSoft, marginBottom:2}}>{label}</div>
      <div style={{height:12, background:GP.paper, border:`1.2px solid ${GP.ink}`, position:'relative', overflow:'hidden'}}>
        <div style={{
          position:'absolute', left:0, top:0, bottom:0,
          width:`${pct*100}%`, background:pct>0.5?GP.honey:pct>0.25?'#D88B2E':GP.redInk,
        }}/>
        {/* tick marks */}
        {[25,50,75].map(t=>(
          <div key={t} style={{position:'absolute', left:`${t}%`, top:0, bottom:0, width:1, background:GP.ink, opacity:0.3}}/>
        ))}
      </div>
    </div>
  );
}

// One placed entity on the field (sprite-scaled small)
function FieldSprite({ x, y, size=42, children, rotate=0, anim }) {
  return (
    <div style={{
      position:'absolute', left:x, top:y, width:size, height:size,
      transform:`translate(-50%,-50%) rotate(${rotate}deg)`,
      animation: anim,
    }}>
      <svg viewBox="0 0 64 64" width={size} height={size} style={{overflow:'visible', display:'block'}}>
        {children}
      </svg>
    </div>
  );
}

// Field — sage parchment with paper grid.
function Field({ children, height }) {
  return (
    <div style={{
      flex:1, position:'relative',
      background:GP.sage, overflow:'hidden',
      borderTop:`1px solid ${GP.ink}`, borderBottom:`1px solid ${GP.ink}`,
    }}>
      {/* paper texture */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0, opacity:0.45, pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
        <rect width="100%" height="100%" filter="url(#paper-noise)" fill={GP.sage}/>
      </svg>
      {/* hand-drawn grass tufts */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0, pointerEvents:'none'}} viewBox="0 0 390 600" preserveAspectRatio="none">
        {[
          [40,80],[110,140],[260,90],[330,180],[60,260],[200,340],[340,360],[80,440],[280,500],[150,540],
        ].map(([x,y],i)=>(
          <g key={i} stroke={GP.inkSoft} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" filter={GRL}>
            <path d={`M ${x},${y} q -2,-6 0,-12`}/>
            <path d={`M ${x+3},${y} q -1,-4 1,-9`}/>
            <path d={`M ${x-3},${y} q -3,-5 -1,-10`}/>
          </g>
        ))}
        {/* dotted defensive perimeter */}
        <ellipse cx="195" cy="300" rx="160" ry="220" stroke={GP.ink} strokeWidth="1" strokeDasharray="3 6" fill="none" opacity="0.35"/>
      </svg>
      {children}
    </div>
  );
}

// =============== CALM STATE ===============
function GameplayCalm() {
  return (
    <div style={{height:'100%', background:GP.paper, display:'flex', flexDirection:'column', position:'relative'}}>
      {/* TOP HUD */}
      <div style={{padding:'12px 14px 10px', background:GP.paper, position:'relative', zIndex:2}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
          <button style={{padding:'6px 8px', border:`1.2px solid ${GP.ink}`, background:GP.paper, fontSize:11, fontFamily:'JetBrains Mono', fontWeight:700}}>‖</button>
          <HiveHpBar pct={0.85}/>
          <HudPill bg={GP.honey}>248 🍯</HudPill>
        </div>
        <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize:9, letterSpacing:'0.2em', color:GP.inkSoft}}>BETWEEN WAVES · 0:18</div>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:14}}>Wave 13 ▸ <span style={{color:GP.honeyDark}}>HORNETS</span></div>
        </div>
      </div>

      {/* FIELD */}
      <Field>
        {/* Hive at center-bottom */}
        <FieldSprite x={195} y={420} size={130} anim="cb-breathe 4s ease-in-out infinite">
          {/* simplified box hive */}
          <ellipse cx="32" cy="38" rx="26" ry="22" fill="url(#honey-glow)" stroke={GP.ink} strokeWidth="2" filter={GR}/>
          <ellipse cx="32" cy="38" rx="20" ry="16" fill={GP.honey} opacity="0.6"/>
          <ellipse cx="32" cy="44" rx="4" ry="3" fill={GP.ink}/>
          <line x1="14" y1="50" x2="50" y2="50" stroke={GP.honeyDark} strokeWidth="0.8"/>
        </FieldSprite>
        {/* Queen marker on hive */}
        <div style={{position:'absolute', left:195, top:380, transform:'translate(-50%,-50%)'}}>
          <svg width="50" height="50" viewBox="0 0 64 64" style={{overflow:'visible'}}><QueenBee expression="calm" size={50}/></svg>
        </div>

        {/* Towers placed around hive */}
        <FieldSprite x={130} y={520} size={48}>
          {React.createElement(STRUCT_BY_ID['comb'].Comp)}
        </FieldSprite>
        <FieldSprite x={260} y={520} size={48}>
          <ellipse cx="32" cy="44" rx="14" ry="6" fill={GP.paperDark} stroke={GP.ink} strokeWidth="1.4" filter={GR}/>
          <rect x="22" y="22" width="20" height="22" fill="#9C7345" stroke={GP.ink} strokeWidth="1.2" filter={GR}/>
          <rect x="26" y="26" width="3" height="4" fill={GP.ink}/>
          <rect x="35" y="26" width="3" height="4" fill={GP.ink}/>
        </FieldSprite>
        <FieldSprite x={120} y={420} size={44}>
          {/* honey vat */}
          <ellipse cx="32" cy="44" rx="14" ry="5" fill={GP.paperDark} stroke={GP.ink} strokeWidth="1.4"/>
          <path d="M 18,42 L 22,22 L 42,22 L 46,42 Z" fill="#9C7345" stroke={GP.ink} strokeWidth="1.4" filter={GR}/>
          <ellipse cx="32" cy="22" rx="10" ry="3" fill={GP.honey} stroke={GP.ink} strokeWidth="1"/>
        </FieldSprite>
        <FieldSprite x={270} y={420} size={44}>
          {/* nursery */}
          <ellipse cx="32" cy="40" rx="16" ry="14" fill={GP.honeyLight} stroke={GP.ink} strokeWidth="1.4" filter={GR}/>
          <circle cx="26" cy="38" r="3" fill={GP.honey} stroke={GP.ink} strokeWidth="0.8"/>
          <circle cx="36" cy="40" r="3" fill={GP.honey} stroke={GP.ink} strokeWidth="0.8"/>
          <circle cx="32" cy="32" r="3" fill={GP.honey} stroke={GP.ink} strokeWidth="0.8"/>
        </FieldSprite>

        {/* Idle bees patrolling */}
        {[
          [80, 320, BEE_ROLES[2].Bee, 'cb-walk-2 0.6s steps(2) infinite'],
          [310, 360, BEE_ROLES[2].Bee, 'cb-walk-2 0.7s steps(2) infinite'],
          [195, 280, BEE_ROLES[3].Bee, 'cb-bob 1.6s ease-in-out infinite'],
          [150, 480, BEE_ROLES[1].Bee, 'cb-bob 1.4s ease-in-out infinite'],
          [240, 480, BEE_ROLES[1].Bee, 'cb-bob 1.6s ease-in-out infinite'],
          [60, 200, BEE_ROLES[0].Bee, 'cb-bob 1.2s ease-in-out infinite'],
          [330, 220, BEE_ROLES[4].Bee, 'cb-bob 1.5s ease-in-out infinite'],
        ].map(([x,y,Bee,anim],i)=>(
          <FieldSprite key={i} x={x} y={y} size={28} anim={anim}><Bee/></FieldSprite>
        ))}

        {/* Tap-to-place ghost */}
        <div style={{
          position:'absolute', left:195, top:170, transform:'translate(-50%,-50%)',
          width:60, height:60, border:`1.5px dashed ${GP.ink}`, opacity:0.45, background:GP.paper,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:GP.inkSoft, letterSpacing:'0.1em', fontWeight:700
        }}>TAP TO PLACE</div>
      </Field>

      {/* BOTTOM RAIL — build palette */}
      <div style={{padding:'10px 12px 18px', background:GP.paper, position:'relative', zIndex:2}}>
        <div style={{fontSize:8.5, letterSpacing:'0.2em', color:GP.inkSoft, marginBottom:6, display:'flex', justifyContent:'space-between'}}>
          <span>BUILD &amp; ASSIGN</span>
          <span>SWIPE FOR MORE ▸</span>
        </div>
        <div style={{display:'flex', gap:6, overflow:'hidden'}}>
          {[
            { sprite: STRUCT_BY_ID['comb'],   label:'TOWER',   cost:'40' },
            { sprite: STRUCT_BY_ID['vat'],    label:'VAT',     cost:'35' },
            { sprite: STRUCT_BY_ID['brood'],  label:'NURSERY', cost:'50' },
            { sprite: STRUCT_BY_ID['wall'],   label:'WALL',    cost:'15' },
            { sprite: STRUCT_BY_ID['turret'], label:'TURRET',  cost:'60' },
          ].map((item,i)=>{
            const sel = i===0;
            return (
              <div key={i} style={{
                flex:1, border:`1.2px solid ${GP.ink}`, background:sel?GP.honey:GP.paper, padding:6,
                boxShadow: sel?`2px 2px 0 ${GP.ink}`:'none',
                transform: sel?'translate(-1px,-1px)':'none',
              }}>
                <div style={{height:36, background:GP.sage, border:`1px solid ${GP.ink}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                  <svg viewBox="0 0 64 64" width="34" height="34" style={{overflow:'visible'}}><item.sprite.Comp/></svg>
                </div>
                <div style={{fontSize:8, fontFamily:'JetBrains Mono', fontWeight:700, marginTop:3, textAlign:'center', letterSpacing:'0.05em'}}>{item.label}</div>
                <div style={{fontSize:8, color:GP.honeyDark, textAlign:'center'}}>{item.cost}🍯</div>
              </div>
            );
          })}
        </div>
        <button style={{
          width:'100%', marginTop:8, padding:'10px 0', border:`1.4px solid ${GP.ink}`, background:GP.rust, color:GP.paper,
          fontFamily:'Fraunces', fontWeight:700, fontSize:13, boxShadow:`3px 3px 0 ${GP.ink}`, letterSpacing:'0.1em',
        }}>READY · START WAVE 13 ▶</button>
      </div>
    </div>
  );
}

// =============== CHAOS STATE ===============
function GameplayChaos() {
  const Hornet = ENEMY_BY_ID['hornet'].Comp;
  const Wasp = ENEMY_BY_ID['wasp'].Comp;
  const Ant = ENEMY_BY_ID['ant'].Comp;
  const Mite = ENEMY_BY_ID['mite'].Comp;
  return (
    <div style={{height:'100%', background:GP.paper, display:'flex', flexDirection:'column', position:'relative'}}>
      {/* TOP HUD */}
      <div style={{padding:'12px 14px 10px', background:GP.paper, position:'relative', zIndex:2}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
          <button style={{padding:'6px 8px', border:`1.2px solid ${GP.ink}`, background:GP.paper, fontSize:11, fontFamily:'JetBrains Mono', fontWeight:700}}>‖</button>
          <HiveHpBar pct={0.32} label="HIVE — UNDER ATTACK"/>
          <HudPill bg={GP.honey}>87 🍯</HudPill>
        </div>
        <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize:9, letterSpacing:'0.2em', color:GP.redInk, fontWeight:700, animation:'cb-warn-wash 1.2s ease-in-out infinite', padding:'2px 6px'}}>● WAVE 13 · 0:42 LEFT</div>
          <div style={{fontFamily:'Fraunces', fontWeight:700, fontSize:14}}>14 / 22</div>
        </div>
      </div>

      {/* FIELD */}
      <Field>
        {/* warning gradient at top edge */}
        <div style={{position:'absolute', top:0, left:0, right:0, height:50, background:`linear-gradient(180deg, ${GP.redInk}55 0%, transparent 100%)`, animation:'cb-warn-wash 1.4s ease-in-out infinite', pointerEvents:'none'}}/>
        <div style={{position:'absolute', top:6, left:0, right:0, textAlign:'center', fontSize:10, color:GP.paper, fontFamily:'Fraunces', fontWeight:700, letterSpacing:'0.3em', textShadow:`1px 1px 0 ${GP.ink}`, pointerEvents:'none'}}>▼ INCOMING ▼</div>

        {/* Hive — damaged & shaking */}
        <FieldSprite x={195} y={460} size={130} anim="cb-shake 0.18s linear infinite">
          <ellipse cx="32" cy="38" rx="26" ry="22" fill="url(#honey-glow)" stroke={GP.redInk} strokeWidth="2.4" filter={GR}/>
          <ellipse cx="32" cy="38" rx="20" ry="16" fill={GP.honey} opacity="0.6"/>
          <ellipse cx="32" cy="44" rx="4" ry="3" fill={GP.ink}/>
          {/* cracks */}
          <g stroke={GP.redInk} strokeWidth="1.4" fill="none">
            <path d="M 18,30 L 24,38 L 22,46"/>
            <path d="M 44,32 L 40,40 L 46,46"/>
            <path d="M 32,52 L 36,58"/>
          </g>
        </FieldSprite>

        {/* Towers + walls */}
        <FieldSprite x={130} y={520} size={48}>{React.createElement(STRUCT_BY_ID['comb'].Comp)}</FieldSprite>
        <FieldSprite x={260} y={520} size={48}>
          <rect x="22" y="22" width="20" height="22" fill="#9C7345" stroke={GP.ink} strokeWidth="1.2"/>
          <rect x="26" y="26" width="3" height="4" fill={GP.ink}/>
        </FieldSprite>
        {/* Smashed wall */}
        <div style={{position:'absolute', left:80, top:380, width:60, height:8, background:GP.paperDark, border:`1px solid ${GP.ink}`, transform:'rotate(-4deg)', filter:'url(#rough-1)'}}/>
        <div style={{position:'absolute', left:90, top:386, width:18, height:14, background:GP.honeyLight, border:`1.2px solid ${GP.redInk}`, transform:'rotate(-12deg)'}}/>

        {/* Friendly bees in combat */}
        {[
          [180, 380, BEE_ROLES[2].Bee, 'cb-walk-2 0.3s steps(2) infinite'],
          [220, 380, BEE_ROLES[2].Bee, 'cb-walk-2 0.3s steps(2) infinite'],
          [150, 340, BEE_ROLES[2].Bee, 'cb-walk-2 0.3s steps(2) infinite'],
          [250, 340, BEE_ROLES[3].Bee, 'cb-bob 0.6s ease-in-out infinite'],
          [110, 460, BEE_ROLES[1].Bee, 'cb-bob 0.6s ease-in-out infinite'],
        ].map(([x,y,Bee,a],i)=>(
          <FieldSprite key={`f${i}`} x={x} y={y} size={26} anim={a}><Bee/></FieldSprite>
        ))}

        {/* Enemies attacking from top */}
        <FieldSprite x={120} y={140} size={44} anim="cb-bob 0.4s ease-in-out infinite"><Hornet/></FieldSprite>
        <FieldSprite x={210} y={100} size={48} anim="cb-bob 0.5s ease-in-out infinite"><Hornet/></FieldSprite>
        <FieldSprite x={290} y={170} size={40} anim="cb-bob 0.4s ease-in-out infinite"><Wasp/></FieldSprite>
        <FieldSprite x={70} y={250} size={36} anim="cb-walk-2 0.4s steps(2) infinite"><Ant/></FieldSprite>
        <FieldSprite x={320} y={290} size={36} anim="cb-walk-2 0.4s steps(2) infinite"><Ant/></FieldSprite>
        <FieldSprite x={170} y={210} size={28} anim="cb-bob 0.4s ease-in-out infinite"><Mite/></FieldSprite>
        <FieldSprite x={250} y={250} size={28} anim="cb-bob 0.4s ease-in-out infinite"><Mite/></FieldSprite>

        {/* VFX overlays — combat puff over hornet */}
        <div style={{position:'absolute', left:200, top:180, transform:'translate(-50%,-50%)', animation:'cb-shake 0.18s linear infinite'}}>
          <svg width="80" height="60" viewBox="0 0 80 60" style={{overflow:'visible'}}>
            <ellipse cx="40" cy="30" rx="30" ry="18" fill={GP.honeyLight} stroke={GP.ink} strokeWidth="1.4" opacity="0.85" filter={GR}/>
            <text x="40" y="36" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="14" fill={GP.ink}>POW</text>
          </svg>
        </div>

        {/* Smoke AoE bottom-left */}
        <div style={{position:'absolute', left:90, top:480, transform:'translate(-50%,-50%)', animation:'cb-pulse-soft 2s ease-in-out infinite'}}>
          <svg width="120" height="80" viewBox="0 0 120 80" style={{overflow:'visible'}}>
            <ellipse cx="60" cy="40" rx="50" ry="30" fill={GP.smokeGrey} stroke={GP.ink} strokeWidth="1.2" filter="url(#rough-3)" opacity="0.6"/>
            <ellipse cx="40" cy="30" rx="20" ry="12" fill={GP.smokeGrey} opacity="0.4"/>
            <ellipse cx="80" cy="50" rx="22" ry="14" fill={GP.smokeGrey} opacity="0.4"/>
          </svg>
        </div>

        {/* Floating damage numbers */}
        {[
          { x:212, y:160, t:'-12', d:0 },
          { x:124, y:240, t:'-8', d:0.6 },
          { x:80, y:460, t:'+5🍯', d:1.2, color:GP.honeyDark },
        ].map((n,i)=>(
          <div key={i} style={{position:'absolute', left:n.x, top:n.y, transform:'translate(-50%,-50%)', animation:`cb-rise 1.8s ease-out infinite`, animationDelay:`${n.d}s`, pointerEvents:'none'}}>
            <span style={{fontFamily:'Fraunces', fontWeight:700, fontSize:18, color:n.color||GP.redInk, textShadow:`1px 1px 0 ${GP.paper}, -1px -1px 0 ${GP.paper}, 1px -1px 0 ${GP.paper}, -1px 1px 0 ${GP.paper}`}}>{n.t}</span>
          </div>
        ))}

        {/* Web overlay on lower right */}
        <svg style={{position:'absolute', left:280, top:380, transform:'translate(-50%,-50%)', overflow:'visible'}} width="80" height="80" viewBox="0 0 80 80">
          <g stroke={GP.webWhite} strokeWidth="1.2" fill="none" filter={GRL} opacity="0.85">
            <line x1="40" y1="40" x2="6" y2="6"/>
            <line x1="40" y1="40" x2="74" y2="6"/>
            <line x1="40" y1="40" x2="6" y2="74"/>
            <line x1="40" y1="40" x2="74" y2="74"/>
            <path d="M 18,18 L 62,18 L 70,40 L 62,62 L 18,62 L 10,40 Z"/>
            <path d="M 26,26 L 54,26 L 60,40 L 54,54 L 26,54 L 20,40 Z"/>
          </g>
        </svg>
      </Field>

      {/* BOTTOM RAIL — abilities (in chaos: ability tray) */}
      <div style={{padding:'10px 12px 18px', background:GP.paper, position:'relative', zIndex:2}}>
        <div style={{fontSize:8.5, letterSpacing:'0.2em', color:GP.inkSoft, marginBottom:6}}>QUEEN ABILITIES · TAP TO CAST</div>
        <div style={{display:'flex', gap:8}}>
          {[
            { icon:'☁', name:'SMOKE',   cost:'-15', ready:true },
            { icon:'🍯', name:'NECTAR',  cost:'-25', ready:true },
            { icon:'⚡', name:'STRIKE',  cost:'-30', ready:false, cd:'4s' },
            { icon:'✨', name:'JELLY',   cost:'BOON', ready:false, cd:'18s' },
          ].map(a=>(
            <div key={a.name} style={{
              flex:1, border:`1.4px solid ${GP.ink}`, padding:'10px 4px', textAlign:'center',
              background: a.ready?GP.honey:GP.paperDark, opacity: a.ready?1:0.7,
              boxShadow: a.ready?`2px 2px 0 ${GP.ink}`:'none', position:'relative', overflow:'hidden'
            }}>
              <div style={{fontSize:24, lineHeight:1}}>{a.icon}</div>
              <div style={{fontFamily:'JetBrains Mono', fontWeight:700, fontSize:9, marginTop:4, letterSpacing:'0.05em'}}>{a.name}</div>
              <div style={{fontSize:8.5, color: a.ready?GP.ink:GP.inkSoft, marginTop:2}}>{a.ready?a.cost:a.cd}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.CAMB_GAMEPLAY = { GameplayCalm, GameplayChaos };
