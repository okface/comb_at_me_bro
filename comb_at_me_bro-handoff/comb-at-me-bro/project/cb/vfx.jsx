/* Comb At Me Bro — VFX components.
   Each VFX is a self-contained square cell with its own animation.
*/
const { PAL: VP, ROUGH: VR, ROUGH_LIGHT: VRL, ROUGH_STRONG: VRS } = window.CAMB;

// helper for stages
function VStage({ children, w=240, h=160, bg='sage' }) {
  const fill = bg==='sage' ? VP.sage : bg==='paper' ? VP.paper : bg==='ink' ? VP.ink : bg;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{display:'block'}}>
      <rect width={w} height={h} fill={fill==='sage'?VP.sage:fill}/>
      {children}
    </svg>
  );
}

// 1. Hive idle — breathing + orbiting bees (use small inline)
function VFX_HiveIdle() {
  return (
    <VStage>
      <g style={{transformOrigin:'120px 90px', animation:'cb-breathe 3s ease-in-out infinite'}}>
        <ellipse cx="120" cy="100" rx="42" ry="38" fill="url(#honey-glow)" stroke={VP.ink} strokeWidth="2" filter={VR}/>
        <ellipse cx="120" cy="115" rx="6" ry="4" fill={VP.ink}/>
      </g>
      {[0,1,2,3].map(i=>(
        <g key={i} style={{transformOrigin:'120px 90px', animation:`cb-spin ${6+i*1.5}s linear infinite`, animationDelay:`${i*0.4}s`}}>
          <g transform={`translate(${120+58*Math.cos(i*1.6)},${90+38*Math.sin(i*1.6)})`}>
            <ellipse cx="0" cy="0" rx="3" ry="2" fill={VP.honey} stroke={VP.ink} strokeWidth="0.6"/>
            <line x1="-1.5" y1="0" x2="1.5" y2="0" stroke={VP.ink} strokeWidth="0.6"/>
          </g>
        </g>
      ))}
    </VStage>
  );
}

// 2. Hive damage <50%
function VFX_HiveDamage() {
  return (
    <VStage>
      <g filter={VR}>
        <ellipse cx="120" cy="100" rx="42" ry="38" fill="url(#honey-glow)" stroke={VP.ink} strokeWidth="2"/>
        <g stroke={VP.ink} strokeWidth="1.4" fill="none">
          <path d="M 90,85 L 100,95 L 96,105 L 106,115"/>
          <path d="M 140,80 L 134,90 L 142,100"/>
          <path d="M 118,128 L 124,138"/>
        </g>
      </g>
    </VStage>
  );
}

// 3. Hive critical <25%
function VFX_HiveCritical() {
  return (
    <VStage>
      <g filter={VR} className="cb-pulse" style={{animation:'cb-pulse 0.8s ease-in-out infinite', transformOrigin:'120px 100px'}}>
        <ellipse cx="120" cy="100" rx="42" ry="38" fill="url(#honey-glow)" stroke={VP.redInk} strokeWidth="3"/>
        <g stroke={VP.redInk} strokeWidth="1.6" fill="none">
          <path d="M 90,85 L 100,95 L 96,105 L 106,115 L 100,125"/>
          <path d="M 140,80 L 134,90 L 142,100 L 136,110"/>
          <path d="M 118,128 L 124,138 L 116,148"/>
          <path d="M 80,110 L 90,118"/>
        </g>
      </g>
    </VStage>
  );
}

// 4. Swarm — forming
function VFX_SwarmForm() {
  return (
    <VStage>
      <ellipse cx="60" cy="120" rx="20" ry="14" fill={VP.honeyDeep} stroke={VP.ink} strokeWidth="1.4" filter={VR}/>
      {[0,1,2,3,4,5].map(i=>(
        <g key={i} style={{
          animation:`vfx-form-${i} 1.6s ease-in-out infinite`,
          transformOrigin:'60px 120px',
        }}>
          <ellipse cx="60" cy="120" rx="3" ry="2" fill={VP.honey} stroke={VP.ink} strokeWidth="0.6"/>
        </g>
      ))}
      <style>{`
        ${[0,1,2,3,4,5].map(i=>`
          @keyframes vfx-form-${i} {
            0%   { transform: translate(${(i-2.5)*30}px, ${-30+i*5}px); opacity: 0; }
            100% { transform: translate(0,0); opacity: 1; }
          }
        `).join('')}
      `}</style>
    </VStage>
  );
}

