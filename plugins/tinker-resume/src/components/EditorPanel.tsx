import { observer } from 'mobx-react-lite'
import { useCallback, useMemo, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  FileText,
  Flag,
  FolderGit2,
  List,
  MessageSquare,
  User,
} from 'lucide-react'
import map from 'licia/map'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import NavList, { type NavListItem } from 'share/components/NavList'
import Dialog from 'share/components/Dialog'
import { confirm } from 'share/components/Confirm'
import { tw } from 'share/theme'
import store from '../store'
import type { MenuSection } from '../types'
import BasicForm from './BasicForm'
import SkillForm from './SkillForm'
import ItemList from './ItemList'
import { FieldArea } from './FormField'

const SECTION_ICONS: Record<string, typeof User> = {
  basic: User,
  skills: List,
  experience: FileText,
  projects: FolderGit2,
  education: BookOpen,
  selfEvaluation: MessageSquare,
  certificates: Flag,
}

export default observer(function EditorPanel() {
  const { t } = useTranslation()
  const { experience, projects, education, certificates, menuSections } =
    store.resume

  const experienceFields = useMemo(
    () => [
      { key: 'company', label: t('company') },
      { key: 'position', label: t('position') },
      { key: 'date', label: t('date'), span: 2 as const },
      { key: 'details', label: t('details'), multiline: true },
    ],
    [t]
  )

  const projectFields = useMemo(
    () => [
      { key: 'name', label: t('projectName') },
      { key: 'role', label: t('role') },
      { key: 'date', label: t('date'), span: 2 as const },
      { key: 'description', label: t('description'), multiline: true },
    ],
    [t]
  )

  const educationFields = useMemo(
    () => [
      { key: 'school', label: t('school') },
      { key: 'major', label: t('major') },
      { key: 'degree', label: t('degree'), span: 2 as const },
      { key: 'startDate', label: t('startDate') },
      { key: 'endDate', label: t('endDate') },
      { key: 'description', label: t('description'), multiline: true },
    ],
    [t]
  )

  const certificateFields = useMemo(
    () => [
      { key: 'name', label: t('certificateName') },
      { key: 'issuer', label: t('issuer') },
      { key: 'date', label: t('date'), span: 2 as const },
      { key: 'description', label: t('description'), multiline: true },
    ],
    [t]
  )

  const handleAdd = (event: MouseEvent) => {
    const unused = store.unusedBuiltinIds
    if (unused.length === 1) {
      store.addSection(unused[0])
      return
    }
    tinker.showContextMenu(
      event.clientX,
      event.clientY,
      map(unused, (id) => ({
        label: t(id),
        click: () => store.addSection(id),
      }))
    )
  }

  const handleRemove = useCallback(
    async (section: MenuSection) => {
      const ok = await confirm({
        title: t('deleteModuleTitle'),
        message: t('deleteModuleConfirm'),
      })
      if (ok) store.removeSection(section.id)
    },
    [t]
  )

  const items: NavListItem[] = useMemo(
    () =>
      map(menuSections, (section) => ({
        id: section.id,
        icon: SECTION_ICONS[section.id] || FileText,
        label: t(section.id),
        draggable: section.id !== 'basic',
        menu: () => {
          const actions = [
            {
              label: t('edit'),
              click: () => store.openEditor(section.id),
            },
          ]
          if (section.id !== 'basic') {
            actions.push({
              label: t('delete'),
              click: () => {
                void handleRemove(section)
              },
            })
          }
          return actions
        },
      })),
    [menuSections, t, handleRemove]
  )

  return (
    <div
      className={`h-full w-44 shrink-0 flex flex-col border-r ${tw.border} ${tw.bg.tertiary}`}
    >
      <OverlayScrollbars defer className="min-h-0 flex-1">
        <NavList
          items={items}
          activeId={store.activeSection}
          onSelect={(id) => store.openEditor(id)}
          onReorder={(fromId, toId) => store.moveSection(fromId, toId)}
        />
      </OverlayScrollbars>

      {store.unusedBuiltinIds.length > 0 && (
        <div className={`p-3 border-t ${tw.border}`}>
          <button
            type="button"
            className={`w-full px-3 py-1.5 text-xs ${tw.text.secondary} ${tw.hover} rounded-md transition-colors`}
            onClick={handleAdd}
          >
            {t('addModule')}
          </button>
        </div>
      )}

      <Dialog
        open={store.editorOpen}
        onClose={() => store.closeEditor()}
        title={t(store.activeSection)}
        showClose
        className="w-full max-w-2xl"
      >
        <div className="space-y-4">
          {store.activeSection === 'basic' && <BasicForm />}
          {store.activeSection === 'skills' && <SkillForm />}
          {store.activeSection === 'selfEvaluation' && (
            <FieldArea
              value={store.resume.selfEvaluationContent}
              onChange={(value) => store.setSelfEvaluationContent(value)}
              placeholder={t('selfEvaluationPlaceholder')}
              rows={12}
            />
          )}
          {store.activeSection === 'experience' && (
            <ItemList
              items={experience}
              fields={experienceFields}
              titleKey={(item) => item.company}
              onAdd={() => store.addExperience()}
              onChange={(id, key, value) =>
                store.updateExperience(id, { [key]: value })
              }
              onRemove={(id) => store.removeExperience(id)}
              onToggleVisible={(id, visible) =>
                store.updateExperience(id, { visible })
              }
            />
          )}
          {store.activeSection === 'projects' && (
            <ItemList
              items={projects}
              fields={projectFields}
              titleKey={(item) => item.name}
              onAdd={() => store.addProject()}
              onChange={(id, key, value) =>
                store.updateProject(id, { [key]: value })
              }
              onRemove={(id) => store.removeProject(id)}
              onToggleVisible={(id, visible) =>
                store.updateProject(id, { visible })
              }
            />
          )}
          {store.activeSection === 'education' && (
            <ItemList
              items={education}
              fields={educationFields}
              titleKey={(item) => item.school}
              onAdd={() => store.addEducation()}
              onChange={(id, key, value) =>
                store.updateEducation(id, { [key]: value })
              }
              onRemove={(id) => store.removeEducation(id)}
              onToggleVisible={(id, visible) =>
                store.updateEducation(id, { visible })
              }
            />
          )}
          {store.activeSection === 'certificates' && (
            <ItemList
              items={certificates}
              fields={certificateFields}
              titleKey={(item) => item.name}
              onAdd={() => store.addCertificate()}
              onChange={(id, key, value) =>
                store.updateCertificate(id, { [key]: value })
              }
              onRemove={(id) => store.removeCertificate(id)}
              onToggleVisible={(id, visible) =>
                store.updateCertificate(id, { visible })
              }
            />
          )}
        </div>
      </Dialog>
    </div>
  )
})
