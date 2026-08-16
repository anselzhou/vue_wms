export interface User {
  id: number
  username: string
  password?: string
  createTime?: string
  updateTime?: string
}

export interface LoginResult {
  token: string
}

