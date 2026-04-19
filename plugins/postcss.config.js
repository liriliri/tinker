import tailwindcss from '@tailwindcss/postcss'
import dedupVendor from './vendor/postcss.js'

export default {
  plugins: [tailwindcss(), dedupVendor()],
}
