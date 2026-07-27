// Source-of-truth fixture for the Phase 1.3 seed (scripts/seed/personas.ts).
// Runtime code consumes the Drizzle tables via lib/server/personas/lookup.ts,
// NOT this file directly. Only the PersonaRole type export is re-used by
// the P1.2 dashboard code.

export type PersonaRole = "student" | "club" | "corporate";

export interface Persona {
  id: string;
  name: string;
  role: PersonaRole;
  institution: string;
  scenario: string;
  heroFlag: boolean;
}

// @deprecated: HERO_PERSONAS is retained only as a fallback for environments
// where the DB seed has not run. New code must consume the Drizzle tables via
// lib/server/personas/lookup.ts.
export const HERO_PERSONAS: readonly Persona[] = [
  {
    id: "tasnim",
    name: "Tasnim Hossain",
    role: "student",
    institution: "BRAC University",
    scenario: "Final-year CS student looking for ML internships in Dhaka.",
    heroFlag: true,
  },
  {
    id: "nsu-robotics",
    name: "NSU Robotics Club",
    role: "club",
    institution: "North South University",
    scenario:
      "Engineering club seeking sponsors for an inter-university robotics showdown.",
    heroFlag: true,
  },
  {
    id: "bkash",
    name: "bKash People Team",
    role: "corporate",
    institution: "bKash Limited",
    scenario: "Hiring data and ML interns; sponsoring STEM outreach events.",
    heroFlag: true,
  },
] as const;

// ----------------------------------------------------------------------
// Verbatim fixture disclaimer surfaced on every page that displays a
// real-org persona (components/personas/disclaimer.tsx).
// ----------------------------------------------------------------------
export const FIXTURE_DISCLAIMER =
  "Personas and organizations are illustrative fixtures. Named universities and companies appear for scenario realism only and do not imply partnership, endorsement, or audited employment or sponsorship data.";

// ----------------------------------------------------------------------
// Typed rows that seed scripts/seed/personas.ts. These mirror the Drizzle
// column shapes in lib/server/db/schema.ts (snake_case column names).
// ----------------------------------------------------------------------

export interface StudentFixture {
  id: string;
  fullName: string;
  university: string;
  studyProgram: string;
  expectedGraduation: string;
  location: string;
  bio: string;
  skills: string[];
  careerInterests: string[];
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
}

export interface ClubFixture {
  id: string;
  clubName: string;
  university: string;
  categories: string[];
  mission: string;
  audienceReachLabel: string;
  eventFocus: string[];
  sponsorshipNeeds: string[];
  location: string;
  contactRole: string;
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
}

export interface CorporateFixture {
  id: string;
  organizationName: string;
  industry: string;
  location: string;
  description: string;
  talentNeeds: string[];
  sponsorshipInterests: string[];
  csrFocus: string[];
  budgetRange: string;
  collaborationIntent: "hiring" | "sponsorship" | "both";
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
}

