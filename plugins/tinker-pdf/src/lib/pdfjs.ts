import * as pdfjsLib from 'pdfjs-dist'
// Import the worker as a URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Set the worker source to the imported URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export { pdfjsLib }
