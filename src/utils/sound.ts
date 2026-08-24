/**
 * 音效播放工具
 * - 在文本框回车事件执行成功后播放 correct.wav
 * - 在文本框回车事件执行失败时播放 error.wav
 */
import correctSound from '@/audio/correct.wav'
import errorSound from '@/audio/error.wav'

let correctAudio: HTMLAudioElement | null = null
let errorAudio: HTMLAudioElement | null = null

function getAudio(type: 'correct' | 'error'): HTMLAudioElement {
  if (type === 'correct') {
    if (!correctAudio) {
      correctAudio = new Audio(correctSound)
    }
    return correctAudio
  }
  if (!errorAudio) {
    errorAudio = new Audio(errorSound)
  }
  return errorAudio
}

/** 播放成功音效 */
export function playCorrect() {
  try {
    const audio = getAudio('correct')
    audio.currentTime = 0
    audio.play().catch(() => {
      /* 忽略自动播放被浏览器拦截的情况 */
    })
  } catch {
    /* 忽略音效播放异常 */
  }
}

/** 播放失败音效 */
export function playError() {
  try {
    const audio = getAudio('error')
    audio.currentTime = 0
    audio.play().catch(() => {
      /* 忽略自动播放被浏览器拦截的情况 */
    })
  } catch {
    /* 忽略音效播放异常 */
  }
}

/**
 * 包装回车事件处理器：
 * - 处理器正常返回（或 resolve）时播放 correct.wav
 * - 处理器抛出异常（或 reject）时播放 error.wav
 * @param handler 原回车事件处理器
 * @returns 包装后的处理器
 */
export function withEnterSound<T extends (...args: any[]) => any>(handler: T): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>) => {
    try {
      const result = await handler(...args)
      playCorrect()
      return result
    } catch (err) {
      playError()
      throw err
    }
  }
}
