import axios from 'axios'
import type {
  AxiosInstance,
  AxiosResponse
} from 'axios'
import { ElMessage } from 'element-plus'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8989/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    if (res.code === 200) {
      return res
    }

    // 标记了 skipErrorMessage 的请求，跳过全局错误提示，由调用方自行处理
    const skipErrorMessage = (response.config as any)?.skipErrorMessage === true
    if (!skipErrorMessage) {
      ElMessage.error(res.message || '请求失败')
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    // 401 未授权始终需要处理（清除登录态并跳转）
    if (error.response?.status === 401) {
      ElMessage.error('未授权，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 如果当前不在登录页，才重定向
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // 标记了 skipErrorMessage 的请求，跳过全局错误提示，由调用方自行处理
    const skipErrorMessage = (error.config as any)?.skipErrorMessage === true
    if (skipErrorMessage) {
      return Promise.reject(error)
    }

    if (error.response) {
      switch (error.response.status) {
        case 400:
          ElMessage.error(error.response.data?.message || '请求参数错误')
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求地址不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

export default service
