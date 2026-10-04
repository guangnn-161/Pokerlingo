import { and, eq, sql } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { attempts, masteryScores, questTemplates, userQuests, xpLedger, scenarioRevisions, dailyPuzzles, dailyPuzzleAttempts } from "@pokerlingo/db/schema";
import { canonicalActionKey, learningPromptSchema, learningSolutionSchema, type LearningAction, type LearningSolution } from "@pokerlingo/contracts/learning";

export function periodStartFor(cadence:"daily"|"weekly"|"recovery", now=new Date()) {
  if (cadence==="recovery") return null;
  const d=new Date(now);
  d.setUTCHours(0,0,0,0);
  if(cadence==="weekly") d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
  return d;
}
export function recoveryQuestPeriodStartFor(now=new Date()) {
  return periodStartFor("daily", now)!;
}
export function selectedEvForAction(selectedEvs:Record<string,number>, action:LearningAction) {
  return selectedEvs[canonicalActionKey(action)] ?? null;
}
export async function acquireLearningLock(tx:any, userId:string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`learning:${userId}`}))`);
}
export function calculateScore(evLossBb:number) {
  return Math.max(0,Math.min(100,Math.round(100-Math.max(0,evLossBb)*20)));
}
export function mistakeTagFor(topic:string, actionType:string) {
  const t=topic.toLowerCase();
  if(t.includes("pot")||t.includes("odds")) return "pot_odds";
  if(t.includes("range")) return "range_construction";
  if(t.includes("blocker")) return "blocker";
  if(t.includes("bluff")) return "underbluff";
  return actionType==="fold" ? "overfold" : "decision";
}
type Solution=LearningSolution;
const parseSolution=(x:string)=>learningSolutionSchema.parse(JSON.parse(x));
const parseRules=(x:string)=>JSON.parse(x) as {type?:string;target?:number;tag?:string};
const json=(x:unknown)=>JSON.stringify(x);

async function ensureQuest(tx:any,userId:string,template:any,now:Date) {
  const period=template.cadence==="recovery" ? recoveryQuestPeriodStartFor(now) : periodStartFor(template.cadence,now);
  if(!period) return null;
  const existing=await tx.select().from(userQuests).where(and(eq(userQuests.userId,userId),eq(userQuests.templateId,template.id),eq(userQuests.periodStart,period))).limit(1);
  if(existing[0]) return existing[0];
  const rules=parseRules(template.rulesJson);
  const [row]=await tx.insert(userQuests).values({userId,templateId:template.id,periodStart:period,progressJson:json({progress:0,target:rules.target??1}),status:"active"}).returning();
  return row;
}
export async function updateQuests(tx:any,userId:string,args:{score:number;mistakeTag:string|null},now:Date,sourceId:string) {
  const templates=await tx.select().from(questTemplates).where(eq(questTemplates.active,1));
  for(const template of templates){
    const rules=parseRules(template.rulesJson);
    if(template.cadence==="recovery" && rules.tag!==args.mistakeTag) continue;
    const q=await ensureQuest(tx,userId,template,now);
    if(!q) continue;
    if(q.status==="completed") continue;
    const old=JSON.parse(q.progressJson) as {progress:number;target:number};
    let delta=0;
    if(rules.type==="attempts") delta=1;
    else if(rules.type==="score") delta=args.score;
    else if(rules.type==="mistake") delta=1;
    const progress=Math.min(old.target,old.progress+delta);
    const complete=progress>=old.target;
    await tx.update(userQuests).set({progressJson:json({progress,target:old.target}),status:complete?"completed":"active",completedAt:complete?now:q.completedAt}).where(eq(userQuests.id,q.id));
    if(complete) await tx.insert(xpLedger).values({userId,sourceType:"quest",sourceId:q.id,xpDelta:template.xpReward,idempotencyKey:"quest:"+q.id}).onConflictDoNothing({target:xpLedger.idempotencyKey});
  }
}
function resultFrom(row:any, revision:any) {
  const s=parseSolution(revision.solutionJson);
  const selected=JSON.parse(row.selectedActionJson) as LearningAction;
  return {attemptId:row.id,revisionId:revision.id,selectedAction:selected,bestAction:s.bestAction,evLossBb:Number(row.evLossBb),score:row.score,mistakeTag:row.mistakeTag,explanationMd:s.explanationMd,assumptions:s.assumptions,engineVersion:s.engineVersion,calculationMethod:s.calculationMethod};
}
export async function submitLearningAttempt(input:{userId:string;revisionId:string;action:LearningAction;submissionId:string;durationMs?:number}) {
  return db.transaction(async tx=>{
    await acquireLearningLock(tx,input.userId);
    const [existing]=await tx.select().from(attempts).where(and(eq(attempts.userId,input.userId),eq(attempts.submissionId,input.submissionId))).limit(1);
    if(existing){ const [rev]=await tx.select().from(scenarioRevisions).where(eq(scenarioRevisions.id,existing.revisionId)).limit(1); if(!rev) throw new Error("REVISION_NOT_FOUND"); return resultFrom(existing,rev); }
    const [rev]=await tx.select().from(scenarioRevisions).where(and(eq(scenarioRevisions.id,input.revisionId),eq(scenarioRevisions.status,"published"))).limit(1);
    if(!rev) throw new Error("REVISION_NOT_FOUND");
    const s=parseSolution(rev.solutionJson);
    const selectedEvBb=selectedEvForAction(s.selectedEvs,input.action);
    if(typeof selectedEvBb!=="number") throw new Error("ACTION_NOT_SCORABLE");
    const loss=Math.max(0,s.referenceEvBb-selectedEvBb), score=calculateScore(loss), mistake=loss>0?mistakeTagFor(rev.topic,input.action.type):null;
    const [row]=await tx.insert(attempts).values({userId:input.userId,revisionId:rev.id,submissionId:input.submissionId,selectedActionJson:json(input.action),evLossBb:String(loss),score,mistakeTag:mistake,durationMs:input.durationMs??0}).onConflictDoNothing({target:[attempts.userId,attempts.submissionId]}).returning();
    if(!row){ const [winner]=await tx.select().from(attempts).where(and(eq(attempts.userId,input.userId),eq(attempts.submissionId,input.submissionId))).limit(1); if(!winner) throw new Error("ATTEMPT_PERSIST_FAILED"); const [winnerRev]=await tx.select().from(scenarioRevisions).where(eq(scenarioRevisions.id,winner.revisionId)).limit(1); if(!winnerRev) throw new Error("REVISION_NOT_FOUND"); return resultFrom(winner,winnerRev); }
    const [m]=await tx.select().from(masteryScores).where(and(eq(masteryScores.userId,input.userId),eq(masteryScores.topicKey,rev.topic))).limit(1);
    const next=m?Math.round(m.score*.8+score*.2):score;
    await tx.insert(masteryScores).values({userId:input.userId,topicKey:rev.topic,score:next,sampleCount:1}).onConflictDoUpdate({target:[masteryScores.userId,masteryScores.topicKey],set:{score:next,sampleCount:sql`${masteryScores.sampleCount}+1`,updatedAt:new Date()}});
    await tx.insert(xpLedger).values({userId:input.userId,sourceType:"attempt",sourceId:row.id,xpDelta:score>=80?10:5,idempotencyKey:"attempt:"+row.id}).onConflictDoNothing({target:xpLedger.idempotencyKey});
    await updateQuests(tx,input.userId,{score,mistakeTag:mistake},new Date(),row.id);
    return resultFrom(row,rev);
  });
}
export function levelForXp(xp:number){return Math.max(1,Math.floor(Math.sqrt(Math.max(0,xp)/50))+1);}
export async function progressSummary(userId:string) {
  return db.transaction(async tx=>{
    await acquireLearningLock(tx,userId);
    const [xp]=await tx.select({total:sql<number>`coalesce(sum(${xpLedger.xpDelta}),0)`}).from(xpLedger).where(eq(xpLedger.userId,userId));
    const [a]=await tx.select({practiced:sql<number>`count(*)`,avg:sql<number>`coalesce(avg(cast(${attempts.evLossBb} as numeric)),0)`}).from(attempts).where(eq(attempts.userId,userId));
    const ms=await tx.select().from(masteryScores).where(eq(masteryScores.userId,userId));
    const now=new Date(), templates=await tx.select().from(questTemplates).where(eq(questTemplates.active,1));
    const quests:any[]=[];
    for(const t of templates){
      const p=periodStartFor(t.cadence,now);
      if(!p){
        const [q]=await tx.select().from(userQuests).where(and(eq(userQuests.userId,userId),eq(userQuests.templateId,t.id))).limit(1);
        if(q){const x=JSON.parse(q.progressJson);quests.push({id:q.id,key:t.key,cadence:t.cadence,periodStart:q.periodStart.toISOString(),progress:x.progress,target:x.target,status:q.status});}
        continue;
      }
      const q=await ensureQuest(tx,userId,t,now);
      if(q){const x=JSON.parse(q.progressJson);quests.push({id:q.id,key:t.key,cadence:t.cadence,periodStart:q.periodStart.toISOString(),progress:x.progress,target:x.target,status:q.status});}
    }
    const total=Number(xp?.total??0);
    return {xp:total,level:levelForXp(total),mastery:ms.length?Math.round(ms.reduce((s,r)=>s+r.score,0)/ms.length*10)/10:0,practiced:Number(a?.practiced??0),averageEvLossBb:Number(a?.avg??0),quests};
  });
}
export function promptFromRevision(r:any){return learningPromptSchema.parse({scenarioId:r.scenarioId,revisionId:r.id,game:r.game,title:r.title,difficulty:r.difficulty,rulesVersion:r.rulesVersion,promptState:JSON.parse(r.promptJson),tags:JSON.parse(r.tagsJson)});}
export function solutionFromRevision(r:any){return parseSolution(r.solutionJson);}
