import { NextRequest, NextResponse } from 'next/server';
import { StockRange } from '@/types/backtest';

const PYTHON_URL = process.env.PYTHON_SERVER_URL ?? 'http://localhost:8000';

// symbol 룩업 테이블 (id → symbol)
const ID_TO_SYMBOL: Record<string, string> = {
  schd: 'SCHD', qqq: 'QQQ', voo: 'VOO', tqqq: 'TQQQ',
  samsung: '005930', kodex200: '069500',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const symbol = ID_TO_SYMBOL[params.id] ?? params.id.toUpperCase();
  try {
    const res = await fetch(`${PYTHON_URL}/stocks/${symbol}/range`, {
      next: { revalidate: 3600 }, // 1시간 캐시
    });
    if (!res.ok) {
      const err = await res.json() as { detail?: string };
      return NextResponse.json(
        { error: err.detail ?? '데이터 조회 실패' },
        { status: res.status }
      );
    }
    const data = await res.json() as StockRange;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Python 서버 연결 실패' }, { status: 503 });
  }
}
