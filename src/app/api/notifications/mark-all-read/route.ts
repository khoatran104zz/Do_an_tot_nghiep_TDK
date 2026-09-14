import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notificationService } from "@/modules/notification/notification.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const updated = await notificationService.markAllAsRead({
      id: session.user.id,
      role: session.user.role as string,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Đã đánh dấu tất cả thông báo là đã đọc"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
