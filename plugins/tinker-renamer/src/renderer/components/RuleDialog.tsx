import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import type {
  RuleType,
  Rule,
  ReplaceInfo,
  InsertInfo,
  DeleteInfo,
  FormatInfo,
  TemplateInfo,
} from '../../common/types'
import { createDefaultInfo } from '../lib/util'
import store from '../store'
import ReplaceForm from './ReplaceForm'
import InsertForm from './InsertForm'
import DeleteForm from './DeleteForm'
import FormatForm from './FormatForm'
import TemplateForm from './TemplateForm'

export default observer(function RuleDialog() {
  const { t } = useTranslation()
  const isEditing = store.editingRule !== null

  const [ruleType, setRuleType] = useState<RuleType>('replace')
  const [info, setInfo] = useState<Rule['info']>(createDefaultInfo('replace'))

  useEffect(() => {
    if (store.dialogOpen) {
      if (store.editingRule) {
        setRuleType(store.editingRule.type)
        setInfo({ ...store.editingRule.info })
      } else {
        setRuleType(store.addRuleType)
        setInfo(createDefaultInfo(store.addRuleType))
      }
    }
  }, [store.dialogOpen])

  const handleSave = () => {
    if (isEditing && store.editingRule) {
      store.updateRule(store.editingRule.id, info)
    } else {
      store.addRule(ruleType, info)
    }
  }

  const title = isEditing
    ? `${t('editRule')} - ${t(ruleType)}`
    : `${t('addRule')} - ${t(ruleType)}`

  return (
    <Dialog
      open={store.dialogOpen}
      onClose={() => store.closeDialog()}
      title={title}
      className="w-full max-w-sm"
    >
      <div className="space-y-4">
        {ruleType === 'replace' && (
          <ReplaceForm
            info={info as ReplaceInfo}
            onChange={(v) => setInfo(v)}
          />
        )}
        {ruleType === 'insert' && (
          <InsertForm info={info as InsertInfo} onChange={(v) => setInfo(v)} />
        )}
        {ruleType === 'delete' && (
          <DeleteForm info={info as DeleteInfo} onChange={(v) => setInfo(v)} />
        )}
        {ruleType === 'format' && (
          <FormatForm info={info as FormatInfo} onChange={(v) => setInfo(v)} />
        )}
        {ruleType === 'template' && (
          <TemplateForm
            info={info as TemplateInfo}
            onChange={(v) => setInfo(v)}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <DialogButton variant="text" onClick={() => store.closeDialog()}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleSave}>{t('save')}</DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
