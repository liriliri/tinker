import average from 'licia/average'
import base64 from 'licia/base64'
import camelCase from 'licia/camelCase'
import capitalize from 'licia/capitalize'
import clamp from 'licia/clamp'
import className from 'licia/className'
import compact from 'licia/compact'
import contain from 'licia/contain'
import convertBin from 'licia/convertBin'
import copy from 'licia/copy'
import dataUrl from 'licia/dataUrl'
import dateFormat from 'licia/dateFormat'
import debounce from 'licia/debounce'
import decodeUriComponent from 'licia/decodeUriComponent'
import download from 'licia/download'
import durationFormat from 'licia/durationFormat'
import each from 'licia/each'
import endWith from 'licia/endWith'
import escape from 'licia/escape'
import escapeRegExp from 'licia/escapeRegExp'
import evalCss from 'licia/evalCss'
import fileSize from 'licia/fileSize'
import fileUrl from 'licia/fileUrl'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import findKey from 'licia/findKey'
import fullscreen from 'licia/fullscreen'
import has from 'licia/has'
import isArr from 'licia/isArr'
import isDataUrl from 'licia/isDataUrl'
import isEmpty from 'licia/isEmpty'
import isEqual from 'licia/isEqual'
import isMac from 'licia/isMac'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import isUndef from 'licia/isUndef'
import isUrl from 'licia/isUrl'
import isWindows from 'licia/isWindows'
import jsonClone from 'licia/jsonClone'
import kebabCase from 'licia/kebabCase'
import last from 'licia/last'
import keys from 'licia/keys'
import LinkedList from 'licia/LinkedList'
import LocalStore from 'licia/LocalStore'
import lowerCase from 'licia/lowerCase'
import lpad from 'licia/lpad'
import map from 'licia/map'
import md5 from 'licia/md5'
import mime from 'licia/mime'
import naturalSort from 'licia/naturalSort'
import once from 'licia/once'
import pluck from 'licia/pluck'
import openFile from 'licia/openFile'
import query from 'licia/query'
import randomBytes from 'licia/randomBytes'
import remove from 'licia/remove'
import shuffle from 'licia/shuffle'
import snakeCase from 'licia/snakeCase'
import sortBy from 'licia/sortBy'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import stripHtmlTag from 'licia/stripHtmlTag'
import sum from 'licia/sum'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import truncate from 'licia/truncate'
import unescape from 'licia/unescape'
import upperCase from 'licia/upperCase'
import upperFirst from 'licia/upperFirst'
import uuid from 'licia/uuid'

const licia = {
  average,
  base64,
  camelCase,
  capitalize,
  clamp,
  className,
  compact,
  contain,
  convertBin,
  copy,
  dataUrl,
  dateFormat,
  debounce,
  decodeUriComponent,
  download,
  durationFormat,
  each,
  endWith,
  escape,
  escapeRegExp,
  evalCss,
  fileSize,
  fileUrl,
  filter,
  find,
  findIdx,
  findKey,
  fullscreen,
  has,
  isArr,
  isDataUrl,
  isEmpty,
  isEqual,
  isMac,
  isStr,
  isStrBlank,
  isUndef,
  isUrl,
  isWindows,
  jsonClone,
  kebabCase,
  keys,
  last,
  LinkedList,
  LocalStore,
  lowerCase,
  lpad,
  map,
  md5,
  mime,
  naturalSort,
  once,
  openFile,
  pluck,
  query,
  randomBytes,
  remove,
  shuffle,
  snakeCase,
  sortBy,
  splitPath,
  startWith,
  stripHtmlTag,
  sum,
  toNum,
  trim,
  truncate,
  unescape,
  upperCase,
  upperFirst,
  uuid,
}

const g = globalThis as Record<string, unknown>
g.licia = licia

export {
  average,
  base64,
  camelCase,
  capitalize,
  clamp,
  className,
  compact,
  contain,
  convertBin,
  copy,
  dataUrl,
  dateFormat,
  debounce,
  decodeUriComponent,
  download,
  durationFormat,
  each,
  endWith,
  escape,
  escapeRegExp,
  evalCss,
  fileSize,
  fileUrl,
  filter,
  find,
  findIdx,
  findKey,
  fullscreen,
  has,
  isArr,
  isDataUrl,
  isEmpty,
  isEqual,
  isMac,
  isStr,
  isStrBlank,
  isUndef,
  isUrl,
  isWindows,
  jsonClone,
  kebabCase,
  keys,
  last,
  LinkedList,
  LocalStore,
  lowerCase,
  lpad,
  map,
  md5,
  mime,
  naturalSort,
  once,
  openFile,
  pluck,
  query,
  randomBytes,
  remove,
  shuffle,
  snakeCase,
  sortBy,
  splitPath,
  startWith,
  stripHtmlTag,
  sum,
  toNum,
  trim,
  truncate,
  unescape,
  upperCase,
  upperFirst,
  uuid,
}
