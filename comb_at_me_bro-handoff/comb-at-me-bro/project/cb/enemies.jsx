/* Comb At Me Bro — enemy roster, top-down hand-drawn.
   All sprites in 64x64 viewBox unless boss-tier.
*/
const { PAL: EP, ROUGH: ER, ROUGH_LIGHT: ERL, ROUGH_STRONG: ERS } = window.CAMB;

function ShadowBlob({ cx=32, cy=58, rx=18 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry="3.5" fill={EP.ink} opacity="0.2"/>;
}

// 1. HORNET
function Hornet() {
  return (
    <g filter={ER}>
      <ShadowBlob/>
      <g className="cb-flutter" style={{transformOrigin:'18px 28px'}}>
        <path d="M 22,28 Q 8,22 14,36 Z" fill={EP.white} stroke={EP.ink} strokeWidth="1" opacity="0.75"/>
      </g>
      <g className="cb-flutter-s" style={{transformOrigin:'46px 28px'}}>
        <path d="M 42,28 Q 56,22 50,36 Z" fill={EP.white} stroke={EP.ink} strokeWidth="1" opacity="0.75"/>
      </g>
      <ellipse cx="32" cy="36" rx="14" ry="9" fill={EP.rust} stroke={EP.ink} strokeWidth="1.4"/>
      <path d="M 20,32 L 26,34 L 32,32 L 38,34 L 44,32" stroke={EP.rustDark} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 20,40 L 26,38 L 32,40 L 38,38 L 44,40" stroke={EP.rustDark} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 32,16 L 24,28 L 40,28 Z" fill={EP.rustDark} stroke={EP.ink} strokeWidth="1.2"/>
      <circle cx="28" cy="24" r="1" fill={EP.honey}/>
      <circle cx="36" cy="24" r="1" fill={EP.honey}/>
      <path d="M 32,46 L 28,56 L 36,56 Z" fill={EP.ink}/>
    </g>
  );
}

// 2. SPIDER
function Spider() {
  return (
    <g filter={ER}>
      <ShadowBlob rx="20"/>
      {/* legs */}
      <g stroke={EP.ink} strokeWidth="1.6" fill="none" strokeLinecap="round" className="cb-scuttle" style={{animation:'cb-scuttle 0.4s linear infinite', transformOrigin:'32px 36px'}}>
        <path d="M 18,20 Q 10,24 14,30"/>
        <path d="M 16,30 Q 6,32 10,38"/>
        <path d="M 18,42 Q 8,46 14,52"/>
        <path d="M 22,50 Q 18,58 26,56"/>
        <path d="M 46,20 Q 54,24 50,30"/>
        <path d="M 48,30 Q 58,32 54,38"/>
        <path d="M 46,42 Q 56,46 50,52"/>
        <path d="M 42,50 Q 46,58 38,56"/>
      </g>
      <ellipse cx="32" cy="40" rx="13" ry="11" fill={EP.spiderPurple} stroke={EP.ink} strokeWidth="1.4"/>
      <ellipse cx="32" cy="40" rx="13" ry="11" fill={EP.ink} opacity="0.3"/>
      <circle cx="32" cy="26" r="6" fill={EP.spiderPurple} stroke={EP.ink} strokeWidth="1.2"/>
      <circle cx="29" cy="25" r="1" fill={EP.redInk}/>
      <circle cx="35" cy="25" r="1" fill={EP.redInk}/>
      <circle cx="29" cy="28" r="0.7" fill={EP.redInk}/>
      <circle cx="35" cy="28" r="0.7" fill={EP.redInk}/>
    </g>
  );
}

// 3. BEAR — boss tier
function Bear({ size=128 }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} style={{display:'block'}}>
      <g filter={ER} className="cb-bob-s">
        <ellipse cx="64" cy="112" rx="40" ry="6" fill={EP.ink} opacity="0.25"/>
        <ellipse cx="64" cy="72" rx="38" ry="34" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.8"/>
        <g fill={EP.rustDark} opacity="0.35">
          <circle cx="44" cy="60" r="2"/><circle cx="52" cy="80" r="1.5"/>
          <circle cx="78" cy="64" r="1.8"/><circle cx="84" cy="82" r="2"/>
          <circle cx="64" cy="90" r="1.5"/>
        </g>
        {/* paws */}
        <ellipse cx="34" cy="60" rx="9" ry="7" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.4"/>
        <ellipse cx="94" cy="60" rx="9" ry="7" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.4"/>
        <g fill={EP.ink}>
          <circle cx="30" cy="58" r="0.9"/><circle cx="34" cy="55" r="0.9"/><circle cx="38" cy="58" r="0.9"/>
          <circle cx="90" cy="58" r="0.9"/><circle cx="94" cy="55" r="0.9"/><circle cx="98" cy="58" r="0.9"/>
        </g>
        {/* head */}
        <circle cx="64" cy="46" r="18" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.6"/>
        <circle cx="50" cy="34" r="6" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.2"/>
        <circle cx="78" cy="34" r="6" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.2"/>
        <circle cx="50" cy="34" r="2.5" fill={EP.rustDark}/>
        <circle cx="78" cy="34" r="2.5" fill={EP.rustDark}/>
        <circle cx="58" cy="44" r="1.4" fill={EP.ink}/>
        <circle cx="70" cy="44" r="1.4" fill={EP.ink}/>
        <ellipse cx="64" cy="52" rx="4" ry="3" fill={EP.ink}/>
        <path d="M 62,58 Q 64,62 66,58" stroke={EP.ink} strokeWidth="1.2" fill="none"/>
      </g>
    </svg>
  );
}

