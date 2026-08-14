import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    // 1. Authenticate current user via Supabase Server Client
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to use the AI Assistant." },
        { status: 401 }
      );
    }

    // 2. Validate request payload
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { message } = body || {};

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Message is too long. Please keep it under 1000 characters." },
        { status: 400 }
      );
    }

    // 3. Fetch current user's REAL data from Supabase PostgreSQL database
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("full_name, username, university, degree, semester, bio, location, experience_level, availability")
      .eq("id", user.id)
      .maybeSingle();

    const { data: teachSkills } = await (supabase as any)
      .from("user_teaching_skills")
      .select("experience_level, skill:skills(name, category, description)")
      .eq("user_id", user.id);

    const { data: learnSkills } = await (supabase as any)
      .from("user_learning_skills")
      .select("desired_level, skill:skills(name, category, description)")
      .eq("user_id", user.id);

    // Format teaching skills list
    const formattedTeaching = (teachSkills || []).map((t: any) => {
      const skillName = t.skill?.name || "Unspecified Skill";
      const category = t.skill?.category ? ` (${t.skill.category})` : "";
      const level = t.experience_level ? ` - Level: ${t.experience_level}` : "";
      return `- ${skillName}${category}${level}`;
    });

    // Format learning skills list
    const formattedLearning = (learnSkills || []).map((l: any) => {
      const skillName = l.skill?.name || "Unspecified Skill";
      const category = l.skill?.category ? ` (${l.skill.category})` : "";
      const level = l.desired_level ? ` - Target: ${l.desired_level}` : "";
      return `- ${skillName}${category}${level}`;
    });

    // Construct User Profile Context from REAL database values
    const userContextText = `
SkillSwap User Context:
- Name: ${profile?.full_name || "Student"}
- University: ${profile?.university || "Not specified"}
- Degree / Major: ${profile?.degree || "Not specified"}
- Semester: ${profile?.semester || "Not specified"}
- Experience Level: ${profile?.experience_level || "Not specified"}
- Availability: ${profile?.availability || "Flexible"}
- Bio: ${profile?.bio || "No bio provided"}

Skills User Can Teach (${formattedTeaching.length}):
${formattedTeaching.length > 0 ? formattedTeaching.join("\n") : "None listed yet"}

Skills User Wants To Learn (${formattedLearning.length}):
${formattedLearning.length > 0 ? formattedLearning.join("\n") : "None listed yet"}
`.trim();

    // 4. System instructions for SkillSwap AI Assistant powered by Google Gemini
    const systemInstruction = `
You are the official "SkillSwap AI Assistant", a smart and friendly academic advisor built for SkillSwap — a peer-to-peer student skill exchange platform.

Your primary responsibilities:
1. Provide personalized skill recommendations and learning paths tailored specifically to the user's real skills, university, and profile context.
2. Explain technical concepts, frameworks, programming languages, tools, and design subjects clearly and practically.
3. Guide students on how to use SkillSwap effectively (e.g. searching students on Discover page, sending exchange requests, managing requests, chatting, rating completed exchanges).
4. Suggest complementary skills to add to their "Can Teach" or "Wants To Learn" list based on their current profile.

IMPORTANT OPERATIONAL RULES:
- Refer to the user by their actual name (${profile?.full_name || "Student"}) when appropriate.
- ALWAYS base your personalized advice on their ACTUAL profile context provided below.
- Do NOT claim you can execute actions in the database for them (e.g. do NOT say "I have sent an exchange request for you" or "I updated your skills"). Instead, inform them how to perform the action in the UI (e.g. "You can send an exchange request directly from the student's profile page").
- Keep responses encouraging, concise, well-structured, and formatted with markdown (lists, bold headers, bullet points).
- If the user asks about non-academic or unrelated topics, politely guide them back to learning, skill development, or SkillSwap.

${userContextText}
`.trim();

    // 5. Initialize server-side Google Gemini client
    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Google Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    // 6. Call Google Gemini API using official @google/genai SDK
    const prompt = `${systemInstruction}\n\nUser Question:\n${message.trim()}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const reply = response.text || "No response generated by Gemini.";

    return NextResponse.json({
      success: true,
      message: reply,
    });
  } catch (err: any) {
    console.error("Gemini AI Chat API Route error:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while communicating with the AI Assistant. Please try again later.",
      },
      { status: 500 }
    );
  }
}
