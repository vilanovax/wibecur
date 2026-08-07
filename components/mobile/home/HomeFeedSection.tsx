import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** خط جداکننده بالای سکشن — دسکتاپ */
  divider?: boolean;
  className?: string;
};

export default function HomeFeedSection({
  children,
  divider = false,
  className = '',
}: Props) {
  return (
    <div
      className={`${divider ? 'border-t border-wibe/70 pt-6 xl:pt-7' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
