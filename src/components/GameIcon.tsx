import type { SVGProps } from 'react'

export type GameIconName =
  | 'alert'
  | 'airport'
  | 'banknote'
  | 'card-spark'
  | 'cards'
  | 'check'
  | 'chevron-right'
  | 'clock'
  | 'close'
  | 'coin'
  | 'construction'
  | 'crown'
  | 'dice'
  | 'flag'
  | 'festival'
  | 'help'
  | 'history'
  | 'info'
  | 'landmark'
  | 'lock'
  | 'map'
  | 'money-stack'
  | 'mute'
  | 'pause'
  | 'plane'
  | 'play'
  | 'plus'
  | 'restart'
  | 'settings'
  | 'shield'
  | 'sparkles'
  | 'swap'
  | 'target'
  | 'ticket'
  | 'trophy'
  | 'users'
  | 'volume'

interface GameIconProps extends SVGProps<SVGSVGElement> {
  name: GameIconName
  size?: number
}

export function GameIcon({ name, size = 20, ...props }: GameIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <IconPaths name={name} />
    </svg>
  )
}

function IconPaths({ name }: { name: GameIconName }) {
  const common = {
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  }

  switch (name) {
    case 'alert':
      return (
        <>
          <path {...common} d="M10.4 4.7 3.7 16.3A2 2 0 0 0 5.4 19h13.2a2 2 0 0 0 1.7-2.7L13.6 4.7a1.9 1.9 0 0 0-3.2 0Z" />
          <path {...common} d="M12 9v4.2" />
          <circle cx="12" cy="16.2" fill="currentColor" r="1" />
        </>
      )
    case 'banknote':
      return (
        <>
          <rect {...common} height="13" rx="2.5" width="18" x="3" y="5.5" />
          <path {...common} d="M6.5 8.5h-1v1M17.5 8.5h1v1M6.5 15.5h-1v-1M17.5 15.5h1v-1" />
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M12 10.2v3.6M10.8 11h1.8a.8.8 0 0 1 0 1.6h-1.2a.8.8 0 0 0 0 1.6h1.8" />
        </>
      )
    case 'airport':
      return (
        <>
          <path {...common} d="M4 18.5h16M7 18.5l5-13 5 13M9.2 14.2h5.6" />
          <path {...common} d="m12 5.5 2.5 2.2M12 5.5 9.5 7.7M8 21h8" />
        </>
      )
    case 'card-spark':
      return (
        <>
          <rect {...common} height="14" rx="2.5" transform="rotate(-7 11 12)" width="11" x="5.5" y="5" />
          <path {...common} d="M12.1 8.2c.4 1.6 1.1 2.3 2.7 2.7-1.6.4-2.3 1.1-2.7 2.7-.4-1.6-1.1-2.3-2.7-2.7 1.6-.4 2.3-1.1 2.7-2.7Z" />
          <path {...common} d="M18 5.2v3M16.5 6.7h3" />
        </>
      )
    case 'cards':
      return (
        <>
          <rect {...common} height="14" rx="2.5" transform="rotate(-8 10 12)" width="10" x="5" y="5" />
          <path {...common} d="m10 8 1.1 1.5 1.8-.1-1 1.5.7 1.7-1.8-.5-1.4 1.1-.1-1.8-1.5-1 1.7-.7Z" />
          <path {...common} d="m16.5 7.5 2 .1a2 2 0 0 1 1.8 2.2l-.7 7.8a2 2 0 0 1-2.2 1.8l-6.2-.5" />
        </>
      )
    case 'check':
      return <path {...common} d="m5 12.5 4.2 4.2L19 7" />
    case 'chevron-right':
      return <path {...common} d="m9 6 6 6-6 6" />
    case 'clock':
      return (
        <>
          <circle {...common} cx="12" cy="12" r="8.5" />
          <path {...common} d="M12 7.5V12l3 2" />
        </>
      )
    case 'close':
      return <path {...common} d="m7 7 10 10M17 7 7 17" />
    case 'coin':
      return (
        <>
          <circle {...common} cx="12" cy="12" r="8.5" />
          <path {...common} d="M14.8 9.2c-.5-.7-1.4-1.1-2.7-1.1-1.6 0-2.7.8-2.7 2 0 1.2 1 1.7 2.8 2 1.7.3 2.4.8 2.4 1.9 0 1.2-1 2-2.7 2-1.4 0-2.4-.5-3-1.4M12 6.7v10.6" />
        </>
      )
    case 'construction':
      return (
        <>
          <path {...common} d="M4 8.5h16v7H4Z" />
          <path {...common} d="m6 15.5-1.5 4M18 15.5l1.5 4M7 8.5l3.5 7M13.5 8.5l3.5 7M4 12h16" />
          <circle cx="7" cy="6" fill="currentColor" r="1.35" />
          <circle cx="17" cy="6" fill="currentColor" r="1.35" />
        </>
      )
    case 'crown':
      return (
        <>
          <path {...common} d="m4.5 7 4.2 3.4L12 5l3.3 5.4L19.5 7l-1.3 10H5.8Z" />
          <path {...common} d="M6.2 14.5h11.6M6 20h12" />
        </>
      )
    case 'dice':
      return (
        <>
          <rect {...common} height="15.5" rx="3" width="15.5" x="4.25" y="4.25" />
          <circle cx="9" cy="9" fill="currentColor" r="1" />
          <circle cx="15" cy="15" fill="currentColor" r="1" />
          <circle cx="15" cy="9" fill="currentColor" r="1" />
          <circle cx="9" cy="15" fill="currentColor" r="1" />
        </>
      )
    case 'flag':
      return (
        <>
          <path {...common} d="M6.5 20V4.5" />
          <path {...common} d="M7 5h10l-2.4 3L17 11H7" />
        </>
      )
    case 'festival':
      return (
        <>
          <path {...common} d="M5.2 8.4h13.6l-1.2 10.1H6.4Z" />
          <path {...common} d="M4.2 6.1h15.6l-2.1 2.3H6.3Z" />
          <path {...common} d="M8.2 12.3c.8-.9 1.7-.9 2.5 0 .8.9 1.7.9 2.5 0 .8-.9 1.7-.9 2.5 0" />
          <path {...common} d="M8 18.5v2M16 18.5v2M4.2 20.5h15.6" />
          <path {...common} d="m5.4 3.7 1.2 1.2M18.6 3.7l-1.2 1.2M12 2.5v1.8" />
          <path {...common} d="m12 10.3.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2Z" />
        </>
      )
    case 'help':
      return (
        <>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M9.6 9.4a2.6 2.6 0 1 1 4.3 2c-1.2.9-1.9 1.3-1.9 2.6" />
          <circle cx="12" cy="17.2" fill="currentColor" r="1" />
        </>
      )
    case 'history':
      return (
        <>
          <path {...common} d="M4.8 8.2A8.5 8.5 0 1 1 4 13" />
          <path {...common} d="M4.8 4.5v3.7h3.7M12 7.5V12l3 1.8" />
        </>
      )
    case 'info':
      return (
        <>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M12 10.7v5.5" />
          <circle cx="12" cy="7.5" fill="currentColor" r="1.1" />
        </>
      )
    case 'landmark':
      return (
        <>
          <path {...common} d="m3.5 9 8.5-5 8.5 5ZM5 19.5h14M4 21h16M6 9v7.5M10 9v7.5M14 9v7.5M18 9v7.5M4.5 16.5h15" />
        </>
      )
    case 'lock':
      return (
        <>
          <rect {...common} height="9" rx="2" width="13" x="5.5" y="11" />
          <path {...common} d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
        </>
      )
    case 'map':
      return (
        <>
          <path {...common} d="m4.5 6.5 5-2 5 2 5-2v13l-5 2-5-2-5 2Z" />
          <path {...common} d="M9.5 4.5v13M14.5 6.5v13" />
        </>
      )
    case 'money-stack':
      return (
        <>
          <path {...common} d="M5 8.5h12.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2Z" />
          <path {...common} d="M7 8.5V6.8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5.7a2 2 0 0 1-2 2h-.5" />
          <path {...common} d="M5.5 12h11M5.5 15h11" />
          <circle cx="11" cy="12.8" fill="currentColor" r="1.2" />
        </>
      )
    case 'mute':
      return (
        <>
          <path {...common} d="M3.5 9.5v5h3l4.5 4v-13l-4.5 4Z" />
          <path {...common} d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
        </>
      )
    case 'pause':
      return (
        <>
          <path {...common} d="M9 7v10M15 7v10" />
        </>
      )
    case 'plane':
      return <path {...common} d="m3.8 12 6.7 2.1v4.4l1.7.7 1.8-4.1 4.6 1.5 1.2-1.2-5.2-3.4 5.2-3.4-1.2-1.2L14 8.9l-1.8-4.1-1.7.7v4.4Z" />
    case 'play':
      return <path {...common} d="m9 7 8 5-8 5Z" />
    case 'plus':
      return <path {...common} d="M12 5v14M5 12h14" />
    case 'restart':
      return (
        <>
          <path {...common} d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path {...common} d="M20 4v4.5h-4.5" />
        </>
      )
    case 'settings':
      return (
        <>
          <circle {...common} cx="12" cy="12" r="2.7" />
          <path {...common} d="m19 13.7 1.1 1.2-2 3.3-1.6-.5a7 7 0 0 1-2.1 1.2l-.4 1.6h-4l-.4-1.6a7 7 0 0 1-2.1-1.2l-1.6.5-2-3.3L5 13.7a7 7 0 0 1 0-2.4L3.9 10l2-3.3 1.6.5A7 7 0 0 1 9.6 6l.4-1.6h4l.4 1.6a7 7 0 0 1 2.1 1.2l1.6-.5 2 3.3-1.1 1.3a7 7 0 0 1 0 2.4Z" />
        </>
      )
    case 'shield':
      return (
        <>
          <path {...common} d="M12 3.5 19 6v5.2c0 4.4-2.5 7.4-7 9.3-4.5-1.9-7-4.9-7-9.3V6Z" />
          <path {...common} d="m8.6 12 2.2 2.2 4.6-4.7" />
        </>
      )
    case 'sparkles':
      return (
        <>
          <path {...common} d="M12 3.5c.7 3 2 4.3 5 5-3 .7-4.3 2-5 5-.7-3-2-4.3-5-5 3-.7 4.3-2 5-5Z" />
          <path {...common} d="M18.2 14.5c.4 1.7 1.1 2.4 2.8 2.8-1.7.4-2.4 1.1-2.8 2.8-.4-1.7-1.1-2.4-2.8-2.8 1.7-.4 2.4-1.1 2.8-2.8ZM5.5 14.5c.3 1.2.8 1.7 2 2-1.2.3-1.7.8-2 2-.3-1.2-.8-1.7-2-2 1.2-.3 1.7-.8 2-2Z" />
        </>
      )
    case 'swap':
      return (
        <>
          <path {...common} d="M5 8h12.5M14.5 5l3 3-3 3M19 16H6.5M9.5 13l-3 3 3 3" />
        </>
      )
    case 'target':
      return (
        <>
          <circle {...common} cx="12" cy="12" r="8.5" />
          <circle {...common} cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" fill="currentColor" r="1.5" />
          <path {...common} d="M12 1.8v2M22.2 12h-2M12 22.2v-2M1.8 12h2" />
        </>
      )
    case 'ticket':
      return (
        <>
          <path {...common} d="M4 7.2A2.2 2.2 0 0 0 6.2 5h11.3A1.5 1.5 0 0 1 19 6.5v2.2a2.8 2.8 0 0 0 0 5.6v2.2a1.5 1.5 0 0 1-1.5 1.5H6.2A2.2 2.2 0 0 0 4 15.8Z" />
          <path {...common} d="M14.5 7.7v1M14.5 11.5v1M14.5 15.3v1" />
          <path {...common} d="m8 10.4.8 1.1 1.3-.1-.7 1 .5 1.3-1.2-.4-1.1.8v-1.3l-1.1-.8 1.3-.4Z" />
        </>
      )
    case 'trophy':
      return (
        <>
          <path {...common} d="M8 4.5h8v4.8a4 4 0 0 1-8 0Z" />
          <path {...common} d="M8 6H5.5v1.2A3.3 3.3 0 0 0 9 10.5M16 6h2.5v1.2a3.3 3.3 0 0 1-3.5 3.3M12 13.3V17M8.5 19.5h7M9.5 17h5" />
        </>
      )
    case 'users':
      return (
        <>
          <circle {...common} cx="9" cy="9" r="3" />
          <path {...common} d="M3.8 19a5.2 5.2 0 0 1 10.4 0M15 7.2a2.8 2.8 0 0 1 0 5.5M16.4 14.5a4.7 4.7 0 0 1 3.8 4.5" />
        </>
      )
    case 'volume':
      return (
        <>
          <path {...common} d="M3.5 9.5v5h3l4.5 4v-13l-4.5 4Z" />
          <path {...common} d="M15 9.2a4.2 4.2 0 0 1 0 5.6M17.6 6.9a7.4 7.4 0 0 1 0 10.2" />
        </>
      )
    default:
      return null
  }
}
