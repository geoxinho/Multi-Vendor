import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAudienceEmails, AudienceType } from "@/lib/campaignAudience";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const audience = (searchParams.get("audience") ?? "all") as AudienceType;
    const customEmails = searchParams.get("customEmails") ?? "";

    const { emails, label } = await getAudienceEmails(audience, customEmails);

    return NextResponse.json({
      audience,
      label,
      count: emails.length,
      preview: emails.slice(0, 5), // Return first 5 for UI preview
    });
  } catch (err) {
    console.error("[CAMPAIGN RECIPIENTS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
