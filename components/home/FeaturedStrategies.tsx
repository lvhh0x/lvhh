import type { ReactNode } from 'react';
import Link from 'next/link';

interface FeaturedCard {
  id: string;
  ticker: string;
  name: string;
  tag: string;
  retStr: string;
  retColor: string;
  spark: ReactNode;
}

interface FeaturedStrategiesProps {
  cards: FeaturedCard[];
}

export default function FeaturedStrategies({ cards }: FeaturedStrategiesProps) {
  return (
    <section
      style={{
        maxWidth: '1180px',
        margin: '0 auto 48px',
        padding: '0 32px',
      }}
    >
      <p
        style={{
          margin: '0 0 20px',
          fontSize: '11px',
          letterSpacing: '0.16em',
          color: '#8c7a55',
        }}
      >
        FEATURED STRATEGIES
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/stock/${card.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div
              style={{
                border: '1px solid rgba(201,168,106,.14)',
                borderRadius: '4px',
                padding: '18px 20px',
                background: 'rgba(255,255,255,.01)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: '#8c7a55', letterSpacing: '0.1em' }}>
                    {card.ticker}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: '#E8E0D2',
                    }}
                  >
                    {card.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#7a7264' }}>{card.tag}</div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: '13px',
                    color: card.retColor,
                    fontWeight: 500,
                  }}
                >
                  {card.retStr}
                </span>
              </div>
              <div>{card.spark}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
