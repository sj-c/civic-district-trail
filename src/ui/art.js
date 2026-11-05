// Generated illustrations: no image downloads needed.

// A stylised civic facade (pediment, columns, steps) used as the photo
// placeholder on stop cards and as the AR fallback scene.
export function facadeSvg(hue = 30, { scene = false } = {}) {
  const sky1 = `hsl(${(hue + 190) % 360} 60% ${scene ? 72 : 86}%)`;
  const sky2 = `hsl(${(hue + 200) % 360} 55% ${scene ? 88 : 95}%)`;
  const wall = `hsl(${hue} 35% 92%)`;
  const shade = `hsl(${hue} 25% 78%)`;
  const accent = `hsl(${hue} 55% 45%)`;
  const cols = Array.from({ length: 6 }, (_, i) => {
    const x = 118 + i * 33;
    return `<rect x="${x}" y="118" width="14" height="74" rx="2" fill="${wall}" stroke="${shade}" stroke-width="1.5"/><rect x="${x - 3}" y="112" width="20" height="7" rx="1" fill="${shade}"/>`;
  }).join('');
  const trees = scene
    ? `<g fill="hsl(130 35% 38%)"><circle cx="40" cy="170" r="30"/><circle cx="70" cy="180" r="24"/><circle cx="360" cy="168" r="32"/><circle cx="330" cy="182" r="22"/></g>
       <rect x="0" y="205" width="400" height="95" fill="hsl(${hue} 10% 70%)"/><rect x="0" y="205" width="400" height="6" fill="hsl(${hue} 10% 62%)"/>`
    : `<rect x="0" y="205" width="400" height="95" fill="hsl(${hue} 18% 84%)"/>`;
  return `<svg viewBox="0 0 400 ${scene ? 300 : 230}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs><linearGradient id="sky${hue}${scene ? 's' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#sky${hue}${scene ? 's' : ''})"/>
    <circle cx="320" cy="52" r="22" fill="hsl(45 100% 85%)" opacity=".9"/>
    <rect x="100" y="86" width="200" height="14" fill="${shade}"/>
    <polygon points="96,88 200,40 304,88" fill="${wall}" stroke="${shade}" stroke-width="2"/>
    <circle cx="200" cy="70" r="8" fill="none" stroke="${accent}" stroke-width="2.5"/>
    <rect x="104" y="100" width="192" height="12" fill="${wall}"/>
    <rect x="104" y="112" width="192" height="80" fill="hsl(${hue} 20% 70%)"/>
    ${cols}
    <rect x="96" y="192" width="208" height="6" fill="${shade}"/><rect x="88" y="198" width="224" height="7" fill="${wall}"/>
    ${trees}
  </svg>`;
}
