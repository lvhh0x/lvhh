// 홈 MORE TOOLS 섹션 — 기존 FeaturedStrategies(주요 전략 3카드) 자리를 대체.
// 그 3카드는 /stock/1·2·3 이라는 존재하지 않는 종목으로 연결된 죽은 링크였다 (2026-07-14).
// 섹션 폭·여백은 원본 레이아웃 그대로 유지한다.
import { TOOL_TILES } from '@/lib/home/tools';
import ToolTile from '@/components/home/ToolTile';

export default function MoreTools() {
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
        MORE TOOLS
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {TOOL_TILES.map((tile) => (
          <ToolTile key={tile.id} tile={tile} />
        ))}
      </div>
    </section>
  );
}
