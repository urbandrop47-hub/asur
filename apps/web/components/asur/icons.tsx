'use client';

type IconName =
  | 'search' | 'bag' | 'heart' | 'sliders' | 'sort' | 'chevron' | 'chevronD'
  | 'arrow' | 'arrowL' | 'x' | 'plus' | 'minus' | 'check' | 'share'
  | 'truck' | 'lock' | 'ruler' | 'edit' | 'info' | 'ig' | 'wa' | 'yt' | 'xt' | 'user';

interface IconProps {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, className, style }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    bag:    <><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></>,
    heart:  <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"/>,
    sliders:<><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></>,
    sort:   <><path d="M7 5v14"/><path d="M4 16l3 3 3-3"/><path d="M13 7h7"/><path d="M13 12h5"/><path d="M13 17h3"/></>,
    chevron:<path d="M9 6l6 6-6 6"/>,
    chevronD:<path d="M6 9l6 6 6-6"/>,
    arrow:  <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    arrowL: <><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>,
    x:      <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    plus:   <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    minus:  <path d="M5 12h14"/>,
    check:  <path d="M4 12l5 5L20 6"/>,
    share:  <><circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.1 11l6.8-3.6M8.1 13l6.8 3.6"/></>,
    truck:  <><rect x="2" y="7" width="12" height="9"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></>,
    lock:   <><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
    ruler:  <><rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></>,
    edit:   <><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></>,
    info:   <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    ig:     <><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1"/></>,
    wa:     <path d="M5 19l1.3-3.8A7 7 0 1 1 9 18.2L5 19zM9.5 9c-.3 0-.6.3-.6.8 0 1.6 2.3 3.9 3.9 3.9.5 0 .8-.3.8-.6"/>,
    yt:     <><rect x="4" y="6" width="16" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z"/></>,
    xt:     <path d="M5 5l14 14M19 5L5 19"/>,
    user:   <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
