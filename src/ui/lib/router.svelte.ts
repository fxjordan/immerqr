/** Minimal path router for the handful of static pages. */
export type Route = 'home' | 'why' | 'privacy' | 'imprint' | 'notFound';

const PATHS: Record<Exclude<Route, 'notFound'>, string> = {
  home: '/',
  why: '/warum',
  privacy: '/datenschutz',
  imprint: '/impressum',
};

/** Base path from the build, e.g. `/` or `/immerqr/`, without the trailing slash. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function resolve(pathname: string): Route {
  const inApp = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  const clean = inApp.replace(/\/+$/, '') || '/';
  for (const [route, path] of Object.entries(PATHS)) {
    if (path === clean) return route as Route;
  }
  return 'notFound';
}

const state = $state<{ route: Route }>({ route: resolve(location.pathname) });

window.addEventListener('popstate', () => {
  state.route = resolve(location.pathname);
});

export function currentRoute(): Route {
  return state.route;
}

export function hrefFor(route: Exclude<Route, 'notFound'>): string {
  return route === 'home' ? `${BASE}/` : BASE + PATHS[route];
}

/** Click handler for internal links: navigates without a reload, keeps modifier-clicks native. */
export function navigate(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.currentTarget as HTMLAnchorElement;
  if (anchor.origin !== location.origin) return;
  event.preventDefault();
  const { pathname } = anchor;
  if (pathname !== location.pathname) history.pushState(null, '', pathname);
  state.route = resolve(pathname);
  window.scrollTo({ top: 0 });
  document.getElementById('main')?.focus({ preventScroll: true });
}
