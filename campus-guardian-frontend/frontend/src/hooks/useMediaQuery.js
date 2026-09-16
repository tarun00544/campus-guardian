import { useEffect, useState } from 'react';

// Reads a CSS media query from JS. Used where a layout choice cannot be made
// in CSS alone - mainly Recharts props like tick angle or pie labels.
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

// Shared breakpoint helpers so pages agree on what "mobile" means.
export const useIsMobile = () => useMediaQuery('(max-width: 575.98px)');
export const useIsTablet = () => useMediaQuery('(max-width: 991.98px)');

export default useMediaQuery;
