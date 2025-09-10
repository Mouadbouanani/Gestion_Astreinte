// Type guards and utility functions for safe property access
import type { Site, Secteur, Service, User } from '@/types';

// Type guards
export function isSiteObject(site: string | Site | undefined): site is Site {
  return typeof site === 'object' && site !== null && '_id' in site;
}

export function isSecteurObject(secteur: string | Secteur | undefined): secteur is Secteur {
  return typeof secteur === 'object' && secteur !== null && '_id' in secteur;
}

export function isServiceObject(service: string | Service | undefined): service is Service {
  return typeof service === 'object' && service !== null && '_id' in service;
}

export function isUserObject(user: string | User | undefined): user is User {
  return typeof user === 'object' && user !== null && '_id' in user;
}

// Safe property accessors
export function getSiteId(site: string | Site | undefined): string | undefined {
  if (!site) return undefined;
  return isSiteObject(site) ? site._id : site;
}

export function getSiteName(site: string | Site | undefined): string | undefined {
  if (!site) return undefined;
  return isSiteObject(site) ? site.name : site;
}

export function getSecteurId(secteur: string | Secteur | undefined): string | undefined {
  if (!secteur) return undefined;
  return isSecteurObject(secteur) ? secteur._id : secteur;
}

export function getSecteurName(secteur: string | Secteur | undefined): string | undefined {
  if (!secteur) return undefined;
  return isSecteurObject(secteur) ? secteur.name : secteur;
}

export function getServiceId(service: string | Service | undefined): string | undefined {
  if (!service) return undefined;
  return isServiceObject(service) ? service._id : service;
}

export function getServiceName(service: string | Service | undefined): string | undefined {
  if (!service) return undefined;
  return isServiceObject(service) ? service.name : service;
}

export function getUserId(user: string | User | undefined): string | undefined {
  if (!user) return undefined;
  return isUserObject(user) ? (user._id || user.id) : user;
}

export function getUserName(user: string | User | undefined): string | undefined {
  if (!user) return undefined;
  return isUserObject(user) ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : user;
}

// Safe property access with fallback
export function safeGet<T, K extends keyof T>(obj: T | undefined, key: K, fallback?: T[K]): T[K] | undefined {
  if (!obj) return fallback;
  return obj[key] ?? fallback;
}

// Format date safely
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR');
  } catch {
    return 'Date invalide';
  }
}

