/* Comb At Me Bro — animation primitives
   Lightweight CSS keyframe utilities so SVG sprites can animate without JS.
   Inject once via <AnimStyles/> at top of any document.
*/

function AnimStyles() {
  return (
    <style>{`
      @keyframes cb-flutter {
        0%,100% { transform: scaleY(1) scaleX(1); }
        50%     { transform: scaleY(0.55) scaleX(1.05); }
      }
      @keyframes cb-flutter-2 {
        0%,100% { transform: scaleY(1); opacity:0.8; }
        50%     { transform: scaleY(0.5); opacity:1; }
      }
      @keyframes cb-orbit {
        from { transform: rotate(0deg) translateX(var(--r,42px)) rotate(0deg); }
        to   { transform: rotate(360deg) translateX(var(--r,42px)) rotate(-360deg); }
      }
      @keyframes cb-orbit-rev {
        from { transform: rotate(0deg) translateX(var(--r,42px)) rotate(0deg); }
        to   { transform: rotate(-360deg) translateX(var(--r,42px)) rotate(360deg); }
      }
      @keyframes cb-breathe {
        0%,100% { transform: scale(1); }
        50%     { transform: scale(1.03); }
      }
      @keyframes cb-bob {
        0%,100% { transform: translateY(0); }
        50%     { transform: translateY(-3px); }
      }
      @keyframes cb-bob-strong {
        0%,100% { transform: translateY(0); }
        50%     { transform: translateY(-6px); }
      }
      @keyframes cb-wobble {
        0%,100% { transform: rotate(-1deg); }
        50%     { transform: rotate(1deg); }
      }
      @keyframes cb-pulse {
        0%,100% { opacity: 0.45; transform: scale(1); }
        50%     { opacity: 1;    transform: scale(1.15); }
      }
      @keyframes cb-pulse-soft {
        0%,100% { opacity: 0.55; }
        50%     { opacity: 1; }
      }
      @keyframes cb-spin {
        from { transform: rotate(0); } to { transform: rotate(360deg); }
      }
      @keyframes cb-twinkle {
        0%,100% { opacity: 0; transform: scale(0.6); }
        50%     { opacity: 1; transform: scale(1); }
      }
      @keyframes cb-rise {
        0%   { transform: translateY(0);    opacity: 0; }
        15%  { opacity: 1; }
        100% { transform: translateY(-32px); opacity: 0; }
      }
      @keyframes cb-shake {
        0%,100% { transform: translate(0,0); }
        25% { transform: translate(-1px, 1px); }
        50% { transform: translate(1px, -1px); }
        75% { transform: translate(-1px, -1px); }
      }
      @keyframes cb-walk-2 {
        0%,49%   { transform: translateY(0); }
        50%,100% { transform: translateY(-1.5px); }
      }
      @keyframes cb-curl {
        0%   { transform: scale(1) rotate(0); opacity: 1; }
        60%  { transform: scale(0.7) rotate(15deg); opacity: 0.9; }
        100% { transform: scale(0.4) rotate(40deg); opacity: 0; }
      }
      @keyframes cb-puff {
        0%   { transform: scale(0.4); opacity: 0; }
        20%  { opacity: 0.9; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      @keyframes cb-sweep {
        0%   { transform: translateX(-110%); }
        100% { transform: translateX(110%); }
      }
      @keyframes cb-flip-in {
        0%   { transform: rotateY(110deg) translateY(20px); opacity: 0; }
        100% { transform: rotateY(0)      translateY(0);    opacity: 1; }
      }
      @keyframes cb-glow {
        0%,100% { filter: drop-shadow(0 0 0 transparent); }
        50%     { filter: drop-shadow(0 0 6px rgba(242,194,74,0.85)); }
      }
      @keyframes cb-warn-wash {
        0%,100% { opacity: 0; }
        50%     { opacity: 0.55; }
      }
      @keyframes cb-petal {
        0%   { transform: translateY(0) rotate(0); opacity: 0; }
        15%  { opacity: 1; }
        100% { transform: translateY(-160px) rotate(180deg); opacity: 0; }
      }
      @keyframes cb-rain {
        0%   { transform: translateY(-20px); opacity: 0; }
        20%  { opacity: 0.7; }
        100% { transform: translateY(120px); opacity: 0; }
      }
      @keyframes cb-scuttle {
        0%,100% { transform: translateX(0) rotate(-2deg); }
        50%     { transform: translateX(2px) rotate(2deg); }
      }
      @keyframes cb-flap {
        0%,100% { transform: scaleY(1); }
        50%     { transform: scaleY(-1); }
      }
      @keyframes cb-trail {
        0%   { opacity: 0.7; transform: scaleX(1); }
        100% { opacity: 0;   transform: scaleX(2); }
      }

      .cb-flutter   { animation: cb-flutter 0.18s linear infinite; transform-origin: center; }
      .cb-flutter-s { animation: cb-flutter 0.22s linear infinite; transform-origin: center; }
      .cb-bob       { animation: cb-bob 1.6s ease-in-out infinite; }
      .cb-bob-s     { animation: cb-bob-strong 2.4s ease-in-out infinite; }
      .cb-breathe   { animation: cb-breathe 3s ease-in-out infinite; transform-origin: center; }
      .cb-wobble    { animation: cb-wobble 2.4s ease-in-out infinite; transform-origin: center; }
      .cb-pulse     { animation: cb-pulse 1.4s ease-in-out infinite; }
      .cb-spin      { animation: cb-spin 12s linear infinite; transform-origin: center; }
      .cb-spin-fast { animation: cb-spin 4s linear infinite; transform-origin: center; }
    `}</style>
  );
}

window.CAMB_ANIM = { AnimStyles };
