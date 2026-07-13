import { contextBridge } from 'electron'
import { exec } from 'share/tools/shellImpl'
import {
  getRepoPath,
  openRepository,
  getBranches,
  getCommits,
  searchCommits,
  getAuthors,
  getCommitDetail,
  getCommitTree,
  getCommitFileContent,
  getCommitFileContentBinary,
  getCommitFileBlame,
  getCheckoutInfo,
  getWorkingTreeStatus,
  getWorkingTreeFileDiffContent,
  stageFile,
  unstageFile,
  discardFile,
  stageFiles,
  unstageAllFiles,
  discardFiles,
  commitStaged,
  watchWorkingTree,
} from 'share/preload/git'

const api = {
  getRepoPath,
  openRepository,
  getBranches,
  getCommits,
  searchCommits,
  getAuthors,
  getCommitDetail,
  getCommitTree,
  getCommitFileContent,
  getCommitFileContentBinary,
  getCommitFileBlame,
  getCheckoutInfo,
  getWorkingTreeStatus,
  getWorkingTreeFileDiffContent,
  stageFile,
  unstageFile,
  discardFile,
  stageFiles,
  unstageAllFiles,
  discardFiles,
  commitStaged,
  watchWorkingTree,
  exec,
}

contextBridge.exposeInMainWorld('git', api)

declare global {
  const git: typeof api
}
