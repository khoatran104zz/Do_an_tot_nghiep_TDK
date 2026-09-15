import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smartAlertService } from '@/modules/smart-operations/smart-alert.service';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['ACKNOWLEDGE', 'RESOLVE']),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = actionSchema.parse(body);

    const actor = {
      id: session.user.id,
      email: session.user.email || undefined,
      role: session.user.role as string,
    };

    let result;
    if (validated.action === 'ACKNOWLEDGE') {
      result = await smartAlertService.acknowledgeAlert(id, actor);
    } else {
      result = await smartAlertService.resolveAlert(id, actor);
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
