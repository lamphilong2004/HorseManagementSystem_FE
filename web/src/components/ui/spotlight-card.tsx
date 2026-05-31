import React from 'react'
import { cn } from '@/lib/utils'

export function SpotlightCard({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('w-full flex items-center justify-center p-4', className)}>
      <style>{`
        @property --border-angle { syntax: '<angle>'; inherits: true; initial-value: 0deg; }
        @keyframes border-spin { 100% { --border-angle: 360deg; } }
        .spotlight-animate { animation: border-spin 6s linear infinite; }
        .spotlight-outer {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          border-radius: 20px;
          padding: 2px; /* small padding for border */
          background: linear-gradient(45deg, rgba(8,11,17,0.9), rgba(23,32,51,0.85));
          background-clip: padding-box, border-box;
          border: 1px solid transparent;
          /* allow clicks to pass through decorative outer layer to interactive children and popovers */
          pointer-events: none;
        }
        .spotlight-border {
          border-radius: 20px;
          padding: 20px 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          box-shadow: 0 14px 40px rgba(2,6,23,0.45);
          /* inner content must accept pointer events */
          pointer-events: auto;
        }
        /* conic gradient border using custom property */
        .spotlight-outer.spotlight-animate {
          background-image: linear-gradient(45deg, rgba(8,11,17,0.95), rgba(23,32,51,0.9)),
            conic-gradient(from var(--border-angle), rgba(139,92,246,0.12), rgba(16,185,129,0.14), rgba(59,130,246,0.12));
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }
      `}</style>
      <div className="spotlight-outer spotlight-animate">
        <div className="spotlight-border">
          {children}
        </div>
      </div>
    </div>
  )
}

export default SpotlightCard