// 5. Swarm — traveling
function VFX_SwarmTravel() {
  return (
    <VStage>
      <path d="M 30,120 Q 100,80 200,40" stroke={VP.ink} strokeWidth="1.2" strokeDasharray="3 5" fill="none" opacity="0.5"/>
      <g style={{animation:'vfx-travel 2.4s ease-in-out infinite'}}>
        {[[0,0],[8,4],[-4,8],[12,-2],[-8,-4],[4,10],[16,2]].map(([x,y],i)=>(
          <ellipse key={i} cx={20+x} cy={20+y} rx="3" ry="2" fill={VP.honey} stroke={VP.ink} strokeWidth="0.6" opacity={1-i*0.05}/>
        ))}
      </g>
      <style>{`@keyframes vfx-travel { 0%{transform:translate(0,100px);} 100%{transform:translate(180px,0);} }`}</style>
    </VStage>
  );
}

// 6. Swarm — engaging (combat puff)
function VFX_SwarmEngage() {
  return (
    <VStage>
      <g style={{animation:'cb-shake 0.18s linear infinite', transformOrigin:'120px 80px'}}>
        {/* impact stars */}
        <g stroke={VP.redInk} strokeWidth="2.4" strokeLinecap="round" filter={VR}>
          <line x1="100" y1="60" x2="120" y2="80"/>
          <line x1="140" y1="60" x2="120" y2="80"/>
          <line x1="120" y1="40" x2="120" y2="80"/>
          <line x1="120" y1="80" x2="100" y2="100"/>
          <line x1="120" y1="80" x2="140" y2="100"/>
        </g>
        {/* puff cloud */}
        <ellipse cx="120" cy="80" rx="36" ry="24" fill={VP.honeyLight} stroke={VP.ink} strokeWidth="1.4" opacity="0.85" filter={VR}/>
        <text x="120" y="86" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="20" fill={VP.ink}>POW</text>
      </g>
    </VStage>
  );
}

// 7. Attacker death
function VFX_Death() {
  return (
    <VStage>
      <g style={{animation:'cb-curl 2s ease-in infinite', transformOrigin:'120px 80px'}} filter={VR}>
        <ellipse cx="120" cy="80" rx="14" ry="9" fill={VP.rust} stroke={VP.ink} strokeWidth="1.2"/>
        <path d="M 110,76 Q 120,80 130,76" stroke={VP.rustDark} strokeWidth="2" fill="none"/>
      </g>
      <g style={{animation:'cb-puff 2s ease-out infinite', transformOrigin:'120px 80px'}}>
        <circle cx="120" cy="80" r="20" fill={VP.smokeGrey} opacity="0.5"/>
        <circle cx="105" cy="72" r="10" fill={VP.smokeGrey} opacity="0.4"/>
        <circle cx="135" cy="72" r="10" fill={VP.smokeGrey} opacity="0.4"/>
      </g>
    </VStage>
  );
}

// 8. Honey gain tick
function VFX_HoneyTick() {
  return (
    <VStage bg="paper">
      {[0,0.5,1].map(d=>(
        <g key={d} style={{animation:'cb-rise 1.8s ease-out infinite', animationDelay:`${d}s`, transformOrigin:'120px 120px'}}>
          <text x="120" y="120" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="22" fill={VP.honeyDark}>+5🍯</text>
        </g>
      ))}
    </VStage>
  );
}

