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
  watchWorkingTree,
} from 'share/preload/git'

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
