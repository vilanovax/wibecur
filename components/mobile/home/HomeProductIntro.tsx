import { ACTIVATION } from '@/lib/activation-copy';

/**
 * وعدهٔ محصول در first viewport — برای تازه‌واردی که هیرو محتوا را نمی‌فهمد.
 */
export default function HomeProductIntro({ className = '' }: { className?: string }) {
  const { title, description } = ACTIVATION.homeIntro;

  return (
    <div
      className={`px-4 pt-3 pb-1 lg:px-0 lg:pt-0 lg:pb-0 ${className}`}
      data-home-product-intro
    >
      <h1 className="wibe-h3 text-balance text-foreground">{title}</h1>
      <p className="mt-1 max-w-xl text-pretty wibe-small text-muted-foreground">{description}</p>
    </div>
  );
}