// 9. Wave incoming warning
function VFX_WaveIncoming() {
  return (
    <VStage>
      <rect x="0" y="0" width="240" height="60" fill={VP.redInk} opacity="0.5" style={{animation:'cb-warn-wash 1.2s ease-in-out infinite'}}/>
      <text x="120" y="40" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="14" fill={VP.paper} letterSpacing="0.1em">▼ INCOMING ▼</text>
    </VStage>
  );
}

// 10. Wave start banner
function VFX_WaveStart() {
  return (
    <VStage bg="paper">
      <g style={{animation:'cb-sweep 2.8s ease-in-out infinite'}}>
        <rect x="20" y="60" width="200" height="40" fill={VP.honey} stroke={VP.ink} strokeWidth="2" filter={VR}/>
        <text x="120" y="86" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="20" fill={VP.ink} letterSpacing="0.1em">WAVE 12</text>
      </g>
    </VStage>
  );
}

// 11. Wave complete — petals
function VFX_WaveComplete() {
  return (
    <VStage bg="paper">
      <rect x="0" y="0" width="240" height="160" fill={VP.honey} opacity="0.18"/>
      {[20,55,90,130,170,210].map((x,i)=>(
        <g key={i} style={{animation:`cb-petal 2.4s ease-out infinite`, animationDelay:`${i*0.25}s`, transformOrigin:`${x}px 160px`}}>
          <path d={`M ${x},160 q -4,-6 0,-10 q 4,4 0,10 z`} fill={VP.jelly} stroke={VP.ink} strokeWidth="0.8" filter={VR}/>
        </g>
      ))}
      <text x="120" y="92" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="18" fill={VP.honeyDark}>VICTORY</text>
    </VStage>
  );
}

// 12. Boon picker reveal
function VFX_BoonReveal() {
  return (
    <VStage bg="paper">
      {[0,1,2].map(i=>(
        <g key={i} style={{
          animation:`cb-flip-in 1.8s ease-out infinite`,
          animationDelay:`${i*0.25}s`,
          transformOrigin:`${50+i*70}px 80px`
        }}>
          <rect x={30+i*70} y={40} width="40" height="80" rx="4" fill={VP.paper} stroke={VP.ink} strokeWidth="1.4" filter={VR}/>
          <circle cx={50+i*70} cy={66} r="8" fill={VP.honey} stroke={VP.ink} strokeWidth="1"/>
          <line x1={36+i*70} y1={92} x2={64+i*70} y2={92} stroke={VP.ink} strokeWidth="0.6"/>
          <line x1={36+i*70} y1={100} x2={64+i*70} y2={100} stroke={VP.ink} strokeWidth="0.6"/>
        </g>
      ))}
    </VStage>
  );
}

// 13. Boon selected — glow + dissolve
function VFX_BoonSelected() {
  return (
    <VStage bg="paper">
      <g style={{animation:'cb-glow 1.6s ease-in-out infinite'}}>
        <rect x="100" y="40" width="40" height="80" rx="4" fill={VP.honey} stroke={VP.ink} strokeWidth="1.6" filter={VR}/>
        <circle cx="120" cy="66" r="10" fill={VP.honeyLight} stroke={VP.ink} strokeWidth="1"/>
      </g>
      {/* dissolving sparks */}
      {[0,0.4,0.8].map((d,i)=>(
        <g key={i} style={{animation:`cb-rise 1.6s ease-out infinite`, animationDelay:`${d}s`, transformOrigin:'120px 80px'}}>
          <circle cx={110+i*8} cy="80" r="2" fill={VP.honey}/>
        </g>
      ))}
    </VStage>
  );
}

