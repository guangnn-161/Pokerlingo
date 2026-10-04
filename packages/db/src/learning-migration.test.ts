import { describe,it,expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { scenarioRevisions } from "./schema";
describe("learning remediation migration",()=>{
 it("creates immutable revisions and enforces scenario/version uniqueness",async()=>{
  const scenarioId="migration-test-"+Date.now();
  const base={scenarioId,game:"nlhe",title:"test",topic:"test",difficulty:1,rulesVersion:"v1",promptJson:"{}",solutionJson:"{}",tagsJson:"[]",status:"draft" as const};
  const [a]=await db.insert(scenarioRevisions).values({...base,version:1}).returning();
  const [b]=await db.insert(scenarioRevisions).values({...base,version:2}).returning();
  expect(a).toBeDefined();
  expect(b).toBeDefined();
  expect(a!.id).not.toBe(b!.id);
 await expect(db.insert(scenarioRevisions).values({...base,version:1})).rejects.toThrow();
  await db.delete(scenarioRevisions).where(eq(scenarioRevisions.scenarioId,scenarioId));
 });
 it("rejects mutations of a published revision",async()=>{
  const scenarioId="immutable-test-"+Date.now();
  const base={scenarioId,game:"nlhe",title:"test",topic:"test",difficulty:1,rulesVersion:"v1",promptJson:"{}",solutionJson:'{"bestAction":{"type":"fold"},"selectedEvs":{"fold":0},"referenceEvBb":0,"explanationMd":"x","assumptions":[],"engineVersion":"v1","calculationMethod":"fixture"}',tagsJson:"[]",status:"draft" as const,version:1};
  const [revision]=await db.insert(scenarioRevisions).values(base).returning();
  expect(revision).toBeDefined();
  await db.update(scenarioRevisions).set({status:"published"}).where(eq(scenarioRevisions.id,revision!.id));
  await expect(db.update(scenarioRevisions).set({title:"changed"}).where(eq(scenarioRevisions.id,revision!.id))).rejects.toThrow();
  await expect(db.delete(scenarioRevisions).where(eq(scenarioRevisions.id,revision!.id))).rejects.toThrow();
 });
});
