import { prisma } from '@/lib/prisma';
import { parcelRepository } from './parcel.repository';
import { ParcelFilter, ReceiveParcelDto, CollectParcelDto, UpdateParcelDto } from './parcel.types';
import { ParcelStatus, Role } from '@prisma/client';

export class ParcelService {
  async generateUniquePickupCode(): Promise<string> {
    for (let attempt = 0; attempt < 15; attempt++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const isActive = await parcelRepository.isPickupCodeActive(code);
      if (!isActive) return code;
    }
    return (100000 + (Date.now() % 900000)).toString();
  }

  async receiveParcel(
    dto: ReceiveParcelDto,
    staffUser: { id: string; role: string; fullName?: string }
  ) {
    const apartment = await prisma.apartment.findUnique({
      where: { id: dto.apartmentId },
      include: {
        residents: {
          where: { status: 'RESIDING' },
          select: { id: true, fullName: true, phone: true, userId: true },
        },
      },
    });

    if (!apartment) {
      throw new Error('Căn hộ không tồn tại trong hệ thống');
    }

    let finalRecipientName = dto.recipientName?.trim();
    let finalRecipientPhone = dto.recipientPhone?.trim();

    if (dto.recipientId) {
      const matched = apartment.residents.find((r: any) => r.id === dto.recipientId);
      if (matched) {
        if (!finalRecipientName) finalRecipientName = matched.fullName;
        if (!finalRecipientPhone) finalRecipientPhone = matched.phone;
      }
    }

    if (!finalRecipientName) {
      finalRecipientName = `Cư dân căn hộ ${apartment.code}`;
    }

    const pickupCode = await this.generateUniquePickupCode();

    const parcel = await parcelRepository.create({
      ...dto,
      recipientName: finalRecipientName,
      recipientPhone: finalRecipientPhone,
      pickupCode,
      receivedById: staffUser.id,
    });

    try {
      const trackingText = parcel.trackingNumber ? ` (Mã vận đơn: ${parcel.trackingNumber})` : '';
      const locationText = parcel.location ? ` - Vị trí: ${parcel.location}` : '';
      await prisma.notification.create({
        data: {
          title: 'Kiện hàng mới tại quầy lễ tân',
          content: `Căn hộ ${apartment.code} có một kiện hàng từ ${parcel.carrier}${trackingText}${locationText}. Mã nhận hàng bảo mật: ${pickupCode}. Vui lòng tới sảnh lễ tân để nhận bưu kiện.`,
          isGlobal: false,
          targetRole: Role.RESIDENT,
          senderId: staffUser.id,
          apartments: {
            create: {
              apartmentId: apartment.id,
            },
          },
        },
      });

      await parcelRepository.update(parcel.id, {
        status: ParcelStatus.NOTIFIED,
        notifiedAt: new Date(),
      });
      parcel.status = ParcelStatus.NOTIFIED;
      parcel.notifiedAt = new Date();
    } catch (notifError) {
      console.error('Không thể tạo thông báo tự động cho bưu kiện:', notifError);
    }

    return parcel;
  }

  async getParcels(
    filter: ParcelFilter,
    user: { id: string; role: string; email?: string }
  ) {
    let scopedApartmentId: string | undefined = undefined;

    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      if (!resident?.apartmentId) {
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      }
      scopedApartmentId = resident.apartmentId;
    }

    return parcelRepository.findAll(filter, scopedApartmentId);
  }

  async getParcelById(
    id: string,
    user: { id: string; role: string }
  ) {
    const parcel = await parcelRepository.findById(id);
    if (!parcel) {
      throw new Error('Không tìm thấy bưu kiện');
    }

    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      if (!resident || resident.apartmentId !== parcel.apartmentId) {
        throw new Error('Bạn không có quyền xem thông tin bưu kiện của căn hộ khác');
      }
    }

    return parcel;
  }

  async collectParcel(
    dto: CollectParcelDto,
    staffUser: { id: string; role: string; fullName?: string }
  ) {
    const cleanCode = dto.pickupCode.trim();

    let parcel = null;
    if (dto.parcelId) {
      parcel = await parcelRepository.findById(dto.parcelId);
      if (!parcel) throw new Error('Không tìm thấy bưu kiện tương ứng');
      if (parcel.pickupCode !== cleanCode) {
        throw new Error('Mã nhận hàng không chính xác');
      }
    } else {
      parcel = await parcelRepository.findByPickupCode(cleanCode);
    }

    if (!parcel) {
      throw new Error('Mã nhận hàng không hợp lệ hoặc bưu kiện đã được bàn giao trước đó');
    }

    if (parcel.status === ParcelStatus.COLLECTED) {
      throw new Error('Bưu kiện này đã được bàn giao');
    }

    if (parcel.status === ParcelStatus.RETURNED || parcel.status === ParcelStatus.CANCELLED) {
      throw new Error(`Không thể bàn giao bưu kiện đang ở trạng thái ${parcel.status}`);
    }

    const finalCollector = dto.collectedByName?.trim() || parcel.recipientName || 'Cư dân căn hộ';
    const now = new Date();

    const updated = await parcelRepository.update(parcel.id, {
      status: ParcelStatus.COLLECTED,
      collectedAt: now,
      collectedBy: staffUser.id ? { connect: { id: staffUser.id } } : undefined,
      collectedByName: finalCollector,
    });

    try {
      await prisma.notification.create({
        data: {
          title: 'Bưu kiện đã được nhận thành công',
          content: `Kiện hàng ${updated.carrier} (Mã: ${updated.trackingNumber || updated.pickupCode}) của căn hộ ${updated.apartment.code} đã được bàn giao cho ${finalCollector} lúc ${now.toLocaleTimeString('vi-VN')} ngày ${now.toLocaleDateString('vi-VN')}.`,
          isGlobal: false,
          targetRole: Role.RESIDENT,
          senderId: staffUser.id,
          apartments: {
            create: {
              apartmentId: updated.apartmentId,
            },
          },
        },
      });
    } catch (e) {
      console.error('Không thể tạo thông báo bàn giao bưu kiện:', e);
    }

    return updated;
  }

  async updateParcel(
    id: string,
    dto: UpdateParcelDto,
    _staffUser: { id: string; role: string }
  ) {
    const parcel = await parcelRepository.findById(id);
    if (!parcel) throw new Error('Không tìm thấy bưu kiện');

    return parcelRepository.update(id, dto);
  }

  async getStats(user: { id: string; role: string }) {
    let scopedApartmentId: string | undefined = undefined;
    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      if (resident?.apartmentId) {
        scopedApartmentId = resident.apartmentId;
      }
    }

    return parcelRepository.getStats(scopedApartmentId);
  }
}

export const parcelService = new ParcelService();
