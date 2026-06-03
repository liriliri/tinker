import dateFormat from 'licia/dateFormat'
import type { GitCommitDetail } from '../../common/types'

export function formatCommitContent(commit: GitCommitDetail): string {
  const lines = [
    `commit ${commit.sha}`,
    `Author: ${commit.author} <${commit.email}>`,
    `Date: ${dateFormat(new Date(commit.date), 'yyyy-mm-dd HH:MM:ss')}`,
    '',
    `    ${commit.summary}`,
  ]

  if (commit.body) {
    lines.push('')
    commit.body.split('\n').forEach((line) => {
      lines.push(`    ${line}`)
    })
  }

  if (commit.diff) {
    lines.push('', commit.diff)
  }

  return lines.join('\n')
}
