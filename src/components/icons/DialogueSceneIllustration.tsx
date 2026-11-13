import React from "react";

export interface DialogueSceneIllustrationProps {
  className?: string;
}

/**
 * Custom hand-drawn Japanese situational roleplay illustration (会話ロールプレイ)
 * featuring dual speech bubbles (「すみません」「はい！」), a directional map pin,
 * Kuuki atmosphere stars, and a red Hanko stamp in signature Japan Red (#D0104C).
 */
export function DialogueSceneIllustration({
  className = "w-44 h-56",
}: DialogueSceneIllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Japanese situational dialogue roleplay illustration with speech bubbles"
      role="img"
    >
      <g transform="rotate(-2 110 140)">
        {/* Drop shadow offset */}
        <rect
          x="18"
          y="18"
          width="188"
          height="248"
          rx="12"
          className="fill-stone-900/10 dark:fill-black/35"
        />

        {/* Washi Stage Card Base */}
        <rect
          x="14"
          y="14"
          width="188"
          height="248"
          rx="12"
          className="fill-[#FAF7F0] dark:fill-[#252126]"
          stroke="#57534E"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top Scene Header Bar */}
        <path
          d="M14 26C14 19.3726 19.3726 14 26 14H190C196.627 14 202 19.3726 202 26V48H14V26Z"
          className="fill-[#EBE5D8] dark:fill-[#2D2830]"
          stroke="#57534E"
          strokeWidth="2.2"
        />

        {/* Scene Header Dots & Location Label */}
        <circle cx="30" cy="31" r="4" fill="#D0104C" />
        <circle cx="43" cy="31" r="4" fill="#78716C" opacity="0.45" />
        <text
          x="114"
          y="35"
          textAnchor="middle"
          fill="#57534E"
          fontSize="10"
          fontWeight="800"
          letterSpacing="2"
          fontFamily="Noto Sans JP, sans-serif"
        >
          SHIBUYA · 渋谷駅前
        </text>

        {/* Inner dashed frame */}
        <rect
          x="24"
          y="58"
          width="168"
          height="192"
          rx="8"
          stroke="#78716C"
          strokeWidth="1.1"
          strokeDasharray="5 3"
          opacity="0.45"
        />

        {/* Left Speech Bubble (Player Inquiry - Japan Red accent) */}
        <g transform="translate(30, 68)">
          <rect
            x="0"
            y="0"
            width="124"
            height="48"
            rx="10"
            className="fill-[#FDEBF0] dark:fill-[#3B242C]"
            stroke="#D0104C"
            strokeWidth="2"
          />
          <path
            d="M18 48L12 58L28 48"
            className="fill-[#FDEBF0] dark:fill-[#3B242C]"
            stroke="#D0104C"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text
            x="12"
            y="21"
            fill="#D0104C"
            fontSize="11.5"
            fontWeight="800"
            fontFamily="Noto Serif JP, serif"
          >
            すみません！
          </text>
          <text
            x="12"
            y="37"
            fill="#57534E"
            fontSize="9.5"
            fontWeight="600"
            fontFamily="Noto Sans JP, sans-serif"
          >
            マックはどこですか？
          </text>
        </g>

        {/* Right Speech Bubble (NPC Response) */}
        <g transform="translate(56, 132)">
          <rect
            x="0"
            y="0"
            width="126"
            height="50"
            rx="10"
            className="fill-white dark:fill-[#1E171B]"
            stroke="#57534E"
            strokeWidth="2"
          />
          <path
            d="M108 50L114 60L98 50"
            className="fill-white dark:fill-[#1E171B]"
            stroke="#57534E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text
            x="12"
            y="21"
            fill="#5E9B6A"
            fontSize="11"
            fontWeight="800"
            fontFamily="Noto Serif JP, serif"
          >
            はい！あの交差点を
          </text>
          <text
            x="12"
            y="38"
            fill="#57534E"
            fontSize="10"
            fontWeight="700"
            fontFamily="Noto Sans JP, sans-serif"
          >
            右に曲がってください →
          </text>
        </g>

        {/* Bottom Kuuki (Social Atmosphere) Gauge Pill */}
        <g transform="translate(34, 202)">
          <rect
            x="0"
            y="0"
            width="110"
            height="34"
            rx="8"
            className="fill-[#EBE5D8]/70 dark:fill-[#2D2830]"
            stroke="#78716C"
            strokeWidth="1.4"
          />
          <text
            x="10"
            y="14"
            fill="#57534E"
            fontSize="8.5"
            fontWeight="800"
            letterSpacing="0.8"
          >
            空気 KUUKI · 100%
          </text>
          <rect x="10" y="20" width="90" height="6" rx="3" fill="#D6D3D1" />
          <rect x="10" y="20" width="82" height="6" rx="3" fill="#5E9B6A" />
        </g>

        {/* Hanko Stamp (対話) */}
        <g transform="translate(154, 198) rotate(-6)">
          <rect
            x="0"
            y="0"
            width="36"
            height="38"
            rx="4"
            stroke="#D0104C"
            strokeWidth="2.2"
            fill="#D0104C"
            fillOpacity="0.08"
          />
          <text
            x="18"
            y="17"
            textAnchor="middle"
            fill="#D0104C"
            fontSize="12"
            fontWeight="900"
            fontFamily="Noto Serif JP, serif"
          >
            対
          </text>
          <text
            x="18"
            y="32"
            textAnchor="middle"
            fill="#D0104C"
            fontSize="12"
            fontWeight="900"
            fontFamily="Noto Serif JP, serif"
          >
            話
          </text>
        </g>
      </g>
    </svg>
  );
}
