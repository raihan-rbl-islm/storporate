// Source-of-truth fixture for the demo seed (scripts/seed/personas.ts).
// Runtime code consumes the Drizzle tables via lib/server/personas/lookup.ts,
// NOT this file directly. Only the PersonaRole type export is re-used by
// the dashboard code.

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
  contactEmail: string;
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
  contactEmail: string;
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
}

// ----------------------------------------------------------------------
// Demo personas. 24 students, 10 clubs, 12 corporates — sized to give
// every Phase 8 surface (newsfeed, ranked candidates, university drill-
// down, ranked sponsors) meaningful density without overflowing the
// fixtures repo. Persona ids are stable so URLs and screenshots stay
// stable across re-seeds.
// ----------------------------------------------------------------------

export const PERSONA_FIXTURE: {
  students: StudentFixture[];
  clubs: ClubFixture[];
  corporates: CorporateFixture[];
} = {
  students: [
    // ----------------------------------------------------------------
    // BRAC University — multiple students so /students/brac-university
    // has a meaningful ranked list
    // ----------------------------------------------------------------
    {
      id: "tasnim",
      fullName: "Tasnim Hossain",
      university: "BRAC University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "Final-year CS student looking for ML internships in Dhaka. Built a Bengali-language sentiment classifier on a TensorFlow pipeline as a course project; comfortable taking a model from notebook to a small FastAPI service.",
      skills: ["Python", "TensorFlow", "scikit-learn", "pandas", "FastAPI", "SQL"],
      careerInterests: ["machine learning", "fintech", "NLP"],
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "nishat-chowdhury",
      fullName: "Nishat Chowdhury",
      university: "BRAC University",
      studyProgram: "Microbiology",
      expectedGraduation: "'27",
      location: "Dhaka",
      bio: "Microbiology student focused on public-health fieldwork. Spent last summer at icddr,b doing lab work on waterborne pathogens.",
      skills: ["lab techniques", "R", "scientific writing", "epidemiology"],
      careerInterests: ["public health research", "epidemiology"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "sabrina-ahmed",
      fullName: "Sabrina Ahmed",
      university: "BRAC University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Backend-leaning CS student. Built a Node.js + Postgres ordering service for a course e-commerce project.",
      skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker"],
      careerInterests: ["backend engineering", "platform engineering"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "nazim-uddin",
      fullName: "Nazim Uddin",
      university: "BRAC University",
      studyProgram: "Economics",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "Economics undergrad with an analytics bent — comfort in Stata and SQL, curiosity for experimental-design work in development economics.",
      skills: ["Stata", "R", "SQL", "policy memo writing"],
      careerInterests: ["development economics", "data analysis"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "tamanna-khan",
      fullName: "Tamanna Khan",
      university: "BRAC University",
      studyProgram: "Mathematics",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Mathematics student with applied focus; numPy and a taste for actuarial-style problem solving.",
      skills: ["Python", "numPy", "statistics", "LaTeX"],
      careerInterests: ["actuarial science", "quantitative analysis"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    // ----------------------------------------------------------------
    // BUET — engineering-heavy cohort, several program tracks
    // ----------------------------------------------------------------
    {
      id: "rumi-ahmed",
      fullName: "Rumi Ahmed",
      university: "Bangladesh University of Engineering and Technology",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Systems-track CS student; wrote a tiny scheduler in C and a Rust toy kernel as side projects.",
      skills: ["C", "C++", "Rust", "Linux kernel", "GDB"],
      careerInterests: ["systems programming", "operating systems", "compiler engineering"],
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
      bio: "EEE student with a computer-architecture interest; played with a RISC-V soft-core on a low-cost FPGA board.",
      skills: ["Verilog", "FPGA", "C", "MATLAB"],
      careerInterests: ["computer architecture", "chip design"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "iftekhar-ahsan",
      fullName: "Iftekhar Ahsan",
      university: "Bangladesh University of Engineering and Technology",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "Backend-leaning CS student at BUET. Has shipped a couple of small open-source TypeScript packages on npm.",
      skills: ["TypeScript", "Node.js", "PostgreSQL", "AWS"],
      careerInterests: ["distributed systems", "backend engineering"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "sharmin-haque",
      fullName: "Sharmin Haque",
      university: "Bangladesh University of Engineering and Technology",
      studyProgram: "Architecture",
      expectedGraduation: "'27",
      location: "Dhaka",
      bio: "Architecture student with a structural-design focus; well-versed in AutoCAD and Rhino for coursework submissions.",
      skills: ["AutoCAD", "Rhino", "SketchUp", "sustainability"],
      careerInterests: ["sustainable architecture", "urban design"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    // ----------------------------------------------------------------
    // IUT, NSU, DU, EWU, Khulna, Rajshahi, Chittagong, JU, AUST
    // ----------------------------------------------------------------
    {
      id: "sadia-karim",
      fullName: "Sadia Karim",
      university: "Islamic University of Technology",
      studyProgram: "Electrical & Electronic Engineering",
      expectedGraduation: "'26",
      location: "Gazipur",
      bio: "EEE student focused on renewable-energy hardware and power-electronics coursework.",
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
      bio: "Marketing and brand-strategy student with a digital focus — has run Meta Ads campaigns for two student-ventures.",
      skills: ["Google Analytics", "Meta Ads", "copywriting", "SEO"],
      careerInterests: ["brand strategy", "digital marketing"],
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
      bio: "Frontend-leaning CS student with a UX interest; built a small WCAG-audit script as a class project.",
      skills: ["React", "TypeScript", "Figma", "WCAG"],
      careerInterests: ["frontend engineering", "UX"],
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
      bio: "Robotics and embedded systems from outside Dhaka. ROS + Arduino + a 3D-printed line-follower car.",
      skills: ["ROS", "C++", "3D printing", "Arduino"],
      careerInterests: ["robotics", "embedded systems", "automation"],
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
      bio: "Economics student with a public-policy research interest; wrote a thesis on microfinance repayment patterns.",
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
      bio: "Civil engineering student with structural-design and project-management coursework.",
      skills: ["AutoCAD", "ETABS", "MS Project"],
      careerInterests: ["structural engineering", "construction project management"],
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
      bio: "Pharmacy student with a clinical-research orientation; bench-trained in pharmacology labs.",
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
      bio: "Marine biology student focused on coastal ecology; has done two field seasons on the Cox's Bazar coast.",
      skills: ["field research", "R", "scientific writing"],
      careerInterests: ["coastal ecology", "marine biology"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "nadia-rahman",
      fullName: "Nadia Rahman",
      university: "Jahangirnagar University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Savar",
      bio: "Final-year CS student. Web-app dev with a React + Next.js focus; contributed to two small open-source projects.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      careerInterests: ["frontend engineering", "product engineering"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "ziaur-rahman",
      fullName: "Ziaur Rahman",
      university: "North South University",
      studyProgram: "Electrical & Electronic Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "EEE student with a telecom focus; worked on a small OFDM simulation in MATLAB.",
      skills: ["MATLAB", "Python", "signal processing"],
      careerInterests: ["telecom systems", "signal processing"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "ayesha-siddiqua",
      fullName: "Ayesha Siddiqua",
      university: "University of Dhaka",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "CS student with a cybersecurity track; built a tiny CTF platform for class and got the high scorer role in two intra-university CTFs.",
      skills: ["Python", "Linux", "Burp Suite", "network security"],
      careerInterests: ["cybersecurity", "penetration testing"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "saif-islam",
      fullName: "Saif Islam",
      university: "Daffodil International University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "CS student interested in data engineering; built a small ETL pipeline with Python + Postgres as a side project.",
      skills: ["Python", "PostgreSQL", "Airflow", "pandas"],
      careerInterests: ["data engineering", "backend engineering"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "ifti-khan",
      fullName: "Ifti Khan",
      university: "BRAC University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'27",
      location: "Dhaka",
      bio: "Sophomore CS student with an Android focus; published one tiny Kotlin library.",
      skills: ["Kotlin", "Android", "Jetpack Compose"],
      careerInterests: ["mobile engineering", "Android"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "maliha-jamil",
      fullName: "Maliha Jamil",
      university: "Independent University Bangladesh",
      studyProgram: "Environmental Science",
      expectedGraduation: "'25",
      location: "Dhaka",
      bio: "Environmental-science student with two short stints at a climate-research NGO.",
      skills: ["GIS", "R", "field research", "policy memo writing"],
      careerInterests: ["climate research", "sustainability"],
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "tanjim-haque",
      fullName: "Tanjim Haque",
      university: "BRAC University",
      studyProgram: "Computer Science & Engineering",
      expectedGraduation: "'26",
      location: "Dhaka",
      bio: "Sophomore CS student with an interest in cloud and DevOps; built a small CI runner as a side project.",
      skills: ["Python", "Docker", "GitHub Actions", "Linux"],
      careerInterests: ["DevOps", "cloud engineering", "platform engineering"],
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
      eventFocus: ["inter-university robotics showdown", "embedded-systems workshops"],
      sponsorshipNeeds: ["engineering sponsors", "hardware kits", "venue for showdown"],
      location: "Dhaka",
      contactRole: "President",
      contactEmail: "nsu-robotics@example.bd",
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
      contactEmail: "brac-debate@example.bd",
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
      contactEmail: "iut-photography@example.bd",
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
      contactEmail: "du-cultural@example.bd",
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
      contactEmail: "buet-mars-rover@example.bd",
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
      contactEmail: "nsu-drama@example.bd",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "brac-coding",
      clubName: "BRAC University Competitive Programming Club",
      university: "BRAC University",
      categories: ["competitive programming", "algorithms", "computer science"],
      mission: "Train students for ICPC-style contests; weekly problem-set reviews.",
      audienceReachLabel: "70 members (self-reported)",
      eventFocus: ["intra-university programming contest", "ICPC practice sessions"],
      sponsorshipNeeds: ["laptops", "trophies", "snack sponsors"],
      location: "Dhaka",
      contactRole: "Captain",
      contactEmail: "brac-coding@example.bd",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "ewu-business",
      clubName: "EWU Entrepreneurship Club",
      university: "East West University",
      categories: ["entrepreneurship", "business", "startups"],
      mission: "Bring student founders together for demo days and mentor sessions.",
      audienceReachLabel: "55 members (self-reported)",
      eventFocus: ["startup demo day", "founder fireside chats"],
      sponsorshipNeeds: ["venue", "prize sponsor", "printing"],
      location: "Dhaka",
      contactRole: "President",
      contactEmail: "ewu-business@example.bd",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "du-photography",
      clubName: "Dhaka University Photography Club",
      university: "University of Dhaka",
      categories: ["photography", "visual arts", "documentary"],
      mission: "Photo walks, documentary projects, an annual print exhibition.",
      audienceReachLabel: "65 members (self-reported)",
      eventFocus: ["photo walks", "annual print exhibition"],
      sponsorshipNeeds: ["printing", "framing", "venue"],
      location: "Dhaka",
      contactRole: "President",
      contactEmail: "du-photography@example.bd",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "aust-ieee",
      clubName: "AUST IEEE Student Branch",
      university: "Ahsanullah University of Science and Technology",
      categories: ["engineering", "robotics", "academia"],
      mission: "Host technical talks, hardware workshops, and an internal robotics challenge.",
      audienceReachLabel: "50 members (self-reported)",
      eventFocus: ["technical talks", "robotics workshops"],
      sponsorshipNeeds: ["hardware kits", "refreshments", "venue"],
      location: "Dhaka",
      contactRole: "Branch Chair",
      contactEmail: "aust-ieee@example.bd",
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
      talentNeeds: ["Python", "TensorFlow", "machine learning", "data engineering", "SQL"],
      sponsorshipInterests: ["financial-literacy outreach", "STEM education"],
      csrFocus: ["financial inclusion", "STEM education"],
      budgetRange: "BDT 30,000–60,000 per internship (illustrative band)",
      collaborationIntent: "hiring",
      contactEmail: "people@bkash.example",
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "grameenphone",
      organizationName: "Grameenphone People Team",
      industry: "Telecommunications",
      location: "Dhaka",
      description: "Hiring backend and platform engineers; sponsoring STEM education.",
      talentNeeds: ["Java", "Go", "Kubernetes", "backend systems", "distributed systems"],
      sponsorshipInterests: ["STEM education", "university hackathons"],
      csrFocus: ["STEM education", "digital literacy"],
      budgetRange: "BDT 40,000–80,000 per internship (illustrative band)",
      collaborationIntent: "both",
      contactEmail: "people@grameenphone.example",
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
      sponsorshipInterests: ["women-in-leadership", "sustainability programs", "campus events"],
      csrFocus: ["gender equity", "sustainability"],
      budgetRange: "Undisclosed",
      collaborationIntent: "both",
      contactEmail: "hr@unilever-bd.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "pathao",
      organizationName: "Pathao Engineering",
      industry: "Ride-sharing and logistics",
      location: "Dhaka",
      description: "Hiring mobile engineers. Limited sponsorship.",
      talentNeeds: ["Kotlin", "Swift", "mobile architecture", "REST APIs"],
      sponsorshipInterests: [],
      csrFocus: [],
      budgetRange: "Undisclosed",
      collaborationIntent: "hiring",
      contactEmail: "engineering@pathao.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "pran-rfl",
      organizationName: "PRAN-RFL CSR",
      industry: "FMCG and manufacturing",
      location: "Habiganj",
      description: "Sponsoring rural sports and community-development programs.",
      talentNeeds: [],
      sponsorshipInterests: ["rural sports", "community development", "agricultural cooperatives"],
      csrFocus: ["community development", "rural sports"],
      budgetRange: "BDT 100,000–500,000 per program (illustrative band)",
      collaborationIntent: "sponsorship",
      contactEmail: "csr@pranrfl.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "brac-bank",
      organizationName: "BRAC Bank People Team",
      industry: "Retail banking",
      location: "Dhaka",
      description: "Hiring risk and data analysts; sponsoring financial-literacy programs at universities.",
      talentNeeds: ["Python", "SQL", "risk analytics", "credit scoring"],
      sponsorshipInterests: ["financial-literacy programs", "campus events"],
      csrFocus: ["financial inclusion"],
      budgetRange: "BDT 30,000–60,000 per internship (illustrative band)",
      collaborationIntent: "hiring",
      contactEmail: "talent@bracbank.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "walton-bd",
      organizationName: "Walton Hi-Tech Industries",
      industry: "Electronics manufacturing",
      location: "Chandra, Gazipur",
      description: "Hiring electronics and firmware engineers; sponsoring robotics clubs.",
      talentNeeds: ["Verilog", "C", "embedded systems", "PCB design"],
      sponsorshipInterests: ["robotics clubs", "engineering competitions", "STEM education"],
      csrFocus: ["STEM education", "manufacturing skills"],
      budgetRange: "BDT 25,000–50,000 per sponsorship (illustrative band)",
      collaborationIntent: "both",
      contactEmail: "talent@walton.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "robi-axiata",
      organizationName: "Robi Axiata HR",
      industry: "Telecommunications",
      location: "Dhaka",
      description: "Hiring data engineers and product analysts; sponsoring digital-literacy programs.",
      talentNeeds: ["Python", "SQL", "data engineering", "product analytics"],
      sponsorshipInterests: ["digital literacy", "university hackathons", "women-in-tech"],
      csrFocus: ["digital literacy", "women-in-tech"],
      budgetRange: "BDT 30,000–70,000 per internship (illustrative band)",
      collaborationIntent: "both",
      contactEmail: "talent@robi.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "sheba-platform",
      organizationName: "Sheba.xyz People Team",
      industry: "Service marketplace",
      location: "Dhaka",
      description: "Hiring mobile and product engineers; small but growing university presence.",
      talentNeeds: ["React Native", "Node.js", "TypeScript", "product engineering"],
      sponsorshipInterests: ["student entrepreneur meetups"],
      csrFocus: ["women entrepreneurs"],
      budgetRange: "Undisclosed",
      collaborationIntent: "hiring",
      contactEmail: "people@sheba.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "aci-limited",
      organizationName: "ACI Limited HR",
      industry: "Conglomerate (FMCG, pharma, logistics)",
      location: "Dhaka",
      description: "Hiring supply-chain and product-marketing interns; sponsoring healthcare awareness drives.",
      talentNeeds: ["supply-chain analysis", "Excel", "marketing", "operations"],
      sponsorshipInterests: ["public-health drives", "campus events"],
      csrFocus: ["public health", "education"],
      budgetRange: "Undisclosed",
      collaborationIntent: "both",
      contactEmail: "talent@aci.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "idcol-bd",
      organizationName: "IDCOL Sustainability Office",
      industry: "Development finance",
      location: "Dhaka",
      description: "Hiring climate-finance analysts; sponsoring sustainability research at universities.",
      talentNeeds: ["climate finance", "Excel", "policy memo writing", "Stata"],
      sponsorshipInterests: ["sustainability research", "climate awareness campaigns"],
      csrFocus: ["renewable energy", "climate"],
      budgetRange: "Undisclosed",
      collaborationIntent: "both",
      contactEmail: "talent@idcol.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
    {
      id: "summit-group",
      organizationName: "Summit Group CSR",
      industry: "Energy and infrastructure",
      location: "Dhaka",
      description: "Sponsoring community-development and education programs. No open graduate roles this cycle.",
      talentNeeds: [],
      sponsorshipInterests: ["community development", "education", "rural sports"],
      csrFocus: ["education", "community development"],
      budgetRange: "BDT 100,000–500,000 per program (illustrative band)",
      collaborationIntent: "sponsorship",
      contactEmail: "csr@summit.example",
      heroFlag: false,
      fixtureDisclaimerRequired: true,
    },
  ],
};
