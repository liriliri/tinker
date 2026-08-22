import { makeAutoObservable, reaction } from 'mobx'
import jsonClone from 'licia/jsonClone'
import debounce from 'licia/debounce'
import filter from 'licia/filter'
import find from 'licia/find'
import isStr from 'licia/isStr'
import {
  initAiChatAvailability,
  toggleAiChatOpen,
} from 'share/lib/aiChat/aiAvailability'
import { LocalStoreChatPrefs } from 'share/lib/aiChat/chatPrefsStorage'
import { ChatSession } from 'share/lib/aiChat/chatSession'
import { IndexedDbChatStorage } from 'share/lib/aiChat/chatStorage'
import AiChatStore from 'share/store/AiChat'
import BaseStore, { storage } from 'share/store/Base'
import { createMcpApi } from './mcp'
import {
  createCertificate,
  createDefaultResume,
  createEducation,
  createExperience,
  createProject,
} from './lib/defaultResume'
import {
  BUILTIN_CONTENT_IDS,
  hasSection,
  normalizeResume,
  reorderSections,
} from './lib/menu'
import { exportResumePdf } from './lib/pdf'
import {
  DEFAULT_THEME_COLOR,
  isResumeData,
  isTemplateId,
  isThemeColor,
  omitItem,
  patchItem,
  pickPhotoDataUrl,
} from './lib/util'
import type {
  Certificate,
  Education,
  Experience,
  Project,
  ResumeBasic,
  ResumeData,
  TemplateId,
} from './types'

const sessionStorage = new IndexedDbChatStorage('tinker-resume')
const STORAGE_RESUME = 'resume'
const STORAGE_TEMPLATE = 'templateId'
const STORAGE_SECTION = 'activeSection'
const STORAGE_THEME = 'themeColor'

export class Store extends BaseStore {
  chat: AiChatStore
  readonly mcp = createMcpApi(() => this)
  resume: ResumeData = createDefaultResume('zh-CN')
  templateId: TemplateId = 'classic'
  themeColor = DEFAULT_THEME_COLOR
  activeSection = 'basic'
  editorOpen = false
  exporting = false
  hasAI = false
  chatOpen = false
  private persistEnabled = false

  constructor() {
    super()
    const chatSession = new ChatSession({
      sessionId: sessionStorage.sessionId,
      tools: this.mcp.createAgentTools(),
    })
    this.chat = new AiChatStore({
      chatSession,
      sessionStorage,
      prefsStorage: new LocalStoreChatPrefs(storage),
      initialSystemPrompt:
        'You are a resume assistant. Help the user write, translate, and improve resume content. You have tools to read and update the live resume JSON, switch the classic/sidebar template, set the accent color, and export a PDF. Use get before editing. Prefer filling real, concise bullet points. After applying changes, briefly explain what you updated. Do not call tools again unless the user asks for another change.',
    })
    makeAutoObservable(this, { chat: false })
    this.loadStorage()
    this.bindLanguage()
    this.persist()
    void initAiChatAvailability(storage).then(({ hasAI, chatOpen }) => {
      this.hasAI = hasAI
      this.chatOpen = chatOpen
    })
  }

  get unusedBuiltinIds() {
    return filter(
      [...BUILTIN_CONTENT_IDS],
      (id) => !hasSection(this.resume, id)
    )
  }

  setTemplateId(id: TemplateId) {
    this.templateId = id
  }

  setThemeColor(color: string) {
    this.themeColor = color
  }

  setResume(data: ResumeData) {
    this.resume = normalizeResume(jsonClone(data))
    if (
      !find(
        this.resume.menuSections,
        (section) => section.id === this.activeSection
      )
    ) {
      this.activeSection = 'basic'
    }
  }

  toggleChat() {
    if (!this.hasAI) return
    this.chatOpen = toggleAiChatOpen(storage, this.chatOpen)
  }

  openEditor(id: string) {
    this.activeSection = id
    this.editorOpen = true
  }

  closeEditor() {
    this.editorOpen = false
  }

  moveSection(fromId: string, toId: string) {
    this.resume = {
      ...this.resume,
      menuSections: reorderSections(this.resume.menuSections, fromId, toId),
    }
  }

  addSection(id: string) {
    if (hasSection(this.resume, id)) return
    this.resume = {
      ...this.resume,
      menuSections: [...this.resume.menuSections, { id, enabled: true }],
    }
    this.openEditor(id)
  }

