import { and, eq } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { dailyPuzzles, scenarioRevisions } from "@pokerlingo/db/schema";
import { type GameKey } from "@pokerlingo/contracts/game";
export function utcDateKey(now=new Date()){return now.toISOString().slice(0,10);}
export async function publishDailyPuzzle(input:{game:GameKey;scenarioRevisionId:string;publishAt:Date;closeAt:Date}){
 if(input.closeAt<=input.publishAt)throw new Error("INVALID_WINDOW");
 const [r]=await db.select().from(scenarioRevisions).where(and(eq(scenarioRevisions.id,input.scenarioRevisionId),eq(scenarioRevisions.status,"published"))).limit(1);
 if(!r||r.game!==input.game)throw new Error("REVISION_NOT_PUBLISHED");
 const [row]=await db.insert(dailyPuzzles).values({puzzleDate:utcDateKey(input.publishAt),game:input.game,revisionId:r.id,publishAt:input.publishAt,closeAt:input.closeAt}).returning();
 return row;
}
