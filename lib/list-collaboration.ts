import { prisma } from '@/lib/prisma';
import type {
  ListCollaborationStatus,
  ListCollaboratorRole,
  Prisma,
} from '@prisma/client';
import { normalizeUsername } from '@/lib/username';
import { USER_LIST_SELECT } from '@/lib/user-lists';
import { createNotification } from '@/lib/utils/notifications';

export const MAX_LIST_COLLABORATORS = 10;

export type ListAccessRole = 'owner' | ListCollaboratorRole | null;

export type ListAccess = {
  isOwner: boolean;
  role: ListAccessRole;
  canView: boolean;
  canAddItems: boolean;
  canEditList: boolean;
  canManageCollaborators: boolean;
  /** Pending invite for current user — avoids a second collaborator query on list detail */
  pendingCollaboration: { listId: string; invitedBy: string } | null;
};

export type CollaboratorMember = {
  id: string;
  userId: string;
  role: ListCollaboratorRole;
  status: ListCollaborationStatus;
  invitedBy: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  inviter: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
};

function buildAccess(
  isOwner: boolean,
  role: ListAccessRole,
  status?: ListCollaborationStatus,
  options?: {
    isPendingInvitee?: boolean;
    pendingCollaboration?: { listId: string; invitedBy: string } | null;
  }
): ListAccess {
  const accepted = isOwner || status === 'ACCEPTED';
  const canView = accepted || (status === 'PENDING' && options?.isPendingInvitee === true);
  const isEditor = role === 'EDITOR';
  return {
    isOwner,
    role: isOwner ? 'owner' : role,
    canView,
    canAddItems: accepted && (isOwner || role === 'CONTRIBUTOR' || isEditor),
    canEditList: isOwner || (accepted && isEditor),
    canManageCollaborators: isOwner,
    pendingCollaboration: options?.pendingCollaboration ?? null,
  };
}

export async function getCollaboratorRecord(listId: string, userId: string) {
  return prisma.list_collaborators.findUnique({
    where: { listId_userId: { listId, userId } },
  });
}

export async function getListAccessForUser(
  list: { id: string; userId: string; deletedAt?: Date | null },
  userId: string | null
): Promise<ListAccess> {
  if (!userId) {
    return buildAccess(false, null);
  }
  if (list.userId === userId) {
    return buildAccess(true, 'owner');
  }
  if (list.deletedAt) {
    return buildAccess(false, null);
  }
  const collab = await getCollaboratorRecord(list.id, userId);
  if (!collab) {
    return buildAccess(false, null);
  }
  const isPendingInvitee = collab.status === 'PENDING' && collab.invitedBy != null;
  return buildAccess(false, collab.role, collab.status, {
    isPendingInvitee,
    pendingCollaboration:
      isPendingInvitee && collab.invitedBy
        ? { listId: list.id, invitedBy: collab.invitedBy }
        : null,
  });
}

export async function assertListAccess(
  list: { id: string; userId: string; deletedAt?: Date | null; isPublic?: boolean },
  userId: string,
  action: 'view' | 'add_items' | 'edit_list' | 'manage_collaborators'
): Promise<ListAccess> {
  const access = await getListAccessForUser(list, userId);
  const allowed =
    (action === 'view' && access.canView) ||
    (action === 'add_items' && access.canAddItems) ||
    (action === 'edit_list' && access.canEditList) ||
    (action === 'manage_collaborators' && access.canManageCollaborators) ||
    (action === 'view' && list.isPublic);

  if (!allowed) {
    throw new Error('FORBIDDEN');
  }
  return access;
}

async function countAcceptedCollaborators(listId: string) {
  return prisma.list_collaborators.count({
    where: { listId, status: 'ACCEPTED' },
  });
}

export async function createListNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  await createNotification(
    input.userId,
    input.type,
    input.title,
    input.message,
    input.link ?? undefined
  );
}

