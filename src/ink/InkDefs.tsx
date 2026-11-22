/**
 * Shared SVG paint servers and filters for every ink surface on the site. Rendered once in
 * the layout; `url(#…)` resolves document-wide, so each motif references these instead of
 * carrying its own copy.
 */

export function InkDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        {/* Gilt across a 1000-unit motif: the leaf-to-bronze ramp in light and dark bands,
            reflected so the bands carry on across the whole field. */}
        <linearGradient id="ink-sheen" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1000" spreadMethod="reflect">
          <stop offset="0" stopColor="#f2dc94" />
          <stop offset=".3" stopColor="#b08a3a" />
          <stop offset=".5" stopColor="#f8ebbd" />
          <stop offset=".72" stopColor="#7a5a22" />
          <stop offset="1" stopColor="#d9bd72" />
        </linearGradient>

        {/* Spilled pool, sized to the spill’s 1000×1000 box. */}
        <linearGradient id="ink-spill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1000">
          <stop offset="0" stopColor="#8f6c26" />
          <stop offset=".55" stopColor="#6e5019" />
          <stop offset="1" stopColor="#584012" />
        </linearGradient>

        {/* Crisp ink: sharp flat splatter. A whisper of edge displacement so outlines never
            read as vector, faint paper grain, and a thin darker rim where pigment pools. */}
        <filter id="ink-crisp" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves={2} seed={5} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.2} xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={1} seed={2} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.35 1.12" result="gA" />
          <feComposite in="shape" in2="gA" operator="in" result="grain" />
          <feMorphology in="shape" operator="erode" radius="1" result="inner" />
          <feComposite in="shape" in2="inner" operator="out" result="rim" />
          <feFlood floodColor="#2a1b04" floodOpacity=".55" />
          <feComposite in2="rim" operator="in" result="rimT" />
          <feMerge>
            <feMergeNode in="grain" />
            <feMergeNode in="rimT" />
          </feMerge>
        </filter>

        {/* Watercolor wash: pigment granulates into the paper, pools darker at the drying
            edge (the classic watercolor rim), and sits unevenly across the body. */}
        <filter id="ink-wash" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves={3} seed={11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={9} xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves={2} seed={4} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.6 1.05" result="gA" />
          <feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves={2} seed={8} result="m" />
          <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 1.25" result="mA" />
          <feComposite in="shape" in2="gA" operator="in" result="grain" />
          <feComposite in="grain" in2="mA" operator="in" result="body" />
          <feMorphology in="shape" operator="erode" radius="4" result="inner" />
          <feComposite in="shape" in2="inner" operator="out" result="edge" />
          <feGaussianBlur in="edge" stdDeviation="2" result="edgeSoft" />
          <feFlood floodColor="#3a2707" floodOpacity=".6" />
          <feComposite in2="edgeSoft" operator="in" result="edgeT" />
          <feComposite in="edgeT" in2="shape" operator="in" result="edgeIn" />
          <feMerge>
            <feMergeNode in="body" />
            <feMergeNode in="edgeIn" />
          </feMerge>
        </filter>

        {/* Bloom: the wet halo that creeps and fades after the ink lands. */}
        <filter id="ink-bloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
    </svg>
  )
}
