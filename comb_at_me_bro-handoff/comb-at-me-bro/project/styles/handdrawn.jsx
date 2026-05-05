// Hand-drawn picture-book style — wobbly strokes, warm palette, soft fills
const HD = {
  bg: '#C8D89A',
  bgWarm: '#B5C879',
  paper: '#F5EBD6',
  honey: '#E8A24A',
  honeyDeep: '#B66B1E',
  honeyLight: '#F3CB7E',
  bee: '#3A2818',
  beeYellow: '#F2C24A',
  hornet: '#8A3A1C',
  hornetDark: '#3A1A0E',
  human: '#EFE5C9',
  humanShade: '#C7B888',
  ink: '#3A2818',
};

// Roughen filter — applied via filter="url(#roughen)" on shapes
function HDDefs({ id }) {
  return (
    <defs>
      <filter id={`roughen-${id}`} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={id} />
        <feDisplacementMap in="SourceGraphic" scale="2.2" />
      </filter>
      <filter id={`paper-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
        <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.08 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
  );
}

function HDTile({ id, children }) {
  const rough = `url(#roughen-${id})`;
  return (
    <svg viewBox="0 0 220 220" width="100%" height="100%" style={{ display: 'block' }}>
      <HDDefs id={id} />
      <rect width="220" height="220" fill={HD.bg} />
      {/* grass tufts — wobbly strokes */}
      <g stroke={HD.ink} strokeWidth="1.4" fill="none" strokeLinecap="round" filter={rough} opacity="0.6">
        <path d="M20,50 Q22,42 24,50" />
        <path d="M30,52 Q32,44 34,52" />
        <path d="M180,40 Q182,32 184,40" />
        <path d="M190,42 Q192,34 194,42" />
        <path d="M50,200 Q52,192 54,200" />
        <path d="M170,196 Q172,188 174,196" />
        <path d="M30,180 Q32,172 34,180" />
      </g>
      {/* paper texture overlay */}
      <rect width="220" height="220" fill={HD.paper} opacity="0.12" filter={`url(#paper-${id})`} />
      {children}
    </svg>
  );
}

function HDHive({ id = 'hive' }) {
  // Recommendation: WILD NEST — feels coziest, fits storybook tone
  const rough = `url(#roughen-${id})`;
  return (
    <HDTile id={id}>
      {/* shadow */}
      <ellipse cx="110" cy="160" rx="55" ry="10" fill={HD.ink} opacity="0.2" />
      {/* nest blob */}
      <g filter={rough}>
        <ellipse cx="110" cy="120" rx="55" ry="50" fill={HD.honey} />
        <ellipse cx="110" cy="120" rx="55" ry="50" fill="none" stroke={HD.ink} strokeWidth="2.5" />
        {/* drips of comb */}
        <path d="M70,150 Q72,170 78,168" fill={HD.honey} stroke={HD.ink} strokeWidth="2" />
        <path d="M140,152 Q145,172 152,166" fill={HD.honey} stroke={HD.ink} strokeWidth="2" />
        {/* hexagon hints */}
        <g fill={HD.honeyDeep} opacity="0.55">
          <polygon points="100,110 110,104 120,110 120,120 110,126 100,120" />
          <polygon points="80,120 90,114 100,120 100,130 90,136 80,130" />
          <polygon points="120,124 130,118 140,124 140,134 130,140 120,134" />
          <polygon points="100,138 110,132 120,138 120,148 110,154 100,148" />
        </g>
      </g>
      {/* a few bees */}
      <g filter={rough}>
        <ellipse cx="155" cy="92" rx="5" ry="3.5" fill={HD.beeYellow} stroke={HD.ink} strokeWidth="1" />
        <ellipse cx="68" cy="100" rx="5" ry="3.5" fill={HD.beeYellow} stroke={HD.ink} strokeWidth="1" />
      </g>
    </HDTile>
  );
}

function HDSwarm({ id = 'swarm' }) {
  const rough = `url(#roughen-${id})`;
  const dots = [
    [60, 140, 7], [78, 128, 8], [92, 142, 6], [104, 122, 9],
    [120, 134, 7], [138, 118, 8], [152, 130, 6], [166, 116, 7],
  ];
  return (
    <HDTile id={id}>
      {/* dotted motion path */}
      <g stroke={HD.ink} strokeWidth="1.5" strokeDasharray="2 4" fill="none" opacity="0.45" filter={rough}>
        <path d="M40,160 Q90,140 180,108" />
      </g>
      <g filter={rough}>
        {dots.map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={HD.beeYellow} stroke={HD.ink} strokeWidth="1.5" />
            <line x1={x - r * 0.5} y1={y} x2={x + r * 0.5} y2={y} stroke={HD.ink} strokeWidth="1.4" />
          </g>
        ))}
      </g>
    </HDTile>
  );
}

function HDWorker({ id = 'worker' }) {
  const rough = `url(#roughen-${id})`;
  return (
    <HDTile id={id}>
      <g filter={rough}>
        {/* body */}
        <ellipse cx="110" cy="120" rx="42" ry="30" fill={HD.beeYellow} stroke={HD.ink} strokeWidth="2.5" />
        {/* stripes */}
        <path d="M76,108 Q110,114 144,108" stroke={HD.ink} strokeWidth="6" fill="none" />
        <path d="M76,128 Q110,134 144,128" stroke={HD.ink} strokeWidth="6" fill="none" />
        {/* head */}
        <circle cx="110" cy="84" r="13" fill={HD.ink} />
        {/* fuzz dots on head */}
        <circle cx="105" cy="80" r="1.5" fill={HD.beeYellow} opacity="0.5" />
        <circle cx="113" cy="78" r="1.2" fill={HD.beeYellow} opacity="0.5" />
        {/* wings */}
        <ellipse cx="80" cy="102" rx="20" ry="13" fill="#ffffff" opacity="0.75" stroke={HD.ink} strokeWidth="1.5" />
        <ellipse cx="140" cy="102" rx="20" ry="13" fill="#ffffff" opacity="0.75" stroke={HD.ink} strokeWidth="1.5" />
        {/* stinger */}
        <path d="M110,150 L106,160 L114,160 Z" fill={HD.ink} />
      </g>
    </HDTile>
  );
}

function HDHornet({ id = 'hornet' }) {
  const rough = `url(#roughen-${id})`;
  return (
    <HDTile id={id}>
      <g filter={rough}>
        <ellipse cx="110" cy="120" rx="48" ry="26" fill={HD.hornet} stroke={HD.ink} strokeWidth="2.5" />
        {/* jagged stripes */}
        <path d="M72,106 L82,110 L92,106 L102,110 L112,106 L122,110 L132,106 L142,110 L150,106" stroke={HD.hornetDark} strokeWidth="5" fill="none" />
        <path d="M72,128 L82,132 L92,128 L102,132 L112,128 L122,132 L132,128 L142,132 L150,128" stroke={HD.hornetDark} strokeWidth="5" fill="none" />
        {/* angular head */}
        <path d="M110,70 L94,92 L126,92 Z" fill={HD.hornetDark} stroke={HD.ink} strokeWidth="2.5" />
        {/* tiny angry eyes */}
        <circle cx="103" cy="84" r="1.8" fill={HD.beeYellow} />
        <circle cx="117" cy="84" r="1.8" fill={HD.beeYellow} />
        {/* wings — pointier */}
        <path d="M68,108 Q48,86 60,118 Z" fill="#ffffff" opacity="0.7" stroke={HD.ink} strokeWidth="1.5" />
        <path d="M152,108 Q172,86 160,118 Z" fill="#ffffff" opacity="0.7" stroke={HD.ink} strokeWidth="1.5" />
        {/* stinger — long */}
        <path d="M110,148 L102,170 L118,170 Z" fill={HD.ink} />
      </g>
    </HDTile>
  );
}

function HDBeekeeper({ id = 'keeper' }) {
  const rough = `url(#roughen-${id})`;
  return (
    <HDTile id={id}>
      <ellipse cx="110" cy="184" rx="68" ry="12" fill={HD.ink} opacity="0.2" />
      <g filter={rough}>
        {/* suit body */}
        <ellipse cx="110" cy="130" rx="50" ry="56" fill={HD.human} stroke={HD.ink} strokeWidth="2.5" />
        {/* fabric folds */}
        <path d="M86,100 Q90,140 92,170" stroke={HD.humanShade} strokeWidth="2.5" fill="none" />
        <path d="M134,100 Q130,140 128,170" stroke={HD.humanShade} strokeWidth="2.5" fill="none" />
        {/* arm + smoker */}
        <ellipse cx="64" cy="124" rx="14" ry="8" fill={HD.human} stroke={HD.ink} strokeWidth="2.5" />
        <rect x="34" y="100" width="22" height="28" fill={HD.humanShade} stroke={HD.ink} strokeWidth="2.5" rx="2" />
        <path d="M34,100 Q45,90 56,100" fill={HD.humanShade} stroke={HD.ink} strokeWidth="2.5" />
        {/* smoke puffs */}
        <circle cx="46" cy="80" r="7" fill={HD.paper} stroke={HD.ink} strokeWidth="1.5" opacity="0.85" />
        <circle cx="36" cy="68" r="5" fill={HD.paper} stroke={HD.ink} strokeWidth="1.5" opacity="0.7" />
        <circle cx="52" cy="60" r="6" fill={HD.paper} stroke={HD.ink} strokeWidth="1.5" opacity="0.6" />
        {/* hat brim */}
        <circle cx="110" cy="80" r="36" fill={HD.human} stroke={HD.ink} strokeWidth="2.5" />
        {/* veil — dark mesh */}
        <circle cx="110" cy="80" r="26" fill={HD.ink} opacity="0.85" />
        {/* mesh lines */}
        <g stroke={HD.humanShade} strokeWidth="0.7" opacity="0.5">
          <line x1="90" y1="80" x2="130" y2="80" />
          <line x1="110" y1="60" x2="110" y2="100" />
          <line x1="96" y1="66" x2="124" y2="94" />
          <line x1="124" y1="66" x2="96" y2="94" />
        </g>
      </g>
    </HDTile>
  );
}

window.HD_STYLE = { HDHive, HDSwarm, HDWorker, HDHornet, HDBeekeeper, HD };