// 4. BEEKEEPER — boss
function Beekeeper({ size=128 }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} style={{display:'block'}}>
      <g filter={ER} className="cb-bob-s">
        <ellipse cx="64" cy="116" rx="44" ry="7" fill={EP.ink} opacity="0.25"/>
        <ellipse cx="64" cy="78" rx="32" ry="36" fill={EP.paper} stroke={EP.ink} strokeWidth="1.8"/>
        <path d="M 42,60 Q 46,90 48,108" stroke={EP.paperShade} strokeWidth="1.6" fill="none"/>
        <path d="M 86,60 Q 82,90 80,108" stroke={EP.paperShade} strokeWidth="1.6" fill="none"/>
        {/* arm + smoker */}
        <ellipse cx="38" cy="76" rx="10" ry="6" fill={EP.paper} stroke={EP.ink} strokeWidth="1.4"/>
        <rect x="14" y="56" width="20" height="26" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.4" rx="2"/>
        <path d="M 14,56 Q 24,46 34,56" fill={EP.honeyDark} stroke={EP.ink} strokeWidth="1.4"/>
        {/* smoke */}
        <g className="cb-bob">
          <circle cx="24" cy="40" r="6" fill={EP.smokeGrey} stroke={EP.ink} strokeWidth="1" opacity="0.85"/>
          <circle cx="14" cy="28" r="4" fill={EP.smokeGrey} stroke={EP.ink} strokeWidth="1" opacity="0.7"/>
          <circle cx="30" cy="22" r="5" fill={EP.smokeGrey} stroke={EP.ink} strokeWidth="1" opacity="0.6"/>
        </g>
        {/* hat brim */}
        <circle cx="64" cy="42" r="32" fill={EP.paper} stroke={EP.ink} strokeWidth="1.8"/>
        {/* veil */}
        <circle cx="64" cy="42" r="22" fill={EP.ink} opacity="0.88"/>
        <g stroke={EP.paperShade} strokeWidth="0.6" opacity="0.45">
          <line x1="46" y1="42" x2="82" y2="42"/>
          <line x1="64" y1="22" x2="64" y2="62"/>
          <line x1="50" y1="28" x2="78" y2="58"/>
          <line x1="78" y1="28" x2="50" y2="58"/>
        </g>
      </g>
    </svg>
  );
}

// 5. WASP SWARM
function WaspSwarm() {
  const ws = [[18,28],[28,22],[36,30],[26,38],[42,38],[36,46],[20,44]];
  return (
    <g filter={ER}>
      <ShadowBlob rx="22"/>
      {ws.map(([x,y],i)=>(
        <g key={i} className="cb-flutter" style={{transformOrigin:`${x}px ${y}px`, animationDelay:`${i*0.04}s`}}>
          <ellipse cx={x} cy={y} rx="4" ry="2.5" fill={EP.rust} stroke={EP.ink} strokeWidth="0.8"/>
          <line x1={x-2} y1={y} x2={x+2} y2={y} stroke={EP.ink} strokeWidth="1"/>
        </g>
      ))}
    </g>
  );
}

// 6. ANTS — single ant; render as column
function Ant() {
  return (
    <g filter={ER} className="cb-bob">
      <ellipse cx="32" cy="38" rx="3" ry="2" fill={EP.ink}/>
      <circle cx="32" cy="32" r="2" fill={EP.ink}/>
      <circle cx="32" cy="42" r="3" fill={EP.ink}/>
      <g stroke={EP.ink} strokeWidth="0.8" fill="none" strokeLinecap="round">
        <path d="M 30,36 L 26,34"/><path d="M 34,36 L 38,34"/>
        <path d="M 30,40 L 26,42"/><path d="M 34,40 L 38,42"/>
        <path d="M 32,30 L 30,28"/><path d="M 32,30 L 34,28"/>
      </g>
    </g>
  );
}

