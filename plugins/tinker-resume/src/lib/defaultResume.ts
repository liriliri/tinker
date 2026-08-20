import uuid from 'licia/uuid'
import map from 'licia/map'
import startWith from 'licia/startWith'
import type {
  Certificate,
  Education,
  Experience,
  Project,
  ResumeBasic,
  ResumeData,
} from '../types'

const SAMPLE_MENU_SECTIONS = [
  { id: 'basic', enabled: true },
  { id: 'education', enabled: true },
  { id: 'skills', enabled: true },
  { id: 'experience', enabled: true },
  { id: 'projects', enabled: true },
]

const ZH_BASIC: ResumeBasic = {
  name: '林晚舟',
  title: '前端工程师',
  email: 'linwanzhou@example.com',
  phone: '13900001111',
  location: '杭州市西湖区',
  birthDate: '1996-08',
  employementStatus: '在职',
  website: 'https://linwanzhou.dev',
  photo: '',
}

const EN_BASIC: ResumeBasic = {
  name: 'Lin Wanzhou',
  title: 'Frontend Engineer',
  email: 'linwanzhou@example.com',
  phone: '13900001111',
  location: 'Hangzhou, Xihu',
  birthDate: '1996-08',
  employementStatus: 'Employed',
  website: 'https://linwanzhou.dev',
  photo: '',
}

function zhResume(): ResumeData {
  return {
    basic: { ...ZH_BASIC },
    skillContent: [
      '- 熟悉 React、TypeScript，能独立完成页面与组件开发',
      '- 了解 Vite、ESLint 等前端工程化配置',
      '- 关注交互细节与基础性能优化',
    ].join('\n'),
    experience: [
      {
        id: uuid(),
        company: '青梧网络',
        position: '前端工程师',
        date: '2022.03 - 至今',
        details: [
          '- 负责内部协作工具的页面开发与组件维护',
          '- 将常用表单、筛选与列表抽成公共组件，减少重复代码',
          '- 配合设计补齐空态、加载与错误提示，统一交互细节',
          '- 跟进版本发布，处理线上反馈中的样式与兼容问题',
        ].join('\n'),
        visible: true,
      },
      {
        id: uuid(),
        company: '岸北工作室',
        position: '初级前端工程师',
        date: '2018.07 - 2022.02',
        details: [
          '- 参与客户官网与活动落地页的切图与交互实现',
          '- 用 React 改写若干重复页面，方便运营自行替换文案与图片',
          '- 协助联调接口，处理表单校验、分页与上传预览',
          '- 维护内部组件文档，方便新同学快速上手常用模块',
        ].join('\n'),
        visible: true,
      },
    ],
    projects: [
      {
        id: uuid(),
        name: '灯下待办',
        role: '独立开发',
        date: '2023.05 - 2023.09',
        description: [
          '- 本地优先的待办小工具，支持列表分组、标签与快捷筛选',
          '- 使用 React 完成界面，数据保存在本地，支持导入导出',
          '- 加入键盘快捷键与拖拽排序，方便日常整理任务',
        ].join('\n'),
        visible: true,
      },
      {
        id: uuid(),
        name: '晴窗记账',
        role: '前端开发',
        date: '2021.11 - 2022.04',
        description: [
          '- 个人记账应用，按月份汇总支出，支持分类与备注搜索',
          '- 负责图表页与分类管理，处理空数据和跨月切换',
          '- 抽离金额输入与日期选择组件，供其他页面复用',
        ].join('\n'),
        visible: true,
      },
    ],
    education: [
      {
        id: uuid(),
        school: '临川大学',
        major: '软件工程',
        degree: '本科',
        startDate: '2014.09',
        endDate: '2018.06',
        description: '',
        visible: true,
      },
    ],
    selfEvaluationContent: '',
    certificates: [],
    menuSections: map(SAMPLE_MENU_SECTIONS, (section) => ({ ...section })),
  }
}

function enResume(): ResumeData {
  return {
    basic: { ...EN_BASIC },
    skillContent: [
      '- Comfortable with React and TypeScript for day-to-day UI work',
      '- Familiar with Vite and ESLint for local tooling',
      '- Care about interaction details and basic performance',
    ].join('\n'),
    experience: [
      {
        id: uuid(),
        company: 'Qingwu Network',
        position: 'Frontend Engineer',
        date: '2022.03 - Present',
        details: [
          '- Built pages and shared components for an internal collaboration tool',
          '- Extracted common form, filter, and list patterns to cut duplication',
          '- Worked with design on empty, loading, and error states',
          '- Helped with releases and fixed layout and compatibility issues from user feedback',
        ].join('\n'),
        visible: true,
      },
      {
        id: uuid(),
        company: 'Anbei Studio',
        position: 'Junior Frontend Engineer',
        date: '2018.07 - 2022.02',
        details: [
          '- Implemented marketing sites and campaign landing pages from design mocks',
          '- Rebuilt several repeated pages in React so copy and images could be swapped easily',
          '- Helped wire up APIs for validation, pagination, and upload previews',
          '- Kept a short component guide so new teammates could reuse common modules',
        ].join('\n'),
        visible: true,
      },
    ],
    projects: [
      {
        id: uuid(),
        name: 'Lampshade Todos',
        role: 'Solo developer',
        date: '2023.05 - 2023.09',
        description: [
          '- A local-first todo tool with grouped lists, tags, and quick filters',
          '- Built the UI in React with on-device storage, plus import and export',
          '- Added keyboard shortcuts and drag-and-drop so tasks are easier to sort',
        ].join('\n'),
        visible: true,
      },
      {
        id: uuid(),
        name: 'Sill Ledger',
        role: 'Frontend developer',
        date: '2021.11 - 2022.04',
        description: [
          '- A personal expense app with monthly totals, categories, and note search',
          '- Owned the chart page and category manager, including empty and month-switch states',
          '- Extracted amount and date inputs for reuse on other screens',
        ].join('\n'),
        visible: true,
      },
    ],
    education: [
      {
        id: uuid(),
        school: 'Linchuan University',
        major: 'Software Engineering',
        degree: 'B.S.',
        startDate: '2014.09',
        endDate: '2018.06',
        description: '',
        visible: true,
      },
    ],
    selfEvaluationContent: '',
    certificates: [],
    menuSections: map(SAMPLE_MENU_SECTIONS, (section) => ({ ...section })),
  }
}

function isZhLanguage(language: string) {
  return startWith(language, 'zh')
}

export function createDefaultResume(language: string): ResumeData {
  return isZhLanguage(language) ? zhResume() : enResume()
}

export function createExperience(): Experience {
  return {
    id: uuid(),
    company: '',
    position: '',
    date: '',
    details: '',
    visible: true,
  }
}

export function createProject(): Project {
  return {
    id: uuid(),
    name: '',
    role: '',
    date: '',
    description: '',
    visible: true,
  }
}

export function createEducation(): Education {
  return {
    id: uuid(),
    school: '',
    major: '',
    degree: '',
    startDate: '',
    endDate: '',
    description: '',
    visible: true,
  }
}

export function createCertificate(): Certificate {
  return {
    id: uuid(),
    name: '',
    issuer: '',
    date: '',
    description: '',
    visible: true,
  }
}
