import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSessionScheduledEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { exchangeId, title, scheduledDate, startTime, durationMinutes } = body;

    if (!title || !scheduledDate || !startTime) {
      return NextResponse.json({ success: false, error: "Missing required session parameters." }, { status: 400 });
    }

    // Query Exchange & Peer details
    const { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select("*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*)")
      .eq("id", exchangeId)
      .single();

    if (!exchange) {
      return NextResponse.json({ success: false, error: "Exchange not found." }, { status: 404 });
    }

    const isUserOne = exchange.user_one_id === user.id;
    const actorName = isUserOne ? exchange.user_one?.full_name : exchange.user_two?.full_name;

    const jitsiRoomUrl = `https://meet.jit.si/skillswap-exchange-${exchangeId.slice(0, 8)}`;

    // Dispatch email to user's registered email
    const result = await sendSessionScheduledEmail({
      recipientEmail: user.email || "student@university.edu",
      recipientName: actorName || "Student",
      sessionTitle: title,
      scheduledDate,
      startTime,
      durationMinutes: durationMinutes || 60,
      jitsiRoomUrl,
      partnerName: isUserOne ? exchange.user_two?.full_name || "Partner" : exchange.user_one?.full_name || "Partner",
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("API /api/notifications/send-email error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to dispatch email." }, { status: 500 });
  }
}
