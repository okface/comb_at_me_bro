// Flat vector style — bold shapes, limited palette
const FLAT = {
  bg: '#7FB069',      // grass green
  bgDark: '#5C8E4A',
  honey: '#F4A93B',
  honeyDark: '#D17F1F',
  bee: '#1A1A1A',
  beeYellow: '#FFD23F',
  hornet: '#A8401C',
  hornetDark: '#5E2410',
  human: '#E8DCC4',
  humanDark: '#A89878',
  ink: '#1A1A1A',
};

function FlatTile({ children, w = 220, h = 220 }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
      <rect width={w} height={h} fill={FLAT.bg} />
      {/* grass texture: a few darker triangles */}
      <g fill={FLAT.bgDark} opacity="0.55">
        <polygon points="20,40 26,48 14,48" />
        <polygon points="180,30 186,40 174,40" />
        <polygon points="50,180 56,190 44,190" />
        <polygon points="160,170 166,180 154,180" />
        <polygon points="100,200 106,210 94,210" />
        <polygon points="30,110 36,120 24,120" />
        <polygon points="190,120 196,130 184,130" />
      </g>
      {children}
    </svg>
  );
}

function FlatHive() {
  // Recommendation: man-made box hive — reads cleanly as a tower at icon size
  return (
    <FlatTile>
      {/* shadow */}
      <ellipse cx="110" cy="155" rx="55" ry="10" fill={FLAT.ink} opacity="0.18" />
      {/* box body */}
      <rect x="62" y="80" width="96" height="70" fill={FLAT.honey} />
      <rect x="62" y="80" width="96" height="14" fill={FLAT.honeyDark} />
      <rect x="62" y="120" width="96" height="6" fill={FLAT.honeyDark} />
      {/* roof */}
      <polygon points="55,80 165,80 150,62 70,62" fill={FLAT.humanDark} />
      {/* entrance */}
      <rect x="100" y="138" width="20" height="8" fill={FLAT.ink} />
      {/* a worker by entrance */}
      <ellipse cx="140" cy="142" rx="4" ry="2.5" fill={FLAT.beeYellow} />
      <rect x="138" y="141" width="1.5" height="3" fill={FLAT.ink} />
    </FlatTile>
  );
}

function FlatSwarm() {
  // cluster of 8 dots with motion arrow implied via spacing
  const dots = [
    [60, 140, 7], [78, 128, 8], [92, 142, 6], [104, 122, 9],
    [120, 134, 7], [138, 118, 8], [152, 130, 6], [166, 116, 7],
  ];
  return (
    <FlatTile>
      {/* motion streaks */}
      <g stroke={FLAT.ink} strokeWidth="2" opacity="0.25" strokeLinecap="round">
        <line x1="40" y1="150" x2="55" y2="148" />
        <line x1="50" y1="170" x2="68" y2="166" />
        <line x1="44" y1="130" x2="60" y2="130" />
      </g>
      {dots.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={FLAT.beeYellow} />
          <rect x={x - r * 0.6} y={y - 1} width={r * 1.2} height={2} fill={FLAT.ink} />
        </g>
      ))}
    </FlatTile>
  );
}

function FlatWorker() {
  // single bee, top-down, big & centered for icon use
  return (
    <FlatTile>
      <ellipse cx="110" cy="118" rx="44" ry="32" fill={FLAT.beeYellow} />
      {/* stripes */}
      <rect x="78" y="100" width="64" height="8" fill={FLAT.ink} />
      <rect x="78" y="120" width="64" height="8" fill={FLAT.ink} />
      {/* head */}
      <circle cx="110" cy="80" r="14" fill={FLAT.ink} />
      {/* wings */}
      <ellipse cx="80" cy="100" rx="22" ry="14" fill="#ffffff" opacity="0.7" />
      <ellipse cx="140" cy="100" rx="22" ry="14" fill="#ffffff" opacity="0.7" />
      {/* stinger */}
      <polygon points="110,148 106,158 114,158" fill={FLAT.ink} />
    </FlatTile>
  );
}

function FlatHornet() {
  // sharper, longer, darker — clearly NOT a bee
  return (
    <FlatTile>
      <ellipse cx="110" cy="118" rx="50" ry="28" fill={FLAT.hornet} />
      {/* angular stripes */}
      <polygon points="78,100 142,100 138,108 82,108" fill={FLAT.hornetDark} />
      <polygon points="80,120 140,120 136,128 84,128" fill={FLAT.hornetDark} />
      {/* head — pointed */}
      <polygon points="110,68 96,90 124,90" fill={FLAT.hornetDark} />
      {/* mandibles */}
      <polygon points="104,86 100,76 108,82" fill={FLAT.ink} />
      <polygon points="116,86 120,76 112,82" fill={FLAT.ink} />
      {/* wings — sharper */}
      <polygon points="70,110 50,90 64,118" fill="#ffffff" opacity="0.65" />
      <polygon points="150,110 170,90 156,118" fill="#ffffff" opacity="0.65" />
      {/* stinger */}
      <polygon points="110,150 102,168 118,168" fill={FLAT.ink} />
    </FlatTile>
  );
}

function FlatBeekeeper() {
  // boss — fills more of the tile
  return (
    <FlatTile>
      <ellipse cx="110" cy="180" rx="70" ry="14" fill={FLAT.ink} opacity="0.18" />
      {/* body suit */}
      <ellipse cx="110" cy="130" rx="52" ry="58" fill={FLAT.human} />
      {/* arm with smoker */}
      <rect x="52" y="118" width="24" height="14" fill={FLAT.human} rx="6" />
      {/* smoker body */}
      <rect x="36" y="100" width="20" height="26" fill={FLAT.humanDark} />
      <polygon points="36,100 56,100 50,92 42,92" fill={FLAT.humanDark} />
      {/* smoke */}
      <circle cx="46" cy="84" r="6" fill="#ffffff" opacity="0.8" />
      <circle cx="38" cy="74" r="4" fill="#ffffff" opacity="0.6" />
      <circle cx="52" cy="68" r="5" fill="#ffffff" opacity="0.5" />
      {/* hat (top-down: brim circle + veil) */}
      <circle cx="110" cy="78" r="36" fill={FLAT.human} />
      <circle cx="110" cy="78" r="26" fill={FLAT.ink} opacity="0.85" />
      {/* veil mesh hint */}
      <line x1="92" y1="78" x2="128" y2="78" stroke={FLAT.human} strokeWidth="0.5" opacity="0.4" />
      <line x1="110" y1="60" x2="110" y2="96" stroke={FLAT.human} strokeWidth="0.5" opacity="0.4" />
    </FlatTile>
  );
}

window.FLAT_STYLE = { FlatHive, FlatSwarm, FlatWorker, FlatHornet, FlatBeekeeper, FLAT };
