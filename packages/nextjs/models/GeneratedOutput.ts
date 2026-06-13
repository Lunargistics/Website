/**
 * GeneratedOutput types.
 *
 * Migrated from Mongoose to Prisma. The Prisma model lives in
 * `prisma/schema.prisma`; this file only carries the shared TS shapes used by
 * the output routes.
 */

export interface IGeneratedOutput {
  userId: string;
  type: "mission_plan" | "icd_driver" | "test_case" | "orbital_analysis";
  prompt: string;
  output: string;
  metadata?: {
    protocol?: string;
    spacecraft?: string;
    missionType?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}
