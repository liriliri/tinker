import * as pdfjsLib from 'pdfjs-dist'
import { expose } from './util'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs'

expose('pdfjsLib', pdfjsLib)

export { pdfjsLib }