// 7. BIRD
function Bird() {
  return (
    <g filter={ER}>
      <ShadowBlob rx="20"/>
      <ellipse cx="32" cy="36" rx="11" ry="14" fill={EP.rust} stroke={EP.ink} strokeWidth="1.4"/>
      <ellipse cx="32" cy="34" rx="6" ry="9" fill={EP.honeyLight} opacity="0.5"/>
      {/* wings */}
      <g className="cb-flap" style={{animation:'cb-flap 0.3s ease-in-out infinite', transformOrigin:'32px 36px'}}>
        <path d="M 20,32 Q 4,24 14,40 Z" fill={EP.rust} stroke={EP.ink} strokeWidth="1.2"/>
        <path d="M 44,32 Q 60,24 50,40 Z" fill={EP.rust} stroke={EP.ink} strokeWidth="1.2"/>
      </g>
      {/* head/beak */}
      <circle cx="32" cy="22" r="5" fill={EP.rust} stroke={EP.ink} strokeWidth="1.2"/>
      <path d="M 32,18 L 30,12 L 34,12 Z" fill={EP.honey} stroke={EP.ink} strokeWidth="0.8"/>
      <circle cx="30" cy="22" r="0.7" fill={EP.ink}/>
      <circle cx="34" cy="22" r="0.7" fill={EP.ink}/>
    </g>
  );
}

// 8. DRAGONFLY
function Dragonfly() {
  return (
    <g filter={ER}>
      <ShadowBlob rx="20"/>
      <g className="cb-flutter" style={{transformOrigin:'18px 28px'}}>
        <ellipse cx="14" cy="26" rx="14" ry="4" fill={EP.white} stroke={EP.ink} strokeWidth="0.8" opacity="0.7"/>
        <ellipse cx="14" cy="38" rx="12" ry="3.5" fill={EP.white} stroke={EP.ink} strokeWidth="0.8" opacity="0.7"/>
      </g>
      <g className="cb-flutter-s" style={{transformOrigin:'46px 28px'}}>
        <ellipse cx="50" cy="26" rx="14" ry="4" fill={EP.white} stroke={EP.ink} strokeWidth="0.8" opacity="0.7"/>
        <ellipse cx="50" cy="38" rx="12" ry="3.5" fill={EP.white} stroke={EP.ink} strokeWidth="0.8" opacity="0.7"/>
      </g>
      <ellipse cx="32" cy="38" rx="3" ry="18" fill={EP.sageDark} stroke={EP.ink} strokeWidth="1.2"/>
      <g stroke={EP.ink} strokeWidth="0.6" opacity="0.6">
        <line x1="30" y1="28" x2="34" y2="28"/>
        <line x1="30" y1="36" x2="34" y2="36"/>
        <line x1="30" y1="44" x2="34" y2="44"/>
      </g>
      <circle cx="32" cy="20" r="4.5" fill={EP.sageDark} stroke={EP.ink} strokeWidth="1.2"/>
      <circle cx="29" cy="19" r="1.4" fill={EP.honey}/>
      <circle cx="35" cy="19" r="1.4" fill={EP.honey}/>
    </g>
  );
}

// 9. SKUNK
function Skunk({ size=80 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{display:'block'}}>
      <g filter={ER} className="cb-bob">
        <ellipse cx="40" cy="68" rx="22" ry="4" fill={EP.ink} opacity="0.22"/>
        <ellipse cx="40" cy="44" rx="20" ry="18" fill={EP.ink} stroke={EP.ink} strokeWidth="1.4"/>
        <path d="M 40,28 Q 38,44 40,60" stroke={EP.paper} strokeWidth="6" fill="none" strokeLinecap="round"/>
        <circle cx="40" cy="22" r="8" fill={EP.ink} stroke={EP.ink} strokeWidth="1"/>
        <path d="M 40,16 Q 38,22 40,26" stroke={EP.paper} strokeWidth="2" fill="none"/>
        <circle cx="37" cy="22" r="0.9" fill={EP.honey}/>
        <circle cx="43" cy="22" r="0.9" fill={EP.honey}/>
        <ellipse cx="40" cy="26" rx="1.5" ry="1" fill={EP.honeyDark}/>
        {/* tail */}
        <path d="M 60,40 Q 76,30 70,50 Q 64,52 60,48" fill={EP.ink} stroke={EP.ink} strokeWidth="1.2"/>
        <path d="M 64,38 Q 72,34 70,46" stroke={EP.paper} strokeWidth="3" fill="none"/>
      </g>
    </svg>
  );
}

