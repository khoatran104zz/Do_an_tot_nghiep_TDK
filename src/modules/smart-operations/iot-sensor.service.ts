import { prisma } from '@/lib/prisma';
import { 
  IoTSensorType, 
  IoTSensorStatus, 
  AlertSeverity, 
  SmartAlertSource, 
  SmartAlertStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  Role,
  NotificationCategory,
  NotificationPriority,
  NotificationTargetScope
} from '@prisma/client';
import { domainEvents } from '@/lib/events/domain-events';
import { auditLogService } from '../audit/audit-log.service';

export interface SimulationActor {
  id?: string;
  email?: string;
  role?: string;
}

export class IoTSensorService {
  /**
   * Seed 7 baseline building sensors if database is empty
   */
  async seedInitialSensors() {
    const count = await prisma.ioTSensor.count();
    if (count > 0) return;

    const initialSensors = [
      {
        code: 'TEMP-F12',
        name: 'Cảm biến nhiệt độ hành lang Tầng 12',
        type: IoTSensorType.TEMPERATURE,
        location: 'Tầng 12 - Tháp A',
        unit: '°C',
        currentValue: '27.0',
        thresholdMin: 18.0,
        thresholdMax: 40.0,
        status: IoTSensorStatus.NORMAL,
        metadata: { manufacturer: 'Honeywell', model: 'TH-200' },
      },
      {
        code: 'SMOKE-F12',
        name: 'Cảm biến khói PCCC Tầng 12',
        type: IoTSensorType.SMOKE,
        location: 'Tầng 12 - Tháp A',
        unit: 'ppm',
        currentValue: '12',
        thresholdMin: 0,
        thresholdMax: 50,
        status: IoTSensorStatus.NORMAL,
        metadata: { zone: 'PCCC-Z12', standard: 'NFPA 72' },
      },
      {
        code: 'WATER-LVL-B2',
        name: 'Cảm biến mức nước bể ngầm sinh hoạt',
        type: IoTSensorType.WATER_LEVEL,
        location: 'Tầng hầm B2 - Bể ngầm trung tâm',
        unit: '%',
        currentValue: '85',
        thresholdMin: 20.0,
        thresholdMax: 95.0,
        status: IoTSensorStatus.NORMAL,
        metadata: { capacityLiters: 150000 },
      },
      {
        code: 'LEAK-F12',
        name: 'Cảm biến rò rỉ nước hộp kỹ thuật Tầng 12',
        type: IoTSensorType.WATER_LEAKAGE,
        location: 'Tầng 12 - Trục kỹ thuật nước',
        unit: 'trạng thái',
        currentValue: 'NORMAL',
        thresholdMin: 0,
        thresholdMax: 1,
        status: IoTSensorStatus.NORMAL,
        metadata: { floor: 12, pipeZone: 'RISER-A12' },
      },
      {
        code: 'PUMP-01',
        name: 'Cảm biến áp lực cụm bơm tăng áp P-01',
        type: IoTSensorType.PUMP_PRESSURE,
        location: 'Phòng kỹ thuật cơ điện hầm B1',
        unit: 'bar',
        currentValue: '3.2',
        thresholdMin: 2.0,
        thresholdMax: 5.0,
        status: IoTSensorStatus.NORMAL,
        metadata: { pumpSet: 'GRUNDFOS-HYDRO' },
      },
      {
        code: 'POWER-MAIN',
        name: 'Cảm biến công suất tiêu thụ điện toàn khu',
        type: IoTSensorType.POWER,
        location: 'Trạm biến áp trung tâm 1000kVA',
        unit: '%',
        currentValue: '72',
        thresholdMin: 0,
        thresholdMax: 90,
        status: IoTSensorStatus.NORMAL,
        metadata: { voltage: 380, loadKwhToday: 1420 },
      },
      {
        code: 'ELEV-A01',
        name: 'Hệ thống giám sát vận hành Thang máy Tháp A',
        type: IoTSensorType.ELEVATOR,
        location: 'Trục thang máy Tháp A',
        unit: 'trạng thái',
        currentValue: '4 / 4 ONLINE',
        thresholdMin: 1,
        thresholdMax: 4,
        status: IoTSensorStatus.NORMAL,
        metadata: { brand: 'Mitsubishi', activeCars: 4, totalCars: 4 },
      },
    ];

    for (const sensor of initialSensors) {
      await prisma.ioTSensor.upsert({
        where: { code: sensor.code },
        update: {},
        create: sensor,
      });
    }
  }

