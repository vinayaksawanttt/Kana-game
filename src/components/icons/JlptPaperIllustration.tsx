import React from "react";

export interface JlptPaperIllustrationProps {
  className?: string;
}

/**
 * Custom hand-drawn brush/crayon-style SVG illustration of a graded Japanese test paper
 * (`100` score in Japan Red `#D0104C` at top-right, red `〇` maru grading circles over
 * dotted Japanese answer rows on a slightly tilted Washi exam sheet).
 */
export function JlptPaperIllustration({ className = "w-44 h-56" }: JlptPaperIllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Graded Japanese exam paper with 100 score and red maru circles"
      role="img"
    >
      <g transform="rotate(-2.5 110 140)">
        {/* Drop shadow offset sheet */}
        <rect
          x="18"
          y="18"
          width="188"
          height="248"
          rx="10"
          className="fill-stone-900/10 dark:fill-black/35"
        />

        {/* Washi Exam Sheet Base */}
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

        {/* Organic inner brush frame */}
        <rect
          x="22"
          y="22"
          width="172"
          height="232"
          rx="6"
          stroke="#78716C"
          strokeWidth="1.2"
          strokeDasharray="6 3"
          opacity="0.55"
        />

        {/* Top Header Bar: Exam Title Marks + Name Box + 100 Score Box */}
        {/* Exam Title Brush Dots */}
        <path
          d="M32 38H88"
          stroke="#44403C"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="2 7"
          className="dark:stroke-stone-300"
        />
        <path
          d="M32 48H72"
          stroke="#78716C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1.5 5"
          className="dark:stroke-stone-400"
        />

        {/* Name Box with 4 Ink Dots */}
        <rect
          x="30"
          y="58"
          width="88"
          height="22"
          rx="4"
          stroke="#57534E"
          strokeWidth="1.8"
          className="fill-stone-100/80 dark:fill-stone-800/70 dark:stroke-stone-400"
        />
        <line
          x1="48"
          y1="58"
          x2="48"
          y2="80"
          stroke="#57534E"
          strokeWidth="1.5"
          className="dark:stroke-stone-400"
        />
        <circle cx="39" cy="69" r="2" className="fill-stone-500 dark:fill-stone-400" />
        <circle cx="60" cy="69" r="2.3" className="fill-stone-700 dark:fill-stone-200" />
        <circle cx="72" cy="69" r="2.3" className="fill-stone-700 dark:fill-stone-200" />
        <circle cx="84" cy="69" r="2.3" className="fill-stone-700 dark:fill-stone-200" />
        <circle cx="96" cy="69" r="2.3" className="fill-stone-700 dark:fill-stone-200" />

        {/* Score Box on Top-Right */}
        <rect
          x="128"
          y="32"
          width="58"
          height="48"
          rx="6"
          stroke="#57534E"
          strokeWidth="1.8"
          className="fill-white/90 dark:fill-stone-900/75 dark:stroke-stone-400"
        />
        {/* Bold Hand-Drawn "100" in Japan Red (#D0104C) */}
        <text
          x="156"
          y="63"
          textAnchor="middle"
          fill="#D0104C"
          fontSize="24"
          fontWeight="900"
          fontFamily="ui-serif, Georgia, serif"
          letterSpacing="-1"
          transform="rotate(-4 156 56)"
        >
          100
        </text>
        {/* Double red underline under 100 */}
        <path
          d="M134 69C145 67 167 66 180 68"
          stroke="#D0104C"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M137 73C148 72 165 71 177 72.5"
          stroke="#D0104C"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Divider Line Below Header */}
        <line
          x1="28"
          y1="90"
          x2="188"
          y2="90"
          stroke="#78716C"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Row 1: Dotted Answer Line + 3 Red Maru (〇) Grading Circles */}
        <text
          x="30"
          y="116"
          fill="#78716C"
          fontSize="10"
          fontWeight="700"
          fontFamily="monospace"
        >
          問1
        </text>
        <path
          d="M52 113H182"
          stroke="#57534E"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="2 8"
          className="dark:stroke-stone-300"
        />
        {/* 3 Hand-drawn Red Maru Circles on Row 1 */}
        <path
          d="M72 103C80 102 84 108 82 116C80 123 70 125 64 120C58 115 61 104 70 103C73 102.5 76 104 77 106"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M118 103C126 102 130 108 128 116C126 123 116 125 110 120C104 115 107 104 116 103C119 102.5 122 104 123 106"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M164 103C172 102 176 108 174 116C172 123 162 125 156 120C150 115 153 104 162 103C165 102.5 168 104 169 106"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Row 2: Star Question Blank Line (＿＿ ＿＿ ★ ＿＿) + 2 Red Maru Circles */}
        <text
          x="30"
          y="156"
          fill="#78716C"
          fontSize="10"
          fontWeight="700"
          fontFamily="monospace"
        >
          問2
        </text>
        <path
          d="M52 153H182"
          stroke="#57534E"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="2 8"
          className="dark:stroke-stone-300"
        />
        {/* Star symbol above row 2 */}
        <text
          x="135"
          y="147"
          textAnchor="middle"
          fill="#D0104C"
          fontSize="12"
          fontWeight="900"
        >
          ★
        </text>
        {/* 2 Hand-drawn Red Maru Circles on Row 2 */}
        <path
          d="M90 142C99 141 104 148 101 157C98 164 87 166 80 160C74 154 78 143 88 142"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M148 142C157 141 162 148 159 157C156 164 145 166 138 160C132 154 136 143 146 142"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Row 3: Dotted Answer Line + 2 Red Maru Circles */}
        <text
          x="30"
          y="196"
          fill="#78716C"
          fontSize="10"
          fontWeight="700"
          fontFamily="monospace"
        >
          問3
        </text>
        <path
          d="M52 193H182"
          stroke="#57534E"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="2 8"
          className="dark:stroke-stone-300"
        />
        <path
          d="M78 182C87 181 92 188 89 197C86 204 75 206 68 200C62 194 66 183 76 182"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M154 182C163 181 168 188 165 197C162 204 151 206 144 200C138 194 142 183 152 182"
          stroke="#D0104C"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Row 4: Dotted Answer Line + 1 Large Red Hanamaru / Maru Circle at Bottom */}
        <text
          x="30"
          y="234"
          fill="#78716C"
          fontSize="10"
          fontWeight="700"
          fontFamily="monospace"
        >
          問4
        </text>
        <path
          d="M52 231H182"
          stroke="#57534E"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="2 8"
          className="dark:stroke-stone-300"
        />
        <path
          d="M118 214C134 212 145 221 141 234C137 245 117 248 104 240C92 232 98 216 115 214C122 213 128 216 131 220"
          stroke="#D0104C"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
