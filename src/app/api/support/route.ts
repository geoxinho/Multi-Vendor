import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SupportTicket } from "@/models/SupportTicket";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { name, email, subject, category, message, orderId } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields (Name, Email, Subject, Message)." },
        { status: 400 }
      );
    }

    const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const adminEmail = process.env.ADMIN_EMAIL || "georgex.edg@gmail.com";

    // Save ticket to database
    await connectDB();
    await SupportTicket.create({
      ticketId,
      name,
      email,
      subject,
      category: category || "General Inquiry",
      orderId: orderId || "",
      message,
      isLoggedIn: !!session,
      userId: session?.user?.id || "",
      status: "open",
    });

    const emailSubject = `🚨 Help Desk Ticket [${ticketId}] — ${subject}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Support Ticket #${ticketId}</h2>
          <p style="color: #6b7280; font-size: 14px;">A new inquiry has been submitted through the Help Desk.</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #4b5563; font-weight: bold; width: 120px;">Sender Name:</td>
              <td style="padding: 8px 0; color: #111827;">${name} ${session?.user ? "(Logged-in User)" : "(Visitor)"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4b5563; font-weight: bold;">Sender Email:</td>
              <td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4b5563; font-weight: bold;">Category:</td>
              <td style="padding: 8px 0; color: #111827;">${category || "General Inquiry"}</td>
            </tr>
            ${
              orderId
                ? `<tr>
              <td style="padding: 8px 0; color: #4b5563; font-weight: bold;">Order ID:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace;">#${orderId}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 8px 0; color: #4b5563; font-weight: bold;">Submitted At:</td>
              <td style="padding: 8px 0; color: #111827;">${new Date().toLocaleString("en-NG")}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #A4860E;">
            <p style="margin: 0; font-weight: bold; color: #1f2937; margin-bottom: 8px;">Message:</p>
            <p style="margin: 0; color: #374151; white-space: pre-wrap; font-size: 14px;">${message}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            CampusGo Help Desk System &bull; Direct Reply Email: ${email}
          </div>
        </div>
      </body>
      </html>
    `;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendMail({
        to: adminEmail,
        subject: emailSubject,
        html: emailHtml,
      }).catch((err) => console.error("[HELP DESK EMAIL ERROR]", err));
    } else {
      console.log(`[HELP DESK TICKET MOCK] Ticket ${ticketId} from ${name} (${email}): ${subject}`);
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Your message has been received. Our support team will get back to you shortly.",
    });
  } catch (err) {
    console.error("[HELP DESK POST ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status") ?? "";
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status && status !== "all") query.status = status;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).sort("-createdAt").skip(skip).limit(limit).lean(),
      SupportTicket.countDocuments(query),
    ]);

    return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error("[HELP DESK GET ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { ticketId, status, adminNote } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    if (status) updates.status = status;
    if (typeof adminNote === "string") updates.adminNote = adminNote;

    const updated = await SupportTicket.findOneAndUpdate({ ticketId }, updates, { new: true });
    if (!updated) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[HELP DESK PATCH ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
