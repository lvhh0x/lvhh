import type { ReactNode } from 'react';

interface HeroSectionProps {
  heroCurve: ReactNode;
}

export default function HeroSection({ heroCurve }: HeroSectionProps) {
  return (
    <section
      style={{
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '46px 32px 30px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: '0 0 20px',
          fontSize: '11px',
          letterSpacing: '0.18em',
          color: '#8c7a55',
          fontWeight: 500,
        }}
      >
        QUANTITATIVE &amp; OPERATIONAL SIMULATION
      </p>
      <h1
        style={{
          margin: '0 0 36px',
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 500,
          fontSize: '64px',
          lineHeight: 1.08,
          color: '#E8E0D2',
        }}
      >
        {'\uc808\uc81c\ub41c'}{' '}
        <em style={{ fontStyle: 'italic', color: '#C9A86A' }}>{'\uc815\ubc00\ud568'}</em>
        {'\uc73c\ub85c \uc218\uc775\uc744 \uc124\uacc4\ud558\ub2e4'}
      </h1>
      <div style={{ maxWidth: '620px', margin: '0 auto', opacity: 0.9 }}>
        {heroCurve}
      </div>
    </section>
  );
}
