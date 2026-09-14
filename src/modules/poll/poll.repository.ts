import { prisma } from '@/lib/prisma';
import { PollFilter, CreatePollDto, UpdatePollDto, PollWithDetails } from './poll.types';
import { PollStatus, Prisma } from '@prisma/client';

export class PollRepository {
  async findAll(filter: PollFilter = {}, residentApartmentId?: string) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(50, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PollWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search.trim(), mode: 'insensitive' } },
        { description: { contains: filter.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.poll.count({ where }),
      prisma.poll.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          options: { orderBy: { displayOrder: 'asc' } },
          _count: { select: { votes: true } },
          ...(residentApartmentId && {
            votes: {
              where: { apartmentId: residentApartmentId },
              select: { optionId: true, createdAt: true },
            },
          }),
        },
      }),
    ]);

    const formatted = items.map((p: any) => {
      const userVote = p.votes && p.votes.length > 0 ? p.votes[0] : null;
      const { votes, ...rest } = p;
      return {
        ...rest,
        userVote,
      };
    });

    return {
      items: formatted as PollWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, residentApartmentId?: string): Promise<PollWithDetails | null> {
    const poll: any = await prisma.poll.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        options: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { votes: true } },
        ...(residentApartmentId && {
          votes: {
            where: { apartmentId: residentApartmentId },
            select: { optionId: true, createdAt: true },
          },
        }),
      },
    });

    if (!poll) return null;

    const userVote = poll.votes && poll.votes.length > 0 ? poll.votes[0] : null;
    delete poll.votes;
    return {
      ...poll,
      userVote,
    } as PollWithDetails;
  }

  async create(data: CreatePollDto, userId: string) {
    return prisma.poll.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: PollStatus.ACTIVE,
        targetScope: data.targetScope,
        targetValue: data.targetValue?.trim() || null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        createdById: userId,
        options: {
          create: data.options.map((opt, idx) => ({
            label: opt.trim(),
            displayOrder: idx + 1,
          })),
        },
      },
      include: {
        options: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, data: UpdatePollDto) {
    const updateData: Prisma.PollUpdateInput = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.status) updateData.status = data.status;
    if (data.endAt) updateData.endAt = new Date(data.endAt);

    return prisma.poll.update({
      where: { id },
      data: updateData,
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { votes: true } },
      },
    });
  }

  async recordVote(pollId: string, optionId: string, apartmentId: string, residentId?: string) {
    return prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        apartmentId,
        voterResidentId: residentId || null,
      },
    });
  }

  async hasApartmentVoted(pollId: string, apartmentId: string): Promise<boolean> {
    const count = await prisma.pollVote.count({
      where: {
        pollId,
        apartmentId,
      },
    });
    return count > 0;
  }

  async getResults(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!poll) return null;

    let eligibleApartments = 0;
    if (poll.targetScope === 'ALL_APARTMENTS') {
      eligibleApartments = await prisma.apartment.count();
    } else if (poll.targetScope === 'BUILDING' && poll.targetValue) {
      eligibleApartments = await prisma.apartment.count({
        where: { building: poll.targetValue },
      });
    } else if (poll.targetScope === 'FLOOR' && poll.targetValue) {
      eligibleApartments = await prisma.apartment.count({
        where: { floor: parseInt(poll.targetValue, 10) || 1 },
      });
    } else {
      eligibleApartments = await prisma.apartment.count();
    }

    if (eligibleApartments === 0) eligibleApartments = 1;

    const totalVotes = poll._count.votes;
    const participationRate = parseFloat(((totalVotes / eligibleApartments) * 100).toFixed(1));

    const options = poll.options.map((opt) => {
      const count = opt._count.votes;
      const percentage = totalVotes > 0 ? parseFloat(((count / totalVotes) * 100).toFixed(1)) : 0;
      return {
        id: opt.id,
        label: opt.label,
        displayOrder: opt.displayOrder,
        votesCount: count,
        percentage,
      };
    });

    return {
      pollId: poll.id,
      title: poll.title,
      status: poll.status,
      startAt: poll.startAt,
      endAt: poll.endAt,
      eligibleApartments,
      totalVotes,
      participationRate,
      options,
    };
  }
}

export const pollRepository = new PollRepository();
