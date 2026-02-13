'use client';

/**
 * حلقه گرادیان + glow برای آواتار کاربران Elite (سطح ۵+).
 * فریم طلایی/بنفش با انیمیشن پالس بسیار ملایم.
 */

interface EliteAvatarFrameProps {
  children: React.ReactNode;
  /** اندازه تقریبی آواتار برای تناسب حلقه (مثلاً 110 یا 96) */
  size?: number;
  className?: string;
}

export default function EliteAvatarFrame({
  children,
  size = 110,
  className = '',
}: EliteAvatarFrameProps) {
  const ringSize = 4;
  const inset = -ringSize - 2;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* حلقه طلایی/بنفش + glow با پالس ملایم */}
      <div
        className="absolute rounded-full pointer-events-none animate-elite-frame-pulse border-2 border-amber-400/60"
        style={{ inset: `${inset}px` }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
