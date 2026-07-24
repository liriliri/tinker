import average from 'licia/average'
import base64 from 'licia/base64'
import bytesToStr from 'licia/bytesToStr'
import camelCase from 'licia/camelCase'
import capitalize from 'licia/capitalize'
import chunk from 'licia/chunk'
import clamp from 'licia/clamp'
import className from 'licia/className'
import clone from 'licia/clone'
import Color from 'licia/Color'
import compact from 'licia/compact'
import contain from 'licia/contain'
import convertBin from 'licia/convertBin'
import copy from 'licia/copy'
import createUrl from 'licia/createUrl'
import dataUrl from 'licia/dataUrl'
import dateFormat from 'licia/dateFormat'
import debounce from 'licia/debounce'
import decodeUriComponent from 'licia/decodeUriComponent'
import download from 'licia/download'
import durationFormat from 'licia/durationFormat'
import each from 'licia/each'
import endWith from 'licia/endWith'
import extend from 'licia/extend'
import escape from 'licia/escape'
import escapeRegExp from 'licia/escapeRegExp'
import evalCss from 'licia/evalCss'
import easing from 'licia/easing'
import fileSize from 'licia/fileSize'
import fileUrl from 'licia/fileUrl'
import fill from 'licia/fill'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import findKey from 'licia/findKey'
import flatten from 'licia/flatten'
import fullscreen from 'licia/fullscreen'
import has from 'licia/has'
import hex from 'licia/hex'
import isArr from 'licia/isArr'
import isBool from 'licia/isBool'
import isDataUrl from 'licia/isDataUrl'
import isEmpty from 'licia/isEmpty'
import isEqual from 'licia/isEqual'
import isErr from 'licia/isErr'
import isJson from 'licia/isJson'
import isMac from 'licia/isMac'
import isNil from 'licia/isNil'
import isObj from 'licia/isObj'
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
import loadImg from 'licia/loadImg'
import LocalStore from 'licia/LocalStore'
import lowerCase from 'licia/lowerCase'
import lpad from 'licia/lpad'
import ltrim from 'licia/ltrim'
import map from 'licia/map'
import mapObj from 'licia/mapObj'
import max from 'licia/max'
import md5 from 'licia/md5'
import mime from 'licia/mime'
import min from 'licia/min'
import ms from 'licia/ms'
import naturalSort from 'licia/naturalSort'
import normalizePath from 'licia/normalizePath'
import noop from 'licia/noop'
import once from 'licia/once'
import openFile from 'licia/openFile'
import pluck from 'licia/pluck'
import precision from 'licia/precision'
import promisify from 'licia/promisify'
import query from 'licia/query'
import randomBytes from 'licia/randomBytes'
import randomItem from 'licia/randomItem'
import range from 'licia/range'
import remove from 'licia/remove'
import replaceAll from 'licia/replaceAll'
import rtrim from 'licia/rtrim'
import shuffle from 'licia/shuffle'
import sleep from 'licia/sleep'
import snakeCase from 'licia/snakeCase'
import some from 'licia/some'
import sortBy from 'licia/sortBy'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import stripHtmlTag from 'licia/stripHtmlTag'
import strToBytes from 'licia/strToBytes'
import sum from 'licia/sum'
import toInt from 'licia/toInt'
import toNum from 'licia/toNum'
import toBool from 'licia/toBool'
import toStr from 'licia/toStr'
import trim from 'licia/trim'
import truncate from 'licia/truncate'
import unescape from 'licia/unescape'
import unique from 'licia/unique'
import upperCase from 'licia/upperCase'
import upperFirst from 'licia/upperFirst'
import uuid from 'licia/uuid'
import values from 'licia/values'

const licia = {
  average,
  base64,
  bytesToStr,
  camelCase,
  capitalize,
  chunk,
  clamp,
  className,
  clone,
  Color,
  compact,
  contain,
  convertBin,
  copy,
  createUrl,
  dataUrl,
  dateFormat,
  debounce,
  decodeUriComponent,
  download,
  durationFormat,
  each,
  endWith,
  extend,
  escape,
  escapeRegExp,
  evalCss,
  easing,
  fileSize,
  fileUrl,
  fill,
  filter,
  find,
  findIdx,
  findKey,
  flatten,
  fullscreen,
  has,
  hex,
  isArr,
  isBool,
  isDataUrl,
  isEmpty,
  isEqual,
  isErr,
  isJson,
  isMac,
  isNil,
  isObj,
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
  loadImg,
  LocalStore,
  lowerCase,
  lpad,
  ltrim,
  map,
  mapObj,
  max,
  md5,
  mime,
  min,
  ms,
  naturalSort,
  normalizePath,
  noop,
  once,
  openFile,
  pluck,
  precision,
  promisify,
  query,
  randomBytes,
  randomItem,
  range,
  remove,
  replaceAll,
  rtrim,
  shuffle,
  sleep,
  snakeCase,
  some,
  sortBy,
  splitPath,
  startWith,
  stripHtmlTag,
  strToBytes,
  sum,
  toInt,
  toNum,
  toBool,
  toStr,
  trim,
  truncate,
  unescape,
  unique,
  upperCase,
  upperFirst,
  uuid,
  values,
}

const g = globalThis as Record<string, unknown>
g.licia = licia

export {
  average,
  base64,
  bytesToStr,
  camelCase,
  capitalize,
  chunk,
  clamp,
  className,
  clone,
  Color,
  compact,
  contain,
  convertBin,
  copy,
  createUrl,
  dataUrl,
  dateFormat,
  debounce,
  decodeUriComponent,
  download,
  durationFormat,
  each,
  endWith,
  extend,
  escape,
  escapeRegExp,
  evalCss,
  easing,
  fileSize,
  fileUrl,
  fill,
  filter,
  find,
  findIdx,
  findKey,
  flatten,
  fullscreen,
  has,
  hex,
  isArr,
  isBool,
  isDataUrl,
  isEmpty,
  isEqual,
  isErr,
  isJson,
  isMac,
  isNil,
  isObj,
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
  loadImg,
  LocalStore,
  lowerCase,
  lpad,
  ltrim,
  map,
  mapObj,
  max,
  md5,
  mime,
  min,
  ms,
  naturalSort,
  normalizePath,
  noop,
  once,
  openFile,
  pluck,
  precision,
  promisify,
  query,
  randomBytes,
  randomItem,
  range,
  remove,
  replaceAll,
  rtrim,
  shuffle,
  sleep,
  snakeCase,
  some,
  sortBy,
  splitPath,
  startWith,
  stripHtmlTag,
  strToBytes,
  sum,
  toInt,
  toNum,
  toBool,
  toStr,
  trim,
  truncate,
  unescape,
  unique,
  upperCase,
  upperFirst,
  uuid,
  values,
}
