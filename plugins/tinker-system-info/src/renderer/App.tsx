import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Monitor, HardDrive, Volume2, Wifi } from 'lucide-react'
import { AlertProvider } from 'share/components/Alert'
import { ToasterProvider } from 'share/components/Toaster'
import { LoadingCircle } from 'share/components/Loading'
import { tw } from 'share/theme'
import fileSize from 'licia/fileSize'
import lowerCase from 'licia/lowerCase'
import store from './store'
import InfoSection from './components/InfoSection'
import InfoRow from './components/InfoRow'
import { formatSpeed } from './lib/format'

export default observer(function App() {
  const { t } = useTranslation()

  if (store.isLoading || !store.systemInfo) {
    return (
      <ToasterProvider>
        <AlertProvider>
          <div
            className={`h-screen flex items-center justify-center ${tw.bg.both.secondary}`}
          >
            <LoadingCircle />
          </div>
        </AlertProvider>
      </ToasterProvider>
    )
  }

  const {
    system,
    cpu,
    mem,
    graphics,
    osInfo,
    diskLayout,
    audio,
    networkInterfaces,
  } = store.systemInfo

  return (
    <ToasterProvider>
      <AlertProvider>
        <div
          className={`min-h-screen ${tw.bg.both.secondary} transition-colors`}
        >
          <div className="max-w-4xl mx-auto px-4 py-6">
            <InfoSection>
              {system?.manufacturer && (
                <InfoRow
                  label={t('manufacturer')}
                  value={system.manufacturer}
                />
              )}
              {system?.model && (
                <InfoRow label={t('model_name')} value={system.model} />
              )}
              {system?.serial &&
                lowerCase(system.serial) !== 'default string' && (
                  <InfoRow label={t('serialNumber')} value={system.serial} />
                )}

              {osInfo && (
                <InfoRow
                  label={t('system')}
                  value={`${osInfo.distro} ${osInfo.release}${
                    osInfo.arch ? ` (${osInfo.arch})` : ''
                  }`}
                />
              )}

              {cpu && (
                <InfoRow
                  label={t('chip')}
                  value={`${cpu.brand}${
                    cpu.cores ? `, ${cpu.physicalCores} ${t('cores')}` : ''
                  }${cpu.speed ? `, ${formatSpeed(cpu.speed)}` : ''}${
                    cpu.manufacturer ? ` (${cpu.manufacturer})` : ''
                  }`}
                />
              )}

              {mem && (
                <InfoRow
                  label={t('memory')}
                  value={`${fileSize(mem.total)}B`}
                />
              )}

              {graphics &&
                graphics.controllers &&
                graphics.controllers.length > 0 &&
                graphics.controllers.map(
                  (controller, index) =>
                    controller.model && (
                      <InfoRow
                        key={index}
                        label={
                          index === 0
                            ? t('graphics')
                            : `${t('graphics')} ${index + 1}`
                        }
                        value={controller.model}
                      />
                    )
                )}
            </InfoSection>

            {graphics && graphics.displays && graphics.displays.length > 0 && (
              <InfoSection title={t('display')}>
                {graphics.displays.map((display, index) => (
                  <div key={index}>
                    {display.model &&
                      display.resolutionX &&
                      display.resolutionY && (
                        <InfoRow
                          label={
                            <div className="flex items-center gap-2">
                              <Monitor size={14} className={tw.primary.text} />
                              <span>{display.model}</span>
                            </div>
                          }
                          value={`${display.resolutionX} × ${display.resolutionY}`}
                        />
                      )}
                  </div>
                ))}
              </InfoSection>
            )}

            {diskLayout && diskLayout.length > 0 && (
              <InfoSection title={t('storage')}>
                {diskLayout.map((disk, index) => {
                  const details = [disk.type, disk.interfaceType]
                    .filter(Boolean)
                    .join(', ')
                  return (
                    <div key={index}>
                      {disk.name && disk.size && (
                        <InfoRow
                          label={
                            <div className="flex items-center gap-2">
                              <HardDrive
                                size={14}
                                className={tw.primary.text}
                              />
                              <span>
                                {disk.name}
                                {details && (
                                  <span className={tw.text.both.tertiary}>
                                    {' '}
                                    ({details})
                                  </span>
                                )}
                              </span>
                            </div>
                          }
                          value={`${fileSize(disk.size)}B`}
                        />
                      )}
                    </div>
                  )
                })}
              </InfoSection>
            )}

            {audio && audio.length > 0 && (
              <InfoSection title={t('audio')}>
                {audio.map((device, index) => (
                  <div key={index}>
                    {device.name && (
                      <InfoRow
                        label={
                          <div className="flex items-center gap-2">
                            <Volume2 size={14} className={tw.primary.text} />
                            <span>{device.name}</span>
                          </div>
                        }
                        value={device.manufacturer || '-'}
                      />
                    )}
                  </div>
                ))}
              </InfoSection>
            )}

            {networkInterfaces &&
              networkInterfaces.filter((ni) => !ni.internal).length > 0 && (
                <InfoSection title={t('network')}>
                  {networkInterfaces
                    .filter((ni) => !ni.internal)
                    .map((ni, index) => (
                      <div key={index}>
                        {ni.iface && ni.ip4 && (
                          <InfoRow
                            label={
                              <div className="flex items-center gap-2">
                                <Wifi size={14} className={tw.primary.text} />
                                <span>{ni.iface}</span>
                              </div>
                            }
                            value={ni.ip4}
                          />
                        )}
                      </div>
                    ))}
                </InfoSection>
              )}
          </div>
        </div>
      </AlertProvider>
    </ToasterProvider>
  )
})
