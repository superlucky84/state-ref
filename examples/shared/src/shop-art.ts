/** Local SVG artwork: no network requests or external image dependencies. */
const pictures: Record<string, { background: string; drawing: string }> = {
  avocado: {
    background: '#e7eee1',
    drawing:
      '<path d="M108 39C89 36 83 77 65 99C30 143 56 181 104 180C153 179 176 144 145 104C126 78 130 44 108 39Z" fill="#427553"/><path d="M108 52C94 51 92 80 75 108C48 144 67 167 104 167C143 167 162 143 137 111C119 87 123 54 108 52Z" fill="#d5df85"/><circle cx="106" cy="131" r="28" fill="#9c6a46"/>',
  },
  lemon: {
    background: '#faf1d9',
    drawing:
      '<path d="M54 118C40 79 80 55 115 68C147 76 156 97 160 108L169 114L161 123C163 157 123 178 91 160C71 151 63 136 54 128L44 124Z" fill="#edc94c"/><path d="M99 55Q124 18 153 41Q136 64 99 55" fill="#639368"/><path d="M71 112Q75 89 96 85" fill="none" stroke="#ffe990" stroke-width="8" stroke-linecap="round"/>',
  },
  strawberry: {
    background: '#f4e3e3',
    drawing:
      '<path d="M52 90Q61 54 111 64Q163 57 169 96Q160 151 109 184Q60 152 52 90Z" fill="#d96062"/><path d="M107 76L66 50L89 47L96 23L110 52L139 32L140 52L165 65Z" fill="#558669"/><g fill="#fff0be"><ellipse cx="79" cy="98" rx="3" ry="5"/><ellipse cx="111" cy="99" rx="3" ry="5"/><ellipse cx="143" cy="101" rx="3" ry="5"/><ellipse cx="91" cy="130" rx="3" ry="5"/><ellipse cx="127" cy="134" rx="3" ry="5"/><ellipse cx="109" cy="159" rx="3" ry="5"/></g>',
  },
  tomato: {
    background: '#f5e8de',
    drawing:
      '<circle cx="83" cy="120" r="45" fill="#dd7158"/><circle cx="137" cy="132" r="39" fill="#ce5f4c"/><path d="M84 84L54 67L78 68L88 45L96 70L122 66L102 83Z" fill="#527e59"/><path d="M138 101L113 87L135 87L146 69L148 89L165 91Z" fill="#527e59"/><path d="M55 112Q56 96 71 91" fill="none" stroke="#f5a48b" stroke-width="7" stroke-linecap="round"/>',
  },
  blueberry: {
    background: '#e7e6f1',
    drawing:
      '<g fill="#63719d"><circle cx="80" cy="120" r="28"/><circle cx="136" cy="131" r="30"/><circle cx="108" cy="82" r="27"/><circle cx="106" cy="155" r="25"/></g><g fill="#a1adca"><path d="M75 105L80 115L91 112L86 122L93 130L80 128L75 137L72 124L62 120L74 116Z"/><circle cx="135" cy="126" r="7"/><circle cx="106" cy="77" r="6"/></g><path d="M127 56Q140 21 172 36Q163 68 127 56" fill="#73967a"/>',
  },
  carrot: {
    background: '#f3eadb',
    drawing:
      '<path d="M67 75Q73 58 95 75L151 151Q161 176 139 163L61 96Q54 84 67 75" fill="#dd9560"/><path d="M68 75Q39 68 35 39Q65 45 68 75M76 69Q65 38 87 24Q99 53 76 69" fill="#68947c"/><path d="M87 102L102 91M108 123L119 113M128 144L137 137" stroke="#c97c46" stroke-width="4" stroke-linecap="round"/>',
  },
  milk: {
    background: '#e3ecec',
    drawing:
      '<path d="M74 64L91 35H137L151 64V176H74Z" fill="#f9f8f1"/><path d="M74 64H151L137 35H91Z" fill="#96b6b0"/><path d="M74 93H151V153H74Z" fill="#719b93"/><path d="M91 35V64" stroke="#5e8b81" stroke-width="4"/><text x="113" y="127" text-anchor="middle" font-family="serif" font-size="20" fill="white">MILK</text>',
  },
  oats: {
    background: '#ede8de',
    drawing:
      '<rect x="68" y="51" width="89" height="127" rx="8" fill="#c5a681"/><rect x="80" y="74" width="65" height="76" rx="2" fill="#f3eedb"/><path d="M112 136V89M112 113Q90 114 94 96Q113 98 112 113M112 124Q132 120 132 102Q113 103 112 124" fill="#b8a06a" stroke="#9f8f65" stroke-width="2"/>',
  },
  broccoli: {
    background: '#e6ece0',
    drawing:
      '<path d="M101 115L89 176H134L123 113Z" fill="#a8b47d"/><g fill="#5c8765"><circle cx="78" cy="99" r="31"/><circle cx="113" cy="76" r="37"/><circle cx="149" cy="105" r="32"/><circle cx="114" cy="117" r="32"/></g>',
  },
  orange: {
    background: '#faedda',
    drawing:
      '<circle cx="109" cy="125" r="54" fill="#e7a450"/><path d="M113 71Q123 35 161 48Q147 80 113 71" fill="#638d64"/><path d="M73 116Q77 95 96 87" fill="none" stroke="#f8ca83" stroke-width="7" stroke-linecap="round"/>',
  },
  cheese: {
    background: '#f2edda',
    drawing:
      '<path d="M53 145L157 78V160H53Z" fill="#e3bf69"/><path d="M53 145L80 67L157 78Z" fill="#f1d68b"/><circle cx="125" cy="128" r="11" fill="#c69d4e"/><circle cx="89" cy="147" r="7" fill="#c69d4e"/><circle cx="92" cy="101" r="8" fill="#e0bc67"/>',
  },
  cucumber: {
    background: '#e3eae0',
    drawing:
      '<rect x="82" y="35" width="43" height="149" rx="22" transform="rotate(29 105 110)" fill="#628167"/><path d="M124 56L67 160M140 65L83 170" stroke="#96b08b" stroke-width="4" stroke-linecap="round"/>',
  },
};
export function productArt(kind: string): string {
  const picture = pictures[kind] ?? pictures.avocado;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"><rect width="220" height="220" rx="24" fill="${picture.background}"/><ellipse cx="111" cy="185" rx="64" ry="7" fill="#24372a" opacity=".06"/>${picture.drawing}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