// 10. RIVAL QUEEN — dark mirror
function RivalQueen({ size=128 }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} style={{display:'block'}}>
      <g filter={ER}>
        <ellipse cx="64" cy="100" rx="40" ry="6" fill={EP.ink} opacity="0.25"/>
        <g className="cb-flutter" style={{transformOrigin:'40px 50px'}}>
          <ellipse cx="34" cy="52" rx="18" ry="11" fill={EP.spiderPurple} stroke={EP.ink} strokeWidth="1.2" opacity="0.55"/>
        </g>
        <g className="cb-flutter-s" style={{transformOrigin:'88px 50px'}}>
          <ellipse cx="94" cy="52" rx="18" ry="11" fill={EP.spiderPurple} stroke={EP.ink} strokeWidth="1.2" opacity="0.55"/>
        </g>
        <ellipse cx="64" cy="68" rx="22" ry="22" fill={EP.rustDark} stroke={EP.ink} strokeWidth="1.6"/>
        <path d="M 46,58 Q 64,62 82,58" stroke={EP.ink} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 46,76 Q 64,80 82,76" stroke={EP.ink} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <circle cx="64" cy="38" r="13" fill={EP.ink} stroke={EP.ink}/>
        <circle cx="58" cy="32" r="2" fill={EP.redInk}/>
        <circle cx="70" cy="32" r="2" fill={EP.redInk}/>
        <path d="M 58,44 L 70,44" stroke={EP.redInk} strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M 50,28 L 54,16 L 58,24 L 64,12 L 70,24 L 74,16 L 78,28 Z"
          fill={EP.spiderPurple} stroke={EP.ink} strokeWidth="1.4"/>
        <circle cx="64" cy="14" r="1.4" fill={EP.redInk}/>
        <path d="M 64,90 L 60,100 L 68,100 Z" fill={EP.ink}/>
      </g>
    </svg>
  );
}

// BONUS: Mites
function Mite() {
  return (
    <g filter={ER}>
      <circle cx="32" cy="36" r="6" fill={EP.rust} stroke={EP.ink} strokeWidth="1.2"/>
      <g stroke={EP.ink} strokeWidth="0.8" strokeLinecap="round">
        <line x1="28" y1="32" x2="24" y2="28"/>
        <line x1="36" y1="32" x2="40" y2="28"/>
        <line x1="28" y1="40" x2="24" y2="44"/>
        <line x1="36" y1="40" x2="40" y2="44"/>
      </g>
      <circle cx="30" cy="34" r="0.6" fill={EP.honey}/>
      <circle cx="34" cy="34" r="0.6" fill={EP.honey}/>
    </g>
  );
}

const ENEMY_ROSTER = [
  { id:'hornet',     name:'Hornet',     tier:'common', size:48, Comp: Hornet,     desc:'Fast aerial melee.' },
  { id:'spider',     name:'Spider',     tier:'common', size:56, Comp: Spider,     desc:'Slow ground; webs Strikers.' },
  { id:'wasp',       name:'Wasp Swarm', tier:'common', size:56, Comp: WaspSwarm,  desc:'Mini cluster, rivals your swarm.' },
  { id:'ant',        name:'Ants',       tier:'common', size:32, Comp: Ant,        desc:'Tiny columns of 8–12.' },
  { id:'bird',       name:'Bird',       tier:'common', size:64, Comp: Bird,       desc:'Dives at hive, ignores ground walls.' },
  { id:'dragonfly',  name:'Dragonfly',  tier:'common', size:56, Comp: Dragonfly,  desc:'Aerial assassin; picks off Strikers.' },
  { id:'skunk',      name:'Skunk',      tier:'mid',    size:80, Comp: Skunk,      desc:'AoE spray disorients bees.' },
  { id:'mite',       name:'Mite',       tier:'pest',   size:32, Comp: Mite,       desc:'Parasite — infects larvae production.' },
  { id:'beekeeper',  name:'Beekeeper',  tier:'boss',   size:128,Comp: Beekeeper,  desc:'Smoker AoE; ranged.' },
  { id:'bear',       name:'Bear',       tier:'boss',   size:128,Comp: Bear,       desc:'Tanky, ignores walls.' },
  { id:'rivalqueen', name:'Rival Queen',tier:'boss',   size:128,Comp: RivalQueen, desc:'Summons enemy bees.' },
];

const ENEMY_BY_ID = Object.fromEntries(ENEMY_ROSTER.map(e=>[e.id, e]));
window.CAMB_ENEMIES = {
  Hornet, Spider, Bear, Beekeeper, WaspSwarm, Ant, Bird, Dragonfly, Skunk, RivalQueen, Mite,
  ENEMY_ROSTER, ENEMY_BY_ID
};
