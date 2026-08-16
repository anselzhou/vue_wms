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
      // 确保 Authorization header 正确设置
      config.headers.Authorization = `Bearer ${token}`
      console.log('[Request Interceptor] URL:', config.url)
      console.log('[Request Interceptor] Method:', config.method)
      console.log('[Request Interceptor] Token存在，长度:', token.length)
      console.log('[Request Interceptor] Authorization Header:', config.headers.Authorization.substring(0, 30) + '...')
    } else {
      console.log('[Request Interceptor] URL:', config.url, '- 无Token')
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    console.log('[Response Interceptor] URL:', response.config.url, '- Code:', res.code)

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
    console.error('[Response Interceptor] 响应错误:')
    console.error('[Response Interceptor] URL:', error.config?.url)
    console.error('[Response Interceptor] Method:', error.config?.method)
    console.error('[Response Interceptor] Status:', error.response?.status)
    console.error('[Response Interceptor] Response Data:', error.response?.data)
    console.error('[Response Interceptor] Error Message:', error.message)
    
    // 打印完整的错误配置
    if (error.config) {
      console.error('[Response Interceptor] Request Headers:', error.config.headers)
    }

    // 401 未授权始终需要处理（清除登录态并跳转）
    if (error.response?.status === 401) {
      console.error('[401 Error] 未授权 - 当前路径:', window.location.pathname)
      console.error('[401 Error] localStorage中的token:', localStorage.getItem('token'))
      ElMessage.error('未授权，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 如果当前不在登录页，才重定向
      if (window.location.pathname !== '/login') {
        console.log('[401 Error] 重定向到登录页')
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
          // 只在HTTP错误时显示，不重复显示
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