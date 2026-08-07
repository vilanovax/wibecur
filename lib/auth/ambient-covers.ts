import { CATEGORY_COVER_IMAGES } from '@/lib/category-cover-images';

/** کاورهای ثابت برای پس‌زمینهٔ محو صفحات ورود/ثبت‌نام */
export const AUTH_AMBIENT_COVERS = [
  {
    src: CATEGORY_COVER_IMAGES.movies,
    className: '-start-[12%] top-[6%] h-56 w-56',
  },
  {
    src: CATEGORY_COVER_IMAGES.books,
    className: '-end-[8%] top-[18%] h-48 w-48',
  },
  {
    src: CATEGORY_COVER_IMAGES.cafe,
    className: 'start-[8%] bottom-[14%] h-52 w-52',
  },
  {
    src: CATEGORY_COVER_IMAGES.podcast,
    className: '-end-[6%] bottom-[8%] h-44 w-44',
  },
  {
    src: CATEGORY_COVER_IMAGES.travel,
    className: 'start-1/2 top-[42%] h-40 w-64 -translate-x-1/2',
  },
] as const;