  removeSection(id: string) {
    if (id === 'basic') return
    const menuSections = filter(
      this.resume.menuSections,
      (section) => section.id !== id
    )
    this.resume = { ...this.resume, menuSections }
    if (this.activeSection === id) this.activeSection = 'basic'
  }

  updateBasic(patch: Partial<ResumeBasic>) {
    this.resume = {
      ...this.resume,
      basic: { ...this.resume.basic, ...patch },
    }
  }

  setSkillContent(value: string) {
    this.resume = { ...this.resume, skillContent: value }
  }

  setSelfEvaluationContent(value: string) {
    this.resume = { ...this.resume, selfEvaluationContent: value }
  }

  addExperience() {
    this.setList('experience', [...this.resume.experience, createExperience()])
  }

  updateExperience(id: string, patch: Partial<Experience>) {
    this.setList('experience', patchItem(this.resume.experience, id, patch))
  }

  removeExperience(id: string) {
    this.setList('experience', omitItem(this.resume.experience, id))
  }

  addProject() {
    this.setList('projects', [...this.resume.projects, createProject()])
  }

  updateProject(id: string, patch: Partial<Project>) {
    this.setList('projects', patchItem(this.resume.projects, id, patch))
  }

  removeProject(id: string) {
    this.setList('projects', omitItem(this.resume.projects, id))
  }

  addEducation() {
    this.setList('education', [...this.resume.education, createEducation()])
  }

  updateEducation(id: string, patch: Partial<Education>) {
    this.setList('education', patchItem(this.resume.education, id, patch))
  }

  removeEducation(id: string) {
    this.setList('education', omitItem(this.resume.education, id))
  }

  addCertificate() {
    this.setList('certificates', [
      ...this.resume.certificates,
      createCertificate(),
    ])
  }

  updateCertificate(id: string, patch: Partial<Certificate>) {
    this.setList('certificates', patchItem(this.resume.certificates, id, patch))
  }

  removeCertificate(id: string) {
    this.setList('certificates', omitItem(this.resume.certificates, id))
  }

  async pickPhoto() {
    const photo = await pickPhotoDataUrl()
    if (photo) this.updateBasic({ photo })
  }

  clearPhoto() {
    this.updateBasic({ photo: '' })
  }

  private setList<
    K extends 'experience' | 'projects' | 'education' | 'certificates'
  >(key: K, items: ResumeData[K]) {
    this.resume = { ...this.resume, [key]: items }
  }

  async exportPdf(filePath?: string) {
    let path = filePath
    if (!path) {
      const name = this.resume.basic.name || 'resume'
      const result = await tinker.showSaveDialog({
        defaultPath: `${name}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      })
      if (result.canceled || !result.filePath) return false
      path = result.filePath
    }

    this.exporting = true
    try {
      await exportResumePdf(path)
      return path
    } finally {
      this.exporting = false
    }
  }

  private readStoredResume() {
    const keys = ['resume', 'resumeZh', 'resumeEn']
    const key = find(keys, (item) => isResumeData(storage.get(item)))
    if (!key) return null
    return normalizeResume(jsonClone(storage.get(key)))
  }

  private loadStorage() {
    const savedResume = this.readStoredResume()
    if (savedResume) {
      this.resume = savedResume
      this.persistEnabled = true
    }

    const savedTemplate = storage.get<string | undefined>(STORAGE_TEMPLATE)
    if (isTemplateId(savedTemplate)) this.templateId = savedTemplate

    const savedTheme = storage.get<string | undefined>(STORAGE_THEME)
    if (isThemeColor(savedTheme)) this.themeColor = savedTheme

    const savedSection = storage.get<string | undefined>(STORAGE_SECTION)
    if (
      isStr(savedSection) &&
      find(this.resume.menuSections, (section) => section.id === savedSection)
    ) {
      this.activeSection = savedSection
    }
  }

  private bindLanguage() {
    tinker.getLanguage().then((language) => {
      if (!this.persistEnabled) {
        this.resume = createDefaultResume(language)
      }
      this.persistEnabled = true
    })
  }

  private persist() {
    const save = debounce(() => {
      if (!this.persistEnabled) return
      storage.set(STORAGE_RESUME, jsonClone(this.resume))
      storage.set(STORAGE_TEMPLATE, this.templateId)
      storage.set(STORAGE_SECTION, this.activeSection)
      storage.set(STORAGE_THEME, this.themeColor)
    }, 200)

    reaction(
      () => [this.resume, this.templateId, this.activeSection, this.themeColor],
      () => save()
    )
  }
}

export default new Store()
