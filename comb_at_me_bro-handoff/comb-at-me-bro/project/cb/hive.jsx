/* Comb At Me Bro — wild-nest hive component (player base). */
const { PAL: HP, ROUGH: HR } = window.CAMB;

function WildNestHive({ size=180, hp=1.0, idleBees=true }) {
  const damaged = hp < 0.5;
  const critical = hp < 0.25;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{display:'block', overflow:'visible'}}>
      <g filter={HR}>
        <ellipse cx="100" cy="170" rx="60" ry="9" fill={HP.ink} opacity="0.25"/>
        {/* nest blob */}
        <g className="cb-breathe" style={{transformOrigin:'100px 110px'}}>
          <path d="M 50,90 Q 40,60 80,55 Q 120,50 160,90 Q 170,130 140,160 Q 100,170 60,160 Q 30,130 50,90 Z"
            fill="url(#honey-glow)" stroke={HP.ink} strokeWidth="2.4"/>
          {/* hex hints */}
          <g fill={HP.honeyDark} opacity="0.5">
            <polygon points="80,90 90,84 100,90 100,100 90,106 80,100"/>
            <polygon points="100,90 110,84 120,90 120,100 110,106 100,100"/>
            <polygon points="90,106 100,100 110,106 110,116 100,122 90,116"/>
            <polygon points="70,106 80,100 90,106 90,116 80,122 70,116"/>
            <polygon points="110,106 120,100 130,106 130,116 120,122 110,116"/>
            <polygon points="80,122 90,116 100,122 100,132 90,138 80,132"/>
            <polygon points="100,122 110,116 120,122 120,132 110,138 100,132"/>
          </g>
          {/* drips */}
          <path d="M 60,150 Q 62,170 70,168" fill={HP.honey} stroke={HP.ink} strokeWidth="1.8"/>
          <path d="M 140,152 Q 145,172 152,166" fill={HP.honey} stroke={HP.ink} strokeWidth="1.8"/>
          {/* entrance */}
          <ellipse cx="100" cy="135" rx="10" ry="6" fill={HP.ink}/>
          <ellipse cx="100" cy="134" rx="8" ry="4" fill={HP.rustDark}/>
        </g>
        {/* damage cracks */}
        {damaged && (
          <g stroke={HP.ink} strokeWidth="1.6" fill="none" opacity="0.7">
            <path d="M 70,80 L 80,90 L 76,100 L 86,108"/>
            <path d="M 130,75 L 124,86 L 132,94"/>
            <path d="M 110,148 L 118,156"/>
          </g>
        )}
        {critical && (
          <g className="cb-pulse" style={{animation:'cb-pulse 0.9s ease-in-out infinite'}}>
            <path d="M 50,90 Q 40,60 80,55 Q 120,50 160,90 Q 170,130 140,160 Q 100,170 60,160 Q 30,130 50,90 Z"
              fill="none" stroke={HP.redInk} strokeWidth="2" opacity="0.6"/>
          </g>
        )}
      </g>
      {/* idle orbiting bees */}
      {idleBees && (
        <g style={{transformOrigin:'100px 110px'}}>
          {[0,1,2,3].map(i=>(
            <g key={i} style={{
              transformOrigin:'100px 110px',
              animation:`cb-spin ${8+i*1.5}s linear infinite`,
              animationDelay:`${i*0.4}s`
            }}>
              <g transform={`translate(${100 + 70*Math.cos(i*Math.PI/2)},${110 + 50*Math.sin(i*Math.PI/2)})`}>
                <ellipse cx="0" cy="0" rx="3" ry="2" fill={HP.honey} stroke={HP.ink} strokeWidth="0.8"/>
                <line x1="-1.5" y1="0" x2="1.5" y2="0" stroke={HP.ink} strokeWidth="0.8"/>
                <ellipse cx="-2" cy="-1" rx="2" ry="1.2" fill={HP.white} opacity="0.7"/>
                <ellipse cx="2" cy="-1" rx="2" ry="1.2" fill={HP.white} opacity="0.7"/>
              </g>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

window.CAMB_HIVE = { WildNestHive };
