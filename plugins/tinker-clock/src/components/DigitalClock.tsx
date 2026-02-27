import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { THEME_COLORS } from 'share/theme'
import store from '../store'
import { getTimeForTimezone } from '../lib/timezone'

const DigitalClock = observer(() => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const color = store.isDark
      ? THEME_COLORS.text.dark.primary
      : THEME_COLORS.text.light.primary
    const backgroundColor = store.isDark
      ? THEME_COLORS.bg.dark.primary
      : THEME_COLORS.bg.light.primary

    const timeObj = {
      numberPathsD: {
        topM: 'M 8 4 L 16 4 L 18 6 L 16 8 L 8 8 L 6 6 Z',
        midd: 'M 8 18 L 16 18 L 18 20 L 16 22 L 8 22 L 6 20 Z',
        topL: 'M 6 7 L 8 9 L 8 17 L 6 19 L 4 17 L 4 9 Z',
        topR: 'M 18 7 L 20 9 L 20 17 L 18 19 L 16 17 L 16 9 Z',
        btmM: 'M 8 32 L 16 32 L 18 34 L 16 36 L 8 36 L 6 34 Z',
        btmL: 'M 6 21 L 8 23 L 8 31 L 6 33 L 4 31 L 4 23 Z',
        btmR: 'M 18 21 L 20 23 L 20 31 L 18 33 L 16 31 L 16 23 Z',
      },
      seconds: {
        topM: [1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
        midd: [0, 0, 1, 1, 1, 1, 1, 0, 1, 1],
        topL: [1, 0, 0, 0, 1, 1, 1, 0, 1, 1],
        topR: [1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
        btmM: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        btmL: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        btmR: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      },
      tenSeconds: {
        topM: [1, 0, 1, 1, 0, 1],
        midd: [0, 0, 1, 1, 1, 1],
        topL: [1, 0, 0, 0, 1, 1],
        topR: [1, 1, 1, 1, 1, 0],
        btmM: [1, 0, 1, 1, 0, 1],
        btmL: [1, 0, 1, 0, 0, 0],
        btmR: [1, 1, 0, 1, 1, 1],
      },
      minutes: {
        topM: [1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
        midd: [0, 0, 1, 1, 1, 1, 1, 0, 1, 1],
        topL: [1, 0, 0, 0, 1, 1, 1, 0, 1, 1],
        topR: [1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
        btmM: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        btmL: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        btmR: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      },
      tenMinutes: {
        topM: [1, 0, 1, 1, 0, 1],
        midd: [0, 0, 1, 1, 1, 1],
        topL: [1, 0, 0, 0, 1, 1],
        topR: [1, 1, 1, 1, 1, 0],
        btmM: [1, 0, 1, 1, 0, 1],
        btmL: [1, 0, 1, 0, 0, 0],
        btmR: [1, 1, 0, 1, 1, 1],
      },
      hours: {
        topM: [
          1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1,
          0,
        ],
        midd: [
          1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0,
          0,
        ],
        topL: [
          0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1,
          0,
        ],
        topR: [
          1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1,
          1,
        ],
        btmM: [
          1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1,
          0,
        ],
        btmL: [
          1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1,
          0,
        ],
        btmR: [
          0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
          1,
        ],
      },
      tenHours: {
        topM: [
          0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
          0,
        ],
        midd: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0,
        ],
        topL: [
          0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
          0,
        ],
        topR: [
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
          1,
        ],
        btmM: [
          0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
          0,
        ],
        btmL: [
          0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
          0,
        ],
        btmR: [
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
          1,
        ],
      },
    }

    const now = getTimeForTimezone(store.timezone)
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const milliseconds = now.getMilliseconds()

    const HH = hours.toString().padStart(2, '0')
    const MM = minutes.toString().padStart(2, '0')
    const SS = seconds.toString().padStart(2, '0')
    const M0 = parseInt(MM.charAt(0))
    const M1 = parseInt(MM.charAt(1))
    const S0 = parseInt(SS.charAt(0))
    const S1 = parseInt(SS.charAt(1))
    const onesDigit = seconds % 10

    const milliAnimStartPercent = milliseconds / 1000

    const shiftAtIndex = (arr: number[], index: number) => {
      const rm = arr.splice(0, index)
      arr.push(...rm)
      return arr
    }

    const adjustProps = (digit: keyof typeof timeObj, numberIndex: number) => {
      for (const prop in timeObj[digit]) {
        const key = prop as keyof (typeof timeObj)[typeof digit]
        const value = timeObj[digit][key]
        if (Array.isArray(value)) {
          timeObj[digit][key] = shiftAtIndex([...value], numberIndex) as any
        }
      }
    }

    adjustProps('seconds', S1)
    adjustProps('tenSeconds', S0)
    adjustProps('minutes', M1)
    adjustProps('tenMinutes', M0)
    adjustProps('hours', parseInt(HH))
    adjustProps('tenHours', parseInt(HH))

    const populateAnimations = (
      array: number[],
      pathD: string,
      waitTime: string,
      id: string,
      alreadyCompleted: string
    ) => {
      const arrLen = array.length
      let path = `<path d="${pathD}" opacity="${array[0]}">
        <animate id="${id}0" attributeName="opacity" dur=".1s" begin="${alreadyCompleted}; ${id}${
        arrLen - 1
      }.end+${waitTime}" fill="freeze" values="${array[0]}; ${array[1]}"/>`

      for (let i = 1; i < array.length - 1; i++) {
        path += `<animate id="${id}${i}" attributeName="opacity" dur=".1s" begin="${id}${
          i - 1
        }.end+${waitTime}" fill="freeze" values="${array[i]}; ${
          array[i + 1]
        }"/>`
      }

      path += `<animate id="${id}${
        arrLen - 1
      }" attributeName="opacity" dur=".1s" begin="${id}${
        arrLen - 2
      }.end+${waitTime}" fill="freeze" values="${array[arrLen - 1]}; ${
        array[0]
      }" /></path>`
      return path
    }

    const sDelay = milliAnimStartPercent
    const stDelay = 9 - onesDigit + sDelay
    const mDelay = 59 - seconds + milliAnimStartPercent
    const mtDelay = 599 - 599 * (M1 / 10) - 59.9 + mDelay
    const hDelay = 3599 - (3599 * (minutes / 60) + 60 - mDelay)
    const htDelay = 3599 - (3599 * (minutes / 60) + 60 - mDelay)

    const digitClasses: Array<keyof typeof timeObj.numberPathsD> = [
      'topM',
      'midd',
      'topL',
      'topR',
      'btmM',
      'btmL',
      'btmR',
    ]
    const s: string[] = []
    const st: string[] = []
    const m: string[] = []
    const mt: string[] = []
    const h: string[] = []
    const ht: string[] = []

    for (let i = 0; i < digitClasses.length; i++) {
      s.push(
        populateAnimations(
          timeObj.seconds[digitClasses[i]],
          timeObj.numberPathsD[digitClasses[i]],
          '0.9s',
          'sec',
          `${sDelay}s`
        )
      )

      st.push(
        populateAnimations(
          timeObj.tenSeconds[digitClasses[i]],
          timeObj.numberPathsD[digitClasses[i]],
          '9.9s',
          'tenSec',
          `${stDelay}s`
        )
      )

      m.push(
        populateAnimations(
          timeObj.minutes[digitClasses[i]],
          timeObj.numberPathsD[digitClasses[i]],
          '59.9s',
          'min',
          `${mDelay}s`
        )
      )

      mt.push(
        populateAnimations(
          timeObj.tenMinutes[digitClasses[i]],
          timeObj.numberPathsD[digitClasses[i]],
          '599.9s',
          'tenMin',
          `${mtDelay}s`
        )
      )

      h.push(
        populateAnimations(
          timeObj.hours[digitClasses[i]],
          timeObj.numberPathsD[digitClasses[i]],
          '3599.9s',
          'hr',
          `${hDelay}s`
        )
      )

      ht.push(
        populateAnimations(
          timeObj.tenHours[digitClasses[i]],
          timeObj.numberPathsD[digitClasses[i]],
          '3599.9s',
          'tenHr',
          `${htDelay}s`
        )
      )
    }

    const secG = `<g transform="translate(116 0)">${s[0]} ${s[1]} ${s[2]} ${s[3]} ${s[4]} ${s[5]} ${s[6]}</g>`
    const secTG = `<g transform="translate(96 0)">${st[0]} ${st[1]} ${st[2]} ${st[3]} ${st[4]} ${st[5]} ${st[6]}</g>`
    const minG = `<g transform="translate(68 0)">${m[0]} ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]} ${m[6]}</g>`
    const minTG = `<g transform="translate(48 0)">${mt[0]} ${mt[1]} ${mt[2]} ${mt[3]} ${mt[4]} ${mt[5]} ${mt[6]}</g>`
    const hrG = `<g transform="translate(20 0)">${h[0]} ${h[1]} ${h[2]} ${h[3]} ${h[4]} ${h[5]} ${h[6]}</g>`
    const hrTG = `<g transform="translate(0 0)">${ht[0]} ${ht[1]} ${ht[2]} ${ht[3]} ${ht[4]} ${ht[5]} ${ht[6]}</g>`

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 140 40')
    svg.innerHTML = `<rect x="0%" y="0%" height="100%" width="100%" fill="${backgroundColor}" />
    <g fill="${color}">
      ${secG}${secTG}
      <path class="secMinDots" d="M92 11v4h4v-4ZM 92 25v4h4v-4Z" />
      ${minG}${minTG}
      <path class="minHrDots" d="M44 11v4h4v-4ZM 44 25v4h4v-4Z" />
      ${hrG}${hrTG}
    </g>`

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(svg)
  }, [store.isDark, store.timezone])

  return (
    <div
      ref={containerRef}
      className="w-[clamp(400px,70vw,900px)] rounded-3xl p-4 bg-[#1e1e1e] dark:bg-[#1e1e1e]"
    />
  )
})

export default DigitalClock
