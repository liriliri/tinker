import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import store from '../store'

export default observer(function Toolbar() {
  const { config } = store
  const [isApplying, setIsApplying] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleApply = async () => {
    setIsApplying(true)
    setMessage(null)

    try {
      await store.applyHosts()
      setMessage({ type: 'success', text: '✓ 配置已成功应用到系统 hosts 文件' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: `✗ 应用失败: ${
          error instanceof Error ? error.message : '未知错误'
        }`,
      })
    } finally {
      setIsApplying(false)
    }
  }

  if (!config) return null

  const activeConfigs = config.configs.filter((c) =>
    config.activeIds.includes(c.id)
  )

  return (
    <div className="h-12 bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] flex items-center px-4 gap-4">
      <button
        className={`px-4 py-2 text-sm rounded font-semibold ${
          isApplying
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#0fc25e] hover:bg-[#0db350]'
        } text-white`}
        onClick={handleApply}
        disabled={isApplying || activeConfigs.length === 0}
      >
        {isApplying ? '应用中...' : '应用配置'}
      </button>

      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span>当前激活:</span>
        {activeConfigs.length === 0 ? (
          <span className="text-gray-500">无</span>
        ) : (
          <div className="flex gap-2">
            {activeConfigs.map((cfg) => (
              <span
                key={cfg.id}
                className="px-2 py-1 bg-gray-300 dark:bg-[#4a4a4a] text-gray-800 dark:text-gray-200 rounded text-xs"
              >
                {cfg.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`ml-auto px-3 py-1 rounded text-sm ${
            message.type === 'success'
              ? 'bg-[#0fc25e] bg-opacity-20 text-[#0fc25e]'
              : 'bg-red-500 bg-opacity-20 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
})
