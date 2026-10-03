import {describe,it,expect} from "vitest";
import {canonicalActionKey} from "@pokerlingo/contracts/learning";
import {periodStartFor} from "./learning";
describe("learning contracts",()=>{
 it("keeps action sizes distinct",()=>{expect(canonicalActionKey({type:"raise",size:"2.5x"})).not.toBe(canonicalActionKey({type:"raise",size:"4x"}));});
 it("uses canonical UTC periods",()=>{
  const d=new Date("2026-10-04T23:30:00Z");
  expect(periodStartFor("daily",d).toISOString()).toBe("2026-10-04T00:00:00.000Z");
  expect(periodStartFor("weekly",d).toISOString()).toBe("2026-09-28T00:00:00.000Z");
  expect(periodStartFor("recovery",d)).toBeNull();
 });
});