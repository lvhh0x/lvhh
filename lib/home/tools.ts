// 홈 MORE TOOLS 3칸 단일 소스.
// 새 도구 추가 = 이 배열의 status/href 를 바꾸는 것으로 끝난다.
// (lib/stock/tiles.ts 의 SimTile 과 같은 방식)

export interface ToolTile {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'coming-soon';
  href?: string;
}

export const TOOL_TILES: ToolTile[] = [
  {
    id: 'slot1',
    title: '준비 중',
    description: '추가 도구',
    status: 'coming-soon',
  },
  {
    id: 'slot2',
    title: '준비 중',
    description: '추가 도구',
    status: 'coming-soon',
  },
  {
    id: 'archive',
    title: '자료실',
    description: '자료 열람 및 다운로드',
    status: 'active',
    href: '/archive',
  },
];
