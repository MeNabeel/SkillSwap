export interface SeedSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export const SKILL_CATEGORIES = [
  "Software & Web Development",
  "Design & Creative",
  "Data & AI",
  "Academics & Science",
  "Languages",
  "Business & Career",
] as const;

export const INITIAL_SKILLS: SeedSkill[] = [
  {
    id: "skill-1",
    name: "React.js",
    category: "Software & Web Development",
    description: "Component-based UI library for web applications",
    icon: "react",
  },
  {
    id: "skill-2",
    name: "Next.js",
    category: "Software & Web Development",
    description: "Full-stack React framework with SSR and App Router",
    icon: "nextjs",
  },
  {
    id: "skill-3",
    name: "TypeScript",
    category: "Software & Web Development",
    description: "Typed superset of JavaScript",
    icon: "typescript",
  },
  {
    id: "skill-4",
    name: "Python",
    category: "Software & Web Development",
    description: "Versatile programming language for web, data, and scripting",
    icon: "python",
  },
  {
    id: "skill-5",
    name: "Node.js",
    category: "Software & Web Development",
    description: "JavaScript runtime environment for backend development",
    icon: "nodejs",
  },
  {
    id: "skill-6",
    name: "Data Structures & Algorithms",
    category: "Software & Web Development",
    description: "Core computer science problem solving and algorithms",
    icon: "code",
  },
  {
    id: "skill-7",
    name: "Figma & UI/UX Design",
    category: "Design & Creative",
    description: "Interface design, wireframing, and user research",
    icon: "figma",
  },
  {
    id: "skill-8",
    name: "Graphic Design",
    category: "Design & Creative",
    description: "Visual branding, posters, and illustration",
    icon: "palette",
  },
  {
    id: "skill-9",
    name: "Machine Learning",
    category: "Data & AI",
    description: "Predictive modeling, PyTorch, and Scikit-Learn",
    icon: "brain",
  },
  {
    id: "skill-10",
    name: "SQL & Databases",
    category: "Data & AI",
    description: "Relational database design and PostgreSQL queries",
    icon: "database",
  },
  {
    id: "skill-11",
    name: "Calculus & Linear Algebra",
    category: "Academics & Science",
    description: "College mathematics and problem solving",
    icon: "calculator",
  },
  {
    id: "skill-12",
    name: "Academic Writing",
    category: "Academics & Science",
    description: "Research papers, essays, and APA citation formatting",
    icon: "book-open",
  },
  {
    id: "skill-13",
    name: "Spanish Language",
    category: "Languages",
    description: "Conversational and written Spanish skills",
    icon: "languages",
  },
  {
    id: "skill-14",
    name: "English Conversation",
    category: "Languages",
    description: "Fluency practice and pronunciation",
    icon: "globe",
  },
  {
    id: "skill-15",
    name: "Public Speaking",
    category: "Business & Career",
    description: "Presentation skills and speech confidence",
    icon: "mic",
  },
  {
    id: "skill-16",
    name: "Digital Marketing",
    category: "Business & Career",
    description: "SEO, social media strategy, and content marketing",
    icon: "trending-up",
  },
];

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;

export const AVAILABILITY_OPTIONS = [
  "1-3 hours/week",
  "3-5 hours/week",
  "5-10 hours/week",
  "Weekends only",
  "Flexible / On-demand",
] as const;
