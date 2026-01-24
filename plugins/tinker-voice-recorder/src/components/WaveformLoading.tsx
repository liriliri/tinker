import { tw } from 'share/theme'

const WaveformLoading = () => {
  const barHeights = [
    30, 50, 70, 60, 45, 65, 80, 55, 40, 75, 50, 35, 60, 70, 45,
  ]

  return (
    <div
      className={`w-full h-[120px] rounded-lg overflow-hidden ${tw.bg.both.secondary} flex items-center justify-center`}
    >
      <div className="flex items-center gap-1.5">
        {barHeights.map((height, i) => (
          <div
            key={i}
            className={`w-1 ${tw.primary.bg} rounded-full`}
            style={{
              height: `${height}px`,
              animation: 'waveformPulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes waveformPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scaleY(0.6);
          }
          50% {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  )
}

export default WaveformLoading
