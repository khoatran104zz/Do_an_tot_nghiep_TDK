import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiAssistantService } from '@/modules/ai/ai-assistant.service';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Vui lòng nhập nội dung câu hỏi'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const validated = chatSchema.parse(body);

    const result = await aiAssistantService.chat(validated.message, session.user.id, {
      email: session.user.email || undefined,
      role: session.user.role as string,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
