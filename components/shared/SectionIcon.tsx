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
  location: { Icon: MapPin, className: 'h-5 w-5 shrink-0 text-muted-foreground' },
  curators: { Icon: Trophy, className: 'h-5 w-5 shrink-0 text-brand' },
  debate: { Icon: MessageCircle, className: 'h-5 w-5 shrink-0 text-muted-foreground' },
  film: { Icon: Film, className: 'h-5 w-5 shrink-0 text-brand' },
  rising: { Icon: TrendingUp, className: 'h-5 w-5 shrink-0 text-brand' },
  bookmark: { Icon: Bookmark, className: 'h-5 w-5 shrink-0 text-brand' },
  forYou: { Icon: Sparkles, className: 'h-5 w-5 shrink-0 text-brand' },
  mood: { Icon: Target, className: 'h-5 w-5 shrink-0 text-brand' },
};

export default function SectionIcon({ variant }: { variant: SectionIconVariant }) {
  const { Icon, className } = ICON_VARIANTS[variant];
  return <Icon className={className} aria-hidden />;
}
