import { computed, ref, watch } from 'vue'

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 20
/** 可选的每页条数 */
export const PAGE_SIZE_OPTIONS: number[] = [10, 20, 50, 100]

/**
 * 前端分页通用逻辑
 *
 * @param getData 数据源 getter，需返回完整列表（可以是 ref 的 value 或任意响应式派生结果）
 * @returns 分页状态、当前页切片数据及相关操作
 *
 * @example
 * const { currentPage, pageSize, paginatedData, handleSizeChange, resetPage } =
 *   usePagination(() => tableData.value)
 */
export function usePagination<T>(getData: () => T[]) {
  const currentPage = ref(1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  /** 数据总条数 */
  const total = computed(() => getData().length)
  /** 当前数据量下的最大页码（至少为 1，避免空数据时分页器显示异常） */
  const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  /** 当前页展示的切片数据 */
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return getData().slice(start, start + pageSize.value)
  })

  // 边界处理：数据量缩小导致当前页超出最大页码时，自动回退到最后一页
  // （例如查询结果从 100 条变为 3 条，当前页仍停留在第 5 页的场景）
  watch(maxPage, (page) => {
    if (currentPage.value > page) {
      currentPage.value = page
    }
  })

  /** 切换每页条数时回到第一页 */
  function handleSizeChange(size: number) {
    pageSize.value = size
    currentPage.value = 1
  }

  /** 重置到第一页（查询 / 重置后使用） */
  function resetPage() {
    currentPage.value = 1
  }

  return {
    currentPage,
    pageSize,
    total,
    maxPage,
    paginatedData,
    handleSizeChange,
    resetPage,
  }
}
