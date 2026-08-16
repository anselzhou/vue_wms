import type { User } from '@/types/user'

export function setUserInfo(user: User) {
  localStorage.setItem('userInfo', JSON.stringify(user))
}

export function getUserInfo(): User | null {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      return JSON.parse(userInfo)
    } catch (e) {
      return null
    }
  }
  return null
}

export function removeUserInfo() {
  localStorage.removeItem('userInfo')
  localStorage.removeItem('token')
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
