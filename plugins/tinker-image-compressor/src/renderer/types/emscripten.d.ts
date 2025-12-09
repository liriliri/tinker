declare namespace EmscriptenWasm {
  interface Module {
    HEAP8: Int8Array
    HEAP16: Int16Array
    HEAP32: Int32Array
    HEAPU8: Uint8Array
    HEAPU16: Uint16Array
    HEAPU32: Uint32Array
    HEAPF32: Float32Array
    HEAPF64: Float64Array
  }

  interface ModuleFactory<T extends Module> {
    (config?: ModuleFactoryConfig): Promise<T>
  }

  interface ModuleFactoryConfig {
    locateFile?: (path: string) => string
    mainScriptUrlOrBlob?: string
  }
}
