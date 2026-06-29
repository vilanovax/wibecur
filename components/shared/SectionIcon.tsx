import {
  Flame,
  Sparkles,
  Star,
  MapPin,
  MessageCircle,
  Trophy,
  Film,
  TrendingUp,
  Bookmark,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type SectionIconVariant =
  | 'trending'
  | 'new'
  | 'saved'
  | 'location'
  | 'viral'
  | 'curators'
  | 'debate'
  | 'film'
  | 'rising'
  | 'bookmark'
  | 'forYou'
  | 'mood';

const ICON_VARIANTS: Record<
  SectionIconVariant,
  { Icon: LucideIcon; className: string }
> = {
  trending: { Icon: Flame, className: 'h-5 w-5 shrink-0 text-warning' },
  viral: { Icon: Flame, className: 'h-5 w-5 shrink-0 text-warning' },
  new: { Icon: Sparkles, className: 'h-5 w-5 shrink-0 text-success' },
  saved: { Icon: Star, className: 'h-5 w-5 shrink-0 text-warning' },
  location: { Icon: MapPin, className: 'h-5 w-5 shrink-0 text-wibe-secondary' },
  curators: { Icon: Trophy, className: 'h-5 w-5 shrink-0 text-primary' },
  debate: { Icon: MessageCircle, className: 'h-5 w-5 shrink-0 text-wibe-secondary' },
  film: { Icon: Film, className: 'h-5 w-5 shrink-0 text-primary' },
  rising: { Icon: TrendingUp, className: 'h-5 w-5 shrink-0 text-primary' },
  bookmark: { Icon: Bookmark, className: 'h-5 w-5 shrink-0 text-primary' },
  forYou: { Icon: Sparkles, className: 'h-5 w-5 shrink-0 text-primary' },
  mood: { Icon: Target, className: 'h-5 w-5 shrink-0 text-primary' },
};

export default function SectionIcon({ variant }: { variant: SectionIconVariant }) {
  const { Icon, className } = ICON_VARIANTS[variant];
  return <Icon className={className} aria-hidden />;
}
