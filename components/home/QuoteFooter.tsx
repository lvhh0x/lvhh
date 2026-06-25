export default function QuoteFooter() {
  return (
    <footer
      style={{
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '48px 32px 56px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontStyle: 'italic',
          fontSize: '32px',
          color: '#cabfa8',
          margin: '0 0 20px',
          lineHeight: 1.3,
        }}
      >
        &ldquo;{'\uaddc\uc728\uc740 \uae30\uc220\ubcf4\ub2e4 \ub354 \ud070 \uc218\uc775\uc744 \ub9cc\ub4e0\ub2e4.'}&rdquo;
      </p>
      <p
        style={{
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: '#3d3628',
          margin: 0,
        }}
      >
        &copy; 2026 MERIDIAN &middot; PRIVATE SIMULATION DESK
      </p>
    </footer>
  );
}
