import React from "react";

export interface StoriesBookIllustrationProps {
  className?: string;
}

/**
 * Custom hand-drawn washi Japanese book illustration (和綴じ - Watoji traditional 4-hole stitched book)
 * featuring a daisen title strip (題簽), red silk binding thread, audio speech ripples,
 * and a Momotaro peach/sakura motif in signature Japan Red (#D0104C).
 *
 * Designed to mirror the exact aspect ratio, scale, and organic brush-paper feel
 * of the JlptPaperIllustration.
 */
export function StoriesBookIllustration({
  className = "w-44 h-56",
}: StoriesBookIllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Japanese traditional storybook with audio waves and sakura petals"
      role="img"
    >
      <g transform="rotate(2.5 110 140)">
        {/* Drop shadow offset layer */}
        <rect
          x="18"
          y="18"
          width="188"
          height="248"
          rx="10"
          className="fill-stone-900/10 dark:fill-black/35"
        />

        {/* Washi Book Base Cover */}
        <rect
          x="14"
          y="14"
          width="188"
          height="248"
          rx="10"
          className="fill-[#FAF7F0] dark:fill-[#252126]"
          stroke="#57534E"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Traditional Watoji Spine Band (和綴じ背表紙) */}
        <path
          d="M14 24C14 18.4772 18.4772 14 24 14H46V262H24C18.4772 262 14 257.523 14 252V24Z"
          className="fill-[#EBE5D8] dark:fill-[#2D2830]"
          stroke="#57534E"
          strokeWidth="2.2"
        />

        {/* Organic inner border / frame */}
        <rect
          x="54"
          y="22"
          width="140"
          height="232"
          rx="6"
          stroke="#78716C"
          strokeWidth="1.2"
          strokeDasharray="6 3"
          opacity="0.55"
        />

        {/* Red Silk Binding Stitches (四つ目綴じ - Yotsume Toji red thread in #D0104C) */}
        {/* Top edge wrap */}
        <path d="M30 14V34" stroke="#D0104C" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M14 34H46" stroke="#D0104C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="30" cy="34" r="2.2" fill="#D0104C" />

        {/* Stitch 2 */}
        <path d="M14 98H46" stroke="#D0104C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="30" cy="98" r="2.2" fill="#D0104C" />

        {/* Stitch 3 */}
        <path d="M14 178H46" stroke="#D0104C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="30" cy="178" r="2.2" fill="#D0104C" />

        {/* Bottom edge wrap */}
        <path d="M14 242H46" stroke="#D0104C" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M30 242V262" stroke="#D0104C" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="30" cy="242" r="2.2" fill="#D0104C" />

        {/* Vertical Spine Spine Stitch Lines connecting the 4 holes */}
        <path
          d="M30 34V98M30 98V178M30 178V242"
          stroke="#D0104C"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.85"
        />

        {/* Traditional Title Slip (題簽 - Daisen label strip) */}
        <rect
          x="62"
          y="28"
          width="36"
          height="116"
          rx="4"
          className="fill-white/95 dark:fill-stone-900/90"
          stroke="#D0104C"
          strokeWidth="1.8"
        />
        <rect
          x="65"
          y="31"
          width="30"
          height="110"
          rx="2"
          stroke="#D0104C"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.6"
        />

        {/* Vertical Japanese Title inside Daisen: 日本語 多読 */}
        <text
          x="80"
          y="49"
          textAnchor="middle"
          fill="#1C1917"
          className="dark:fill-stone-100"
          fontSize="12"
          fontWeight="900"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
        >
          日
        </text>
        <text
          x="80"
          y="66"
          textAnchor="middle"
          fill="#1C1917"
          className="dark:fill-stone-100"
          fontSize="12"
          fontWeight="900"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
        >
          本
        </text>
        <text
          x="80"
          y="83"
          textAnchor="middle"
          fill="#1C1917"
          className="dark:fill-stone-100"
          fontSize="12"
          fontWeight="900"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
        >
          語
        </text>
        <text
          x="80"
          y="103"
          textAnchor="middle"
          fill="#D0104C"
          fontSize="13"
          fontWeight="900"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
        >
          多
        </text>
        <text
          x="80"
          y="120"
          textAnchor="middle"
          fill="#D0104C"
          fontSize="13"
          fontWeight="900"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
        >
          読
        </text>

        {/* Red Artist Seal Hanko Stamp (落款印 - "物語" / Story mark) */}
        <rect x="73" y="128" width="14" height="12" rx="2" fill="#D0104C" />
        <text
          x="80"
          y="138"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          話
        </text>

        {/* Audio Speech Waves (Representing spoken Japanese story audio) */}
        <g opacity="0.9">
          {/* Wave 1 */}
          <path
            d="M142 42C150 48 150 64 142 70"
            stroke="#D0104C"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Wave 2 */}
          <path
            d="M152 34C164 43 164 69 152 78"
            stroke="#D0104C"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* Wave 3 */}
          <path
            d="M162 26C178 38 178 74 162 86"
            stroke="#D0104C"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          {/* Small speaker/audio node */}
          <circle cx="132" cy="56" r="4.5" fill="#D0104C" />
          <path
            d="M125 53H129L134 49V63L129 59H125Z"
            fill="#D0104C"
          />
        </g>

        {/* Peach (桃) & Folklore Motif in Center-Right */}
        <g transform="translate(122, 100)">
          {/* Peach glow shadow */}
          <ellipse cx="26" cy="38" rx="28" ry="18" className="fill-stone-900/5 dark:fill-black/20" />

          {/* Golden/Peach Leaves */}
          <path
            d="M26 12C14 2 2 10 2 18C10 24 22 18 26 12Z"
            className="fill-emerald-600/75 dark:fill-emerald-500/80"
            stroke="#57534E"
            strokeWidth="1.4"
          />
          <path
            d="M26 12C38 2 50 10 50 18C42 24 30 18 26 12Z"
            className="fill-emerald-700/80 dark:fill-emerald-400/80"
            stroke="#57534E"
            strokeWidth="1.4"
          />

          {/* Peach Fruit (桃太郎 Peach silhouette) */}
          <path
            d="M26 12C10 16 0 32 6 48C12 60 22 66 26 70C30 66 40 60 46 48C52 32 42 16 26 12Z"
            fill="#FCA5A5"
            stroke="#D0104C"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Peach Cleft curve */}
          <path
            d="M26 12V48"
            stroke="#D0104C"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Japan Red blush accent */}
          <path
            d="M12 40C16 48 24 50 26 50"
            stroke="#D0104C"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>

        {/* Floating Sakura Petals (桜の花びら) */}
        <path
          d="M174 186C176 181 183 182 185 186C187 190 182 195 178 193C174 191 173 188 174 186Z"
          fill="#D0104C"
          opacity="0.75"
        />
        <path
          d="M112 196C114 192 119 193 121 196C122 199 118 203 115 201C112 200 111 198 112 196Z"
          fill="#D0104C"
          opacity="0.6"
          transform="rotate(25 115 198)"
        />

        {/* Text preview brush marks representing story paragraphs */}
        <path
          d="M64 168H98"
          stroke="#57534E"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray="2 6"
          className="dark:stroke-stone-300"
        />
        <path
          d="M64 182H102"
          stroke="#78716C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="1.5 5"
          className="dark:stroke-stone-400"
        />
        <path
          d="M64 196H90"
          stroke="#78716C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="1.5 5"
          className="dark:stroke-stone-400"
        />

        {/* Bottom Level Pill: "N5–N4 · 62 篇" */}
        <rect
          x="62"
          y="218"
          width="124"
          height="24"
          rx="12"
          className="fill-stone-100/90 dark:fill-stone-800/80"
          stroke="#57534E"
          strokeWidth="1.6"
        />
        <text
          x="124"
          y="234"
          textAnchor="middle"
          fill="#44403C"
          className="dark:fill-stone-200"
          fontSize="10"
          fontWeight="800"
          fontFamily="monospace"
          letterSpacing="0.05em"
        >
          JLPT N5–N4 · STORIES
        </text>

        {/* Dangling Silk Bookmark Ribbon (栞 - Shiori) */}
        <path
          d="M160 250V274L167 267L174 274V250"
          fill="#D0104C"
          stroke="#A80C3D"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}
