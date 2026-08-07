import type { FeaturedListData } from '@/types/home-data';

type HomeLcpPreloadProps = {
  href: string | null | undefined;
};

/** Preload hero banner for faster LCP — Next.js hoists <link> into document head. */
export default function HomeLcpPreload({ href }: HomeLcpPreloadProps) {
  if (!href) return null;

  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
