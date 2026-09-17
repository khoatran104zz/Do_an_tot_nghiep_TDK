import { prisma } from '@/lib/prisma';
import { FeedbackFilter, CreateFeedbackDto, RespondFeedbackDto, RateFeedbackDto } from './feedback.types';
import { Prisma } from '@prisma/client';

export class FeedbackRepository {
  async findAll(filter: FeedbackFilter) {
    const { search, category, priority, status, apartmentId, buildingId, buildingIds, residentId, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const andClauses: Prisma.FeedbackWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { apartment: { code: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (category) andClauses.push({ category });
    if (priority) andClauses.push({ priority });
    if (status) andClauses.push({ status });
    if (apartmentId) andClauses.push({ apartmentId });
    if (residentId) andClauses.push({ residentId });

    if (buildingIds && buildingIds.length > 0) {
      andClauses.push({
        apartment: {
          OR: [
            { buildingId: { in: buildingIds } },
            { block: { buildingId: { in: buildingIds } } },
          ],
        },
      });
    } else if (buildingId) {
      andClauses.push({
        apartment: {
          OR: [
            { buildingId },
            { block: { buildingId } },
          ],
        },
      });
    }

    const where: Prisma.FeedbackWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { id: true, code: true, building: true } },
          resident: { select: { id: true, fullName: true, phone: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return prisma.feedback.findUnique({
      where: { id },
      include: {
        apartment: true,
        resident: true,
      },
    });
  }

  async create(data: CreateFeedbackDto, code: string) {
    if (!data.apartmentId || !data.residentId) {
      throw new Error('apartmentId và residentId là bắt buộc khi tạo phản ánh');
    }
    return prisma.feedback.create({
      data: {
        code,
        apartmentId: data.apartmentId,
        residentId: data.residentId,
        category: data.category,
        title: data.title,
        content: data.content,
        priority: data.priority || 'MEDIUM',
        images: data.images || [],
        status: 'NEW',
      },
    });
  }

  async respond(id: string, dto: RespondFeedbackDto) {
    return prisma.feedback.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.responseContent && { responseContent: dto.responseContent }),
      },
    });
  }

  async rate(id: string, dto: RateFeedbackDto) {
    return prisma.feedback.update({
      where: { id },
      data: {
        rating: dto.rating,
        ratingComment: dto.ratingComment || null,
      },
    });
  }

  async delete(id: string) {
    return prisma.feedback.delete({
      where: { id },
    });
  }
}

export const feedbackRepository = new FeedbackRepository();
