'use client';

import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';

const VALID_LEVELS: CuratorLevelKey[] = [
  'EXPLORER',
  'NEW_CURATOR',
  'ACTIVE_CURATOR',
  'TRUSTED_CURATOR',
  'INFLUENTIAL_CURATOR',
  'ELITE_CURATOR',
  'VIBE_LEGEND',
];

function normalizeLevel(level: CuratorLevelKey | string): CuratorLevelKey {
  const s = String(level).toUpperCase().replace(/-/g, '_');
  return VALID_LEVELS.includes(s as CuratorLevelKey) ? (s as CuratorLevelKey) : 'EXPLORER';
}

interface CuratorBadgeProps {
  level: CuratorLevelKey | string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showLabel?: boolean;
  glow?: boolean;
  className?: string;
}

export default function CuratorBadge({
  level,
  size = 'medium',
  showIcon = true,
  showLabel = true,
  glow = true,
  className = '',
}: CuratorBadgeProps) {
  const key = normalizeLevel(level);
  const config = getLevelConfig(key);

  const sizeClass =
    size === 'small'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : size === 'large'
        ? 'px-4 py-2 text-sm gap-2'
        : 'px-3 py-1 text-xs gap-1.5';

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        animate-curator-badge-in
        ${config.bgClass}
        ${sizeClass}
        ${glow ? config.glowClass : ''}
        transition-all duration-200
        ${className}
      `}
      title={config.short}
    >
      {showIcon && <span className="leading-none">{config.icon}</span>}
      {showLabel && <span>{config.short}</span>}
    </span>
  );
}
