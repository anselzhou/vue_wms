import request from '@/utils/request'

interface RegisterParams {
  username: string
  password: string
}

interface LoginParams {
  username: string
  password: string
}

interface UpdatePwdParams {
  old_pwd: string
  new_pwd: string
  re_pwd: string
}

export function register(data: RegisterParams) {
  return request({
    url: '/user/register',
    method: 'post',
    data: data  // 改为 data，使用请求体传递参数
  })
}

export function login(data: LoginParams) {
  return request({
    url: '/user/login',
    method: 'post',
    data: data  // 改为 data，使用请求体传递参数
  })
}


export function getUserInfo() {
  return request({
    url: '/user/userInfo',
    method: 'get'
  })
}

export function updatePwd(data: UpdatePwdParams) {
  return request({
    url: '/user/updatePwd',
    method: 'patch',
    data
  })
}