// 14. Larva mature
function VFX_LarvaMature() {
  return (
    <VStage>
      <g style={{transformOrigin:'120px 80px'}}>
        <ellipse cx="120" cy="80" rx="14" ry="10" fill={VP.paperDark} stroke={VP.ink} strokeWidth="1.2" filter={VR}/>
        <line x1="110" y1="78" x2="130" y2="78" stroke={VP.honeyDark} strokeWidth="0.6"/>
        <line x1="110" y1="82" x2="130" y2="82" stroke={VP.honeyDark} strokeWidth="0.6"/>
      </g>
      <g style={{animation:'cb-puff 2s ease-out infinite', transformOrigin:'120px 80px'}}>
        <circle cx="120" cy="80" r="22" fill={VP.honeyLight} opacity="0.7"/>
      </g>
      <g style={{animation:'cb-bob 1.6s ease-in-out infinite'}}>
        <ellipse cx="120" cy="60" rx="6" ry="4" fill={VP.honey} stroke={VP.ink} strokeWidth="1"/>
        <line x1="116" y1="60" x2="124" y2="60" stroke={VP.ink} strokeWidth="1.4"/>
      </g>
    </VStage>
  );
}

// 15. Royal jelly sparkle
function VFX_RoyalJelly() {
  return (
    <VStage bg="paper">
      <g style={{animation:'cb-pulse 2s ease-in-out infinite', transformOrigin:'120px 80px'}}>
        <circle cx="120" cy="80" r="40" fill={VP.jelly} opacity="0.3"/>
      </g>
      {[[80,40],[160,50],[100,120],[170,110],[60,100],[180,80]].map(([x,y],i)=>(
        <g key={i} style={{animation:'cb-twinkle 1.8s ease-in-out infinite', animationDelay:`${i*0.2}s`, transformOrigin:`${x}px ${y}px`}}>
          <path d={`M ${x},${y-6} L ${x+2},${y-2} L ${x+6},${y} L ${x+2},${y+2} L ${x},${y+6} L ${x-2},${y+2} L ${x-6},${y} L ${x-2},${y-2} Z`}
            fill={VP.jelly} stroke={VP.jellyDeep} strokeWidth="0.6"/>
        </g>
      ))}
      <text x="120" y="86" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="14" fill={VP.jellyDeep}>✨</text>
    </VStage>
  );
}

// 16. Damage indicator splatter
function VFX_DamageSplat() {
  return (
    <VStage>
      <g style={{animation:'cb-shake 0.18s linear infinite', transformOrigin:'120px 80px'}}>
        <g fill={VP.redInk} opacity="0.85" filter={VR}>
          <circle cx="120" cy="80" r="12"/>
          <circle cx="100" cy="64" r="4"/>
          <circle cx="142" cy="60" r="5"/>
          <circle cx="106" cy="100" r="4"/>
          <circle cx="140" cy="100" r="3"/>
          <circle cx="156" cy="78" r="2"/>
          <circle cx="84" cy="80" r="2"/>
        </g>
        <text x="120" y="88" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="22" fill={VP.paper}>-12</text>
      </g>
    </VStage>
  );
}

// 17. Smoke AoE
function VFX_Smoke() {
  return (
    <VStage>
      <g style={{animation:'cb-pulse-soft 2s ease-in-out infinite', transformOrigin:'120px 80px'}}>
        <ellipse cx="120" cy="80" rx="60" ry="34" fill={VP.smokeGrey} stroke={VP.ink} strokeWidth="1.2" filter={VRS} opacity="0.7"/>
        <ellipse cx="100" cy="74" rx="20" ry="12" fill={VP.smokeGrey} opacity="0.5"/>
        <ellipse cx="142" cy="86" rx="22" ry="14" fill={VP.smokeGrey} opacity="0.5"/>
      </g>
      {/* greyed bee inside */}
      <g style={{transform:'translate(120px,80px)'}}>
        <ellipse cx="0" cy="0" rx="6" ry="4" fill={VP.smokeGrey} stroke={VP.ink} strokeWidth="0.8"/>
        <line x1="-4" y1="0" x2="4" y2="0" stroke={VP.ink} strokeWidth="1"/>
      </g>
    </VStage>
  );
}

