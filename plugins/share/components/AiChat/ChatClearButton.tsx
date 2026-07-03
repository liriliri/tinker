import { useTranslation } from 'react-i18next'
import { Eraser } from 'lucide-react'
import { ToolbarButton, TOOLBAR_ICON_SIZE } from '../Toolbar'
import { AI_CHAT_NS } from './i18n'

export interface ChatClearButtonProps {
  onClick: () => void
  disabled?: boolean
}

export default function ChatClearButton({
  onClick,
  disabled = false,
}: ChatClearButtonProps) {
  const { t } = useTranslation(AI_CHAT_NS)

  return (
    <ToolbarButton
      title={t('clearMessages')}
      onClick={onClick}
      disabled={disabled}
    >
      <Eraser size={TOOLBAR_ICON_SIZE} />
    </ToolbarButton>
  )
}
