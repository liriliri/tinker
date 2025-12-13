import { useState, useCallback } from 'react'

interface UseCopyToClipboardReturn {
  copied: boolean
  copyToClipboard: (text: string) => Promise<void>
}

export function useCopyToClipboard(
  timeout: number = 2000
): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), timeout)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    },
    [timeout]
  )

  return { copied, copyToClipboard }
}
