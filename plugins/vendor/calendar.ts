import * as fullcalendarCore from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import zhLocale from '@fullcalendar/core/locales/zh-cn'
import jsCalendarConverter from 'js-calendar-converter'
import { expose } from './util'

expose({
  fullcalendarCore,
  fullcalendarReact: FullCalendar,
  fullcalendarDaygrid: dayGridPlugin,
  fullcalendarTimegrid: timeGridPlugin,
  fullcalendarInteraction: interactionPlugin,
  fullcalendarLocaleZhcn: zhLocale,
  jsCalendarConverter,
})
