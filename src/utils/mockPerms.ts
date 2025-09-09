export type TeacherPerms = { canCreateQuestions: boolean }

type Store = { teachers: Record<string, TeacherPerms> }

const KEY = 'mock_permissions'
const empty: Store = { teachers: {} }

export function readPerms(): Store {
  try { 
    return JSON.parse(localStorage.getItem(KEY) || '') as Store 
  } catch { 
    return empty 
  }
}

export function writePerms(s: Store) { 
  localStorage.setItem(KEY, JSON.stringify(s)) 
}

export function getTeacherPerm(u: string): TeacherPerms {
  const s = readPerms()
  return s.teachers[u] ?? { canCreateQuestions: false }
}

export function setTeacherPerm(u: string, p: Partial<TeacherPerms>) {
  const s = readPerms()
  const cur = s.teachers[u] ?? { canCreateQuestions: false }
  s.teachers[u] = { ...cur, ...p }
  writePerms(s)
}