export const PERSONA_FIXTURE: {
  students: StudentFixture[];
  clubs: ClubFixture[];
  corporates: CorporateFixture[];
} = {
  students: [
    {
      id: "tasnim",
      fullName: "Tasnim Hossain",
      university: "BRAC University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "Final-year CS student looking for ML internships in Dhaka.",
      skills: ["Python", "TensorFlow", "scikit-learn", "pandas"],
      careerInterests: ["machine learning", "fintech"],
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "rumi-ahmed",
      fullName: "Rumi Ahmed",
      university: "Bangladesh University of Engineering and Technology",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Systems-track CS student; low-level and OS projects.",
      skills: ["C", "C++", "Rust", "Linux kernel"],
      careerInterests: ["systems programming", "operating systems", "compiler engineering"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "sadia-karim",
      fullName: "Sadia Karim",
      university: "Islamic University of Technology",
      studyProgram: "Electrical & Electronic Engineering",
      expectedGraduation: "'26",
      location: "Gazipur",
      bio: "EEE student focused on renewable energy hardware and power electronics.",
      skills: ["MATLAB", "PSCAD", "soldering", "PCB design"],
      careerInterests: ["renewable energy", "power electronics"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "tanvir-hassan",
      fullName: "Tanvir Hassan",
      university: "North South University",
      studyProgram: "Bachelor of Business Administration",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Marketing and brand strategy with a digital focus.",
      skills: ["Google Analytics", "Meta Ads", "copywriting"],
      careerInterests: ["brand strategy", "digital marketing"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "mehnaz-tabassum",
      fullName: "Mehnaz Tabassum",
      university: "University of Dhaka",
      studyProgram: "Economics",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "Economics student with a public-policy research interest.",
      skills: ["Stata", "R", "policy memo writing"],
      careerInterests: ["policy research", "development economics"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "asif-iqbal",
      fullName: "Asif Iqbal",
      university: "Ahsanullah University of Science and Technology",
      studyProgram: "Civil Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Civil engineering student; structural design and project management.",
      skills: ["AutoCAD", "ETABS", "MS Project"],
      careerInterests: ["structural engineering", "construction project management"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "nishat-chowdhury",
      fullName: "Nishat Chowdhury",
      university: "BRAC University",
      studyProgram: "Microbiology",
      expectedGraduation: "'27",
      location: "Dhaka",
      bio: "Microbiology student interested in public-health research.",
      skills: ["lab techniques", "R", "scientific writing"],
      careerInterests: ["public health research", "epidemiology"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "tahsin-zaman",
      fullName: "Tahsin Zaman",
      university: "Khulna University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Khulna",
      bio: "Robotics and embedded systems from outside Dhaka.",
      skills: ["ROS", "C++", "3D printing", "Arduino"],
      careerInterests: ["robotics", "embedded systems", "automation"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "lamia-haque",
      fullName: "Lamia Haque",
      university: "East West University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Frontend-leaning CS student with a UX interest.",
      skills: ["React", "TypeScript", "Figma", "WCAG"],
      careerInterests: ["frontend engineering", "UX"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "rafsan-ali",
      fullName: "Rafsan Ali",
      university: "Bangladesh University of Engineering and Technology",
      studyProgram: "Electrical & Electronic Engineering",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "EEE student with a computer-architecture interest.",
      skills: ["Verilog", "FPGA", "C", "MATLAB"],
      careerInterests: ["computer architecture", "chip design"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "sumaiya-akter",
      fullName: "Sumaiya Akter",
      university: "University of Rajshahi",
      studyProgram: "Pharmacy",
      expectedGraduation: "'25",
      location: "Rajshahi",
      bio: "Pharmacy student interested in clinical research.",
      skills: ["pharmacology", "lab techniques", "scientific writing"],
      careerInterests: ["pharmacology", "clinical research"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "imran-hossain",
      fullName: "Imran Hossain",
      university: "University of Chittagong",
      studyProgram: "Marine Biology",
      expectedGraduation: "'26",
      location: "Chittagong",
      bio: "Marine biology student; coastal ecology.",
      skills: ["field research", "R", "scientific writing"],
      careerInterests: ["coastal ecology", "marine biology"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
  ],
  clubs: [
    {
      id: "nsu-robotics",
      clubName: "NSU Robotics Club",
      university: "North South University",
      categories: ["robotics", "electronics", "engineering"],
      mission: "Build, code, and compete — annual inter-university robotics showdown.",
      audienceReachLabel: "85 active members (self-reported)",
      eventFocus: ["inter-university robotics showdown", "workshops on embedded systems"],
      sponsorshipNeeds: ["engineering sponsors", "hardware kits", "venue for showdown"],
      location: "Dhaka",
      contactRole: "President",
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "brac-debate",
      clubName: "BRAC University Debate Club",
      university: "BRAC University",
      categories: ["debate", "public speaking", "model UN"],
      mission: "Foster civil discourse and parliamentary debate across universities.",
      audienceReachLabel: "60 active debaters (self-reported)",
      eventFocus: ["inter-university debate tournament", "model UN conference"],
      sponsorshipNeeds: ["travel grants", "trophies", "venue"],
      location: "Dhaka",
      contactRole: "Captain",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "iut-photography",
      clubName: "IUT Photography Society",
      university: "Islamic University of Technology",
      categories: ["photography", "visual arts"],
      mission: "Develop student photographers; annual exhibition.",
      audienceReachLabel: "40 members (self-reported)",
      eventFocus: ["annual photography exhibition", "workshops"],
      sponsorshipNeeds: ["printing", "framing", "venue"],
      location: "Gazipur",
      contactRole: "Secretary",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "du-cultural",
      clubName: "DU Cultural Society",
      university: "University of Dhaka",
      categories: ["music", "drama", "cultural"],
      mission: "Stage cultural programs and a year-end fest.",
      audienceReachLabel: "150 members (self-reported)",
      eventFocus: ["annual cultural fest", "music nights"],
      sponsorshipNeeds: ["sound gear", "venue", "media partner"],
      location: "Dhaka",
      contactRole: "General Secretary",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "buet-mars-rover",
      clubName: "BUET Mars Rover Team",
      university: "Bangladesh University of Engineering and Technology",
      categories: ["robotics", "aerospace", "engineering"],
      mission: "Design and build a Mars-rover-style platform for student competitions.",
      audienceReachLabel: "35 active members (self-reported)",
      eventFocus: ["University Rover Challenge", "open showcases"],
      sponsorshipNeeds: ["engineering sponsors", "metal fabrication", "electronics"],
      location: "Dhaka",
      contactRole: "Team Lead",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "nsu-drama",
      clubName: "North South University Drama Club",
      university: "North South University",
      categories: ["theater", "drama", "performance"],
      mission: "Stage a semesterly production open to all NSU students.",
      audienceReachLabel: "25 members (self-reported)",
      eventFocus: ["semesterly production", "open mic nights"],
      sponsorshipNeeds: ["local business sponsors", "costume budget"],
      location: "Dhaka",
      contactRole: "Director",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
  ],
  corporates: [
    {
      id: "bkash",
      organizationName: "bKash People Team",
      industry: "Mobile financial services",
      location: "Dhaka",
      description: "Hiring data and ML interns; sponsoring financial-literacy outreach.",
      talentNeeds: ["Python", "TensorFlow", "machine learning", "data engineering"],
      sponsorshipInterests: ["financial-literacy outreach", "STEM education"],
      csrFocus: ["financial inclusion", "STEM education"],
      budgetRange: "BDT 30,000–60,000 per internship (illustrative band)",
      collaborationIntent: "hiring",
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "grameenphone",
      organizationName: "Grameenphone People Team",
      industry: "Telecommunications",
      location: "Dhaka",
      description: "Hiring backend engineers; sponsoring STEM education.",
      talentNeeds: ["Java", "Go", "Kubernetes", "backend systems"],
      sponsorshipInterests: ["STEM education", "university hackathons"],
      csrFocus: ["STEM education", "digital literacy"],
      budgetRange: "BDT 40,000–80,000 per internship (illustrative band)",
      collaborationIntent: "both",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "unilever-bd",
      organizationName: "Unilever Bangladesh HR",
      industry: "Fast-moving consumer goods",
      location: "Dhaka",
      description: "Hiring marketing and product analysts; sponsoring women-in-leadership programs.",
      talentNeeds: ["marketing analytics", "product analysis", "SQL", "Tableau"],
      sponsorshipInterests: ["women-in-leadership", "sustainability programs"],
      csrFocus: ["gender equity", "sustainability"],
      budgetRange: "Undisclosed",
      collaborationIntent: "both",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "pathao",
      organizationName: "Pathao Engineering",
      industry: "Ride-sharing and logistics",
      location: "Dhaka",
      description: "Hiring mobile engineers. No active sponsorship programs.",
      talentNeeds: ["Kotlin", "Swift", "mobile architecture", "REST APIs"],
      sponsorshipInterests: [],
      csrFocus: [],
      budgetRange: "Undisclosed",
      collaborationIntent: "hiring",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "pran-rfl",
      organizationName: "PRAN-RFL CSR",
      industry: "FMCG and manufacturing",
      location: "Habiganj",
      description: "No current open graduate roles. Sponsoring rural sports and community development.",
      talentNeeds: [],
      sponsorshipInterests: ["rural sports", "community development", "agricultural cooperatives"],
      csrFocus: ["community development", "rural sports"],
      budgetRange: "BDT 100,000–500,000 per program (illustrative band)",
      collaborationIntent: "sponsorship",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
  ],
};
