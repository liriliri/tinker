export interface PhotoGps {
  latitude: number
  longitude: number
  latitudeRef?: string
  longitudeRef?: string
  altitude?: number
  altitudeAboveSeaLevel?: boolean
}

export interface PhotoExif {
  make?: string
  model?: string
  camera?: string
  lensModel?: string
  lensMake?: string
  software?: string
  artist?: string
  copyright?: string
  colorSpace?: string
  rating?: number
  iso?: number
  aperture?: number
  exposureTime?: number
  focalLength?: number
  focalLength35mm?: number
  maxApertureValue?: number
  exposureCompensation?: number
  brightnessValue?: number
  shutterSpeedValue?: number
  apertureValue?: number
  exposureProgram?: string
  exposureMode?: string
  meteringMode?: string
  whiteBalance?: string
  whiteBalanceBias?: number
  wbShiftAB?: string
  wbShiftGM?: string
  flash?: string
  flashMeteringMode?: string
  lightSource?: string
  sceneCaptureType?: string
  sensingMethod?: string
  focalPlaneXResolution?: number
  focalPlaneYResolution?: number
  offsetTime?: string
  orientation?: number
  takenAt?: number
  gps?: PhotoGps
}

export interface PhotoMeta {
  path: string
  size: number
  width: number
  height: number
  createdAt: number
  updatedAt: number
  format: string
}

export interface ThumbnailResult {
  url: string
  width: number
  height: number
  takenAt?: number
}

export interface PreviewResult {
  url: string
  width: number
  height: number
}
