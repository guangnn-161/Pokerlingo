import { describe,it,expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { scenarioRevisions } from "./schema";
describe("learning remediation migration",()=>{
 it("creates immutable revisions and enforces scenario/version uniqueness",async()=>{
  const scenarioId="migration-test-"+Date.now();
  const base={scenarioId,game:"nlhe",title:"test",topic:"test",difficulty:1,rulesVersion:"v1",promptJson:"{}",solutionJson:"{}",tagsJson:"[]",status:"published" as const};
  const [a]=await db.insert(scenarioRevisions).values({...base,version:1}).returning();
  const [b]=await db.insert(scenarioRevisions).values({...base,version:2}).returning();
  expect(a.id).not.toBe(b.id);
  await expect(db.insert(scenarioRevisions).values({...base,version:1})).rejects.toThrow();
  await db.delete(scenarioRevisions).where(eq(scenarioRevisions.scenarioId,scenarioId));
 });
});