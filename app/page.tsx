import Ticker from '@/components/layout/Ticker';
import HeroSection from '@/components/home/HeroSection';
import EntryTiles from '@/components/home/EntryTiles';
import FeaturedStrategies from '@/components/home/FeaturedStrategies';
import StatsBand from '@/components/home/StatsBand';
import QuoteFooter from '@/components/home/QuoteFooter';
import LineSvg from '@/components/svg/LineSvg';
import PalletSvg from '@/components/svg/PalletSvg';
import { walk, COLORS } from '@/lib/svg/generators';
import Link from 'next/link';

interface StockSim {
  id: string;
  ticker: string;
  name: string;
  tag: string;
  seed: number;
  bias: number;
  vol: number;
}

const STOCK_SIMS: StockSim[] = [
  { id: '1', ticker: '005930', name: '\uc0bc\uc131\uc804\uc790', tag: '\ube14\ub8e8\uce59', seed: 42, bias: 12, vol: 22 },
  { id: '2', ticker: 'NVDA',   name: '\uc5d4\ube44\ub514\uc544', tag: '\uc131\uc7a5\uc8fc',   seed: 77, bias: 28, vol: 40 },
  { id: '3', ticker: 'BTC',    name: '\ube44\ud2b8\ucf54\uc778', tag: '\ub514\uc9c0\ud138\uc790\uc0b0', seed: 99, bias: 35, vol: 60 },
];

export default function HomePage() {
  const heroVals   = walk(56, 7, 30, 16);
  const heroSmVals = walk(46, 7, 28, 16);

  const featuredCards = STOCK_SIMS.map((sim) => {
    const vals     = walk(60, sim.seed * 13 + 50, sim.bias + 8, sim.vol);
    const last     = vals[vals.length - 1] ?? 100;
    const ret      = ((last - vals[0]) / vals[0]) * 100;
    const retStr   = `${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`;
    const retColor = ret >= 0 ? '#8FBFA0' : '#C77B66';
    return {
      id:       sim.id,
      ticker:   sim.ticker,
      name:     sim.name,
      tag:      sim.tag,
      retStr,
      retColor,
      spark:    <LineSvg vals={vals} w={110} h={30} color={retColor} area={false} sw={1.2} />,
    };
  });

  return (
    <div>
      <Ticker />

      {/* Home-only TopBar */}
      <header style={{ borderBottom: '1px solid rgba(201,168,106,.10)' }}>
        <div
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: '#C9A86A',
            }}
          >
            MERIDIAN
          </span>
          <nav style={{ display: 'flex', gap: '32px' }}>
            <Link
              href="/stock"
              style={{ fontSize: '11px', color: '#7a7264', textDecoration: 'none', letterSpacing: '0.12em' }}
            >
              STOCK
            </Link>
            <Link
              href="/company"
              style={{ fontSize: '11px', color: '#7a7264', textDecoration: 'none', letterSpacing: '0.12em' }}
            >
              COMPANY
            </Link>
          </nav>
        </div>
      </header>

      <HeroSection
        heroCurve={
          <LineSvg vals={heroVals} w={620} h={150} color={COLORS.GOLD} area={false} sw={2} />
        }
      />
      <EntryTiles
        heroCurveSm={
          <LineSvg vals={heroSmVals} w={360} h={70} color={COLORS.GOLD} area={false} sw={1.8} />
        }
        heroPallet={<PalletSvg perLayer={8} tiers={5} filled={32} big={true} />}
      />
      <FeaturedStrategies cards={featuredCards} />
      <StatsBand />
      <QuoteFooter />
    </div>
  );
}
