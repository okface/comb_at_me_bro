/* Comb At Me Bro — bees, top-down, hand-drawn.
   Each bee is rendered into a 64x64 sprite viewBox. Wings flutter via CSS.
   Roles: forager / nurse / guard / striker / architect / drone / princess
   Plus Queen (3 expressions).
*/

const { PAL: BPAL, ROUGH: BR, ROUGH_LIGHT: BRL } = window.CAMB;

// ---- Generic bee body ----
function BeeBody({
  bodyColor = BPAL.honey,
  bodyDeep = BPAL.honeyDeep,
  stripe = BPAL.ink,
  rx = 14, ry = 10,
  cy = 32,
  headR = 6,
  headColor = BPAL.ink,
  stinger = true,
  stingerSize = 1,
  wingW = 12, wingH = 7,
  wingOpacity = 0.78,
  fuzz = false,
  filter = BR,
  extra = null,
  glowAccent = null,
}) {
  return (
    <g filter={filter}>
      {/* shadow */}
      <ellipse cx="32" cy={cy + ry + 4} rx={rx + 2} ry="3" fill={BPAL.ink} opacity="0.18"/>
      {/* wings — flutter */}
      <g className="cb-flutter" style={{transformOrigin:`${32 - rx*0.4}px ${cy - ry*0.3}px`}}>
        <ellipse cx={32 - rx*0.55} cy={cy - ry*0.2} rx={wingW} ry={wingH}
          fill={BPAL.white} stroke={BPAL.ink} strokeWidth="1" opacity={wingOpacity}/>
      </g>
      <g className="cb-flutter-s" style={{transformOrigin:`${32 + rx*0.4}px ${cy - ry*0.3}px`}}>
        <ellipse cx={32 + rx*0.55} cy={cy - ry*0.2} rx={wingW} ry={wingH}
          fill={BPAL.white} stroke={BPAL.ink} strokeWidth="1" opacity={wingOpacity}/>
      </g>
      {/* body */}
      <ellipse cx="32" cy={cy} rx={rx} ry={ry} fill={bodyColor} stroke={BPAL.ink} strokeWidth="1.4"/>
      {/* stripes — wobbly arcs */}
      <path d={`M ${32-rx*0.78},${cy-ry*0.18} Q 32,${cy-ry*0.05} ${32+rx*0.78},${cy-ry*0.18}`}
        stroke={stripe} strokeWidth={ry*0.36} strokeLinecap="round" fill="none"/>
      <path d={`M ${32-rx*0.72},${cy+ry*0.42} Q 32,${cy+ry*0.55} ${32+rx*0.72},${cy+ry*0.42}`}
        stroke={stripe} strokeWidth={ry*0.36} strokeLinecap="round" fill="none"/>
      {/* head */}
      <circle cx="32" cy={cy - ry - headR*0.3} r={headR} fill={headColor} stroke={BPAL.ink} strokeWidth="1"/>
      {fuzz && (
        <g fill={bodyDeep} opacity="0.7">
          <circle cx={30} cy={cy - ry - headR*0.5} r="0.7"/>
          <circle cx={34} cy={cy - ry - headR*0.6} r="0.6"/>
          <circle cx={32} cy={cy - ry - headR*0.2} r="0.6"/>
        </g>
      )}
      {/* stinger */}
      {stinger && (
        <path d={`M 32,${cy + ry + 1} L ${32 - 2*stingerSize},${cy + ry + 5*stingerSize} L ${32 + 2*stingerSize},${cy + ry + 5*stingerSize} Z`}
          fill={BPAL.ink}/>
      )}
      {extra}
      {glowAccent && (
        <circle cx="32" cy={cy} r={rx*1.4} fill="none" stroke={glowAccent} strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
      )}
    </g>
  );
}

// ---- 7 roles ----
const ForagerBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honey} bodyDeep={BPAL.honeyDeep} fuzz
    extra={
      <g>
        {/* pollen sacs on legs */}
        <circle cx="22" cy="42" r="3" fill={BPAL.honeyDark} stroke={BPAL.ink} strokeWidth="0.8"/>
        <circle cx="42" cy="42" r="3" fill={BPAL.honeyDark} stroke={BPAL.ink} strokeWidth="0.8"/>
      </g>
    }
  />
);

const NurseBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honeyLight} bodyDeep={BPAL.honey}
    rx={13} ry={9}
    extra={
      <g>
        {/* cradled larva */}
        <ellipse cx="32" cy="40" rx="5" ry="3" fill={BPAL.paper} stroke={BPAL.ink} strokeWidth="0.8"/>
        <line x1="29" y1="40" x2="35" y2="40" stroke={BPAL.honeyDark} strokeWidth="0.6"/>
        <line x1="29" y1="41" x2="35" y2="41" stroke={BPAL.honeyDark} strokeWidth="0.6"/>
      </g>
    }
  />
);

const GuardBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honeyDeep} bodyDeep={BPAL.honeyDark}
    rx={15} ry={11}
    stripe={BPAL.ink}
    stingerSize={1.7}
    extra={
      <g>
        {/* heavy outline */}
        <ellipse cx="32" cy="32" rx="15" ry="11" fill="none" stroke={BPAL.ink} strokeWidth="0.8" opacity="0.5"/>
      </g>
    }
  />
);

const StrikerBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honey} bodyDeep={BPAL.honeyDeep}
    rx={16} ry={8}
    extra={
      <g>
        {/* swept-back wings + speed trail */}
        <path d="M 18,24 Q 8,28 14,32" stroke={BPAL.ink} strokeWidth="0.8" fill="none" opacity="0.4"/>
        <path d="M 14,28 Q 6,32 12,34" stroke={BPAL.ink} strokeWidth="0.8" fill="none" opacity="0.3"/>
      </g>
    }
  />
);

const ArchitectBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honeyDeep} bodyDeep={BPAL.honeyDark}
    rx={13} ry={9}
    extra={
      <g>
        {/* hex wax flake */}
        <polygon points="32,40 36,42.5 36,45.5 32,48 28,45.5 28,42.5"
          fill={BPAL.paperDark} stroke={BPAL.ink} strokeWidth="0.8"/>
        <polygon points="32,40 36,42.5 36,45.5 32,48 28,45.5 28,42.5"
          fill="none" stroke={BPAL.honeyDark} strokeWidth="0.4"/>
      </g>
    }
  />
);

const DroneBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honey} bodyDeep={BPAL.honeyDeep}
    rx={14} ry={11}
    headR={7.5}
    stinger={false}
    extra={
      <g>
        {/* big eyes */}
        <circle cx="29" cy="20" r="2" fill={BPAL.paper}/>
        <circle cx="35" cy="20" r="2" fill={BPAL.paper}/>
        <circle cx="29" cy="20" r="1" fill={BPAL.ink}/>
        <circle cx="35" cy="20" r="1" fill={BPAL.ink}/>
      </g>
    }
  />
);

const PrincessBee = (p) => (
  <BeeBody {...p}
    bodyColor={BPAL.honey} bodyDeep={BPAL.honeyDeep}
    rx={16} ry={11}
    headR={7}
    fuzz
    extra={
      <g>
        {/* crown */}
        <path d="M 26,18 L 28,12 L 30,16 L 32,10 L 34,16 L 36,12 L 38,18 Z"
          fill={BPAL.honeyDark} stroke={BPAL.ink} strokeWidth="0.8"/>
        <circle cx="32" cy="13" r="0.8" fill={BPAL.jelly}/>
      </g>
    }
  />
);

