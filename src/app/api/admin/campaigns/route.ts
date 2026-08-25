import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { getAudienceEmails, AudienceType } from "@/lib/campaignAudience";
import { sendMail } from "@/lib/email";

// GET /api/admin/campaigns — List all past email campaigns
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const campaigns = await Campaign.find({})
      .populate("sentBy", "name email")
      .sort("-sentAt")
      .lean();

    return NextResponse.json(campaigns);
  } catch (err) {
    console.error("[CAMPAIGNS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/campaigns — Send new email campaign broadcast
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      subject,
      preheader,
      audience,
      customEmails,
      content,
      ctaText,
      ctaUrl,
    } = await req.json();

    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject line is required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Campaign message content is required" }, { status: 400 });
    }

    await connectDB();

    const audienceType = (audience || "all") as AudienceType;
    const { emails, label } = await getAudienceEmails(audienceType, customEmails);

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No recipient email addresses found for the selected audience." },
        { status: 400 }
      );
    }

    // Convert newlines in content to HTML paragraphs / line breaks if plain text
    const formattedBodyHtml = content.includes("<")
      ? content
      : content
          .split("\n\n")
          .map((p: string) => `<p style="margin: 0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");

    const fullEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${preheader ? `<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
        <div style="background: linear-gradient(135deg, #A4860E, #c9a72a); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">CampusGo</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Adeleke University Campus Marketplace</p>
        </div>
        <div style="padding: 36px 40px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 16px; line-height: 1.3;">${subject}</h2>
          <div style="color: #374151; font-size: 15px; line-height: 1.7;">
            ${formattedBodyHtml}
          </div>
          ${
            ctaText && ctaUrl
              ? `
            <div style="text-align: center; margin: 32px 0 16px;">
              <a href="${ctaUrl}"
                style="display: inline-block; background: #A4860E; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(164,134,14,0.25);">
                ${ctaText}
              </a>
            </div>
          `
              : ""
          }
        </div>
        <div style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">CampusGo · Adeleke University Campus Marketplace</p>
        </div>
      </div>
    `;

    // Save campaign record in DB
    const campaign = await Campaign.create({
      subject,
      preheader: preheader || "",
      audience: audienceType,
      audienceLabel: label,
      recipientCount: emails.length,
      recipientEmails: emails,
      htmlContent: fullEmailHtml,
      ctaText: ctaText || "",
      ctaUrl: ctaUrl || "",
      sentBy: session.user.id,
      status: "sending",
      sentAt: new Date(),
    });

    // Send emails in batches of 5 to avoid overloading connection
    let sentSuccessCount = 0;
    const batchSize = 5;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (recipientEmail) => {
          try {
            await sendMail({
              to: recipientEmail,
              subject: subject,
              html: fullEmailHtml,
            });
            sentSuccessCount++;
          } catch (mailErr) {
            console.error(`[CAMPAIGN MAIL ERROR] Failed sending to ${recipientEmail}:`, mailErr);
          }
        })
      );
    }

    campaign.status = "sent";
    await campaign.save();

    return NextResponse.json({
      message: `Campaign successfully sent to ${sentSuccessCount} of ${emails.length} recipients!`,
      recipientCount: sentSuccessCount,
      campaign,
    });
  } catch (err) {
    console.error("[CAMPAIGNS POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
