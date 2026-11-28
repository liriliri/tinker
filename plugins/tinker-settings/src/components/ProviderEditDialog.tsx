import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import clone from 'licia/clone'
import extend from 'licia/extend'
import find from 'licia/find'
import Dialog from 'share/components/Dialog'
import store from '../store'
import type { AiImageProvider, AiMode, AiProvider } from '../types'
import ProviderFields from './ProviderFields'

interface ProviderEditDialogProps {
  mode: AiMode
  providerName: string | null
  open: boolean
  onClose: () => void
}

export default observer(function ProviderEditDialog({
  mode,
  providerName,
  open,
  onClose,
}: ProviderEditDialogProps) {
  const isImage = mode === 'image'
  const provider = providerName
    ? isImage
      ? find(store.aiImageProviders, (p) => p.name === providerName)
      : find(store.aiProviders, (p) => p.name === providerName)
    : undefined
  const [form, setForm] = useState<AiProvider | AiImageProvider | null>(null)

  useEffect(() => {
    if (!open || !providerName) {
      setForm(null)
      return
    }
    const current = isImage
      ? find(store.aiImageProviders, (p) => p.name === providerName)
      : find(store.aiProviders, (p) => p.name === providerName)
    setForm(current ? clone(current) : null)
  }, [open, providerName, mode, isImage])

  useEffect(() => {
    if (open && providerName && !provider) {
      onClose()
    }
  }, [open, providerName, provider, onClose])

  if (!open || !provider || !form) return null

  const saveProvider = (next: AiProvider | AiImageProvider) => {
    if (isImage) {
      void store.updateAiImageProvider(next as AiImageProvider)
    } else {
      void store.updateAiProvider(next as AiProvider)
    }
  }

  const handleChange = (patch: Partial<AiProvider | AiImageProvider>) => {
    const next = extend(clone(form), patch)
    setForm(next)
    if (patch.models !== undefined) {
      saveProvider(next)
    }
  }

  const handleBlur = () => {
    saveProvider(form)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={provider.name}
      showClose
      className={
        isImage
          ? 'w-full max-w-lg h-[min(520px,90vh)]'
          : 'w-full max-w-5xl h-[min(720px,90vh)]'
      }
      bodyClassName="overflow-hidden flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0" onBlur={handleBlur}>
        <ProviderFields
          key={provider.name}
          mode={mode}
          value={form}
          onChange={handleChange}
        />
      </div>
    </Dialog>
  )
})
