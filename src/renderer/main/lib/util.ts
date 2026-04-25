import naturalSort from 'licia/naturalSort'
import lowerCase from 'licia/lowerCase'
import contain from 'licia/contain'
import each from 'licia/each'
import pinyin from 'pinyin'
import { isObservable, toJS } from 'mobx'

const chineseRe = /[\u4e00-\u9fa5]/

function toPinyin(str: string): string {
  if (!chineseRe.test(str)) {
    return str
  }

  return pinyin(str, { style: 'normal', segment: true })
    .map((p) => p[0])
    .join('')
}

function toFirstLetter(str: string): string {
  if (!chineseRe.test(str)) {
    return str
  }

  return pinyin(str, { style: 'first_letter', segment: true })
    .map((p) => p[0])
    .join('')
}

export function pinyinMatch(input: string, keyword: string): boolean {
  input = lowerCase(input)
  keyword = lowerCase(keyword)

  return (
    contain(input, keyword) ||
    contain(toPinyin(input), keyword) ||
    contain(toFirstLetter(input), keyword)
  )
}

export function sortByName<T extends { name: string }>(arr: T[]): T[] {
  const nameMap = new Map<T, string>()
  each(arr, (item) => nameMap.set(item, lowerCase(toPinyin(item.name))))
  return arr.sort((a, b) =>
    naturalSort.comparator(nameMap.get(a)!, nameMap.get(b)!)
  )
}

export async function setMainStore(name: string, val: any) {
  await main.setMainStore(name, isObservable(val) ? toJS(val) : val)
}
