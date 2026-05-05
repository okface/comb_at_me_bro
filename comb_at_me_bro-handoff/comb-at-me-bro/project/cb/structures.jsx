/* Comb At Me Bro — structures, top-down hand-drawn. */
const { PAL: SP, ROUGH: SR, ROUGH_LIGHT: SRL } = window.CAMB;

function ShadowS({ rx=22 }) { return <ellipse cx="32" cy="58" rx={rx} ry="3.5" fill={SP.ink} opacity="0.18"/>; }

// 1. Propolis wall
function PropolisWall() {
  return (
    <g filter={SR}>
      <ShadowS rx="22"/>
      <path d="M 12,38 Q 14,28 22,30 Q 30,22 40,28 Q 50,24 52,34 Q 56,42 50,48 Q 40,54 30,50 Q 16,52 12,38 Z"
        fill={SP.honeyDark} stroke={SP.ink} strokeWidth="1.6"/>
      <g fill={SP.honey} opacity="0.6">
        <circle cx="22" cy="36" r="2"/>
        <circle cx="34" cy="32" r="2.2"/>
        <circle cx="44" cy="42" r="1.6"/>
        <circle cx="28" cy="46" r="1.6"/>
      </g>
    </g>
  );
}

// 2. Decoy entrance
function Decoy() {
  return (
    <g filter={SR}>
      <ShadowS/>
      <ellipse cx="32" cy="38" rx="20" ry="14" fill={SP.honeyDeep} stroke={SP.ink} strokeWidth="1.6"/>
      <ellipse cx="32" cy="38" rx="8" ry="5" fill={SP.ink}/>
      {/* ✗ mark */}
      <g stroke={SP.redInk} strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
        <line x1="20" y1="28" x2="44" y2="50"/>
        <line x1="44" y1="28" x2="20" y2="50"/>
      </g>
    </g>
  );
}

// 3. Comb tower
function CombTower() {
  return (
    <g filter={SR}>
      <ShadowS rx="20"/>
      <ellipse cx="32" cy="50" rx="18" ry="6" fill={SP.honeyDark} stroke={SP.ink} strokeWidth="1.4"/>
      <rect x="18" y="20" width="28" height="32" rx="6" fill={SP.honey} stroke={SP.ink} strokeWidth="1.6"/>
      {/* hex layers */}
      <g stroke={SP.honeyDark} strokeWidth="0.8" fill="none" opacity="0.7">
        <polygon points="24,28 28,26 32,28 32,32 28,34 24,32"/>
        <polygon points="32,28 36,26 40,28 40,32 36,34 32,32"/>
        <polygon points="28,36 32,34 36,36 36,40 32,42 28,40"/>
        <polygon points="24,42 28,40 32,42 32,46 28,48 24,46"/>
        <polygon points="32,42 36,40 40,42 40,46 36,48 32,46"/>
      </g>
      <ellipse cx="32" cy="14" rx="6" ry="3" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="1"/>
    </g>
  );
}

// 4. Watchtower
function Watchtower() {
  return (
    <g filter={SR}>
      <ShadowS rx="18"/>
      <rect x="26" y="30" width="12" height="22" fill={SP.honeyDark} stroke={SP.ink} strokeWidth="1.4"/>
      <ellipse cx="32" cy="22" rx="14" ry="8" fill={SP.honey} stroke={SP.ink} strokeWidth="1.6"/>
      {/* eye */}
      <ellipse cx="32" cy="22" rx="6" ry="3.5" fill={SP.paper} stroke={SP.ink} strokeWidth="0.8"/>
      <circle cx="32" cy="22" r="2.2" fill={SP.ink}/>
      <circle cx="32" cy="22" r="1" fill={SP.honey}/>
    </g>
  );
}

// 5. Honey vat
function HoneyVat() {
  return (
    <g filter={SR}>
      <ShadowS/>
      <ellipse cx="32" cy="42" rx="20" ry="16" fill="url(#honey-glow)" stroke={SP.ink} strokeWidth="1.6"/>
      <ellipse cx="32" cy="28" rx="20" ry="6" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="1.4"/>
      <ellipse cx="32" cy="28" rx="14" ry="3.5" fill={SP.honey} opacity="0.7"/>
      {/* glow */}
      <ellipse cx="32" cy="40" rx="14" ry="10" fill={SP.honeyLight} opacity="0.35" className="cb-pulse" style={{animation:'cb-pulse 2.4s ease-in-out infinite', transformOrigin:'32px 40px'}}/>
    </g>
  );
}

// 6. Stinger turret
function StingerTurret() {
  return (
    <g filter={SR}>
      <ShadowS rx="20"/>
      <circle cx="32" cy="40" r="14" fill={SP.honeyDeep} stroke={SP.ink} strokeWidth="1.6"/>
      <g className="cb-spin-fast" style={{transformOrigin:'32px 40px', animation:'cb-spin 6s linear infinite'}}>
        <path d="M 32,40 L 32,18" stroke={SP.ink} strokeWidth="3" strokeLinecap="round"/>
        <path d="M 32,18 L 28,24 L 36,24 Z" fill={SP.ink}/>
      </g>
      <circle cx="32" cy="40" r="4" fill={SP.ink}/>
      <circle cx="32" cy="40" r="1.5" fill={SP.honey}/>
    </g>
  );
}

