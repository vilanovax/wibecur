import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  discoverPeopleFromItems,
  upsertPersonProfile,
  clearImdbUrlConflictsForImport,
} from '@/lib/person-profiles-server';
import { revalidateAdminPeopleCache } from '@/lib/admin/admin-cache';
import { findDiscoveredPersonMatch } from '@/lib/person-profiles';
import { parsePersonBioImportPayload } from '@/lib/person-bio-ai';
import {
  isLatinPersonSlug,
  personIdentityMatches,
  personSlugsMatch,
  pickCanonicalPersonSlug,
} from '@/lib/people';

/** POST /api/admin/people/import-bios — ورود JSON از هوش مصنوعی خارجی */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const payload = parsePersonBioImportPayload(body);

    const { people: discoveredPeople } = await discoverPeopleFromItems(prisma, {
      skipPagination: true,
    });

    let updated = 0;
    const errors: string[] = [];

    for (const item of payload.people) {
      try {
        const importIdentity = {
          role: item.role,
          slug: item.slug,
          displayName: item.displayName.trim(),
          externalUrl: item.externalUrl?.trim() || null,
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

        await clearImdbUrlConflictsForImport(
          prisma,
          item.role,
          canonicalSlug,
          importIdentity.externalUrl
        );

        await upsertPersonProfile(prisma, {
          role: item.role,
          slug: canonicalSlug,
          displayName,
          bio: item.bio.trim(),
          imageUrl: item.imageUrl?.trim() || null,
          externalUrl: importIdentity.externalUrl,
          status: item.status ?? 'published',
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
      data: { updated, failed: errors.length, errors: errors.slice(0, 10) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ورود JSON';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
