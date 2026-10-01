import type { Locale } from '../i18n/types.ts'
import type { Project } from '../types/project.ts'

export function defaultProjectName(locale: Locale) {
  return locale === 'tr' ? 'adsız_proje.kivi' : 'untitled_project.kivi'
}

export function projectFileName(name: string) {
  const clean = name.trim() || 'untitled_project'
  return clean.toLowerCase().endsWith('.kivi') ? clean : `${clean}.kivi`
}

export function recentProjects(projects: readonly Project[], limit = 5) {
  return [...projects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, limit)
}

export function projectSize(project: Project) {
  return new TextEncoder().encode(JSON.stringify(project)).byteLength
}

export function formatProjectSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`
}
