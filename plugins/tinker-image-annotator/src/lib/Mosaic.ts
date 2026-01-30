import { Rect } from 'leafer-ui'

class Mosaic extends Rect {
  get __tag() {
    return 'Mosaic'
  }
}

Mosaic.registerUI()
Mosaic.setEditConfig(() => {
  return {
    middlePoint: null,
    rotateable: false,
  }
})

export default Mosaic
