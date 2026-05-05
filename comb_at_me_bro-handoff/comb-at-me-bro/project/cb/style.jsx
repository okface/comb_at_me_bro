/* Comb At Me Bro — shared style kit
   Locked palette + ink filters + paper texture + animation primitives.
*/

const PAL = {
  paper: '#F5EBD6',
  paperDark: '#E8DCBF',
  paperShade: '#D4C5A0',
  sage: '#C8D89A',
  sageDeep: '#A8BE7A',
  sageDark: '#7E9658',
  honey: '#F2C24A',
  honeyDeep: '#E8A24A',
  honeyDark: '#B66B1E',
  honeyLight: '#F7DDA0',
  rust: '#8A3A1C',
  rustDark: '#5E2410',
  ink: '#3A2818',
  inkSoft: '#6B5A45',
  white: '#FBF6E8',
  redInk: '#A8351E',
  jelly: '#E8B8E0',
  jellyDeep: '#9E5BA0',
  smokeGrey: '#A8A097',
  spiderPurple: '#5B3D5E',
  webWhite: '#EFE8D8',
};

// Single source of truth for SVG ink filters and paper texture.
// Mount once at top of document.
function InkDefs() {
  return (
    <svg width="0" height="0" style={{position:'absolute'}} aria-hidden="true">
      <defs>
        {/* Wobble — for hand-drawn lines */}
        <filter id="rough-1" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="1"/>
          <feDisplacementMap in="SourceGraphic" scale="2"/>
        </filter>
        <filter id="rough-2" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3"/>
          <feDisplacementMap in="SourceGraphic" scale="2.4"/>
        </filter>
        <filter id="rough-3" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5"/>
          <feDisplacementMap in="SourceGraphic" scale="3"/>
        </filter>
        <filter id="rough-strong" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="7"/>
          <feDisplacementMap in="SourceGraphic" scale="4.5"/>
        </filter>
        <filter id="paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/>
          <feColorMatrix values="0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0 0.09  0 0 0 0.10 0"/>
        </filter>
        <filter id="ink-blur">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
        <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.7"/>
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.4 -0.2"/>
        </filter>

        {/* Paper background pattern */}
        <pattern id="paper-bg" width="220" height="220" patternUnits="userSpaceOnUse">
          <rect width="220" height="220" fill={PAL.paper}/>
          <rect width="220" height="220" fill={PAL.paper} filter="url(#paper-noise)" opacity="0.6"/>
        </pattern>

        {/* Grass tile */}
        <pattern id="grass-tile" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill={PAL.sage}/>
          <g stroke={PAL.sageDark} strokeWidth="1.4" strokeLinecap="round" filter="url(#rough-1)" opacity="0.55">
            <path d="M12,30 q2,-8 4,0"/>
            <path d="M22,32 q2,-8 4,0"/>
            <path d="M88,18 q2,-8 4,0"/>
            <path d="M98,20 q2,-8 4,0"/>
            <path d="M30,90 q2,-8 4,0"/>
            <path d="M88,98 q2,-8 4,0"/>
            <path d="M50,60 q2,-8 4,0"/>
            <path d="M68,50 q2,-8 4,0"/>
          </g>
          <g fill={PAL.sageDeep} opacity="0.4">
            <circle cx="20" cy="100" r="2"/>
            <circle cx="60" cy="40" r="2"/>
            <circle cx="100" cy="80" r="2"/>
          </g>
        </pattern>

        {/* Honey gradient */}
        <radialGradient id="honey-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={PAL.honeyLight}/>
          <stop offset="65%" stopColor={PAL.honey}/>
          <stop offset="100%" stopColor={PAL.honeyDark}/>
        </radialGradient>

        {/* Drop shadow under units */}
        <radialGradient id="unit-shadow">
          <stop offset="0%" stopColor={PAL.ink} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={PAL.ink} stopOpacity="0"/>
        </radialGradient>

        {/* Hex pattern for honey/comb */}
        <pattern id="hex-comb" width="20" height="17.32" patternUnits="userSpaceOnUse">
          <polygon points="10,1 19,6 19,12 10,17 1,12 1,6"
            fill="none" stroke={PAL.honeyDark} strokeWidth="0.8" opacity="0.5"/>
        </pattern>
      </defs>
    </svg>
  );
}

// Reusable wobbly stroke
const ROUGH_LIGHT = 'url(#rough-1)';
const ROUGH = 'url(#rough-2)';
const ROUGH_STRONG = 'url(#rough-strong)';

window.CAMB = { PAL, InkDefs, ROUGH_LIGHT, ROUGH, ROUGH_STRONG };
