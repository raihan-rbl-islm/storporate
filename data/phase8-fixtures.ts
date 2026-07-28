// Phase 8 seed fixtures — student sub-resources, events, jobs, posts,
// and a handful of invitations. Stable, deterministic ids so re-seeding
// is idempotent and screenshots/URLs stay reproducible.
//
// Schema reference: lib/server/db/schema.ts (Phase 8 tables).
// Seed script: scripts/seed/personas.ts.
//
// Notes on ids:
//   - Experiences / achievements / activities / events / jobs / posts
//     have stable UUIDv5 ids derived from a fixed namespace so a re-seed
//     overwrites the same row instead of creating duplicates. This is
//     only possible if no `randomUUID()` happens client-side — which is
//     why the seed script generates these IDs itself rather than relying
//     on the schema's `$defaultFn(() => crypto.randomUUID())`.
//
// Notes on datetimes:
//   - Events: startsAt / endsAt are deterministic ISO timestamps within
//     the next ~3 months so the newsfeed and "Upcoming" tabs always
//     have fresh content for a reviewer.
//   - Posts: publishedAt is staggered over the last 60 days so the
//     newsfeed ranking has signal to compare.
//
// Notes on embeddings:
//   - The seed deliberately sets `embedding: null` and
//     `needsEmbedding: true`. The matching brain fills these in on the
//     next cron run, or synchronously the first time a viewer pulls
//     the matching surface. The deterministic scorer is the fallback.

import { createHash } from "node:crypto";

