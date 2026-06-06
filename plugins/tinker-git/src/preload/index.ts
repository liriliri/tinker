import { contextBridge } from 'electron'
import {
  getRepoPath,
  openRepository,
  getBranches,
  getCommits,
  getCommitDetail,
  getCommitTree,
  getCommitFileContent,
  getCommitFileBlame,
} from '../../../share/preload/git'

const gitObj = {
  getRepoPath,
  openRepository,
  getBranches,
  getCommits,
  getCommitDetail,
  getCommitTree,
  getCommitFileContent,
  getCommitFileBlame,
}

contextBridge.exposeInMainWorld('git', gitObj)

declare global {
  const git: typeof gitObj
}
