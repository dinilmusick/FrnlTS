export interface FrnlRoute {
  readonly id: string;
  readonly pattern: string;
  readonly load?: () => Promise<unknown>;
}

export interface FrnlRouteMatch {
  readonly id: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly path: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileRoute(pattern: string): { regex: RegExp; names: string[] } {
  const names: string[] = [];
  const parts = pattern.split('/');
  const regexParts = parts.map((part) => {
    if (part.startsWith(':')) {
      names.push(part.slice(1));
      return '([^/]+)';
    }
    if (part === '*') {
      names.push('wildcard');
      return '(.*)';
    }
    return escapeRegex(part);
  });

  const source = regexParts.join('/');
  return {
    regex: new RegExp(`^${source}/?$`),
    names,
  };
}

export function matchRoute(route: FrnlRoute, url: string): FrnlRouteMatch | null {
  const parsed = new URL(url, 'http://frnl.local');
  const compiled = compileRoute(route.pattern);
  const match = compiled.regex.exec(parsed.pathname);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};
  compiled.names.forEach((name, index) => {
    const rawVal = match[index + 1] ?? '';
    params[name] = decodeURIComponent(rawVal);
  });

  const query: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    id: route.id,
    params: Object.freeze(params),
    query: Object.freeze(query),
    path: parsed.pathname,
  };
}

export function buildRouteUrl(
  route: FrnlRoute,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
): string {
  const parts = route.pattern.split('/');
  const builtParts = parts.map((part) => {
    if (part.startsWith(':')) {
      const name = part.slice(1);
      const value = params[name];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing route parameter: ${name}`);
      }
      return encodeURIComponent(value);
    }
    if (part === '*') {
      const value = params.wildcard ?? '';
      return value
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
    }
    return part;
  });

  const path = builtParts.join('/');

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export class FrnlRouter {
  private readonly routes: FrnlRoute[];

  constructor(routes: readonly FrnlRoute[] = []) {
    this.routes = [...routes];
  }

  addRoute(route: FrnlRoute): void {
    this.routes.push(route);
  }

  match(url: string): FrnlRouteMatch | null {
    for (const route of this.routes) {
      const match = matchRoute(route, url);
      if (match) {
        return match;
      }
    }
    return null;
  }

  list(): readonly FrnlRoute[] {
    return [...this.routes];
  }
}