// 7. Pheromone marker
function Pheromone() {
  return (
    <g filter={SR}>
      <ShadowS rx="20"/>
      <g style={{transformOrigin:'32px 38px'}}>
        <circle cx="32" cy="38" r="20" fill={SP.honey} opacity="0.18" className="cb-pulse"/>
        <circle cx="32" cy="38" r="14" fill={SP.honey} opacity="0.28" className="cb-pulse" style={{animationDelay:'0.4s'}}/>
      </g>
      <path d="M 26,42 L 32,22 L 38,42 Z" fill={SP.honey} stroke={SP.ink} strokeWidth="1.4"/>
      <ellipse cx="32" cy="42" rx="6" ry="2" fill={SP.honeyDark} stroke={SP.ink} strokeWidth="1"/>
      <circle cx="32" cy="20" r="2" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="0.8"/>
    </g>
  );
}

// 8. Brood chamber
function BroodChamber() {
  return (
    <g filter={SR}>
      <ShadowS/>
      <ellipse cx="32" cy="40" rx="22" ry="14" fill={SP.paperDark} stroke={SP.ink} strokeWidth="1.6"/>
      {/* cells */}
      <g>
        <ellipse cx="22" cy="38" rx="4" ry="3" fill={SP.honey} stroke={SP.ink} strokeWidth="0.8"/>
        <ellipse cx="32" cy="36" rx="4" ry="3" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="0.8"/>
        <ellipse cx="42" cy="38" rx="4" ry="3" fill={SP.honey} stroke={SP.ink} strokeWidth="0.8"/>
        <ellipse cx="27" cy="44" rx="4" ry="3" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="0.8"/>
        <ellipse cx="37" cy="44" rx="4" ry="3" fill={SP.honey} stroke={SP.ink} strokeWidth="0.8"/>
      </g>
      {/* larva dots */}
      <g fill={SP.paper}>
        <circle cx="22" cy="38" r="1"/><circle cx="32" cy="36" r="1"/>
        <circle cx="42" cy="38" r="1"/><circle cx="27" cy="44" r="1"/>
      </g>
    </g>
  );
}

// 9. Wax fence
function WaxFence() {
  return (
    <g filter={SR}>
      <ShadowS rx="22"/>
      {[12, 24, 36, 48].map((x,i)=>(
        <g key={i}>
          <rect x={x-3} y={26} width="6" height="22" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="1.2" rx="2"/>
          <circle cx={x} cy="26" r="3" fill={SP.honeyLight} stroke={SP.ink} strokeWidth="1.2"/>
        </g>
      ))}
      <line x1="8" y1="32" x2="56" y2="32" stroke={SP.honeyDark} strokeWidth="1.4"/>
      <line x1="8" y1="42" x2="56" y2="42" stroke={SP.honeyDark} strokeWidth="1.4"/>
    </g>
  );
}

// 10. Royal chamber
function RoyalChamber() {
  return (
    <g filter={SR}>
      <ShadowS rx="24"/>
      <path d="M 14,46 Q 14,22 32,14 Q 50,22 50,46 Z" fill={SP.honeyDeep} stroke={SP.ink} strokeWidth="1.6"/>
      {/* ornate */}
      <path d="M 32,14 L 28,8 L 32,4 L 36,8 Z" fill={SP.jelly} stroke={SP.ink} strokeWidth="1"/>
      <circle cx="32" cy="6" r="1.4" fill={SP.honeyLight}/>
      <g stroke={SP.honeyLight} strokeWidth="0.8" fill="none" opacity="0.8">
        <path d="M 22,30 Q 32,26 42,30"/>
        <path d="M 22,38 Q 32,34 42,38"/>
      </g>
      <ellipse cx="32" cy="42" rx="6" ry="3" fill={SP.ink}/>
      <circle cx="32" cy="42" r="1.6" fill={SP.jelly} className="cb-pulse"/>
    </g>
  );
}

const STRUCTURES = [
  { id:'wall',       name:'Propolis Wall',   Comp: PropolisWall,   cost:'15🍯',      desc:'Basic defense block.' },
  { id:'fence',      name:'Wax Fence',       Comp: WaxFence,       cost:'8🍯',       desc:'Cheap, weaker walls.' },
  { id:'decoy',      name:'False Entrance',  Comp: Decoy,          cost:'25🍯',      desc:'Lures and traps attackers.' },
  { id:'comb',       name:'Comb Tower',      Comp: CombTower,      cost:'40🍯',      desc:'Increases storage cap.' },
  { id:'watch',      name:'Watchtower',      Comp: Watchtower,     cost:'30🍯',      desc:'Reveals next wave.' },
  { id:'vat',        name:'Honey Vat',       Comp: HoneyVat,       cost:'35🍯',      desc:'Bulbous storage; glows when full.' },
  { id:'turret',     name:'Stinger Turret',  Comp: StingerTurret,  cost:'60🍯',      desc:'Auto-Guard emplacement.' },
  { id:'pher',       name:'Pheromone Marker',Comp: Pheromone,      cost:'45🍯',      desc:'Buffs nearby bees.' },
  { id:'brood',      name:'Brood Chamber',   Comp: BroodChamber,   cost:'50🍯',      desc:'+larvae per wave.' },
  { id:'royal',      name:'Royal Chamber',   Comp: RoyalChamber,   cost:'120🍯+✨',  desc:'Princess unlock.' },
];

const STRUCT_BY_ID = Object.fromEntries(STRUCTURES.map(s=>[s.id, s]));
window.CAMB_STRUCT = { STRUCTURES, STRUCT_BY_ID, PropolisWall, Decoy, CombTower, Watchtower, HoneyVat, StingerTurret, Pheromone, BroodChamber, WaxFence, RoyalChamber };
