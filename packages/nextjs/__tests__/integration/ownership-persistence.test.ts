/**
 * @jest-environment node
 *
 * Real-DB integration test for mission ownership persistence (Postgres/Prisma).
 *
 * Exercises the actual MissionOwnershipManager against a real Postgres database
 * — no mocks of the code under test. Verifies ownership survives a cache clear
 * (i.e. is genuinely persisted) and that delegation/sharing/transfer
 * accessibility queries hit the database.
 *
 * Gated behind RUN_INTEGRATION_TESTS because, unlike the previous
 * mongodb-memory-server setup, Postgres has no in-memory equivalent. To run:
 *   RUN_INTEGRATION_TESTS=1 DATABASE_URL=postgres://... yarn jest __tests__/integration
 * (the target database must already have the Prisma schema applied).
 */
import { OwnershipAction, ownershipManager } from "../../lib/auth/ownership";
import { Permission, Role, User } from "../../lib/auth/rbac";
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from "../../tests/utils/db-test-utils";

const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === "1" || process.env.RUN_INTEGRATION_TESTS === "true";
const describeIntegration = RUN_INTEGRATION ? describe : describe.skip;

const owner: User = {
  id: "user-owner",
  email: "owner@x.com",
  roles: [Role.MISSION_MANAGER],
  createdAt: new Date(),
} as User;

describeIntegration("MissionOwnershipManager persistence (real Postgres)", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    ownershipManager.clearAllCache();
  });

  afterEach(async () => {
    await clearTestDatabase();
    ownershipManager.clearAllCache();
  });

  it("persists a created ownership record across a cache clear", async () => {
    await ownershipManager.createOwnership("mission-1", owner.id, "org-1");

    // Drop the in-memory cache so the next read must come from the database.
    ownershipManager.clearAllCache();

    expect(await ownershipManager.isOwner(owner.id, "mission-1")).toBe(true);
    expect(await ownershipManager.isOwner("someone-else", "mission-1")).toBe(false);
    expect(await ownershipManager.getMissionsOwnedBy(owner.id)).toEqual(["mission-1"]);
  });

  it("persists delegated access and surfaces it in accessible missions", async () => {
    await ownershipManager.createOwnership("mission-2", owner.id, "org-1");
    await ownershipManager.delegateAccess("mission-2", owner.id, "delegate-user", [Permission.MISSION_READ]);
    ownershipManager.clearAllCache();

    const delegate: User = { id: "delegate-user", email: "d@x.com", roles: [], createdAt: new Date() } as User;
    expect(await ownershipManager.canPerformAction(delegate, "mission-2", OwnershipAction.VIEW)).toBe(true);
    expect(await ownershipManager.canPerformAction(delegate, "mission-2", OwnershipAction.DELETE)).toBe(false);
    expect(await ownershipManager.getAccessibleMissions(delegate)).toContain("mission-2");
  });

  it("persists a public share so any user can view it", async () => {
    await ownershipManager.createOwnership("mission-3", owner.id, "org-1");
    await ownershipManager.shareMission("mission-3", owner.id, "public", undefined, [Permission.MISSION_READ]);
    ownershipManager.clearAllCache();

    const stranger: User = { id: "stranger", email: "s@x.com", roles: [], createdAt: new Date() } as User;
    expect(await ownershipManager.canPerformAction(stranger, "mission-3", OwnershipAction.VIEW)).toBe(true);
    expect(await ownershipManager.getAccessibleMissions(stranger)).toContain("mission-3");
  });

  it("persists an ownership transfer", async () => {
    await ownershipManager.createOwnership("mission-4", owner.id, "org-1");
    await ownershipManager.transferOwnership("mission-4", owner.id, "new-owner", owner.id, "handoff", false);
    ownershipManager.clearAllCache();

    expect(await ownershipManager.isOwner("new-owner", "mission-4")).toBe(true);
    expect(await ownershipManager.isOwner(owner.id, "mission-4")).toBe(false);
  });

  it("returns null/empty for unknown missions", async () => {
    expect(await ownershipManager.isOwner(owner.id, "does-not-exist")).toBe(false);
    expect(await ownershipManager.getMissionsOwnedBy("nobody")).toEqual([]);
  });
});
