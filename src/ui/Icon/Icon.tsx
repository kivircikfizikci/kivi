import type { SVGProps } from 'react'

export type IconName = 'settings' | 'expand' | 'collapse' | 'close' | 'folder' | 'chevronLeft' | 'chevronUp' | 'chevronDown' | 'line' | 'cursor' | 'undo' | 'redo' | 'trash' | 'plus' | 'edit' | 'dimension' | 'menu' | 'tools' | 'share' | 'image' | 'file' | 'link'

const paths: Record<IconName, React.ReactNode> = {
  settings: (
    <>
      <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" />
      <path d="m19.1 13.9 1.2 1.4-2 3.45-1.82-.36a7.9 7.9 0 0 1-2.22 1.28L13.65 21h-3.3l-.61-1.33a7.9 7.9 0 0 1-2.22-1.28l-1.82.36-2-3.45 1.2-1.4a8 8 0 0 1 0-2.8L3.7 9.7l2-3.45 1.82.36a7.9 7.9 0 0 1 2.22-1.28L10.35 4h3.3l.61 1.33a7.9 7.9 0 0 1 2.22 1.28l1.82-.36 2 3.45-1.2 1.4a8 8 0 0 1 0 2.8Z" />
    </>
  ),
  expand: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5m13 5h5v-5M3 8l6-6m12 6-6-6M3 16l6 6m12-6-6 6" />,
  collapse: <path d="M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5M4 9l6-6m10 6-6-6M4 15l6 6m10-6-6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  folder: <path d="M3 7.5h7l2-2h9v13H3v-11Z" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  line: <path d="M5 19 19 5M4 17v3h3m10-16h3v3" />,
  cursor: <path d="m5 3 14 9-7 1-3 7L5 3Z" />,
  undo: <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" />,
  redo: <path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6" />,
  trash: <path d="M4 7h16M9 11v6m6-6v6M8 7l1-3h6l1 3m2 0-1 14H7L6 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm10-12 3 3" />,
  dimension: <path d="M4 7v10m16-10v10M5 12h14m-11-3-3 3 3 3m8-6 3 3-3 3" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  tools: <path d="m14.5 6.5 3-3 3 3-3 3m-2-1L6 18l-2 2 2-2m1.5-8.5-4-4 2-2 4 4M14 14l6 6" />,
  share: <path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v7h14v-7" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m4 17 5-5 4 4 2-2 5 5" /></>,
  file: <path d="M6 3h8l4 4v14H6V3Zm8 0v5h5M9 13h6m-6 4h6" />,
  link: <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15" />,
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  )
}
