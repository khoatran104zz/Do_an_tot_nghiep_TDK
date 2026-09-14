import { prisma } from '@/lib/prisma';
import { pollRepository } from './poll.repository';
import { PollFilter, CreatePollDto, UpdatePollDto, VotePollDto } from './poll.types';
import { domainEvents } from '@/lib/events/domain-events';
import { NotificationCategory, NotificationPriority, PollStatus, Role } from '@prisma/client';

export class PollService {
  async getPolls(filter: PollFilter, user: { id: string; role: string }) {
    let residentApartmentId: string | undefined = undefined;
    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      residentApartmentId = resident?.apartmentId || undefined;
      if (!filter.status) {
        filter.status = PollStatus.ACTIVE;
      }
    }

    return pollRepository.findAll(filter, residentApartmentId);
  }

  async getPollById(id: string, user: { id: string; role: string }) {
    let residentApartmentId: string | undefined = undefined;
    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      residentApartmentId = resident?.apartmentId || undefined;
    }

    const poll = await pollRepository.findById(id, residentApartmentId);
    if (!poll) {
      throw new Error('Không tìm thấy cuộc khảo sát');
    }
    return poll;
  }

  async createPoll(dto: CreatePollDto, user: { id: string; role: string }) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new Error('Chỉ Ban Quản Lý hoặc Quản trị viên mới có quyền tạo cuộc khảo sát');
    }

    const poll = await pollRepository.create(dto, user.id);

    // Create Notification and Dispatch Realtime Event
    try {
      await prisma.notification.create({
        data: {
          title: 'Khảo sát ý kiến cư dân mới',
          content: `Ban quản lý vừa mở cuộc biểu quyết: "${poll.title}". Mời cư dân tham gia đóng góp ý kiến.`,
          category: NotificationCategory.POLL,
          priority: NotificationPriority.NORMAL,
          isGlobal: true,
          targetRole: Role.RESIDENT,
          relatedEntityType: 'POLL',
          relatedEntityId: poll.id,
          senderId: user.id,
        },
      });

      domainEvents.dispatch({
        type: 'POLL_PUBLISHED',
        title: 'Khảo sát ý kiến cư dân mới',
        message: poll.title,
        category: NotificationCategory.POLL,
        priority: NotificationPriority.NORMAL,
        targetScope: 'ROLE',
        targetRole: Role.RESIDENT,
        relatedEntityType: 'POLL',
        relatedEntityId: poll.id,
      });
    } catch (e) {
      console.error('Không thể tạo thông báo tự động cho Poll:', e);
    }

    return poll;
  }

  async updatePoll(id: string, dto: UpdatePollDto, user: { id: string; role: string }) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new Error('Chỉ Ban Quản Lý mới có quyền cập nhật cuộc khảo sát');
    }

    const existing = await pollRepository.findById(id);
    if (!existing) throw new Error('Không tìm thấy cuộc khảo sát');

    if (dto.options && existing._count.votes > 0) {
      throw new Error('Không thể chỉnh sửa phương án khi đã có căn hộ biểu quyết');
    }

    return pollRepository.update(id, dto);
  }

  async vote(pollId: string, dto: VotePollDto, user: { id: string; role: string }) {
    if (user.role !== Role.RESIDENT) {
      throw new Error('Chỉ cư dân sinh sống tại chung cư mới có quyền tham gia biểu quyết');
    }

    // Resolve Resident and Apartment securely from DB
    const resident = await prisma.resident.findFirst({
      where: { userId: user.id },
      include: { apartment: true },
    });

    if (!resident || !resident.apartmentId) {
      throw new Error('Tài khoản của bạn chưa được liên kết với căn hộ nào để thực hiện biểu quyết');
    }

    const poll = await pollRepository.findById(pollId);
    if (!poll) {
      throw new Error('Cuộc khảo sát không tồn tại');
    }

    if (poll.status !== PollStatus.ACTIVE) {
      throw new Error('Cuộc khảo sát hiện không trong thời gian nhận biểu quyết');
    }

    const now = new Date();
    if (now < poll.startAt || now > poll.endAt) {
      throw new Error('Đã hết hạn tham gia biểu quyết cho khảo sát này');
    }

    const optionExists = poll.options.some((o) => o.id === dto.optionId);
    if (!optionExists) {
      throw new Error('Phương án lựa chọn không hợp lệ');
    }

    // Check if apartment has already voted
    const alreadyVoted = await pollRepository.hasApartmentVoted(pollId, resident.apartmentId);
    if (alreadyVoted) {
      throw new Error(
        'Căn hộ của bạn đã thực hiện biểu quyết cho khảo sát này. Mỗi căn hộ chỉ có duy nhất 1 lượt biểu quyết.'
      );
    }

    // Record Vote with DB unique constraint
    try {
      const vote = await pollRepository.recordVote(
        pollId,
        dto.optionId,
        resident.apartmentId,
        resident.id
      );
      return vote;
    } catch (dbErr: any) {
      if (dbErr.code === 'P2002') {
        throw new Error('Căn hộ của bạn đã bỏ phiếu. Ràng buộc: Mỗi căn hộ chỉ được tính 1 phiếu.');
      }
      throw dbErr;
    }
  }

  async getResults(pollId: string, _user: { id: string; role: string }) {
    const results = await pollRepository.getResults(pollId);
    if (!results) {
      throw new Error('Không tìm thấy cuộc khảo sát');
    }
    return results;
  }
}

export const pollService = new PollService();
