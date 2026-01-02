import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { config, getType, calculate } from './lib/units'

const storage = new LocalStore('tinker-unit-converter')

type ConversionResult = {
  key: string
  value: string
  unit: string
  unitKey: string
}

class Store extends BaseStore {
  type = 'length'
  from = 'm'
  input = '1'

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSavedState()
  }

  private loadSavedState() {
    const saved = storage.get('state')
    if (saved) {
      this.type = saved.type || 'length'
      this.from = saved.from || 'm'
      this.input = saved.input || '1'
    }
  }

  setType(type: string) {
    this.type = type
    const typeConfig = getType(type)
    this.from = typeConfig.main
    this.saveState()
  }

  setFrom(from: string) {
    this.from = from
    this.saveState()
  }

  setInput(input: string) {
    this.input = input
    this.saveState()
  }

  private getUnitKey(unitKey: string): string {
    return `${this.type}${unitKey.charAt(0).toUpperCase()}${unitKey
      .slice(1)
      .replace(/_/g, '')}`
  }

  private getTypeKey(typeKey: string): string {
    return `type${typeKey.charAt(0).toUpperCase()}${typeKey.slice(1)}`
  }

  get allResults(): ConversionResult[] {
    const results: ConversionResult[] = []
    const typeConfig = getType(this.type)

    for (const unit of typeConfig.unit) {
      try {
        const value = calculate(this.type, this.input, this.from, unit.key)
        results.push({
          key: unit.key,
          value,
          unit: unit.unit,
          unitKey: this.getUnitKey(unit.key),
        })
      } catch {
        // Skip invalid conversions
      }
    }
    return results
  }

  get unitTypes() {
    return config.map((item) => ({
      key: item.key,
      typeKey: this.getTypeKey(item.key),
    }))
  }

  get currentUnits() {
    const typeConfig = getType(this.type)
    return typeConfig.unit.map((unit) => ({
      value: unit.key,
      label: unit.unit,
      unitKey: this.getUnitKey(unit.key),
    }))
  }

  private saveState() {
    storage.set('state', {
      type: this.type,
      from: this.from,
      input: this.input,
    })
  }
}

const store = new Store()

export default store
