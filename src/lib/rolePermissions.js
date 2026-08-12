import { base44 } from '@/api/base44Client';

let cache = { role: null, routes: null, timestamp: 0 };
const CACHE_TTL = 30000;

export async function getRolePermissions(role) {
  if (role === 'admin') return null;
  if (cache.role === role && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.routes;
  }
  try {
    const data = await base44.entities.RolePermission.filter({ role });
    const routes = data.length > 0
      ? (data[0].allowed_routes?.split(',').filter(Boolean) || [])
      : null;
    cache = { role, routes, timestamp: Date.now() };
    return routes;
  } catch {
    return null;
  }
}

export function invalidateRolePermissions() {
  cache = { role: null, routes: null, timestamp: 0 };
}

export function isRouteAllowed(route, permissions) {
  if (permissions === null || permissions === undefined) return true;
  if (route === '/akun') return true;
  return permissions.includes(route);
}