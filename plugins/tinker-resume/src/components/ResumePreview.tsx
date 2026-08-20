import { useMemo, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import store from '../store'
import { RESUME_PAGE_ID } from '../lib/pdf'
import { useFitScale } from '../hooks/useFitScale'
import ClassicTemplate from './templates/ClassicTemplate'
import SidebarTemplate from './templates/SidebarTemplate'

export default observer(function ResumePreview() {
  const { resume, templateId, themeColor } = store
  const containerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const { scale, width, height } = useFitScale(containerRef, paperRef)

  const frameStyle = useMemo(
    () => ({ width: width || undefined, height: height || undefined }),
    [width, height]
  )
  const paperStyle = useMemo(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    }),
    [scale]
  )

  return (
    <div ref={containerRef} className={`h-full ${tw.bg.secondary}`}>
      <OverlayScrollbars className="h-full">
        <div className="flex justify-center p-6">
          <div className="overflow-hidden" style={frameStyle}>
            <div style={paperStyle}>
              <div
                ref={paperRef}
                id={RESUME_PAGE_ID}
                className="w-[210mm] min-h-[297mm] bg-white shadow-lg overflow-hidden"
              >
                {templateId === 'classic' && (
                  <ClassicTemplate resume={resume} themeColor={themeColor} />
                )}
                {templateId === 'sidebar' && (
                  <SidebarTemplate resume={resume} themeColor={themeColor} />
                )}
              </div>
            </div>
          </div>
        </div>
      </OverlayScrollbars>
    </div>
  )
})