// 18. Web overlay
function VFX_Web() {
  return (
    <VStage>
      <g stroke={VP.webWhite} strokeWidth="1.4" fill="none" filter={VRL} opacity="0.85">
        <line x1="120" y1="80" x2="60" y2="30"/>
        <line x1="120" y1="80" x2="180" y2="30"/>
        <line x1="120" y1="80" x2="60" y2="130"/>
        <line x1="120" y1="80" x2="180" y2="130"/>
        <line x1="120" y1="80" x2="120" y2="20"/>
        <line x1="120" y1="80" x2="120" y2="140"/>
        <line x1="120" y1="80" x2="50" y2="80"/>
        <line x1="120" y1="80" x2="190" y2="80"/>
        <path d="M 90,55 L 150,55 L 160,80 L 150,105 L 90,105 L 80,80 Z"/>
        <path d="M 100,65 L 140,65 L 148,80 L 140,95 L 100,95 L 92,80 Z"/>
      </g>
      {/* trapped bee */}
      <g>
        <ellipse cx="120" cy="80" rx="6" ry="4" fill={VP.honey} stroke={VP.ink} strokeWidth="1"/>
        <line x1="116" y1="80" x2="124" y2="80" stroke={VP.ink} strokeWidth="1.2"/>
      </g>
    </VStage>
  );
}

// 19. Skunk spray
function VFX_Skunk() {
  return (
    <VStage>
      <g style={{animation:'cb-pulse-soft 1.8s ease-in-out infinite', transformOrigin:'120px 80px'}}>
        <ellipse cx="120" cy="80" rx="58" ry="32" fill="#9CB85F" opacity="0.6" filter={VRS}/>
        <ellipse cx="100" cy="70" rx="18" ry="10" fill="#7E9658" opacity="0.5"/>
        <ellipse cx="142" cy="88" rx="22" ry="12" fill="#7E9658" opacity="0.5"/>
      </g>
      {/* random arrows */}
      <g stroke={VP.ink} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M 90,60 q 8,4 -4,12"/>
        <path d="M 150,60 q -8,4 4,12"/>
        <path d="M 110,100 q 8,-4 4,-12"/>
      </g>
    </VStage>
  );
}

// 20. Status indicators row
function VFX_Status() {
  const items = [
    { icon: '☠', color: '#7E9658', name:'POISONED' },
    { icon: '☁', color: VP.smokeGrey, name:'SMOKED' },
    { icon: '✱', color: VP.webWhite, name:'WEBBED' },
    { icon: '↑', color: VP.honey, name:'BUFFED' },
    { icon: '+', color: '#A8351E', name:'HEALING' },
    { icon: '✦', color: VP.jelly, name:'BLESSED' },
  ];
  return (
    <VStage bg="paper">
      <g>
        {items.map((s,i)=>{
          const x = 24 + i*36;
          return (
            <g key={i}>
              <circle cx={x} cy="60" r="11" fill={s.color} stroke={VP.ink} strokeWidth="1.2" filter={VR}/>
              <text x={x} y="65" textAnchor="middle" fontFamily="Fraunces" fontWeight="700" fontSize="13" fill={VP.ink}>{s.icon}</text>
              <text x={x} y="100" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6.5" fill={VP.inkSoft} letterSpacing="0.05em">{s.name}</text>
            </g>
          );
        })}
      </g>
    </VStage>
  );
}

// 21. Princess departure
function VFX_PrincessFly() {
  return (
    <VStage>
      <g style={{animation:'vfx-princess 3s ease-in-out infinite'}}>
        <g filter={VR}>
          <ellipse cx="0" cy="0" rx="10" ry="7" fill={VP.honey} stroke={VP.ink} strokeWidth="1.2"/>
          <line x1="-7" y1="0" x2="7" y2="0" stroke={VP.ink} strokeWidth="1.4"/>
          <path d="M -4,-8 L -2,-12 L 0,-9 L 2,-12 L 4,-8 Z" fill={VP.honeyDark} stroke={VP.ink} strokeWidth="0.6"/>
        </g>
      </g>
      {/* second hive growing */}
      <g style={{animation:'vfx-grow 3s ease-in-out infinite', transformOrigin:'200px 130px'}}>
        <ellipse cx="200" cy="130" rx="20" ry="18" fill="url(#honey-glow)" stroke={VP.ink} strokeWidth="1.4" filter={VR}/>
      </g>
      <style>{`
        @keyframes vfx-princess {
          0%   { transform: translate(60px,120px); }
          100% { transform: translate(240px,-20px) scale(0.4); opacity:0;}
        }
        @keyframes vfx-grow {
          0% { transform: scale(0); opacity:0; }
          70% { transform: scale(0); opacity:0; }
          100% { transform: scale(1); opacity:1; }
        }
      `}</style>
    </VStage>
  );
}

