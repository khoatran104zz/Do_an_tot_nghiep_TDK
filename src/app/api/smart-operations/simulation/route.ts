import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ioTSensorService } from '@/modules/smart-operations/iot-sensor.service';
import { z } from 'zod';

const simulationSchema = z.object({
  scenario: z.enum(['WATER_LEAKAGE', 'SMOKE', 'ELEVATOR', 'HIGH_TEMP', 'RESET']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Ban Quản Lý hoặc Kỹ thuật viên mới có quyền kích hoạt mô phỏng IoT' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = simulationSchema.parse(body);

    const result = await ioTSensorService.simulate(validated.scenario, {
      id: session.user.id,
      email: session.user.email || undefined,
      role: session.user.role as string,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
