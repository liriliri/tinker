import { contextBridge } from 'electron'
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
} from 'share/preload/git'
import { watchWorkingTree } from './workingTreeWatch'

const gitObj = {
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
}

contextBridge.exposeInMainWorld('git', gitObj)

declare global {
  const git: typeof gitObj
}
