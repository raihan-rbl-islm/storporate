import { describe, expect, it } from "vitest";

import {
  EXPERIENCE_FIXTURES,
  ACHIEVEMENT_FIXTURES,
  ACTIVITY_FIXTURES,
  EVENT_FIXTURES,
  EVENT_REGISTRATION_FIXTURES,
  JOB_FIXTURES,
  POST_FIXTURES,
  INVITATION_FIXTURES,
} from "@/data/phase8-fixtures";
import { PERSONA_FIXTURE } from "@/data/personas";

/**
 * Phase 8 fixture sanity tests. These don't hit the DB — they just guard
 * the in-repo data shape so future PRs that add/remove fixtures catch
 * regressions at unit-test time.
 */

describe("Phase 8 fixtures", () => {
  it("experiences reference valid student ids", () => {
    const studentIds = new Set(PERSONA_FIXTURE.students.map((s) => s.id));
    for (const exp of EXPERIENCE_FIXTURES) {
      expect(studentIds.has(exp.studentId)).toBe(true);
    }
  });

  it("achievements reference valid student ids", () => {
    const studentIds = new Set(PERSONA_FIXTURE.students.map((s) => s.id));
    for (const ach of ACHIEVEMENT_FIXTURES) {
      expect(studentIds.has(ach.studentId)).toBe(true);
    }
  });

  it("activities reference valid student ids", () => {
    const studentIds = new Set(PERSONA_FIXTURE.students.map((s) => s.id));
    for (const act of ACTIVITY_FIXTURES) {
      expect(studentIds.has(act.studentId)).toBe(true);
    }
  });

  it("events reference valid owners", () => {
    const clubIds = new Set(PERSONA_FIXTURE.clubs.map((c) => c.id));
    const corpIds = new Set(PERSONA_FIXTURE.corporates.map((c) => c.id));
    for (const ev of EVENT_FIXTURES) {
      if (ev.ownerKind === "club") {
        expect(clubIds.has(ev.ownerId)).toBe(true);
      } else {
        expect(corpIds.has(ev.ownerId)).toBe(true);
      }
    }
  });

  it("event registrations reference valid (event, student) pairs", () => {
    const eventIds = new Set(EVENT_FIXTURES.map((e) => e.id));
    const studentIds = new Set(PERSONA_FIXTURE.students.map((s) => s.id));
    for (const r of EVENT_REGISTRATION_FIXTURES) {
      expect(eventIds.has(r.eventId)).toBe(true);
      expect(studentIds.has(r.studentId)).toBe(true);
    }
  });

  it("jobs reference valid corporates", () => {
    const corpIds = new Set(PERSONA_FIXTURE.corporates.map((c) => c.id));
    for (const j of JOB_FIXTURES) {
      expect(corpIds.has(j.corporateId)).toBe(true);
    }
  });

  it("posts reference valid owners", () => {
    const clubIds = new Set(PERSONA_FIXTURE.clubs.map((c) => c.id));
    const corpIds = new Set(PERSONA_FIXTURE.corporates.map((c) => c.id));
    for (const p of POST_FIXTURES) {
      if (p.ownerKind === "club") {
        expect(clubIds.has(p.ownerId)).toBe(true);
      } else {
        expect(corpIds.has(p.ownerId)).toBe(true);
      }
    }
  });

  it("invitations reference valid personas and targets", () => {
    const studentIds = new Set(PERSONA_FIXTURE.students.map((s) => s.id));
    const clubIds = new Set(PERSONA_FIXTURE.clubs.map((c) => c.id));
    const corpIds = new Set(PERSONA_FIXTURE.corporates.map((c) => c.id));
    for (const inv of INVITATION_FIXTURES) {
      if (inv.fromKind === "student") {
        expect(studentIds.has(inv.fromId)).toBe(true);
      } else {
        expect(clubIds.has(inv.fromId)).toBe(true);
      }
      expect(corpIds.has(inv.toId)).toBe(true);
    }
  });

  it("all fixture ids are unique within each table", () => {
    expect(new Set(EXPERIENCE_FIXTURES.map((e) => e.id)).size).toBe(
      EXPERIENCE_FIXTURES.length,
    );
    expect(new Set(ACHIEVEMENT_FIXTURES.map((a) => a.id)).size).toBe(
      ACHIEVEMENT_FIXTURES.length,
    );
    expect(new Set(ACTIVITY_FIXTURES.map((a) => a.id)).size).toBe(
      ACTIVITY_FIXTURES.length,
    );
    expect(new Set(EVENT_FIXTURES.map((e) => e.id)).size).toBe(
      EVENT_FIXTURES.length,
    );
    expect(new Set(EVENT_FIXTURES.map((e) => e.slug)).size).toBe(
      EVENT_FIXTURES.length,
    );
    expect(new Set(JOB_FIXTURES.map((j) => j.id)).size).toBe(
      JOB_FIXTURES.length,
    );
    expect(new Set(JOB_FIXTURES.map((j) => j.slug)).size).toBe(
      JOB_FIXTURES.length,
    );
    expect(new Set(POST_FIXTURES.map((p) => p.id)).size).toBe(
      POST_FIXTURES.length,
    );
    expect(new Set(POST_FIXTURES.map((p) => p.slug)).size).toBe(
      POST_FIXTURES.length,
    );
    expect(new Set(INVITATION_FIXTURES.map((i) => i.id)).size).toBe(
      INVITATION_FIXTURES.length,
    );
  });

  it("every Phase 8 fixture table has at least one row", () => {
    expect(EXPERIENCE_FIXTURES.length).toBeGreaterThan(0);
    expect(ACHIEVEMENT_FIXTURES.length).toBeGreaterThan(0);
    expect(ACTIVITY_FIXTURES.length).toBeGreaterThan(0);
    expect(EVENT_FIXTURES.length).toBeGreaterThan(0);
    expect(EVENT_REGISTRATION_FIXTURES.length).toBeGreaterThan(0);
    expect(JOB_FIXTURES.length).toBeGreaterThan(0);
    expect(POST_FIXTURES.length).toBeGreaterThan(0);
    expect(INVITATION_FIXTURES.length).toBeGreaterThan(0);
  });
});