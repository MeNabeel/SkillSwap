import { UserMatchProfile, MatchScoreResult, MatchReason } from "./types";

export function calculateMatchScore(
  currentUser: UserMatchProfile | null | undefined,
  targetUser: UserMatchProfile
): MatchScoreResult {
  // Default score for unauthenticated browsing or self-view
  if (!currentUser || currentUser.id === targetUser.id) {
    return {
      score: 75,
      teachingMatchCount: targetUser.teaching_skills.length,
      learningMatchCount: targetUser.learning_skills.length,
      reasons: [
        {
          id: "r-1",
          text: `${targetUser.full_name} offers ${targetUser.teaching_skills.length} teaching skills`,
          type: "teaching",
        },
      ],
      matchedTeachingSkills: targetUser.teaching_skills.map((s) => s.name),
      matchedLearningSkills: [],
    };
  }

  let teachingMatchScore = 0;
  let learningMatchScore = 0;
  let experienceScore = 0;
  let availabilityScore = 0;

  const matchedTeachingSkills: string[] = [];
  const matchedLearningSkills: string[] = [];
  const reasons: MatchReason[] = [];

  // 1. Target user teaches what Current user wants to learn (Max 40 pts)
  const currentLearningNames = new Map(
    currentUser.learning_skills.map((s) => [s.name.toLowerCase(), s.name])
  );

  targetUser.teaching_skills.forEach((ts) => {
    if (currentLearningNames.has(ts.name.toLowerCase())) {
      matchedTeachingSkills.push(ts.name);
      reasons.push({
        id: `teach-${ts.skillId}`,
        text: `${targetUser.full_name.split(" ")[0]} can teach ${ts.name}`,
        type: "teaching",
      });
    }
  });

  if (currentUser.learning_skills.length > 0 && matchedTeachingSkills.length > 0) {
    teachingMatchScore = Math.min(
      40,
      (matchedTeachingSkills.length / currentUser.learning_skills.length) * 40
    );
  }

  // 2. Current user teaches what Target user wants to learn (Max 40 pts)
  const targetLearningNames = new Map(
    targetUser.learning_skills.map((s) => [s.name.toLowerCase(), s.name])
  );

  currentUser.teaching_skills.forEach((cts) => {
    if (targetLearningNames.has(cts.name.toLowerCase())) {
      matchedLearningSkills.push(cts.name);
      reasons.push({
        id: `learn-${cts.skillId}`,
        text: `You can teach ${cts.name} to ${targetUser.full_name.split(" ")[0]}`,
        type: "learning",
      });
    }
  });

  if (targetUser.learning_skills.length > 0 && matchedLearningSkills.length > 0) {
    learningMatchScore = Math.min(
      40,
      (matchedLearningSkills.length / targetUser.learning_skills.length) * 40
    );
  }

  // Mutual Skill Exchange Bonus (+10 pts)
  if (matchedTeachingSkills.length > 0 && matchedLearningSkills.length > 0) {
    reasons.push({
      id: "mutual-exchange",
      text: "Mutual skill exchange opportunities exist on both sides",
      type: "teaching",
    });
  }

  // 3. Experience level alignment (+10 pts)
  if (
    currentUser.experience_level &&
    targetUser.experience_level &&
    currentUser.experience_level === targetUser.experience_level
  ) {
    experienceScore = 10;
    reasons.push({
      id: "exp-match",
      text: `Both users share ${currentUser.experience_level} experience level`,
      type: "experience",
    });
  }

  // 4. Availability alignment (+10 pts)
  if (
    currentUser.availability &&
    targetUser.availability &&
    currentUser.availability === targetUser.availability
  ) {
    availabilityScore = 10;
    reasons.push({
      id: "avail-match",
      text: `Compatible weekly availability (${currentUser.availability})`,
      type: "availability",
    });
  }

  // Total Score Calculation
  let totalScore = Math.round(
    teachingMatchScore + learningMatchScore + experienceScore + availabilityScore
  );

  // Normalize range between 55% and 99% for active users with overlapping skills
  if (matchedTeachingSkills.length > 0 || matchedLearningSkills.length > 0) {
    totalScore = Math.max(65, Math.min(98, totalScore + 20));
  } else {
    // Baseline potential for general campus peer match
    totalScore = 55;
  }

  return {
    score: totalScore,
    teachingMatchCount: matchedTeachingSkills.length,
    learningMatchCount: matchedLearningSkills.length,
    reasons,
    matchedTeachingSkills,
    matchedLearningSkills,
  };
}
