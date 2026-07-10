import fs from 'fs'
import path from 'path'
import { resolveResources } from './util'

interface SkillInfo {
  name: string
  description: string
  dir: string
}

function parseFrontmatter(
  content: string
): { name: string; description: string } | null {
  const trimmed = content.trimStart()
  if (!trimmed.startsWith('---')) {
    return null
  }
  const afterOpening = trimmed.slice(3)
  const end = afterOpening.indexOf('\n---')
  if (end === -1) {
    return null
  }
  const frontmatter = afterOpening.slice(0, end)

  let name: string | undefined
  let description = ''
  const lines = frontmatter.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('name:')) {
      name = line.slice('name:'.length).trim()
    } else if (line.startsWith('description:')) {
      let desc = line.slice('description:'.length).trim()
      while (
        i + 1 < lines.length &&
        (lines[i + 1].startsWith('  ') || lines[i + 1].startsWith('\t'))
      ) {
        i += 1
        desc += ` ${lines[i].trim()}`
      }
      description = desc
    }
    i += 1
  }

  if (!name) {
    return null
  }
  return { name, description }
}

function discoverSkills(skillsDir: string): SkillInfo[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true })
  } catch {
    return []
  }

  const skills: SkillInfo[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const dir = path.join(skillsDir, entry.name)
    const skillMd = path.join(dir, 'SKILL.md')
    if (!fs.existsSync(skillMd)) {
      continue
    }
    let content: string
    try {
      content = fs.readFileSync(skillMd, 'utf8')
    } catch {
      continue
    }
    const parsed = parseFrontmatter(content)
    if (!parsed) {
      continue
    }
    skills.push({
      name: parsed.name,
      description: parsed.description,
      dir,
    })
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))
  return skills
}

function truncateDescription(desc: string, maxLen: number): string {
  if (desc.length <= maxLen) {
    return desc
  }
  const slice = desc.slice(0, maxLen)
  const space = slice.lastIndexOf(' ')
  const end = space === -1 ? maxLen : space
  return `${desc.slice(0, end)}...`
}

function ensureSkillsDir(): string {
  const skillsDir = resolveResources('skills')
  if (!fs.existsSync(skillsDir)) {
    console.error(`Error: Skills directory not found: ${skillsDir}`)
    process.exit(1)
  }
  return skillsDir
}

export function runSkillsList() {
  const skillsDir = ensureSkillsDir()
  const skills = discoverSkills(skillsDir)
  if (skills.length === 0) {
    console.log('No skills found')
    return
  }

  const maxName = Math.max(...skills.map((s) => s.name.length))
  for (const skill of skills) {
    console.log(
      `  ${skill.name.padEnd(maxName)}  ${truncateDescription(
        skill.description,
        70
      )}`
    )
  }
}

export function runSkillsPath(name?: string) {
  const skillsDir = ensureSkillsDir()
  if (!name) {
    console.log(skillsDir)
    return
  }

  const skills = discoverSkills(skillsDir)
  const skill = skills.find((s) => s.name === name)
  if (!skill) {
    console.error(`Error: Skill not found: ${name}`)
    process.exit(1)
  }
  console.log(skill.dir)
}

export function runSkills(args: string[]) {
  const subcommand = args[0] || 'list'
  const name = args[1]

  if (subcommand === 'list') {
    runSkillsList()
    return
  }
  if (subcommand === 'path') {
    runSkillsPath(name)
    return
  }

  console.error(`Error: Unknown skills subcommand: ${subcommand}`)
  process.exit(1)
}
