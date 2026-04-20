window.SVGS = {
  cityscape: `
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sky" cx="50%" cy="120%" r="80%">
          <stop offset="0%" stop-color="#2c4565"/>
          <stop offset="100%" stop-color="#0f1e33"/>
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky)"/>
      <circle cx="320" cy="60" r="28" fill="#e8d5a0" opacity="0.9"/>
      <rect x="0" y="180" width="400" height="80" fill="#0a1422"/>
      <rect x="5" y="140" width="50" height="120" fill="#1a2d47"/>
      <rect x="58" y="90"  width="55" height="170" fill="#243a55"/>
      <rect x="117" y="50" width="42" height="210" fill="#1a2d47"/>
      <rect x="163" y="110" width="65" height="150" fill="#243a55"/>
      <rect x="232" y="70" width="52" height="190" fill="#1a2d47"/>
      <rect x="288" y="115" width="58" height="145" fill="#243a55"/>
      <rect x="350" y="140" width="50" height="120" fill="#1a2d47"/>
      <rect x="136" y="40" width="4" height="15" fill="#d90429"/>
      ${Array.from({length: 50}, (_, i) => {
        const cols = [10, 25, 40, 65, 80, 95, 125, 140, 175, 195, 215, 240, 255, 270, 295, 315, 335, 360, 380];
        const x = cols[i % cols.length];
        const y = 55 + (i * 11) % 190;
        return `<rect x="${x}" y="${y}" width="4" height="4" fill="#f4c430" opacity="${0.5 + (i%3)*0.2}"/>`;
      }).join('')}
    </svg>`,
  globe: `
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" fill="#0a1628"/>
      ${Array.from({length: 40}, (_, i) => {
        const x = (i * 37) % 400;
        const y = (i * 23) % 260;
        return `<circle cx="${x}" cy="${y}" r="${0.5 + (i%3)*0.4}" fill="white" opacity="${0.3 + (i%4)*0.15}"/>`;
      }).join('')}
      <circle cx="200" cy="130" r="95" fill="#1e3a5f"/>
      <circle cx="200" cy="130" r="95" fill="none" stroke="#4a7ab0" stroke-width="1.5" opacity="0.7"/>
      <ellipse cx="200" cy="130" rx="95" ry="28" fill="none" stroke="#4a7ab0" stroke-width="1" opacity="0.4"/>
      <ellipse cx="200" cy="130" rx="95" ry="55" fill="none" stroke="#4a7ab0" stroke-width="1" opacity="0.4"/>
      <ellipse cx="200" cy="130" rx="60" ry="95" fill="none" stroke="#4a7ab0" stroke-width="1" opacity="0.4"/>
      <line x1="105" y1="130" x2="295" y2="130" stroke="#4a7ab0" stroke-width="1" opacity="0.4"/>
      <line x1="200" y1="35" x2="200" y2="225" stroke="#4a7ab0" stroke-width="1" opacity="0.4"/>
      <path d="M 150 100 Q 172 92 188 108 Q 205 118 228 102 Q 240 120 225 140 Q 200 148 175 138 Q 160 125 150 100 Z" fill="#2c5a82"/>
      <path d="M 165 160 Q 185 155 208 168 Q 218 185 195 192 Q 172 188 165 160 Z" fill="#2c5a82"/>
      <path d="M 215 85 Q 235 82 245 95 Q 240 105 220 100 Z" fill="#2c5a82"/>
      <circle cx="175" cy="110" r="2.5" fill="#d90429"/>
      <circle cx="175" cy="110" r="5" fill="none" stroke="#d90429" stroke-width="1" opacity="0.5">
        <animate attributeName="r" from="3" to="12" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="230" cy="155" r="2.5" fill="#d90429"/>
      <circle cx="210" cy="95" r="2.5" fill="#d90429"/>
    </svg>`,
  chart: `
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" fill="#0f1e33"/>
      <g stroke="#1e3a5f" stroke-width="1">
        <line x1="30" y1="50" x2="390" y2="50"/>
        <line x1="30" y1="95" x2="390" y2="95"/>
        <line x1="30" y1="140" x2="390" y2="140"/>
        <line x1="30" y1="185" x2="390" y2="185"/>
        <line x1="30" y1="230" x2="390" y2="230"/>
      </g>
      <g stroke="#1e3a5f" stroke-width="1" opacity="0.5">
        ${[80, 130, 180, 230, 280, 330].map(x => `<line x1="${x}" y1="40" x2="${x}" y2="240"/>`).join('')}
      </g>
      <polygon points="30,200 70,180 110,190 150,150 190,165 230,115 270,130 310,85 350,105 390,60 390,240 30,240"
               fill="#d90429" opacity="0.2"/>
      <polyline points="30,200 70,180 110,190 150,150 190,165 230,115 270,130 310,85 350,105 390,60"
                fill="none" stroke="#d90429" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <g fill="#d90429">
        <circle cx="30"  cy="200" r="3.5"/>
        <circle cx="150" cy="150" r="3.5"/>
        <circle cx="230" cy="115" r="3.5"/>
        <circle cx="310" cy="85" r="3.5"/>
        <circle cx="390" cy="60" r="4.5"/>
      </g>
      <circle cx="390" cy="60" r="9" fill="none" stroke="#d90429" stroke-width="1.5">
        <animate attributeName="r" from="6" to="16" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.8" to="0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </svg>`,
  stadium: `
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" fill="#041a0f"/>
      <ellipse cx="200" cy="90" rx="200" ry="30" fill="#1a2d1f"/>
      ${Array.from({length: 70}, (_, i) => {
        const x = 10 + (i * 271) % 380;
        const y = 70 + (i * 7) % 35;
        return `<circle cx="${x}" cy="${y}" r="1.5" fill="#f4c430" opacity="${0.3 + (i%4)*0.2}"/>`;
      }).join('')}
      <ellipse cx="200" cy="170" rx="195" ry="85" fill="#0e3820"/>
      <ellipse cx="200" cy="170" rx="170" ry="72" fill="#1a5f35"/>
      <ellipse cx="200" cy="170" rx="145" ry="60" fill="#2d7a4a"/>
      <g fill="none" stroke="white" stroke-width="1.8" opacity="0.85">
        <ellipse cx="200" cy="170" rx="140" ry="55"/>
        <line x1="200" y1="115" x2="200" y2="225"/>
        <ellipse cx="200" cy="170" rx="20" ry="10"/>
        <ellipse cx="80" cy="170" rx="30" ry="14"/>
        <ellipse cx="320" cy="170" rx="30" ry="14"/>
      </g>
      <circle cx="200" cy="170" r="3" fill="white"/>
    </svg>`,
  planet: `
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" fill="#050818"/>
      ${Array.from({length: 80}, (_, i) => {
        const x = (i * 53) % 400;
        const y = (i * 31) % 260;
        const r = 0.3 + (i % 4) * 0.4;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${0.2 + (i%5)*0.15}"/>`;
      }).join('')}
      <circle cx="90" cy="70" r="22" fill="#f4c430" opacity="0.9"/>
      <circle cx="90" cy="70" r="35" fill="#f4c430" opacity="0.15"/>
      <circle cx="90" cy="70" r="50" fill="#f4c430" opacity="0.05"/>
      <g transform="translate(260 140)">
        <ellipse cx="0" cy="0" rx="130" ry="22" fill="none" stroke="#c49a6c" stroke-width="10" opacity="0.7" transform="rotate(-18)"/>
        <circle cx="0" cy="0" r="75" fill="#4a6d9a"/>
        <circle cx="0" cy="0" r="75" fill="#3a5c85" opacity="0.6" style="clip-path: inset(0 0 0 50%)"/>
        <ellipse cx="-20" cy="-25" rx="18" ry="10" fill="#5a7daa" opacity="0.6"/>
        <ellipse cx="15" cy="10" rx="25" ry="12" fill="#2c4565" opacity="0.8"/>
        <ellipse cx="-10" cy="25" rx="15" ry="7" fill="#5a7daa" opacity="0.6"/>
        <ellipse cx="0" cy="0" rx="130" ry="22" fill="none" stroke="#c49a6c" stroke-width="10" opacity="0.7" transform="rotate(-18)" style="clip-path: inset(0 0 50% 0)"/>
      </g>
    </svg>`,
  generic: `
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="genBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1a1a"/>
          <stop offset="100%" stop-color="#0a0a0a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#genBg)"/>
      <g stroke="#d90429" stroke-width="2" fill="none" opacity="0.6">
        <line x1="0" y1="220" x2="400" y2="220"/>
        <line x1="0" y1="40" x2="400" y2="40"/>
      </g>
      <text x="200" y="145" text-anchor="middle" fill="#d90429"
            font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="800"
            letter-spacing="6">INFO</text>
    </svg>`
};
