import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { scenarioRevisions } from "@pokerlingo/db/schema";
import { gameKeySchema, type GameKey } from "@pokerlingo/contracts/game";
import { getCurrentUser } from "@/lib/current-user";
import { promptFromRevision } from "@/lib/learning";
export async function GET(request:Request){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const game=new URL(request.url).searchParams.get("game"); const parsed=gameKeySchema.safeParse(game);
 const rows=await db.select().from(scenarioRevisions).where(eq(scenarioRevisions.status,"published"));
 const filtered=parsed.success?rows.filter(r=>r.game===parsed.data as GameKey):rows;
 return NextResponse.json({data:filtered.map(promptFromRevision)},{headers:{"Cache-Control":"no-store"}});
}
