import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { visitorService } from '@/modules/visitor/visitor.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {
      // Body is optional
    }

    const pass = await visitorService.cancelVisitorPass(id, reason, {
      id: session.user.id,
      email: session.user.email || '',
      role: session.user.role,
      fullName: session.user.name,
    });
    return NextResponse.json({ success: true, data: pass });
  } catch (error: any) {
    console.error('Error cancelling visitor pass:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi hủy thẻ khách' },
      { status: error.message?.includes('quyền') ? 403 : 400 }
    );
  }
}