// Deterministic UUIDv5-ish generator so we get stable ids without
// pulling in the `uuid` package. Hash a namespace + slug, format as
// v4-ish UUID. Good enough for idempotent seeding.
function stableUuid(namespace: string, key: string): string {
  const h = createHash("sha1").update(`${namespace}:${key}`).digest();
  // Set version (4) and variant (8,9,a,b) bits so the result is a
  // syntactically valid UUID. Not RFC 4122 compliant in any deeper
  // sense — only used as a stable opaque id.
  const bytes = Buffer.from(h.subarray(0, 16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// ----------------------------------------------------------------------
// Student sub-resources
// ----------------------------------------------------------------------

export interface ExperienceFixture {
  id: string;
  studentId: string;
  kind: "work" | "research" | "volunteer" | "project";
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  tags: string[];
  sortOrder: number;
}

export interface AchievementFixture {
  id: string;
  studentId: string;
  kind: "award" | "publication" | "talk" | "certification" | "competition";
  title: string;
  issuer: string;
  date: string;
  url: string;
  description: string;
  sortOrder: number;
}

export interface ActivityFixture {
  id: string;
  studentId: string;
  kind: "club" | "society" | "mentorship" | "volunteering" | "other";
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

const NS = "storporate-phase8";

export const EXPERIENCE_FIXTURES: ExperienceFixture[] = [
  // Tasnim — ML/fintech track
  {
    id: stableUuid(NS, "exp:tasnim:bkaish-intern"),
    studentId: "tasnim",
    kind: "work",
    title: "Machine Learning Intern",
    organization: "bKash Limited",
    location: "Dhaka",
    startDate: "2024-06",
    endDate: "2024-08",
    description:
      "Built a fraud-feature pipeline on top of the transactions data lake; documented the existing label-generation logic and replaced a hand-rolled feature store with a Postgres + dbt setup.",
    tags: ["Python", "SQL", "dbt", "fraud"],
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "exp:tasnim:course-proj"),
    studentId: "tasnim",
    kind: "project",
    title: "Bengali Sentiment Classifier (course project)",
    organization: "BRAC University",
    location: "Dhaka",
    startDate: "2024-09",
    endDate: "2024-12",
    description:
      "Trained a Bengali-language sentiment classifier on a small labeled dataset; reached 0.82 F1 on a held-out set. Used TensorFlow + a custom tokenizer.",
    tags: ["TensorFlow", "NLP", "Python"],
    sortOrder: 1,
  },
  {
    id: stableUuid(NS, "exp:tasnim:volunteer"),
    studentId: "tasnim",
    kind: "volunteer",
    title: "Data-science mentor",
    organization: "DataCamp Donates",
    location: "Remote",
    startDate: "2025-01",
    endDate: "Present",
    description:
      "Volunteer mentor for an introductory Python + pandas cohort; weekly office hours.",
    tags: ["Python", "mentoring"],
    sortOrder: 2,
  },

  // Lamia — frontend track
  {
    id: stableUuid(NS, "exp:lamia:freelance"),
    studentId: "lamia-haque",
    kind: "work",
    title: "Frontend Intern",
    organization: "ShopUp",
    location: "Dhaka",
    startDate: "2024-07",
    endDate: "2024-09",
    description:
      "Shipped two customer-facing React components used in the merchant dashboard; ran the WCAG audit script in CI on every PR.",
    tags: ["React", "TypeScript", "WCAG"],
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "exp:lamia:research"),
    studentId: "lamia-haque",
    kind: "research",
    title: "UX research assistant",
    organization: "EWU CS Dept.",
    location: "Dhaka",
    startDate: "2025-01",
    endDate: "Present",
    description:
      "Co-authoring a workshop paper on accessibility heuristics in Bangla interfaces.",
    tags: ["UX research", "accessibility"],
    sortOrder: 1,
  },

  // Rumi — systems track
  {
    id: stableUuid(NS, "exp:rumi:kernel"),
    studentId: "rumi-ahmed",
    kind: "project",
    title: "Tiny Rust kernel",
    organization: "Self-directed",
    location: "Dhaka",
    startDate: "2025-02",
    endDate: "Present",
    description:
      "Built a small x86_64 hobby kernel in Rust — page tables, scheduler, and a serial-console driver.",
    tags: ["Rust", "x86_64", "kernel"],
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "exp:rumi:open-source"),
    studentId: "rumi-ahmed",
    kind: "work",
    title: "Open-source contributor",
    organization: "Linux Foundation Mentorship",
    location: "Remote",
    startDate: "2024-06",
    endDate: "2024-09",
    description:
      "Reviewed and merged patches to a small in-kernel BPF helper as part of an LF mentorship cohort.",
    tags: ["C", "BPF", "Linux"],
    sortOrder: 1,
  },

  // Rafsan — chip design
  {
    id: stableUuid(NS, "exp:rafsan:riscv"),
    studentId: "rafsan-ali",
    kind: "project",
    title: "RISC-V soft-core on FPGA",
    organization: "BUET EEE Dept.",
    location: "Dhaka",
    startDate: "2024-09",
    endDate: "2025-01",
    description:
      "Implemented a minimal RV32I core in Verilog, simulated with Verilator, and ran a 'Hello, world' on a low-cost Lattice FPGA board.",
    tags: ["Verilog", "FPGA", "RISC-V"],
    sortOrder: 0,
  },

  // Tahsin — robotics
  {
    id: stableUuid(NS, "exp:tahsin:ros"),
    studentId: "tahsin-zaman",
    kind: "project",
    title: "ROS line-follower car",
    organization: "Khulna University Robotics Lab",
    location: "Khulna",
    startDate: "2024-10",
    endDate: "2025-03",
    description:
      "Built a small differential-drive car that follows a black line using ROS + a Pi Camera. 3D-printed chassis.",
    tags: ["ROS", "C++", "3D printing"],
    sortOrder: 0,
  },
];

export const ACHIEVEMENT_FIXTURES: AchievementFixture[] = [
  {
    id: stableUuid(NS, "ach:tasnim:icpc"),
    studentId: "tasnim",
    kind: "competition",
    title: "ICPC Asia Dhaka Regional — Honorable Mention",
    issuer: "ICPC",
    date: "2024-11",
    url: "",
    description:
      "Solved 3 problems in the regional contest; first ICPC appearance for the team.",
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "ach:tasnim:aws-cert"),
    studentId: "tasnim",
    kind: "certification",
    title: "AWS Cloud Practitioner",
    issuer: "Amazon Web Services",
    date: "2025-02",
    url: "https://aws.amazon.com/certification/",
    description: "Entry-level cloud certification.",
    sortOrder: 1,
  },

  {
    id: stableUuid(NS, "ach:rumi:ossp"),
    studentId: "rumi-ahmed",
    kind: "publication",
    title: "Notes on a Hobby Kernel in Rust (blog series)",
    issuer: "rumi.bd (personal blog)",
    date: "2025-03",
    url: "https://example.com/rumi-kernel-notes",
    description:
      "Three-part write-up of the page-table and scheduler subsystems.",
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "ach:rumi:talk"),
    studentId: "rumi-ahmed",
    kind: "talk",
    title: "Building a Tiny Scheduler (lightning talk)",
    issuer: "BUET CS Club",
    date: "2025-04",
    url: "",
    description: "20-minute talk on round-robin vs CFS, with a small demo.",
    sortOrder: 1,
  },

  {
    id: stableUuid(NS, "ach:lamia:wcag"),
    studentId: "lamia-haque",
    kind: "award",
    title: "Best Accessibility Hack — BRAC Hack Day",
    issuer: "BRAC University CS Dept.",
    date: "2025-01",
    url: "",
    description:
      "Built a tiny bookmarklet that scores any page on the WCAG 2.2 quick-reference list in under a second.",
    sortOrder: 0,
  },

  {
    id: stableUuid(NS, "ach:sadia:ieee"),
    studentId: "sadia-karim",
    kind: "competition",
    title: "IEEE Region 10 Student Paper — Finalist",
    issuer: "IEEE",
    date: "2024-10",
    url: "",
    description: "Finalist in the undergraduate paper track on a microgrid case study.",
    sortOrder: 0,
  },

  {
    id: stableUuid(NS, "ach:rafsan:fpgafest"),
    studentId: "rafsan-ali",
    kind: "competition",
    title: "National FPGA Design Fest — 2nd runner-up",
    issuer: "BUET EEE Dept.",
    date: "2025-02",
    url: "",
    description: "Submission: minimal RV32I core on a Lattice board.",
    sortOrder: 0,
  },
];

export const ACTIVITY_FIXTURES: ActivityFixture[] = [
  {
    id: stableUuid(NS, "act:tasnim:icpc-club"),
    studentId: "tasnim",
    kind: "club",
    role: "Member",
    organization: "BRAC University Competitive Programming Club",
    startDate: "2023-09",
    endDate: "Present",
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "act:tasnim:mentor"),
    studentId: "tasnim",
    kind: "mentorship",
    role: "Python mentor",
    organization: "DataCamp Donates cohort",
    startDate: "2025-01",
    endDate: "Present",
    sortOrder: 1,
  },

  {
    id: stableUuid(NS, "act:rumi:oss"),
    studentId: "rumi-ahmed",
    kind: "club",
    role: "Open-source maintainer",
    organization: "BUET OSS Society",
    startDate: "2024-01",
    endDate: "Present",
    sortOrder: 0,
  },

  {
    id: stableUuid(NS, "act:lamia:society"),
    studentId: "lamia-haque",
    kind: "society",
    role: "Vice President",
    organization: "EWU UX Society",
    startDate: "2024-04",
    endDate: "Present",
    sortOrder: 0,
  },
  {
    id: stableUuid(NS, "act:lamia:volunteer"),
    studentId: "lamia-haque",
    kind: "volunteering",
    role: "Volunteer",
    organization: "Code for Bangladesh",
    startDate: "2024-12",
    endDate: "Present",
    sortOrder: 1,
  },

  {
    id: stableUuid(NS, "act:nishat:fieldwork"),
    studentId: "nishat-chowdhury",
    kind: "volunteering",
    role: "Field assistant",
    organization: "icddr,b",
    startDate: "2024-06",
    endDate: "2024-08",
    sortOrder: 0,
  },

  {
    id: stableUuid(NS, "act:tahsin:robotics-club"),
    studentId: "tahsin-zaman",
    kind: "club",
    role: "Project lead",
    organization: "Khulna University Robotics Club",
    startDate: "2024-09",
    endDate: "Present",
    sortOrder: 0,
  },
];

