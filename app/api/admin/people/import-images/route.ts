import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  discoverPeopleFromItems,
  getPersonProfileFlexible,
  upsertPersonProfile,
} from '@/lib/person-profiles-server';
import { revalidateAdminPeopleCache } from '@/lib/admin/admin-cache';
import { findDiscoveredPersonMatch } from '@/lib/person-profiles';
import { parsePersonImageImportPayload, normalizePersonImageImportRaw } from '@/lib/person-image-ai';
import { importPersonImageFromJson } from '@/lib/person-image-storage';
import {
  isLatinPersonSlug,
  personIdentityMatches,
  personSlugsMatch,
  pickCanonicalPersonSlug,
} from '@/lib/people';

/** POST /api/admin/people/import-images — ورود JSON تصاویر از AI و آپلود به ParsPack */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const payload = parsePersonImageImportPayload(normalizePersonImageImportRaw(body));

    const { people: discoveredPeople } = await discoverPeopleFromItems(prisma, {
      skipPagination: true,
    });

    let updated = 0;
    let uploaded = 0;
    let fromTmdb = 0;
    const errors: string[] = [];

    for (const item of payload.people) {
      try {
        const importIdentity = {
          role: item.role,
          slug: item.slug,
          displayName: item.displayName.trim(),
        };
        const match = findDiscoveredPersonMatch(discoveredPeople, importIdentity);
        const canonicalSlug = isLatinPersonSlug(item.slug)
          ? item.slug
          : match
            ? pickCanonicalPersonSlug(
                { slug: item.slug, itemCount: match.itemCount },
                { slug: match.slug, itemCount: match.itemCount }
              )
            : item.slug;

        const relatedNames = discoveredPeople
          .filter(
            (person) =>
              person.role === item.role &&
              (personSlugsMatch(person.slug, canonicalSlug) ||
                personIdentityMatches(person, importIdentity))
          )
          .map((person) => person.displayName.trim());
        const displayName = [...new Set([importIdentity.displayName, ...relatedNames])].join(
          ' · '
        );

        const existing = await getPersonProfileFlexible(
          prisma,
          item.role,
          canonicalSlug,
          displayName
        );

        const result = await importPersonImageFromJson(
          prisma,
          item.role,
          canonicalSlug,
          displayName,
          item.imageUrl.trim(),
          {
            externalUrl: existing?.externalUrl,
            tmdbId: existing?.tmdbId,
          }
        );

        if (!result.ok) {
          throw new Error(result.error);
        }

        uploaded += 1;
        if (result.source === 'tmdb') fromTmdb += 1;

        await upsertPersonProfile(prisma, {
          role: item.role,
          slug: canonicalSlug,
          displayName,
          bio: existing?.bio ?? null,
          imageUrl: result.url,
          tmdbId: result.tmdbId ?? existing?.tmdbId ?? null,
          externalUrl: existing?.externalUrl ?? null,
          status: existing?.status ?? 'published',
        });
        updated += 1;
      } catch (err: unknown) {
        errors.push(
          `${item.displayName}: ${err instanceof Error ? err.message : 'خطا'}`
        );
      }
    }

    revalidateAdminPeopleCache();

    return NextResponse.json({
      success: true,
      data: {
        updated,
        uploaded,
        fromTmdb,
        failed: errors.length,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ورود JSON';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
