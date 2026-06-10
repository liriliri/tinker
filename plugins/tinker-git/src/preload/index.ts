import { contextBridge } from 'electron'
import {
  getRepoPath,
  openRepository,
  getBranches,
  getCommits,
  getCommitDetail,
  getCommitTree,
  getCommitFileContent,
  getCommitFileContentBinary,
  getCommitFileBlame,
} from 'share/preload/git'

const gitObj = {
  getRepoPath,
  openRepository,
  getBranches,
  getCommits,
  getCommitDetail,
  getCommitTree,
  getCommitFileContent,
  getCommitFileContentBinary,
  getCommitFileBlame,
}

contextBridge.exposeInMainWorld('git', gitObj)

declare global {
  const git: typeof gitObj
}
