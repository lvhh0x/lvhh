// 회사 시뮬레이션 그리드 단일 소스 — /company 6칸 타일 구동.
// 새 시뮬레이션 추가 = 이 배열에 1줄 + 해당 전용 라우트 폴더 생성으로 완료.

export interface CompanyTileData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'coming-soon';
  href?: string;
}

export const COMPANY_TILES: CompanyTileData[] = [
  {
    id: 'box-pallet',
    title: '박스·파렛트 적재 시뮬레이션',
    description: '제품 수량에 따른 인박스→아웃박스 포장 및 파렛트 적재 단수를 계산합니다.',
    status: 'active',
    href: '/company/box-pallet',
  },
  {
    id: 'coming-2',
    title: '출고 스케줄러',
    description: '준비 중',
    status: 'coming-soon',
  },
  {
    id: 'coming-3',
    title: '재고 분석',
    description: '준비 중',
    status: 'coming-soon',
  },
  {
    id: 'coming-4',
    title: '원가 계산기',
    description: '준비 중',
    status: 'coming-soon',
  },
  {
    id: 'coming-5',
    title: '생산 계획',
    description: '준비 중',
    status: 'coming-soon',
  },
  {
    id: 'coming-6',
    title: '배송 추적',
    description: '준비 중',
    status: 'coming-soon',
  },
];
