import { prisma } from '@/lib/prisma';
import {
  StaffFilter,
  CreateStaffDto,
  UpdateStaffDto,
  AssignShiftDto,
  StaffOverviewStats,
} from './staff.types';
import { Role, StaffShift, StaffStatus, Prisma } from '@prisma/client';

export class StaffRepository {
  async generateEmployeeCode(role: Role): Promise<string> {
    let prefix = 'NV-STAFF-';
    if (role === Role.STAFF_TECHNICIAN) prefix = 'NV-TECH-';
    else if (role === Role.STAFF_SECURITY) prefix = 'NV-SEC-';
    else if (role === Role.STAFF_RECEPTIONIST) prefix = 'NV-REC-';
    else if (role === Role.MANAGER) prefix = 'NV-MGT-';

    const count = await prisma.staffProfile.count({
      where: {
        employeeCode: { startsWith: prefix },
      },
    });

    const padded = String(count + 1).padStart(3, '0');
    return `${prefix}${padded}`;
  }

  async findMany(filter: StaffFilter) {
    const { search, role, shift, status, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const staffRoles: Role[] = [
      Role.STAFF_TECHNICIAN,
      Role.STAFF_SECURITY,
      Role.STAFF_RECEPTIONIST,
      Role.MANAGER,
    ];

    const where: Prisma.UserWhereInput = {
      role: role ? role : { in: staffRoles },
    };

    if (shift || status) {
      where.staffProfile = {
        ...(shift ? { currentShift: shift } : {}),
        ...(status ? { status } : {}),
      };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        {
          staffProfile: {
            employeeCode: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staffProfile: true,
          _count: {
            select: {
              assignedTickets: {
                where: {
                  status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] },
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffProfile: true,
        assignedTickets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            apartment: {
              select: { id: true, code: true, building: true, floor: true },
            },
          },
        },
        ticketComments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: CreateStaffDto, passwordHash: string) {
    const employeeCode = data.employeeCode || (await this.generateEmployeeCode(data.role));

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        isActive: true,
        staffProfile: {
          create: {
            employeeCode,
            position: data.position,
            department: data.department || this.getDefaultDepartment(data.role),
            currentShift: data.currentShift || StaffShift.MORNING,
            status: StaffStatus.ACTIVE,
            assignedZone: data.assignedZone || null,
            notes: data.notes || null,
          },
        },
      },
      include: {
        staffProfile: true,
      },
    });
  }

  async update(userId: string, data: UpdateStaffDto) {
    const userUpdate: Prisma.UserUpdateInput = {};
    if (data.fullName !== undefined) userUpdate.fullName = data.fullName;
    if (data.phone !== undefined) userUpdate.phone = data.phone;
    if (data.role !== undefined) userUpdate.role = data.role;

    const profileUpdate: Prisma.StaffProfileUpdateInput = {};
    if (data.position !== undefined) profileUpdate.position = data.position;
    if (data.department !== undefined) profileUpdate.department = data.department;
    if (data.currentShift !== undefined) profileUpdate.currentShift = data.currentShift;
    if (data.assignedZone !== undefined) profileUpdate.assignedZone = data.assignedZone;
    if (data.status !== undefined) profileUpdate.status = data.status;
    if (data.notes !== undefined) profileUpdate.notes = data.notes;

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdate,
        staffProfile: {
          upsert: {
            create: {
              employeeCode: await this.generateEmployeeCode(data.role || Role.STAFF_TECHNICIAN),
              position: data.position || 'Nhân viên vận hành',
              department: data.department || 'Ban Quản Lý',
              currentShift: data.currentShift || StaffShift.MORNING,
              assignedZone: data.assignedZone || null,
              notes: data.notes || null,
            },
            update: profileUpdate,
          },
        },
      },
      include: {
        staffProfile: true,
      },
    });
  }

  async updateShift(userId: string, data: AssignShiftDto) {
    return prisma.staffProfile.upsert({
      where: { userId },
      create: {
        userId,
        employeeCode: await this.generateEmployeeCode(Role.STAFF_TECHNICIAN),
        position: 'Nhân viên vận hành',
        currentShift: data.currentShift,
        assignedZone: data.assignedZone || null,
        notes: data.notes || null,
      },
      update: {
        currentShift: data.currentShift,
        assignedZone: data.assignedZone !== undefined ? data.assignedZone : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
      include: {
        user: true,
      },
    });
  }

  async updateStatus(userId: string, status: StaffStatus) {
    const isActive = status === StaffStatus.ACTIVE || status === StaffStatus.ON_LEAVE;

    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isActive },
      }),
      prisma.staffProfile.upsert({
        where: { userId },
        create: {
          userId,
          employeeCode: await this.generateEmployeeCode(Role.STAFF_TECHNICIAN),
          position: 'Nhân viên vận hành',
          status,
        },
        update: { status },
        include: { user: true },
      }),
    ]);
  }

  async getStaffStats(): Promise<StaffOverviewStats> {
    const staffRoles: Role[] = [
      Role.STAFF_TECHNICIAN,
      Role.STAFF_SECURITY,
      Role.STAFF_RECEPTIONIST,
      Role.MANAGER,
    ];

    const [totalStaff, technicians, security, receptionist, shifts] = await Promise.all([
      prisma.user.count({ where: { role: { in: staffRoles } } }),
      prisma.user.count({ where: { role: Role.STAFF_TECHNICIAN } }),
      prisma.user.count({ where: { role: Role.STAFF_SECURITY } }),
      prisma.user.count({ where: { role: Role.STAFF_RECEPTIONIST } }),
      prisma.staffProfile.groupBy({
        by: ['currentShift'],
        _count: { id: true },
      }),
    ]);

    const shiftMap: Record<StaffShift, number> = {
      MORNING: 0,
      AFTERNOON: 0,
      NIGHT: 0,
    };
    shifts.forEach((s) => {
      shiftMap[s.currentShift] = s._count.id;
    });

    // Determine current shift based on current hour
    const currentHour = new Date().getHours();
    let currentActiveShift: StaffShift = StaffShift.MORNING;
    if (currentHour >= 6 && currentHour < 14) currentActiveShift = StaffShift.MORNING;
    else if (currentHour >= 14 && currentHour < 22) currentActiveShift = StaffShift.AFTERNOON;
    else currentActiveShift = StaffShift.NIGHT;

    const onShiftNow = shiftMap[currentActiveShift] || 0;

    return {
      totalStaff,
      onShiftNow,
      techniciansCount: technicians,
      securityCount: security,
      receptionistCount: receptionist,
      morningShiftCount: shiftMap.MORNING,
      afternoonShiftCount: shiftMap.AFTERNOON,
      nightShiftCount: shiftMap.NIGHT,
    };
  }

  private getDefaultDepartment(role: Role): string {
    switch (role) {
      case Role.STAFF_TECHNICIAN:
        return 'Ban Kỹ thuật & Bảo trì';
      case Role.STAFF_SECURITY:
        return 'Đội An ninh & Bảo vệ';
      case Role.STAFF_RECEPTIONIST:
        return 'Tổ Lễ tân & CSKH';
      case Role.MANAGER:
        return 'Ban Quản Lý Tòa Nhà';
      default:
        return 'Khối Vận hành';
    }
  }
}

export const staffRepository = new StaffRepository();
