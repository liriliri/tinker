export type TemplateId = 'classic' | 'sidebar'

export interface MenuSection {
  id: string
  enabled: boolean
}

export interface ResumeBasic {
  name: string
  title: string
  email: string
  phone: string
  location: string
  birthDate: string
  employementStatus: string
  website: string
  photo: string
}

export interface Experience {
  id: string
  company: string
  position: string
  date: string
  details: string
  visible: boolean
}

export interface Education {
  id: string
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
  description: string
  visible: boolean
}

export interface Project {
  id: string
  name: string
  role: string
  date: string
  description: string
  visible: boolean
}

export interface Certificate {
  id: string
  name: string
  issuer: string
  date: string
  description: string
  visible: boolean
}

export interface ResumeData {
  basic: ResumeBasic
  skillContent: string
  selfEvaluationContent: string
  experience: Experience[]
  projects: Project[]
  education: Education[]
  certificates: Certificate[]
  menuSections: MenuSection[]
}

export interface ResumeTemplateProps {
  resume: ResumeData
  themeColor: string
}
