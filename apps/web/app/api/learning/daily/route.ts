import { NextResponse } from "next/server";
import { and, eq, lte, gt } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { dailyPuzzleAttempts,dailyPuzzles,scenarioRevisions,xpLedger } from "@pokerlingo/db/schema";
import { dailyGetSchema,dailyPostRequestSchema } from "@pokerlingo/contracts/learning";
import { getCurrentUser } from "@/lib/current-user";
import { calculateScore,mistakeTagFor,promptFromRevision,solutionFromRevision,updateQuests } from "@/lib/learning";
import { utcDateKey } from "@/lib/daily-puzzle";
export async function GET(request:Request){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const game=new URL(request.url).searchParams.get("game"); if(!game)return NextResponse.json({error:"GAME_REQUIRED"},{status:400});
 const now=new Date(), date=utcDateKey(now);
 const [p]=await db.select().from(dailyPuzzles).where(and(eq(dailyPuzzles.puzzleDate,date),eq(dailyPuzzles.game,game),lte(dailyPuzzles.publishAt,now),gt(dailyPuzzles.closeAt,now))).limit(1);
 if(!p)return NextResponse.json({error:"DAILY_NOT_FOUND"},{status:404});
 const [r]=await db.select().from(scenarioRevisions).where(eq(scenarioRevisions.id,p.revisionId)).limit(1); if(!r)return NextResponse.json({error:"REVISION_NOT_FOUND"},{status:404});
 const [first]=await db.select().from(dailyPuzzleAttempts).where(and(eq(dailyPuzzleAttempts.puzzleId,p.id),eq(dailyPuzzleAttempts.userId,user.id),eq(dailyPuzzleAttempts.isFirstAttempt,1))).limit(1);
 const response={puzzleId:p.id,puzzleDate:p.puzzleDate,game:p.game,prompt:promptFromRevision(r),hasSubmitted:!!first,canReveal:!!first};
 return NextResponse.json({data:dailyGetSchema.parse(response)},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const parsed=dailyPostRequestSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST",details:parsed.error.flatten()},{status:400});
 const now=new Date(), date=utcDateKey(now);
 const result=await db.transaction(async tx=>{
  const [p]=await tx.select().from(dailyPuzzles).where(and(eq(dailyPuzzles.puzzleDate,date),eq(dailyPuzzles.game,parsed.data.game),lte(dailyPuzzles.publishAt,now),gt(dailyPuzzles.closeAt,now))).limit(1);
  if(!p)throw new Error("DAILY_NOT_FOUND");
  const [same]=await tx.select().from(dailyPuzzleAttempts).where(and(eq(dailyPuzzleAttempts.puzzleId,p.id),eq(dailyPuzzleAttempts.userId,user.id),eq(dailyPuzzleAttempts.submissionId,parsed.data.submissionId))).limit(1);
  if(same)return {p,same:true,row:same,tag:null};
  const [first]=await tx.select().from(dailyPuzzleAttempts).where(and(eq(dailyPuzzleAttempts.puzzleId,p.id),eq(dailyPuzzleAttempts.userId,user.id),eq(dailyPuzzleAttempts.isFirstAttempt,1))).limit(1);
  if(first)return {p,same:false,row:first,tag:null};
  const [r]=await tx.select().from(scenarioRevisions).where(eq(scenarioRevisions.id,p.revisionId)).limit(1);if(!r)throw new Error("REVISION_NOT_FOUND");
  const s=solutionFromRevision(r), selected=s.selectedEvs[parsed.data.action.size?parsed.data.action.type+":"+parsed.data.action.size:parsed.data.action.type];
  const selectedEv=typeof selected==="number"?selected:s.selectedEvs[parsed.data.action.type];if(typeof selectedEv!=="number")throw new Error("ACTION_NOT_SCORABLE");
  const loss=Math.max(0,s.referenceEvBb-selectedEv),score=calculateScore(loss),tag=loss>0?mistakeTagFor(r.topic,parsed.data.action.type):null;
  const [row]=await tx.insert(dailyPuzzleAttempts).values({puzzleId:p.id,userId:user.id,submissionId:parsed.data.submissionId,evLoss:String(loss),score,durationMs:parsed.data.durationMs??0,isFirstAttempt:1,selectedActionJson:JSON.stringify(parsed.data.action)}).returning();
  await tx.insert(xpLedger).values({userId:user.id,sourceType:"daily",sourceId:row.id,xpDelta:score>=80?10:5,idempotencyKey:"daily:"+row.id}).onConflictDoNothing({target:xpLedger.idempotencyKey});\n  await updateQuests(tx,user.id,{score,mistakeTag:tag},now,row.id);
  return {p,same:false,row,tag};
 });
 const [r]=await db.select().from(scenarioRevisions).where(eq(scenarioRevisions.id,result.p.revisionId)).limit(1); if(!r)return NextResponse.json({error:"REVISION_NOT_FOUND"},{status:404});
 const s=solutionFromRevision(r), action=JSON.parse(result.row.selectedActionJson);
 return NextResponse.json({attemptId:result.row.id,puzzleId:result.p.id,isFirstAttempt:result.row.isFirstAttempt===1,selectedAction:action,bestAction:s.bestAction,evLossBb:Number(result.row.evLoss),score:result.row.score,mistakeTag:result.tag ?? null,explanationMd:s.explanationMd,assumptions:s.assumptions,engineVersion:s.engineVersion,calculationMethod:s.calculationMethod});
}
