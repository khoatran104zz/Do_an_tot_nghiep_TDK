import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiAssistantService } from '@/modules/ai/ai-assistant.service';
import { z } from 'zod';

const classifySchema = z.object({
  title: z.string().optional().default(''),
  content: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const validated = classifySchema.parse(body);

    const result = await aiAssistantService.classifyIncident(
      validated.title || '',
      validated.content || '',
      {
        id: session.user.id,
        email: session.user.email || undefined,
        role: session.user.role as string,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
