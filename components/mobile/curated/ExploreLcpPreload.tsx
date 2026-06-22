type ExploreLcpPreloadProps = {
  href: string | null | undefined;
};

/** Preload اولین کاور ترند اکسپلور برای LCP سریع‌تر */
export default function ExploreLcpPreload({ href }: ExploreLcpPreloadProps) {
  if (!href) return null;

  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
