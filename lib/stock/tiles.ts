// 시뮬레이션 그리드 단일 소스 — /stock 6칸 타일 구동.
// 새 시뮬레이션 추가 = 이 배열에 1줄 + 해당 전용 라우트 폴더 1개 생성으로 끝.

export interface SimTile {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'coming-soon';
  href?: string;
}

export const SIM_TILES: SimTile[] = [
  {
    id: 'etf',
    title: 'ETF 시뮬레이션',
    description: '티커·종목코드를 직접 입력해 백테스트',
    status: 'active',
    href: '/stock/etf',
  },
  {
    id: 'compare',
    title: 'ETF 비교',
    description: '여러 ETF 동시 비교',
    status: 'coming-soon',
  },
  {
    id: 'switching',
    title: 'ETF 스위칭',
    description: '모멘텀 스위칭 전략',
    status: 'coming-soon',
  },
  {
    id: 'slot4',
    title: '준비 중',
    description: '추가 시뮬레이션',
    status: 'coming-soon',
  },
  {
    id: 'slot5',
    title: '준비 중',
    description: '추가 시뮬레이션',
    status: 'coming-soon',
  },
  {
    id: 'slot6',
    title: '준비 중',
    description: '추가 시뮬레이션',
    status: 'coming-soon',
  },
];