const VFX_LIST = [
  { id:'hive-idle',        name:'Hive Idle',          group:'HIVE',    Comp: VFX_HiveIdle,        desc:'Breathing pulse + lazy orbit.' },
  { id:'hive-damage',      name:'Hive <50%',          group:'HIVE',    Comp: VFX_HiveDamage,      desc:'Comb cracks overlay.' },
  { id:'hive-critical',    name:'Hive <25%',          group:'HIVE',    Comp: VFX_HiveCritical,    desc:'Flickering paper, red ink.' },
  { id:'swarm-form',       name:'Swarm Forming',      group:'SWARM',   Comp: VFX_SwarmForm,       desc:'Bees converge from hive.' },
  { id:'swarm-travel',     name:'Swarm Traveling',    group:'SWARM',   Comp: VFX_SwarmTravel,     desc:'Motion-blur + dotted path.' },
  { id:'swarm-engage',     name:'Swarm Engaging',     group:'SWARM',   Comp: VFX_SwarmEngage,     desc:'Combat puff + impact stars.' },
  { id:'death',            name:'Attacker Death',     group:'COMBAT',  Comp: VFX_Death,           desc:'Curl + ink-puff dissipate.' },
  { id:'damage',           name:'Damage Splatter',    group:'COMBAT',  Comp: VFX_DamageSplat,     desc:'Red splatter + screen-shake.' },
  { id:'smoke',            name:'Smoke AoE',          group:'STATUS',  Comp: VFX_Smoke,           desc:'Wobbly grey cloud, bees fade.' },
  { id:'web',              name:'Web Overlay',        group:'STATUS',  Comp: VFX_Web,             desc:'Sticky cobweb; bees -50% spd.' },
  { id:'skunk',            name:'Skunk Spray',        group:'STATUS',  Comp: VFX_Skunk,           desc:'Green wobble cloud, scrambles.' },
  { id:'status',           name:'Status Icons',       group:'STATUS',  Comp: VFX_Status,          desc:'6 status effects, ink-drawn.' },
  { id:'honey',            name:'Honey Tick +5',      group:'HUD',     Comp: VFX_HoneyTick,       desc:'Floating numerals rise + fade.' },
  { id:'wave-incoming',    name:'Wave Incoming',      group:'HUD',     Comp: VFX_WaveIncoming,    desc:'Red ink wash from top edge.' },
  { id:'wave-start',       name:'Wave Banner',        group:'HUD',     Comp: VFX_WaveStart,       desc:'Paper banner sweeps across.' },
  { id:'wave-complete',    name:'Wave Complete',      group:'HUD',     Comp: VFX_WaveComplete,    desc:'Golden wash + petals.' },
  { id:'boon-reveal',      name:'Boon Reveal',        group:'META',    Comp: VFX_BoonReveal,      desc:'3 cards flip in, flourish.' },
  { id:'boon-selected',    name:'Boon Selected',      group:'META',    Comp: VFX_BoonSelected,    desc:'Glow + dissolve into hive.' },
  { id:'larva-mature',     name:'Larva Mature',       group:'META',    Comp: VFX_LarvaMature,     desc:'Pulse + emergence puff.' },
  { id:'jelly',            name:'Royal Jelly',        group:'META',    Comp: VFX_RoyalJelly,      desc:'Late-game shimmer overlay.' },
  { id:'princess',         name:'Princess Departs',   group:'META',    Comp: VFX_PrincessFly,     desc:'Flies offscreen, hive grows.' },
];

window.CAMB_VFX = { VFX_LIST };
