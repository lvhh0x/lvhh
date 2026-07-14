import Ticker from '@/components/layout/Ticker';
import HeroSection from '@/components/home/HeroSection';
import EntryTiles from '@/components/home/EntryTiles';
import MoreTools from '@/components/home/MoreTools';
import StatsBand from '@/components/home/StatsBand';
import QuoteFooter from '@/components/home/QuoteFooter';
import LineSvg from '@/components/svg/LineSvg';
import PalletSvg from '@/components/svg/PalletSvg';
import { walk, COLORS } from '@/lib/svg/generators';
import Link from 'next/link';

export default function HomePage() {
  const heroVals   = walk(56, 7, 30, 16);
  const heroSmVals = walk(46, 7, 28, 16);

  return (
    <div>
      {/* MoreTools \uc758 active \ud0c0\uc77c hover \u2014 /stock, /company \uc640 \ub3d9\uc77c \uaddc\uce59 */}
      <style>{`.sim-tile:hover { border-color: #C9A86A !important; }`}</style>

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
      <MoreTools />
      <StatsBand />
      <QuoteFooter />
    </div>
  );
}