  /**
   * Get all sensors (auto seeds if empty)
   */
  async getSensors() {
    await this.seedInitialSensors();
    return prisma.ioTSensor.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        alerts: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get single sensor with recent alerts
   */
  async getSensorDetail(idOrCode: string) {
    return prisma.ioTSensor.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      include: {
        alerts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * SIMULATION ENGINE: Executes simulated incident workflows
   */
  async simulate(
    scenario: 'WATER_LEAKAGE' | 'SMOKE' | 'ELEVATOR' | 'HIGH_TEMP' | 'RESET',
    actor?: SimulationActor
  ) {
    await this.seedInitialSensors();

    switch (scenario) {
      case 'WATER_LEAKAGE':
        return this.simulateWaterLeakage(actor);
      case 'SMOKE':
        return this.simulateSmokeAlert(actor);
      case 'ELEVATOR':
        return this.simulateElevatorFailure(actor);
      case 'HIGH_TEMP':
        return this.simulateHighTemperature(actor);
      case 'RESET':
        return this.resetSimulation(actor);
      default:
        throw new Error('Kịch bản mô phỏng không hợp lệ');
    }
  }

  /**
   * 1. WATER LEAKAGE SCENARIO (Floor 12)
   */
  private async simulateWaterLeakage(actor?: SimulationActor) {
    // 1. Update Sensor to CRITICAL
    const sensor = await prisma.ioTSensor.update({
      where: { code: 'LEAK-F12' },
      data: {
        status: IoTSensorStatus.CRITICAL,
        currentValue: 'RÒ RỈ NƯỚC CẤP TÍNH',
        lastUpdated: new Date(),
      },
    });

    // 2. Create SmartAlertRecord
    const alert = await prisma.smartAlertRecord.create({
      data: {
        title: 'CẢNH BÁO RÒ RỈ NƯỚC - TẦNG 12 THÁP A',
        description: 'Cảm biến LEAK-F12 phát hiện nước rò rỉ mạnh tại hộp kỹ thuật Tầng 12. Nguy cơ tràn hành lang và ngấm trần.',
        type: 'WATER_LEAKAGE',
        severity: AlertSeverity.CRITICAL,
        source: SmartAlertSource.IOT,
        status: SmartAlertStatus.OPEN,
        location: 'Tầng 12 - Trục kỹ thuật nước',
        sensorId: sensor.id,
        actionUrl: '/smart-operations/iot',
      },
    });

    // 3. Find or pick an apartment & resident on Floor 12 (or fallback to any apartment)
    const apartment =
      (await prisma.apartment.findFirst({
        where: { floor: 12 },
        include: { residents: { take: 1 } },
      })) ||
      (await prisma.apartment.findFirst({
        include: { residents: { take: 1 } },
      }));

    // Find technician to assign
    const technician = await prisma.user.findFirst({
      where: { role: Role.STAFF_TECHNICIAN, isActive: true },
    });

    // 4. Duplicate prevention: Check if ticket already exists in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingTicket = await prisma.feedback.findFirst({
      where: {
        title: { contains: 'Rò rỉ nước - Tầng 12' },
        createdAt: { gte: fiveMinutesAgo },
        status: { in: [TicketStatus.NEW, TicketStatus.ASSIGNED, TicketStatus.PROCESSING] },
      },
    });

    let ticket = existingTicket;

    if (!existingTicket && apartment) {
      // Find or pick a resident ID
      const residentId = apartment.residents[0]?.id;
      if (residentId) {
        const ticketCode = `TICK-EMG-${Date.now().toString().slice(-4)}`;
        ticket = await prisma.feedback.create({
          data: {
            code: ticketCode,
            title: '[SỰ CỐ KHẨN CẤP IOT] Rò rỉ nước - Tầng 12 Tháp A',
            content: 'Cảm biến IoT (LEAK-F12) phát hiện rò rỉ nước cấp tính tại hộp kỹ thuật Tầng 12. Hệ thống đã tự động kích hoạt quy trình ứng cứu khẩn cấp.',
            category: TicketCategory.WATER,
            priority: TicketPriority.URGENT,
            status: technician ? TicketStatus.ASSIGNED : TicketStatus.NEW,
            assignedStaffId: technician?.id || null,
            slaDueAt: new Date(Date.now() + 2 * 3600 * 1000), // 2 hours urgent SLA
            apartmentId: apartment.id,
            residentId: residentId,
            internalNote: `[TỰ ĐỘNG BỞI IOT ENGINE] Alert ID: ${alert.id}`,
          },
        });

        // Link ticket back to SmartAlertRecord
        await prisma.smartAlertRecord.update({
          where: { id: alert.id },
          data: {
            relatedEntityType: 'TICKET',
            relatedEntityId: ticket.id,
            actionUrl: `/feedbacks?search=${ticket.code}`,
          },
        });
      }
    }

    // 5. Notify Manager & Technician
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: [Role.ADMIN, Role.MANAGER] } },
    });

    if (adminUser) {
      await prisma.notification.create({
        data: {
          title: '🚨 BÁO ĐỘNG KHẨN: Rò rỉ nước Tầng 12',
          content: `Cảm biến LEAK-F12 kích hoạt cảnh báo rò rỉ nước tại Tầng 12 Tháp A. ${
            technician ? `Đã gán nhiệm vụ xử lý cho kỹ thuật viên: ${technician.fullName}.` : 'Cần phân công kỹ thuật viên ngay.'
          }`,
          category: NotificationCategory.EMERGENCY,
          priority: NotificationPriority.EMERGENCY,
          targetScope: NotificationTargetScope.ALL,
          targetRole: Role.STAFF_TECHNICIAN,
          relatedEntityType: 'TICKET',
          relatedEntityId: ticket?.id,
          senderId: adminUser.id,
        },
      });
    }

    // 6. Realtime Event Emission via SSE
    domainEvents.dispatch({
      type: 'EMERGENCY_ALERT',
      title: '🚨 BÁO ĐỘNG KHẨN CẤP: RÒ RỈ NƯỚC TẦNG 12',
      message: 'Cảm biến IoT phát hiện rò rỉ nước tại hộp kỹ thuật Tầng 12 Tháp A. Đội kỹ thuật đang tiến hành xử lý.',
      category: NotificationCategory.EMERGENCY,
      priority: NotificationPriority.EMERGENCY,
      targetScope: 'ALL',
      relatedEntityType: 'TICKET',
      relatedEntityId: ticket?.id,
    });

    // 7. Audit Log
    await auditLogService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'IOT_SIMULATION_TRIGGERED',
      entity: 'IOT_SENSOR',
      entityId: sensor.id,
      metadata: {
        scenario: 'WATER_LEAKAGE',
        sensorCode: 'LEAK-F12',
        alertId: alert.id,
        ticketId: ticket?.id,
        ticketCode: ticket?.code,
        assignedTo: technician?.fullName,
      },
    });

    await auditLogService.record({
      actorId: actor?.id,
      action: 'SENSOR_ALERT_CREATED',
      entity: 'SMART_ALERT',
      entityId: alert.id,
      metadata: { severity: 'CRITICAL', type: 'WATER_LEAKAGE' },
    });

    return {
      success: true,
      scenario: 'WATER_LEAKAGE',
      sensor,
      alert,
      ticket,
      technician: technician ? { id: technician.id, name: technician.fullName } : null,
      message: 'Đã kích hoạt mô phỏng sự cố rò rỉ nước Tầng 12 thành công.',
    };
  }

  /**
   * 2. SMOKE ALERT SCENARIO (Floor 12)
   */
  private async simulateSmokeAlert(actor?: SimulationActor) {
    const sensor = await prisma.ioTSensor.update({
      where: { code: 'SMOKE-F12' },
      data: {
        status: IoTSensorStatus.CRITICAL,
        currentValue: '185 ppm (VƯỢT NGƯỠNG)',
        lastUpdated: new Date(),
      },
    });

    const alert = await prisma.smartAlertRecord.create({
      data: {
        title: 'CẢNH BÁO KHÓI PCCC - TẦNG 12 THÁP A',
        description: 'Cảm biến SMOKE-F12 đo được nồng độ khói 185 ppm (vượt ngưỡng 50 ppm). Yêu cầu kiểm tra an toàn PCCC khẩn cấp.',
        type: 'SMOKE_DETECTED',
        severity: AlertSeverity.CRITICAL,
        source: SmartAlertSource.IOT,
        status: SmartAlertStatus.OPEN,
        location: 'Tầng 12 - Tháp A',
        sensorId: sensor.id,
        actionUrl: '/smart-operations/iot',
      },
    });

    // Realtime notification
    domainEvents.dispatch({
      type: 'EMERGENCY_ALERT',
      title: '🚨 BÁO ĐỘNG KHÓI PCCC - TẦNG 12 (MÔ PHỎNG)',
      message: 'Cảm biến PCCC phát hiện nồng độ khói cao tại Tầng 12 Tháp A. Chế độ diễn tập mô phỏng đang hoạt động.',
      category: NotificationCategory.EMERGENCY,
      priority: NotificationPriority.EMERGENCY,
      targetScope: 'ALL',
    });

    await auditLogService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'IOT_SIMULATION_TRIGGERED',
      entity: 'IOT_SENSOR',
      entityId: sensor.id,
      metadata: { scenario: 'SMOKE', alertId: alert.id },
    });

    return {
      success: true,
      scenario: 'SMOKE',
      sensor,
      alert,
      message: 'Đã kích hoạt mô phỏng cảnh báo khói Tầng 12 thành công.',
    };
  }

  /**
   * 3. ELEVATOR FAILURE SCENARIO
   */
  private async simulateElevatorFailure(actor?: SimulationActor) {
    const sensor = await prisma.ioTSensor.update({
      where: { code: 'ELEV-A01' },
      data: {
        status: IoTSensorStatus.OFFLINE,
        currentValue: '3 / 4 ONLINE (CABIN A01 OFFLINE)',
        lastUpdated: new Date(),
      },
    });

    const alert = await prisma.smartAlertRecord.create({
      data: {
        title: 'THANG MÁY A01 MẤT TÍN HIỆU KẾT NỐI (OFFLINE)',
        description: 'Cabin thang máy A01 dừng đột ngột giữa Tầng 8 và 9. Cần kỹ thuật viên thang máy kiểm tra hệ thống điều khiển.',
        type: 'ELEVATOR_OFFLINE',
        severity: AlertSeverity.HIGH,
        source: SmartAlertSource.IOT,
        status: SmartAlertStatus.OPEN,
        location: 'Trục thang máy Tháp A',
        sensorId: sensor.id,
        actionUrl: '/smart-operations/iot',
      },
    });

    domainEvents.dispatch({
      type: 'EMERGENCY_ALERT',
      title: '⚠️ SỰ CỐ THANG MÁY A01 TẠM NGƯNG VẬN HÀNH',
      message: 'Thang máy A01 đang được kiểm tra kỹ thuật. Cư dân vui lòng sử dụng Thang máy A02, A03, A04.',
      category: NotificationCategory.MAINTENANCE,
      priority: NotificationPriority.URGENT,
      targetScope: 'ALL',
    });

    await auditLogService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'IOT_SIMULATION_TRIGGERED',
      entity: 'IOT_SENSOR',
      entityId: sensor.id,
      metadata: { scenario: 'ELEVATOR', alertId: alert.id },
    });

    return {
      success: true,
      scenario: 'ELEVATOR',
      sensor,
      alert,
      message: 'Đã kích hoạt mô phỏng sự cố thang máy A01.',
    };
  }

  /**
   * 4. HIGH TEMPERATURE SCENARIO
   */
  private async simulateHighTemperature(actor?: SimulationActor) {
    const sensor = await prisma.ioTSensor.update({
      where: { code: 'TEMP-F12' },
      data: {
        status: IoTSensorStatus.CRITICAL,
        currentValue: '58.5',
        lastUpdated: new Date(),
      },
    });

    const alert = await prisma.smartAlertRecord.create({
      data: {
        title: 'NHIỆT ĐỘ HÀNH LANG TẦNG 12 VƯỢT NGƯỠNG AN TOÀN',
        description: 'Nhiệt độ đo được 58.5°C (ngưỡng an toàn tối đa 40°C). Cần rà soát nguy cơ chập điện hoặc bức xạ nhiệt.',
        type: 'HIGH_TEMPERATURE',
        severity: AlertSeverity.HIGH,
        source: SmartAlertSource.IOT,
        status: SmartAlertStatus.OPEN,
        location: 'Tầng 12 - Tháp A',
        sensorId: sensor.id,
        actionUrl: '/smart-operations/iot',
      },
    });

    await auditLogService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'IOT_SIMULATION_TRIGGERED',
      entity: 'IOT_SENSOR',
      entityId: sensor.id,
      metadata: { scenario: 'HIGH_TEMP', alertId: alert.id },
    });

    return {
      success: true,
      scenario: 'HIGH_TEMP',
      sensor,
      alert,
      message: 'Đã kích hoạt mô phỏng nhiệt độ cao Tầng 12.',
    };
  }

  /**
   * 5. RESET SIMULATION SCENARIO
   */
  private async resetSimulation(actor?: SimulationActor) {
    // Reset all 7 sensors back to NORMAL
    await prisma.ioTSensor.update({
      where: { code: 'TEMP-F12' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: '27.0', lastUpdated: new Date() },
    });
    await prisma.ioTSensor.update({
      where: { code: 'SMOKE-F12' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: '12', lastUpdated: new Date() },
    });
    await prisma.ioTSensor.update({
      where: { code: 'WATER-LVL-B2' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: '85', lastUpdated: new Date() },
    });
    await prisma.ioTSensor.update({
      where: { code: 'LEAK-F12' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: 'NORMAL', lastUpdated: new Date() },
    });
    await prisma.ioTSensor.update({
      where: { code: 'PUMP-01' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: '3.2', lastUpdated: new Date() },
    });
    await prisma.ioTSensor.update({
      where: { code: 'POWER-MAIN' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: '72', lastUpdated: new Date() },
    });
    await prisma.ioTSensor.update({
      where: { code: 'ELEV-A01' },
      data: { status: IoTSensorStatus.NORMAL, currentValue: '4 / 4 ONLINE', lastUpdated: new Date() },
    });

    // Resolve open IoT simulation alerts
    await prisma.smartAlertRecord.updateMany({
      where: {
        source: SmartAlertSource.IOT,
        status: SmartAlertStatus.OPEN,
      },
      data: {
        status: SmartAlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById: actor?.id || null,
      },
    });

    await auditLogService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'IOT_SIMULATION_TRIGGERED',
      entity: 'IOT_SENSOR',
      metadata: { scenario: 'RESET', note: 'All sensors and simulation alerts restored to NORMAL' },
    });

    return {
      success: true,
      scenario: 'RESET',
      message: 'Toàn bộ cảm biến đã được khôi phục về trạng thái bình thường.',
    };
  }
}

export const ioTSensorService = new IoTSensorService();
