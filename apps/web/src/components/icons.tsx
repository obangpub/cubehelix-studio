/**
 * Shared SVG glyph icons. Each accepts an optional `size` in pixels (applied
 * to both width and height; the viewBox scales to fit) and draws with
 * `currentColor` so the glyph inherits text color from its button.
 */

interface IconProps {
  size?: number;
}

export function MoonIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function SunIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
        <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
      </g>
    </svg>
  );
}

export function CheckIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12l5 5L20 7"
      />
    </svg>
  );
}

export function CloseIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

export function LinkIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
      />
    </svg>
  );
}

export function ClipboardIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect
        x="8"
        y="3"
        width="8"
        height="3"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResetIcon({ size = 14 }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.42A6 6 0 1 1 8 2v1z"
      />
      <path
        fill="currentColor"
        d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"
      />
    </svg>
  );
}

export function CogIcon({ size = 14 }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311a1.464 1.464 0 0 1-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.858 2.929 2.929 0 0 1 0 5.858z"
      />
    </svg>
  );
}

export function AutoRotateIcon({ size = 14 }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 2.5a5.5 5.5 0 0 1 5.477 5h-1.51l2.017 2.5L16 7.5h-1.508a6.5 6.5 0 0 0-12.713-1.5h1.022A5.503 5.503 0 0 1 8 2.5zM8 13.5a5.5 5.5 0 0 1-5.477-5h1.51L2.016 6 0 8.5h1.508a6.5 6.5 0 0 0 12.713 1.5h-1.022A5.503 5.503 0 0 1 8 13.5z"
      />
    </svg>
  );
}

export function CubeIcon({ size = 14 }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        d="M8 1.5 14 4.5v7L8 14.5 2 11.5v-7zM8 1.5v6.5M8 8v6.5M8 8 2 4.5M8 8l6-3.5"
      />
    </svg>
  );
}

export function PowerIcon({ size = 14 }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2.5v5M4.4 4.5a4.5 4.5 0 1 0 7.2 0"
      />
    </svg>
  );
}
