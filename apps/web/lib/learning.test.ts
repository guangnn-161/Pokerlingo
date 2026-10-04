import {describe,it,expect} from "vitest";
import {canonicalActionKey} from "@pokerlingo/contracts/learning";
import {periodStartFor,recoveryQuestPeriodStartFor,selectedEvForAction} from "./learning";
describe("learning contracts",()=>{
 it("keeps action sizes distinct",()=>{expect(canonicalActionKey({type:"raise",size:"2.5x"})).not.toBe(canonicalActionKey({type:"raise",size:"4x"}));});
 it("uses canonical UTC periods",()=>{
  const d=new Date("2026-10-04T23:30:00Z");
  const daily=periodStartFor("daily",d), weekly=periodStartFor("weekly",d);
  expect(daily?.toISOString()).toBe("2026-10-04T00:00:00.000Z");
  expect(weekly?.toISOString()).toBe("2026-09-28T00:00:00.000Z");
  expect(periodStartFor("recovery",d)).toBeNull();
 });
 it("groups recovery quests by their qualifying UTC day",()=>{
  expect(recoveryQuestPeriodStartFor(new Date("2026-10-04T23:30:00Z")).toISOString()).toBe("2026-10-04T00:00:00.000Z");
 });
 it("does not score a sized action using an unsized fallback",()=>{
  expect(selectedEvForAction({raise:1.5,"raise:2.5x":2},{type:"raise",size:"4x"})).toBeNull();
 });
});
