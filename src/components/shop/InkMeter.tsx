import styles from './InkMeter.module.css'

/**
 * The run, one reed-pen stroke per print. Sold prints are inked in gold, filling from the
 * foot of the stroke in sequence; the next print to go is marked in indigo; the rest wait
 * as faint strokes. Each stroke leans and sits a touch differently, as a hand would set them.
 */
export function InkMeter({ run, sold, open = true, className }: { run: number; sold: number; open?: boolean; className?: string }) {
  return (
    <div className={[styles.meter, className].filter(Boolean).join(' ')} role="img" aria-label={`${sold} of ${run} sold`}>
      {Array.from({ length: run }, (_, i) => (
        <i
          key={i}
          data-state={i < sold ? 'sold' : open && i === sold ? 'next' : undefined}
          style={
            {
              '--i': i,
              '--lean': `${(Math.sin(i * 12.9898) * 2.2).toFixed(2)}deg`,
              '--h': (0.9 + ((Math.sin(i * 78.233) + 1) / 2) * 0.1).toFixed(3),
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