// ---- Queen ----
function QueenBee({ expression = 'calm', size = 128 }) {
  const isPanicked = expression === 'panicked';
  const isFocused = expression === 'focused';
  const eyeY = 32;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} style={{display:'block'}}>
      <g filter={BR}>
        {/* shadow */}
        <ellipse cx="64" cy="100" rx="40" ry="6" fill={BPAL.ink} opacity="0.22"/>
        {/* wings */}
        <g className="cb-flutter" style={{transformOrigin:'40px 50px'}}>
          <ellipse cx="34" cy="52" rx="18" ry="11" fill={BPAL.white} stroke={BPAL.ink} strokeWidth="1.2" opacity="0.78"/>
          <path d="M 26,50 Q 20,46 24,58" stroke={BPAL.ink} strokeWidth="0.6" fill="none" opacity="0.4"/>
        </g>
        <g className="cb-flutter-s" style={{transformOrigin:'88px 50px'}}>
          <ellipse cx="94" cy="52" rx="18" ry="11" fill={BPAL.white} stroke={BPAL.ink} strokeWidth="1.2" opacity="0.78"/>
          <path d="M 102,50 Q 108,46 104,58" stroke={BPAL.ink} strokeWidth="0.6" fill="none" opacity="0.4"/>
        </g>
        {/* elongated body */}
        <ellipse cx="64" cy="68" rx="22" ry="22" fill={BPAL.honey} stroke={BPAL.ink} strokeWidth="1.6"/>
        {/* stripes */}
        <path d="M 46,58 Q 64,62 82,58" stroke={BPAL.ink} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 46,76 Q 64,80 82,76" stroke={BPAL.ink} strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* fuzz on body */}
        <g fill={BPAL.honeyDeep} opacity="0.5">
          <circle cx="52" cy="65" r="0.8"/>
          <circle cx="76" cy="65" r="0.8"/>
          <circle cx="60" cy="84" r="0.8"/>
          <circle cx="68" cy="84" r="0.8"/>
        </g>
        {/* head */}
        <circle cx="64" cy="38" r="13" fill={BPAL.ink} stroke={BPAL.ink} strokeWidth="1"/>
        {/* eyes — change with expression */}
        {expression === 'calm' && (
          <g fill={BPAL.honey}>
            <ellipse cx="58" cy={eyeY} rx="1.6" ry="2.2"/>
            <ellipse cx="70" cy={eyeY} rx="1.6" ry="2.2"/>
          </g>
        )}
        {isFocused && (
          <g stroke={BPAL.honey} strokeWidth="1.6" strokeLinecap="round" fill="none">
            <line x1="55" y1={eyeY} x2="61" y2={eyeY}/>
            <line x1="67" y1={eyeY} x2="73" y2={eyeY}/>
          </g>
        )}
        {isPanicked && (
          <g fill={BPAL.redInk} stroke={BPAL.honey} strokeWidth="0.6">
            <circle cx="58" cy={eyeY} r="2.4"/>
            <circle cx="70" cy={eyeY} r="2.4"/>
            <circle cx="58" cy={eyeY} r="0.8" fill={BPAL.ink}/>
            <circle cx="70" cy={eyeY} r="0.8" fill={BPAL.ink}/>
          </g>
        )}
        {/* mouth */}
        {expression === 'calm' && (
          <path d="M 60,44 Q 64,46 68,44" stroke={BPAL.honey} strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        )}
        {isFocused && (
          <line x1="60" y1="44" x2="68" y2="44" stroke={BPAL.honey} strokeWidth="1" strokeLinecap="round"/>
        )}
        {isPanicked && (
          <ellipse cx="64" cy="45" rx="2.2" ry="1.4" fill={BPAL.honey}/>
        )}
        {/* big regal crown */}
        <path d="M 50,28 L 54,16 L 58,24 L 64,12 L 70,24 L 74,16 L 78,28 Z"
          fill={BPAL.honeyDark} stroke={BPAL.ink} strokeWidth="1.4"/>
        <circle cx="64" cy="14" r="1.4" fill={BPAL.jelly} stroke={BPAL.ink} strokeWidth="0.5"/>
        <circle cx="56" cy="18" r="0.8" fill={BPAL.honeyLight}/>
        <circle cx="72" cy="18" r="0.8" fill={BPAL.honeyLight}/>
        {/* stinger — long, royal */}
        <path d="M 64,90 L 60,98 L 68,98 Z" fill={BPAL.ink}/>
        {/* royal collar */}
        <path d="M 50,50 Q 64,54 78,50" stroke={BPAL.honeyDark} strokeWidth="2" fill="none"/>
        {isPanicked && (
          <g>
            <text x="44" y="20" fill={BPAL.redInk} fontSize="10" fontFamily="serif" fontWeight="700">!</text>
            <text x="84" y="22" fill={BPAL.redInk} fontSize="9" fontFamily="serif" fontWeight="700">!</text>
          </g>
        )}
      </g>
    </svg>
  );
}

// ---- Sprite frame wrapper (size in px) ----
function BeeSprite({ Bee, size = 48, label, accent = null, walking = false }) {
  const cls = walking ? 'cb-bob' : '';
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
      <div className={cls} style={{width:size, height:size}}>
        <svg viewBox="0 0 64 64" width={size} height={size} style={{display:'block', overflow:'visible'}}>
          <Bee/>
        </svg>
      </div>
      {label && (
        <div style={{fontSize:9, letterSpacing:'0.08em', color: BPAL.inkSoft, fontFamily:'JetBrains Mono, monospace'}}>{label}</div>
      )}
    </div>
  );
}

// Role metadata
const BEE_ROLES = [
  { id:'forager',   name:'Forager',   Bee: ForagerBee,   accent: BPAL.honeyLight, cue:'pollen sacs',    desc:'Gathers honey between waves.' },
  { id:'nurse',     name:'Nurse',     Bee: NurseBee,     accent: BPAL.paper,      cue:'cradled larva',  desc:'Speeds up larva maturation.' },
  { id:'guard',     name:'Guard',     Bee: GuardBee,     accent: BPAL.honeyDark,  cue:'thick stripes',  desc:'Heavy melee defender.' },
  { id:'striker',   name:'Striker',   Bee: StrikerBee,   accent: BPAL.rust,       cue:'swept wings',    desc:'Fast aerial damage.' },
  { id:'architect', name:'Architect', Bee: ArchitectBee, accent: BPAL.paperDark,  cue:'wax flake',      desc:'Reduces structure cost.' },
  { id:'drone',     name:'Drone',     Bee: DroneBee,     accent: BPAL.paper,      cue:'big eyes',       desc:'Tank, no stinger; comic relief.' },
  { id:'princess',  name:'Princess',  Bee: PrincessBee,  accent: BPAL.jelly,      cue:'tiny crown',     desc:'Late-game, founds second hive.' },
];

window.CAMB_BEES = {
  BeeBody, ForagerBee, NurseBee, GuardBee, StrikerBee, ArchitectBee, DroneBee, PrincessBee,
  QueenBee, BeeSprite, BEE_ROLES
};
