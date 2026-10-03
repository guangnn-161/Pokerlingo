import {describe,it,expect} from "vitest";
import {promptFromRevision} from "./learning";
describe("learning response redaction",()=>{
 it("never includes private solution fields in prompts",()=>{
  const p=promptFromRevision({scenarioId:"s",id:"00000000-0000-0000-0000-000000000001",game:"nlhe",title:"T",difficulty:1,rulesVersion:"v1",promptJson:'{"board":[]}',tagsJson:'["preflop"]'});
  const serialized=JSON.stringify(p);
  for(const secret of ["referenceActionType","referenceActionSize","referenceEvBb","selectedEvs","explanationMd","assumptions","engineVersion","calculationMethod"]) expect(serialized).not.toContain(secret);
 });
});