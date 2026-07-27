import { describe, it, expect } from "vitest";
import {
  studentSchema,
  clubSchema,
  corporateSchema,
  schemaForRole,
} from "@/lib/server/personas/schemas";

describe("studentSchema", () => {
  it("accepts a minimal valid payload", () => {
    const r = studentSchema.safeParse({
      fullName: "Tasnim Hossain",
      university: "BRAC University",
      studyProgram: "BSc in Computer Science",
      expectedGraduation: "Spring 2026",
      location: "Dhaka, Bangladesh",
      bio: "",
      skills: ["Python", "TensorFlow"],
      careerInterests: ["ML", "Fintech"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty required strings", () => {
    const r = studentSchema.safeParse({
      fullName: "  ",
      university: "BRAC University",
      studyProgram: "BSc",
      expectedGraduation: "Spring 2026",
      location: "Dhaka",
      bio: "",
      skills: ["Python"],
      careerInterests: ["ML"],
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty skills array", () => {
    const r = studentSchema.safeParse({
      fullName: "Tasnim",
      university: "BRAC University",
      studyProgram: "BSc",
      expectedGraduation: "Spring 2026",
      location: "Dhaka",
      bio: "",
      skills: [],
      careerInterests: ["ML"],
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty university, studyProgram, expectedGraduation, location", () => {
    const r = studentSchema.safeParse({
      fullName: "Tasnim",
      university: "",
      studyProgram: "BSc",
      expectedGraduation: "",
      location: "   ",
      bio: "",
      skills: ["Python"],
      careerInterests: ["ML"],
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty bio (optional)", () => {
    const r = studentSchema.safeParse({
      fullName: "Tasnim",
      university: "BRAC University",
      studyProgram: "BSc",
      expectedGraduation: "Spring 2026",
      location: "Dhaka",
      bio: "",
      skills: ["Python"],
      careerInterests: ["ML"],
    });
    expect(r.success).toBe(true);
  });
});

describe("clubSchema", () => {
  it("rejects empty categories array", () => {
    const r = clubSchema.safeParse({
      clubName: "NSU Robotics",
      university: "North South University",
      categories: [],
      mission: "",
      audienceReachLabel: "120 members",
      eventFocus: ["Hackathons"],
      sponsorshipNeeds: ["Prizes"],
      location: "Dhaka",
      contactRole: "President",
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty mission (optional)", () => {
    const r = clubSchema.safeParse({
      clubName: "NSU Robotics",
      university: "NSU",
      categories: ["Robotics"],
      mission: "",
      audienceReachLabel: "120 members",
      eventFocus: ["Hackathons"],
      sponsorshipNeeds: ["Prizes"],
      location: "Dhaka",
      contactRole: "President",
    });
    expect(r.success).toBe(true);
  });
});

describe("corporateSchema", () => {
  it("rejects unknown collaborationIntent", () => {
    const r = corporateSchema.safeParse({
      organizationName: "bKash",
      industry: "Mobile Financial Services",
      location: "Dhaka",
      description: "",
      talentNeeds: ["ML"],
      sponsorshipInterests: ["Hackathons"],
      csrFocus: ["Financial inclusion"],
      budgetRange: "BDT 500k-1M",
      collaborationIntent: "charity",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty collaborationIntent", () => {
    const r = corporateSchema.safeParse({
      organizationName: "bKash",
      industry: "MFS",
      location: "Dhaka",
      description: "",
      talentNeeds: ["ML"],
      sponsorshipInterests: ["Hackathons"],
      csrFocus: ["Inclusion"],
      budgetRange: "",
      collaborationIntent: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty budgetRange (optional per ticket 022)", () => {
    const r = corporateSchema.safeParse({
      organizationName: "bKash",
      industry: "MFS",
      location: "Dhaka",
      description: "",
      talentNeeds: ["ML"],
      sponsorshipInterests: ["Hackathons"],
      csrFocus: ["Inclusion"],
      budgetRange: "",
      collaborationIntent: "hiring",
    });
    expect(r.success).toBe(true);
  });
});

describe("schemaForRole", () => {
  it("dispatches by role", () => {
    expect(schemaForRole("student")).toBe(studentSchema);
    expect(schemaForRole("club")).toBe(clubSchema);
    expect(schemaForRole("corporate")).toBe(corporateSchema);
  });
});