import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to generate an AI learning plan." },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { exchangeId } = body || {};

    if (!exchangeId || typeof exchangeId !== "string") {
      return NextResponse.json(
        { success: false, message: "Exchange ID is required." },
        { status: 400 }
      );
    }

    // Security check: Query exchange record to verify membership
    const { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select(
        "*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*), teaching_skill:skills!exchanges_teaching_skill_id_fkey(*), learning_skill:skills!exchanges_learning_skill_id_fkey(*)"
      )
      .eq("id", exchangeId)
      .single();

    if (!exchange || (exchange.user_one_id !== user.id && exchange.user_two_id !== user.id)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You are not a participant of this exchange." },
        { status: 403 }
      );
    }

    const teachSkillName = exchange.teaching_skill?.name || "Target Skill";
    const learnSkillName = exchange.learning_skill?.name || "Target Skill";

    const studentAName = exchange.user_one?.full_name || "Student A";
    const studentADegree = exchange.user_one?.degree || "Student";

    const studentBName = exchange.user_two?.full_name || "Student B";
    const studentBDegree = exchange.user_two?.degree || "Student";

    const systemInstruction = `
You are the official "SkillSwap Learning Planner", an academic advisor for peer-to-peer student skill exchanges.

Create a practical, structured 6-to-8 topic learning plan for a peer skill exchange between two students:
- Student A: ${studentAName} (${studentADegree})
- Student B: ${studentBName} (${studentBDegree})
- Primary Skill Exchanged: ${teachSkillName} & ${learnSkillName}

OPERATIONAL RULES:
- Progress logically from core fundamentals to practical projects.
- Include clear titles and 1-2 sentence practical descriptions for each topic.
- Return strictly VALID JSON without any markdown code block wrappers (no \`\`\`json or \`\`\`).
- Output JSON format strictly:
{
  "title": "${teachSkillName} & ${learnSkillName} Learning Plan",
  "description": "Structured peer-to-peer learning roadmap covering fundamentals, implementation, and hands-on practice.",
  "topics": [
    {
      "title": "Topic Title",
      "description": "Clear practical description.",
      "order": 1
    }
  ]
}
`.trim();

    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json(
        {
          success: false,
          message: "Google Gemini API key is not configured on the server.",
        },
        { status: 500 }
      );
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: systemInstruction,
    });

    let rawText = response.text || "";

    // Clean any markdown formatting if present
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let planOutput;
    try {
      planOutput = JSON.parse(rawText);
    } catch {
      // Fallback structured object if parsing fails
      planOutput = {
        title: `${teachSkillName} Peer Learning Roadmap`,
        description: `Practical step-by-step peer exchange covering ${teachSkillName} and ${learnSkillName}.`,
        topics: [
          { title: "Core Fundamentals & Setup", description: `Understand core concepts of ${teachSkillName} and environment configuration.`, order: 1 },
          { title: "Key Language Concepts", description: "Explore syntax, structures, and foundational patterns.", order: 2 },
          { title: "Practical Components & Modules", description: "Build re-usable functional components and modules.", order: 3 },
          { title: "State Management & Data Flow", description: "Learn state, props, and asynchronous data handling.", order: 4 },
          { title: "API & Backend Integration", description: "Connect applications to HTTP services and APIs.", order: 5 },
          { title: "Hands-on Mini Project", description: "Collaboratively build a working demo project combining both skills.", order: 6 },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      plan: planOutput,
    });
  } catch (err: any) {
    console.error("Generate Learning Plan API error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to generate AI learning plan." },
      { status: 500 }
    );
  }
}
