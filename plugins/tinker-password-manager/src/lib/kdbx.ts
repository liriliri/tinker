import * as kdbxweb from 'kdbxweb'
import flatten from 'licia/flatten'
import isStr from 'licia/isStr'
import map from 'licia/map'
import toStr from 'licia/toStr'
import { KdbxEntry, KdbxGroup } from '../types'

export function convertGroup(kdbxGroup: kdbxweb.KdbxGroup): KdbxGroup {
  return {
    uuid: kdbxGroup.uuid.id,
    name: kdbxGroup.name ?? '',
    icon: kdbxGroup.icon ?? 0,
    entries: map(kdbxGroup.entries, convertEntry),
    groups: map(kdbxGroup.groups, convertGroup),
  }
}

function convertEntry(kdbxEntry: kdbxweb.KdbxEntry): KdbxEntry {
  const getFieldValue = (fieldName: string): string => {
    const value = kdbxEntry.fields.get(fieldName)
    if (!value) return ''
    if (isStr(value)) return value
    if (value instanceof kdbxweb.ProtectedValue) {
      return value.getText() || ''
    }
    return toStr(value)
  }

  const getPasswordValue = (): kdbxweb.ProtectedValue => {
    const value = kdbxEntry.fields.get('Password')
    if (value instanceof kdbxweb.ProtectedValue) {
      return value
    }
    return kdbxweb.ProtectedValue.fromString('')
  }

  return {
    uuid: kdbxEntry.uuid.id,
    title: getFieldValue('Title'),
    username: getFieldValue('UserName'),
    password: getPasswordValue(),
    url: getFieldValue('URL'),
    notes: getFieldValue('Notes'),
    icon: kdbxEntry.icon ?? 0,
    tags: kdbxEntry.tags || [],
    customFields: kdbxEntry.fields,
    times: {
      creationTime: kdbxEntry.times.creationTime ?? new Date(),
      lastModTime: kdbxEntry.times.lastModTime ?? new Date(),
      lastAccessTime: kdbxEntry.times.lastAccessTime ?? new Date(),
      expiryTime: kdbxEntry.times.expiryTime ?? null,
      expires: kdbxEntry.times.expires ?? false,
    },
  }
}

export function flattenGroups(group: KdbxGroup): KdbxGroup[] {
  return [group, ...flatten(map(group.groups, flattenGroups))]
}

export function findKdbxGroup(
  db: kdbxweb.Kdbx,
  groupId: string
): kdbxweb.KdbxGroup | null {
  const findInGroup = (group: kdbxweb.KdbxGroup): kdbxweb.KdbxGroup | null => {
    if (group.uuid.id === groupId) return group

    for (const subGroup of group.groups) {
      const found = findInGroup(subGroup)
      if (found) return found
    }

    return null
  }

  return findInGroup(db.getDefaultGroup())
}

export function findKdbxEntry(
  db: kdbxweb.Kdbx,
  entryId: string
): kdbxweb.KdbxEntry | null {
  const findInGroup = (group: kdbxweb.KdbxGroup): kdbxweb.KdbxEntry | null => {
    for (const entry of group.entries) {
      if (entry.uuid.id === entryId) return entry
    }

    for (const subGroup of group.groups) {
      const found = findInGroup(subGroup)
      if (found) return found
    }

    return null
  }

  return findInGroup(db.getDefaultGroup())
}