// ----------------------------------------------------------------------
// Events
// ----------------------------------------------------------------------

export interface EventFixture {
  id: string;
  ownerKind: "club" | "corporate";
  ownerId: string;
  title: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  venue: string;
  locationLabel: string;
  isVirtual: boolean;
  registrationUrl: string;
  capacity: number | null;
  tags: string[];
}

const today = new Date("2026-07-28T00:00:00Z");
function daysFromNow(days: number): string {
  const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export const EVENT_FIXTURES: EventFixture[] = [
  // ----- Club events -----
  {
    id: stableUuid(NS, "evt:nsu-robotics:showdown"),
    ownerKind: "club",
    ownerId: "nsu-robotics",
    title: "Inter-University Robotics Showdown 2026",
    slug: "inter-university-robotics-showdown-2026",
    description:
      "Twelve teams from nine universities compete on an obstacle course, a line-follower track, and a 60-second freestyle round. Open to spectators; registration required.",
    startsAt: daysFromNow(21),
    endsAt: daysFromNow(21),
    venue: "NSU Auditorium",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 400,
    tags: ["robotics", "competition", "engineering", "showcase"],
  },
  {
    id: stableUuid(NS, "evt:nsu-robotics:workshop"),
    ownerKind: "club",
    ownerId: "nsu-robotics",
    title: "Embedded Systems 101 — Hands-on Workshop",
    slug: "embedded-systems-101-workshop",
    description:
      "Two-hour intro to microcontrollers: blink an LED, read a sensor, drive a motor. Bring a laptop. Loaner kits provided for the first 30 signups.",
    startsAt: daysFromNow(7),
    endsAt: daysFromNow(7),
    venue: "NSU Lab 4",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 30,
    tags: ["embedded systems", "workshop", "electronics", "STEM"],
  },
  {
    id: stableUuid(NS, "evt:brac-debate:tournament"),
    ownerKind: "club",
    ownerId: "brac-debate",
    title: "Inter-University Debate Tournament",
    slug: "inter-university-debate-tournament",
    description:
      "British Parliamentary format. Eight teams, quarter-finals to grand final on the same day.",
    startsAt: daysFromNow(35),
    endsAt: daysFromNow(35),
    venue: "BRAC University Auditorium",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 250,
    tags: ["debate", "tournament", "public speaking"],
  },
  {
    id: stableUuid(NS, "evt:du-cultural:fest"),
    ownerKind: "club",
    ownerId: "du-cultural",
    title: "DU Cultural Fest — Spring",
    slug: "du-cultural-fest-spring",
    description:
      "Two nights of music, drama, and a small food court. Headliners include three student bands and a stand-up set.",
    startsAt: daysFromNow(45),
    endsAt: daysFromNow(46),
    venue: "DU TSC Field",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 1500,
    tags: ["cultural", "music", "drama", "fest"],
  },
  {
    id: stableUuid(NS, "evt:buet-mars-rover:demo"),
    ownerKind: "club",
    ownerId: "buet-mars-rover",
    title: "BUET Mars Rover — Public Demo",
    slug: "buet-mars-rover-public-demo",
    description:
      "Open-to-public outdoor demonstration of the team's rover platform: arm pick-and-place, autonomous traverse, and a short Q&A with the engineering leads.",
    startsAt: daysFromNow(28),
    endsAt: daysFromNow(28),
    venue: "BUET East Field",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 200,
    tags: ["robotics", "aerospace", "demo", "engineering"],
  },
  {
    id: stableUuid(NS, "evt:brac-coding:contest"),
    ownerKind: "club",
    ownerId: "brac-coding",
    title: "BRAC Intra-University Programming Contest",
    slug: "brac-intra-university-programming-contest",
    description:
      "Three-hour individual round, ICPC-style. Top three go to the regional. Open to BRAC students only.",
    startsAt: daysFromNow(14),
    endsAt: daysFromNow(14),
    venue: "BRAC CS Lab 2",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 80,
    tags: ["competitive programming", "algorithms", "ICPC"],
  },
  {
    id: stableUuid(NS, "evt:ewu-business:demoday"),
    ownerKind: "club",
    ownerId: "ewu-business",
    title: "EWU Startup Demo Day",
    slug: "ewu-startup-demo-day",
    description:
      "Eight student founders pitch to a panel of three mentors. Audience votes for a 'people's choice' award.",
    startsAt: daysFromNow(40),
    endsAt: daysFromNow(40),
    venue: "EWU Main Hall",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 180,
    tags: ["entrepreneurship", "startups", "demo"],
  },
  {
    id: stableUuid(NS, "evt:iut-photography:exhibition"),
    ownerKind: "club",
    ownerId: "iut-photography",
    title: "IUT Annual Photography Exhibition",
    slug: "iut-annual-photography-exhibition",
    description:
      "Forty framed prints from twenty student photographers. Opening night has a short artist talk.",
    startsAt: daysFromNow(18),
    endsAt: daysFromNow(20),
    venue: "IUT Gallery Hall",
    locationLabel: "Gazipur",
    isVirtual: false,
    registrationUrl: "",
    capacity: 220,
    tags: ["photography", "exhibition", "visual arts"],
  },
  {
    id: stableUuid(NS, "evt:du-photography:walk"),
    ownerKind: "club",
    ownerId: "du-photography",
    title: "Old Dhaka Photo Walk",
    slug: "old-dhaka-photo-walk",
    description:
      "Three-hour guided photo walk through the old city. Bring any camera (phone is fine).",
    startsAt: daysFromNow(11),
    endsAt: daysFromNow(11),
    venue: "Starts at Lalbagh Fort",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 25,
    tags: ["photography", "field trip", "workshop"],
  },
  {
    id: stableUuid(NS, "evt:aust-ieee:workshop"),
    ownerKind: "club",
    ownerId: "aust-ieee",
    title: "IEEE Hardware Hack Night",
    slug: "ieee-hardware-hack-night",
    description:
      "Two-team format, six hours, build anything with the parts table. Prizes for best demo.",
    startsAt: daysFromNow(30),
    endsAt: daysFromNow(30),
    venue: "AUST EE Lab",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 60,
    tags: ["hardware", "hackathon", "engineering", "IEEE"],
  },
  {
    id: stableUuid(NS, "evt:nsu-drama:production"),
    ownerKind: "club",
    ownerId: "nsu-drama",
    title: "NSU Drama Club — Semester Production",
    slug: "nsu-drama-semester-production",
    description:
      "Two-night run of a short Bengali drama with a small live band. Open to all NSU students; 100 seats per night.",
    startsAt: daysFromNow(50),
    endsAt: daysFromNow(51),
    venue: "NSU Black Box",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 100,
    tags: ["drama", "theater", "performance"],
  },

  // ----- Corporate events -----
  {
    id: stableUuid(NS, "evt:bkash:campus-visit"),
    ownerKind: "corporate",
    ownerId: "bkash",
    title: "bKash Campus Visit — Dhaka University",
    slug: "bkash-campus-visit-du",
    description:
      "Engineering managers from bKash spend an evening walking through their ML stack for fraud and credit. Open Q&A; bring questions.",
    startsAt: daysFromNow(10),
    endsAt: daysFromNow(10),
    venue: "DU CS Building — Room 204",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 120,
    tags: ["fintech", "campus visit", "machine learning"],
  },
  {
    id: stableUuid(NS, "evt:grameenphone:hackathon"),
    ownerKind: "corporate",
    ownerId: "grameenphone",
    title: "Grameenphone University Hackathon",
    slug: "grameenphone-university-hackathon",
    description:
      "48-hour hackathon, 12 teams, three problem statements around network-aware UX. Top team gets a fast-track interview.",
    startsAt: daysFromNow(32),
    endsAt: daysFromNow(34),
    venue: "GP Innovation Center",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 80,
    tags: ["hackathon", "telecom", "engineering"],
  },
  {
    id: stableUuid(NS, "evt:unilever-bd:ama"),
    ownerKind: "corporate",
    ownerId: "unilever-bd",
    title: "Unilever Women in Leadership — AMA",
    slug: "unilever-women-in-leadership-ama",
    description:
      "Three Unilever BD leaders take questions on breaking into FMCG, balancing a corporate career with a side passion, and mentorship.",
    startsAt: daysFromNow(24),
    endsAt: daysFromNow(24),
    venue: "Virtual (Zoom)",
    locationLabel: "Online",
    isVirtual: true,
    registrationUrl: "https://zoom.us/j/example",
    capacity: 500,
    tags: ["women-in-leadership", "AMA", "career"],
  },
  {
    id: stableUuid(NS, "evt:robi-axiata:digital-literacy"),
    ownerKind: "corporate",
    ownerId: "robi-axiata",
    title: "Robi Digital Literacy Workshop — IUT",
    slug: "robi-digital-literacy-workshop-iut",
    description:
      "Half-day workshop on internet safety, misinformation, and using mobile wallets safely. Open to IUT students and staff.",
    startsAt: daysFromNow(16),
    endsAt: daysFromNow(16),
    venue: "IUT Auditorium",
    locationLabel: "Gazipur",
    isVirtual: false,
    registrationUrl: "",
    capacity: 150,
    tags: ["digital literacy", "workshop", "telecom"],
  },
  {
    id: stableUuid(NS, "evt:pathao:eng-talk"),
    ownerKind: "corporate",
    ownerId: "pathao",
    title: "Pathao Mobile Engineering — Tech Talk",
    slug: "pathao-mobile-engineering-tech-talk",
    description:
      "The Pathao mobile team walks through their Kotlin + Swift architecture and the offline-first design choices behind the rider app.",
    startsAt: daysFromNow(38),
    endsAt: daysFromNow(38),
    venue: "Pathao HQ — Cafeteria",
    locationLabel: "Dhaka",
    isVirtual: false,
    registrationUrl: "",
    capacity: 90,
    tags: ["mobile engineering", "tech talk", "architecture"],
  },
];

// ----------------------------------------------------------------------
// Jobs
// ----------------------------------------------------------------------

export interface JobFixture {
  id: string;
  corporateId: string;
  title: string;
  slug: string;
  description: string;
  employmentType: "internship" | "full-time" | "contract" | "research";
  locationLabel: string;
  isRemote: boolean;
  startsOn: string;
  endsOn: string;
  applyUrl: string;
  applyEmail: string;
  skills: string[];
  isOpen: boolean;
}

export const JOB_FIXTURES: JobFixture[] = [
  {
    id: stableUuid(NS, "job:bkash:ml-intern"),
    corporateId: "bkash",
    title: "Machine Learning Intern — Risk & Fraud",
    slug: "bkash-ml-intern-risk-fraud",
    description:
      "Work alongside the risk engineering team on a fraud-feature pipeline and a small streaming model. 8 weeks, summer cohort.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-08",
    endsOn: "2026-09",
    applyUrl: "",
    applyEmail: "people@bkash.example",
    skills: ["Python", "TensorFlow", "SQL", "machine learning"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:bkash:data-eng"),
    corporateId: "bkash",
    title: "Junior Data Engineer",
    slug: "bkash-junior-data-engineer",
    description:
      "ETL on the transactions data lake, dbt models, and small data-quality dashboards. Full-time, hybrid.",
    employmentType: "full-time",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-09",
    endsOn: "",
    applyUrl: "",
    applyEmail: "people@bkash.example",
    skills: ["Python", "PostgreSQL", "dbt", "Airflow"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:grameenphone:backend-eng"),
    corporateId: "grameenphone",
    title: "Backend Engineer Intern — Platform",
    slug: "grameenphone-backend-intern-platform",
    description:
      "Ship a small service in Go alongside the platform team. 12-week internship with a final presentation to engineering leadership.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-08",
    endsOn: "2026-11",
    applyUrl: "",
    applyEmail: "people@grameenphone.example",
    skills: ["Go", "Kubernetes", "backend systems", "distributed systems"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:grameenphone:senior-java"),
    corporateId: "grameenphone",
    title: "Senior Software Engineer — Billing",
    slug: "grameenphone-senior-software-engineer-billing",
    description:
      "Own a slice of the billing platform — Java + Postgres, with a small on-call rotation. 4+ years experience preferred.",
    employmentType: "full-time",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "",
    endsOn: "",
    applyUrl: "",
    applyEmail: "people@grameenphone.example",
    skills: ["Java", "PostgreSQL", "backend systems"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:unilever-bd:marketing-analyst"),
    corporateId: "unilever-bd",
    title: "Marketing Analyst Intern",
    slug: "unilever-bd-marketing-analyst-intern",
    description:
      "Pull campaign data into Tableau dashboards; help the brand teams turn analytics into quarterly plans. 6-month internship.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-08",
    endsOn: "2027-02",
    applyUrl: "",
    applyEmail: "hr@unilever-bd.example",
    skills: ["marketing analytics", "SQL", "Tableau"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:pathao:android-eng"),
    corporateId: "pathao",
    title: "Android Engineer",
    slug: "pathao-android-engineer",
    description:
      "Kotlin + Jetpack Compose. Work on the rider app's offline-first layer. Open to junior applicants with strong portfolio apps.",
    employmentType: "full-time",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "",
    endsOn: "",
    applyUrl: "",
    applyEmail: "engineering@pathao.example",
    skills: ["Kotlin", "Android", "Jetpack Compose"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:pathao:ios-eng"),
    corporateId: "pathao",
    title: "iOS Engineer",
    slug: "pathao-ios-engineer",
    description: "Swift + SwiftUI. Help rebuild the customer app with offline support.",
    employmentType: "full-time",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "",
    endsOn: "",
    applyUrl: "",
    applyEmail: "engineering@pathao.example",
    skills: ["Swift", "iOS", "SwiftUI"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:brac-bank:risk-analyst"),
    corporateId: "brac-bank",
    title: "Risk Analytics Intern",
    slug: "brac-bank-risk-analytics-intern",
    description:
      "Support the credit-risk team with scorecards, monitoring, and ad-hoc analyses. Stata or Python welcome.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-09",
    endsOn: "2026-12",
    applyUrl: "",
    applyEmail: "talent@bracbank.example",
    skills: ["Python", "Stata", "risk analytics", "SQL"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:walton-bd:firmware-eng"),
    corporateId: "walton-bd",
    title: "Firmware Engineer Intern",
    slug: "walton-bd-firmware-engineer-intern",
    description:
      "Help port a bootloader to a new STM32 part. C, oscilloscope, soldering iron — the usual. 4-month internship at the Gazipur plant.",
    employmentType: "internship",
    locationLabel: "Gazipur",
    isRemote: false,
    startsOn: "2026-08",
    endsOn: "2026-12",
    applyUrl: "",
    applyEmail: "talent@walton.example",
    skills: ["C", "embedded systems", "PCB design"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:robi-axiata:data-eng"),
    corporateId: "robi-axiata",
    title: "Data Engineering Intern",
    slug: "robi-axiata-data-engineering-intern",
    description:
      "Airflow + dbt on the marketing data lake. 3-month internship with potential conversion.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-08",
    endsOn: "2026-11",
    applyUrl: "",
    applyEmail: "talent@robi.example",
    skills: ["Python", "SQL", "Airflow", "data engineering"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:sheba-platform:product-eng"),
    corporateId: "sheba-platform",
    title: "Product Engineer Intern",
    slug: "sheba-platform-product-engineer-intern",
    description:
      "TypeScript + React Native. Help ship the partner-side features. 4-month internship.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-09",
    endsOn: "2027-01",
    applyUrl: "",
    applyEmail: "people@sheba.example",
    skills: ["TypeScript", "React Native", "product engineering"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:idcol-bd:climate-analyst"),
    corporateId: "idcol-bd",
    title: "Climate Finance Analyst Intern",
    slug: "idcol-bd-climate-finance-analyst-intern",
    description:
      "Help build a portfolio dashboard for renewable-energy projects. Excel, Stata, and policy memos. 6-month internship.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-09",
    endsOn: "2027-03",
    applyUrl: "",
    applyEmail: "talent@idcol.example",
    skills: ["climate finance", "Stata", "policy memo writing"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:aci-limited:supply-chain-intern"),
    corporateId: "aci-limited",
    title: "Supply Chain Analyst Intern",
    slug: "aci-limited-supply-chain-analyst-intern",
    description:
      "Six-month internship in the supply-chain analytics team. Excel-heavy, some SQL. Open to BBA / Econ / Eng students.",
    employmentType: "internship",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "2026-08",
    endsOn: "2027-02",
    applyUrl: "",
    applyEmail: "talent@aci.example",
    skills: ["supply-chain analysis", "Excel", "SQL"],
    isOpen: true,
  },
  {
    id: stableUuid(NS, "job:bkash:applied-research"),
    corporateId: "bkash",
    title: "Applied Research — NLP (closed)",
    slug: "bkash-applied-research-nlp-closed",
    description:
      "A previously-listed NLP research position, now closed. Kept here to demonstrate the closed-job state.",
    employmentType: "research",
    locationLabel: "Dhaka",
    isRemote: false,
    startsOn: "",
    endsOn: "",
    applyUrl: "",
    applyEmail: "people@bkash.example",
    skills: ["Python", "NLP", "TensorFlow"],
    isOpen: false,
  },
];

// ----------------------------------------------------------------------
// Posts (club journals + corporate + club news)
// ----------------------------------------------------------------------

export interface PostFixture {
  id: string;
  ownerKind: "club" | "corporate";
  ownerId: string;
  kind: "journal" | "news";
  title: string;
  slug: string;
  body: string;
  tags: string[];
  publishedAt: string;
}

export const POST_FIXTURES: PostFixture[] = [
  // Club journals
  {
    id: stableUuid(NS, "post:nsu-robotics:journal-2025-recap"),
    ownerKind: "club",
    ownerId: "nsu-robotics",
    kind: "journal",
    title: "What we learned at the 2025 inter-university showdown",
    slug: "nsu-robotics-2025-showdown-recap",
    body: "Twelve teams, eight hours, three rounds. A short journal entry on what worked for the top three, what we would change next year, and a list of small parts that nearly cost us the autonomous round.",
    tags: ["robotics", "competition", "journal"],
    publishedAt: daysFromNow(-25),
  },
  {
    id: stableUuid(NS, "post:buet-mars-rover:journal-arms"),
    ownerKind: "club",
    ownerId: "buet-mars-rover",
    kind: "journal",
    title: "Choosing an arm: degrees of freedom vs. payload",
    slug: "buet-mars-rover-choosing-an-arm",
    body: "We spent six weeks choosing between two arm designs. Here is the spreadsheet, the photos, and what we ended up shipping.",
    tags: ["robotics", "aerospace", "journal"],
    publishedAt: daysFromNow(-12),
  },
  {
    id: stableUuid(NS, "post:brac-coding:journal-template"),
    ownerKind: "club",
    ownerId: "brac-coding",
    kind: "journal",
    title: "A tiny competitive-programming template that actually helps",
    slug: "brac-coding-cp-template",
    body: "Three years of ICPC practice distilled into a 90-line C++ template. Includes a stress-test harness.",
    tags: ["competitive programming", "ICPC", "journal"],
    publishedAt: daysFromNow(-7),
  },
  {
    id: stableUuid(NS, "post:iut-photography:journal-light"),
    ownerKind: "club",
    ownerId: "iut-photography",
    kind: "journal",
    title: "Reading light in old buildings",
    slug: "iut-photography-reading-light",
    body: "Notes from a year of photographing in shaded rooms — how to balance tungsten lamps with daylight through high windows.",
    tags: ["photography", "journal", "visual arts"],
    publishedAt: daysFromNow(-3),
  },

  // Club news
  {
    id: stableUuid(NS, "post:nsu-robotics:news-sponsor"),
    ownerKind: "club",
    ownerId: "nsu-robotics",
    kind: "news",
    title: "Walton Hi-Tech joins as a hardware sponsor for 2026",
    slug: "nsu-robotics-walton-sponsor-2026",
    body: "We're thrilled to welcome Walton Hi-Tech Industries as the hardware sponsor for the 2026 inter-university robotics showdown. Walton is providing all twelve teams with sensor kits.",
    tags: ["news", "sponsor", "robotics"],
    publishedAt: daysFromNow(-2),
  },
  {
    id: stableUuid(NS, "post:du-cultural:news-headliners"),
    ownerKind: "club",
    ownerId: "du-cultural",
    kind: "news",
    title: "Three student bands and a stand-up set for the spring fest",
    slug: "du-cultural-spring-fest-headliners",
    body: "We are announcing the spring fest lineup. Doors open at 5 PM; the headliner goes on at 9:30 PM.",
    tags: ["news", "cultural", "music"],
    publishedAt: daysFromNow(-5),
  },
  {
    id: stableUuid(NS, "post:ewu-business:news-mentor"),
    ownerKind: "club",
    ownerId: "ewu-business",
    kind: "news",
    title: "Mentor round announced for the spring demo day",
    slug: "ewu-business-mentor-round-spring",
    body: "Three mentors will sit on the spring demo day panel: a Pathao product lead, a Sheba founder, and a BRAC Bank analytics manager.",
    tags: ["news", "entrepreneurship", "mentors"],
    publishedAt: daysFromNow(-9),
  },

  // Corporate news
  {
    id: stableUuid(NS, "post:bkash:news-fraud-pipeline"),
    ownerKind: "corporate",
    ownerId: "bkash",
    kind: "news",
    title: "How we rebuilt the fraud-feature pipeline in 90 days",
    slug: "bkash-fraud-feature-pipeline-rebuilt",
    body: "A short write-up of our migration from a hand-rolled feature store to a Postgres + dbt setup, and the data-quality wins we got from it.",
    tags: ["news", "fintech", "data engineering"],
    publishedAt: daysFromNow(-1),
  },
  {
    id: stableUuid(NS, "post:grameenphone:news-internship-cohort"),
    ownerKind: "corporate",
    ownerId: "grameenphone",
    kind: "news",
    title: "Summer internship cohort 2026 — applications open",
    slug: "grameenphone-summer-internship-2026-applications-open",
    body: "Twelve internship slots across platform, billing, and data. Eight weeks, hybrid, mentorship from a senior engineer.",
    tags: ["news", "hiring", "internship"],
    publishedAt: daysFromNow(-4),
  },
  {
    id: stableUuid(NS, "post:unilever-bd:news-csr-recap"),
    ownerKind: "corporate",
    ownerId: "unilever-bd",
    kind: "news",
    title: "Recap: Unilever BD CSR roundtable on sustainability",
    slug: "unilever-bd-csr-roundtable-sustainability",
    body: "A short recap of our October roundtable with three universities on the next round of sustainability programming.",
    tags: ["news", "sustainability", "CSR"],
    publishedAt: daysFromNow(-15),
  },
  {
    id: stableUuid(NS, "post:pathao:news-rider-app"),
    ownerKind: "corporate",
    ownerId: "pathao",
    kind: "news",
    title: "Rider app: offline support is now in beta",
    slug: "pathao-rider-app-offline-beta",
    body: "We are opening a small beta of the new offline-first rider app. Riders in Dhaka and Chittagong can opt in.",
    tags: ["news", "mobile engineering"],
    publishedAt: daysFromNow(-6),
  },
  {
    id: stableUuid(NS, "post:walton-bd:news-ksp"),
    ownerKind: "corporate",
    ownerId: "walton-bd",
    kind: "news",
    title: "Walton will sponsor three university robotics teams in 2026",
    slug: "walton-bd-sponsor-three-robotics-teams-2026",
    body: "We are committing to sponsoring three university robotics teams in 2026 — NSU Robotics, BUET Mars Rover, and AUST IEEE.",
    tags: ["news", "sponsor", "robotics", "STEM"],
    publishedAt: daysFromNow(-10),
  },
  {
    id: stableUuid(NS, "post:robi-axiata:news-hackathon-winners"),
    ownerKind: "corporate",
    ownerId: "robi-axiata",
    kind: "news",
    title: "Hackathon winners — summer 2025 cohort",
    slug: "robi-axiata-hackathon-winners-summer-2025",
    body: "Eight teams competed in our summer 2025 hackathon. The grand prize went to a BRAC team that built a small network-aware SMS dashboard.",
    tags: ["news", "hackathon", "telecom"],
    publishedAt: daysFromNow(-18),
  },
];

// ----------------------------------------------------------------------
// Event registrations — a handful of students register for events.
// We map the seed by (eventId, studentId) so the UNIQUE constraint holds.
// ----------------------------------------------------------------------

export interface EventRegistrationFixture {
  eventId: string;
  studentId: string;
  motivation: string;
}

export const EVENT_REGISTRATION_FIXTURES: EventRegistrationFixture[] = [
  // NSU Robotics Showdown
  {
    eventId: stableUuid(NS, "evt:nsu-robotics:showdown"),
    studentId: "tahsin-zaman",
    motivation:
      "I'm bringing my line-follower car from Khulna — would love feedback on the steering loop.",
  },
  {
    eventId: stableUuid(NS, "evt:nsu-robotics:showdown"),
    studentId: "rafsan-ali",
    motivation: "Want to see how other teams approach autonomous traverse.",
  },
  {
    eventId: stableUuid(NS, "evt:nsu-robotics:showdown"),
    studentId: "rumi-ahmed",
    motivation: "Curious about how teams instrument and debug in real time.",
  },

  // Embedded 101 workshop — popular, fills up
  {
    eventId: stableUuid(NS, "evt:nsu-robotics:workshop"),
    studentId: "sabrina-ahmed",
    motivation: "Backend dev curious about how close-to-metal works in practice.",
  },
  {
    eventId: stableUuid(NS, "evt:nsu-robotics:workshop"),
    studentId: "tamanna-khan",
    motivation: "I've used Python on microcontrollers but never written a register-level C program.",
  },
  {
    eventId: stableUuid(NS, "evt:nsu-robotics:workshop"),
    studentId: "ifti-khan",
    motivation: "Android dev wanting to understand the hardware beneath my Kotlin abstractions.",
  },

  // DU Cultural Fest
  {
    eventId: stableUuid(NS, "evt:du-cultural:fest"),
    studentId: "lamia-haque",
    motivation: "Volunteering at the UX booth.",
  },
  {
    eventId: stableUuid(NS, "evt:du-cultural:fest"),
    studentId: "mehnaz-tabassum",
    motivation: "Looking forward to the headliner.",
  },

  // BUET Mars Rover demo
  {
    eventId: stableUuid(NS, "evt:buet-mars-rover:demo"),
    studentId: "rafsan-ali",
    motivation: "Want to compare notes on the arm design.",
  },
  {
    eventId: stableUuid(NS, "evt:buet-mars-rover:demo"),
    studentId: "tahsin-zaman",
    motivation: "Traveling from Khulna specifically for this.",
  },

  // bKash campus visit
  {
    eventId: stableUuid(NS, "evt:bkash:campus-visit"),
    studentId: "tasnim",
    motivation:
      "Interned there last summer; want to hear what the ML stack looks like now.",
  },
  {
    eventId: stableUuid(NS, "evt:bkash:campus-visit"),
    studentId: "sabrina-ahmed",
    motivation: "Backend-leaning CS student curious about fintech.",
  },
  {
    eventId: stableUuid(NS, "evt:bkash:campus-visit"),
    studentId: "saif-islam",
    motivation: "Data engineering track — interested in how they handle streaming labels.",
  },

  // Unilever AMA — virtual
  {
    eventId: stableUuid(NS, "evt:unilever-bd:ama"),
    studentId: "tanvir-hassan",
    motivation: "BBA student considering FMCG.",
  },
  {
    eventId: stableUuid(NS, "evt:unilever-bd:ama"),
    studentId: "lamia-haque",
    motivation: "Curious about product-side careers outside tech.",
  },
];

// ----------------------------------------------------------------------
// Invitations — a handful of pre-existing connections so the inbox page
// has content out of the box. Each row is a one-way record; the privacy
// gate is bidirectional (looks at either direction).
// ----------------------------------------------------------------------

export interface InvitationFixture {
  id: string;
  kind: "student_to_company" | "club_to_company";
  fromKind: "student" | "club";
  fromId: string;
  toKind: "corporate";
  toId: string;
  jobId: string | null;
  eventId: string | null;
  subject: string;
  body: string;
  senderEmail: string;
  recipientEmail: string;
  status: "sent" | "failed";
  sentAt: string;
}

export const INVITATION_FIXTURES: InvitationFixture[] = [
  {
    id: stableUuid(NS, "inv:tasnim->bkash"),
    kind: "student_to_company",
    fromKind: "student",
    fromId: "tasnim",
    toKind: "corporate",
    toId: "bkash",
    jobId: stableUuid(NS, "job:bkash:ml-intern"),
    eventId: null,
    subject: "Application — ML Intern (Risk & Fraud)",
    body: "Hi bKash team,\n\nI'm Tasnim, a final-year CS student at BRAC University. I interned with your team last summer on the fraud-feature pipeline and would love to come back for the risk-and-fraud internship this fall.\n\nThanks,\nTasnim",
    senderEmail: "tasnim@example.bd",
    recipientEmail: "people@bkash.example",
    status: "sent",
    sentAt: daysFromNow(-14),
  },
  {
    id: stableUuid(NS, "inv:rumi->grameenphone"),
    kind: "student_to_company",
    fromKind: "student",
    fromId: "rumi-ahmed",
    toKind: "corporate",
    toId: "grameenphone",
    jobId: stableUuid(NS, "job:grameenphone:backend-eng"),
    eventId: null,
    subject: "Application — Backend Engineer Intern",
    body: "Hi,\n\nI'm Rumi, a CS student at BUET. My interests are systems programming and distributed systems. I'd love to apply for the platform engineering internship.\n\nBest,\nRumi",
    senderEmail: "rumi@example.bd",
    recipientEmail: "people@grameenphone.example",
    status: "sent",
    sentAt: daysFromNow(-11),
  },
  {
    id: stableUuid(NS, "inv:nsu-robotics->walton-bd"),
    kind: "club_to_company",
    fromKind: "club",
    fromId: "nsu-robotics",
    toKind: "corporate",
    toId: "walton-bd",
    jobId: null,
    eventId: stableUuid(NS, "evt:nsu-robotics:showdown"),
    subject: "Sponsorship pitch — Inter-University Robotics Showdown 2026",
    body: "Hi Walton team,\n\nFollowing up on our conversation about the 2026 showdown. We have 12 teams confirmed from 9 universities, an expected 400-person audience, and we would love Walton as our hardware sponsor again this year.\n\nBest,\nNSU Robotics",
    senderEmail: "nsu-robotics@example.bd",
    recipientEmail: "sponsor@walton.example",
    status: "sent",
    sentAt: daysFromNow(-7),
  },
  {
    id: stableUuid(NS, "inv:buet-mars-rover->walton-bd"),
    kind: "club_to_company",
    fromKind: "club",
    fromId: "buet-mars-rover",
    toKind: "corporate",
    toId: "walton-bd",
    jobId: null,
    eventId: stableUuid(NS, "evt:buet-mars-rover:demo"),
    subject: "Sponsorship request — Mars Rover public demo",
    body: "Hi,\n\nWe are hosting our first public demo of the Mars Rover platform this fall. We would love Walton as a fabrication sponsor.\n\nThanks,\nBUET Mars Rover Team",
    senderEmail: "buet-mars-rover@example.bd",
    recipientEmail: "sponsor@walton.example",
    status: "sent",
    sentAt: daysFromNow(-3),
  },
  {
    id: stableUuid(NS, "inv:tasnim->grameenphone"),
    kind: "student_to_company",
    fromKind: "student",
    fromId: "tasnim",
    toKind: "corporate",
    toId: "grameenphone",
    jobId: stableUuid(NS, "job:grameenphone:backend-eng"),
    eventId: null,
    subject: "Application — Backend Engineer Intern (also interested in ML)",
    body: "Hi Grameenphone team,\n\nI saw your platform engineering internship and wanted to apply. My background is mostly ML (TensorFlow + Python), but I've been deliberately expanding into Go and Kubernetes over the past year.\n\nBest,\nTasnim",
    senderEmail: "tasnim@example.bd",
    recipientEmail: "people@grameenphone.example",
    status: "sent",
    sentAt: daysFromNow(-5),
  },
];