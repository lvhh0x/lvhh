import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MERIDIAN Private Simulation Desk',
  description: '주식 백테스트 시뮬레이션 + 회사 운영 시뮬레이션',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          background: '#14110E',
          color: '#E8E0D2',
          fontFamily: 'sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