export async function fetchCollaboratorsForList(listId: string): Promise<CollaboratorMember[]> {
  const rows = await prisma.list_collaborators.findMany({
    where: {
      listId,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      users: {
        select: { id: true, name: true, username: true, image: true },
      },
      inviter: {
        select: { id: true, name: true, username: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    role: row.role,
    status: row.status,
    invitedBy: row.invitedBy,
    createdAt: row.createdAt,
    user: row.users,
    inviter: row.inviter,
  }));
}

export async function inviteCollaboratorByUsername(
  ownerId: string,
  listId: string,
  rawUsername: string
) {
  const username = normalizeUsername(rawUsername);
  if (!username) {
    throw new Error('INVALID_USERNAME');
  }

  const list = await prisma.lists.findUnique({ where: { id: listId } });
  if (!list || list.deletedAt) throw new Error('LIST_NOT_FOUND');
  if (list.userId !== ownerId) throw new Error('FORBIDDEN');
  if (list.isPublic) throw new Error('PUBLIC_LIST_NO_COLLAB');

  const invitee = await prisma.users.findUnique({
    where: { username },
    select: { id: true, name: true, username: true },
  });
  if (!invitee) throw new Error('USER_NOT_FOUND');
  if (invitee.id === ownerId) throw new Error('CANNOT_INVITE_SELF');

  const acceptedCount = await countAcceptedCollaborators(listId);
  const pendingInvite = await prisma.list_collaborators.findUnique({
    where: { listId_userId: { listId, userId: invitee.id } },
  });
  if (pendingInvite?.status === 'ACCEPTED') throw new Error('ALREADY_MEMBER');
  if (pendingInvite?.status === 'PENDING') throw new Error('ALREADY_PENDING');
  if (acceptedCount >= MAX_LIST_COLLABORATORS) throw new Error('MAX_COLLABORATORS');

  const record = await prisma.list_collaborators.upsert({
    where: { listId_userId: { listId, userId: invitee.id } },
    create: {
      listId,
      userId: invitee.id,
      role: 'CONTRIBUTOR',
      status: 'PENDING',
      invitedBy: ownerId,
    },
    update: {
      role: 'CONTRIBUTOR',
      status: 'PENDING',
      invitedBy: ownerId,
    },
    include: {
      users: { select: { id: true, name: true, username: true, image: true } },
      inviter: { select: { id: true, name: true, username: true } },
    },
  });

  await createListNotification({
    userId: invitee.id,
    type: 'list_collaboration_invite',
    title: 'دعوت به همکاری در لیست',
    message: `برای مشارکت در لیست «${list.title}» دعوت شده‌اید.`,
    link: `/user-lists/${list.id}`,
  });

  return record;
}

export async function requestListCollaboration(userId: string, listId: string) {
  const list = await prisma.lists.findUnique({ where: { id: listId } });
  if (!list || list.deletedAt) throw new Error('LIST_NOT_FOUND');
  if (list.userId === userId) throw new Error('OWNER_CANNOT_REQUEST');
  if (list.isPublic) throw new Error('PUBLIC_LIST_NO_COLLAB');
  if (!list.collaborationEnabled) throw new Error('COLLABORATION_DISABLED');

  const existing = await prisma.list_collaborators.findUnique({
    where: { listId_userId: { listId, userId } },
  });
  if (existing?.status === 'ACCEPTED') throw new Error('ALREADY_MEMBER');
  if (existing?.status === 'PENDING') throw new Error('ALREADY_PENDING');

  const acceptedCount = await countAcceptedCollaborators(listId);
  if (acceptedCount >= MAX_LIST_COLLABORATORS) throw new Error('MAX_COLLABORATORS');

  const requester = await prisma.users.findUnique({
    where: { id: userId },
    select: { name: true, username: true },
  });

  const record = await prisma.list_collaborators.upsert({
    where: { listId_userId: { listId, userId } },
    create: {
      listId,
      userId,
      role: 'CONTRIBUTOR',
      status: 'PENDING',
      invitedBy: null,
    },
    update: {
      role: 'CONTRIBUTOR',
      status: 'PENDING',
      invitedBy: null,
    },
  });

  await createListNotification({
    userId: list.userId,
    type: 'list_collaboration_request',
    title: 'درخواست همکاری در لیست',
    message: `${requester?.name || requester?.username || 'کاربر'} می‌خواهد در لیست «${list.title}» مشارکت کند.`,
    link: `/user-lists/${list.id}`,
  });

  return record;
}

export async function respondToCollaborationInvite(
  userId: string,
  listId: string,
  action: 'accept' | 'reject'
) {
  const record = await prisma.list_collaborators.findUnique({
    where: { listId_userId: { listId, userId } },
    include: { lists: { select: { title: true, userId: true } } },
  });
  if (!record || record.status !== 'PENDING') throw new Error('NOT_FOUND');
  if (record.invitedBy == null) throw new Error('USE_OWNER_RESPONSE');

  if (action === 'reject') {
    return prisma.list_collaborators.update({
      where: { id: record.id },
      data: { status: 'REJECTED' },
    });
  }

  const acceptedCount = await countAcceptedCollaborators(listId);
  if (acceptedCount >= MAX_LIST_COLLABORATORS) throw new Error('MAX_COLLABORATORS');

  const updated = await prisma.list_collaborators.update({
    where: { id: record.id },
    data: { status: 'ACCEPTED' },
  });

  await createListNotification({
    userId: record.lists.userId,
    type: 'list_collaboration_accepted',
    title: 'پذیرش دعوت همکاری',
    message: `دعوت همکاری در لیست «${record.lists.title}» پذیرفته شد.`,
    link: `/user-lists/${listId}`,
  });

  return updated;
}

export async function ownerRespondToCollaborationRequest(
  ownerId: string,
  listId: string,
  memberUserId: string,
  action: 'accept' | 'reject'
) {
  const list = await prisma.lists.findUnique({ where: { id: listId } });
  if (!list || list.userId !== ownerId) throw new Error('FORBIDDEN');

  const record = await prisma.list_collaborators.findUnique({
    where: { listId_userId: { listId, userId: memberUserId } },
    include: { users: { select: { name: true, username: true } } },
  });
  if (!record || record.status !== 'PENDING') throw new Error('NOT_FOUND');
  if (record.invitedBy != null) throw new Error('USE_INVITEE_RESPONSE');

  if (action === 'reject') {
    return prisma.list_collaborators.update({
      where: { id: record.id },
      data: { status: 'REJECTED' },
    });
  }

  const acceptedCount = await countAcceptedCollaborators(listId);
  if (acceptedCount >= MAX_LIST_COLLABORATORS) throw new Error('MAX_COLLABORATORS');

  const updated = await prisma.list_collaborators.update({
    where: { id: record.id },
    data: { status: 'ACCEPTED' },
  });

  await createListNotification({
    userId: memberUserId,
    type: 'list_collaboration_accepted',
    title: 'پذیرش درخواست همکاری',
    message: `درخواست همکاری شما در لیست «${list.title}» پذیرفته شد.`,
    link: `/user-lists/${listId}`,
  });

  return updated;
}

export async function revokeCollaborator(ownerId: string, listId: string, memberUserId: string) {
  const list = await prisma.lists.findUnique({ where: { id: listId } });
  if (!list || list.userId !== ownerId) throw new Error('FORBIDDEN');

  const record = await prisma.list_collaborators.findUnique({
    where: { listId_userId: { listId, userId: memberUserId } },
  });
  if (!record || record.status === 'REVOKED') throw new Error('NOT_FOUND');

  return prisma.list_collaborators.update({
    where: { id: record.id },
    data: { status: 'REVOKED' },
  });
}

export async function fetchSharedLists(
  userId: string,
  options: { page?: number; limit?: number } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.list_collaboratorsWhereInput = {
    userId,
    status: 'ACCEPTED',
    lists: { deletedAt: null, isPublic: false },
  };

  const [memberships, total] = await Promise.all([
    prisma.list_collaborators.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        lists: { select: USER_LIST_SELECT },
      },
    }),
    prisma.list_collaborators.count({ where }),
  ]);

  return {
    lists: memberships.map((m) => ({
      ...m.lists,
      collaborationRole: m.role,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export function collaborationErrorMessage(code: string): string {
  switch (code) {
    case 'INVALID_USERNAME':
      return 'نام کاربری معتبر نیست';
    case 'USER_NOT_FOUND':
      return 'کاربری با این نام کاربری یافت نشد';
    case 'ALREADY_MEMBER':
      return 'این کاربر قبلاً عضو لیست است';
    case 'ALREADY_PENDING':
      return 'درخواست یا دعوت در انتظار تأیید است';
    case 'MAX_COLLABORATORS':
      return `حداکثر ${MAX_LIST_COLLABORATORS} همکار برای هر لیست مجاز است`;
    case 'PUBLIC_LIST_NO_COLLAB':
      return 'همکاری فقط برای لیست‌های شخصی فعال است';
    case 'COLLABORATION_DISABLED':
      return 'مالک لیست درخواست همکاری را فعال نکرده است';
    case 'CANNOT_INVITE_SELF':
      return 'نمی‌توانید خودتان را دعوت کنید';
    case 'OWNER_CANNOT_REQUEST':
      return 'مالک لیست نیازی به درخواست همکاری ندارد';
    case 'NOT_FOUND':
      return 'درخواست همکاری یافت نشد';
    case 'FORBIDDEN':
      return 'شما اجازه این عملیات را ندارید';
    default:
      return 'خطا در عملیات همکاری';
  }
}
