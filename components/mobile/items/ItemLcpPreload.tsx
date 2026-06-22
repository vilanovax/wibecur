type ItemLcpPreloadProps = {
  href: string | null | undefined;
};

/** Preload item hero poster for faster LCP. */
export default function ItemLcpPreload({ href }: ItemLcpPreloadProps) {
  if (!href) return null;
  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
