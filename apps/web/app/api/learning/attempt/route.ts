import { NextResponse } from "next/server";
import { attemptRequestSchema } from "@pokerlingo/contracts/learning";
import { getCurrentUser } from "@/lib/current-user";
import { submitLearningAttempt } from "@/lib/learning";
export async function POST(request:Request){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const parsed=attemptRequestSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST",details:parsed.error.flatten()},{status:400});
 try{return NextResponse.json(await submitLearningAttempt({userId:user.id,...parsed.data}));}
 catch(e){const code=e instanceof Error?e.message:"UNKNOWN"; const status=code==="REVISION_NOT_FOUND"?404:code==="ACTION_NOT_SCORABLE"?422:500; return NextResponse.json({error:code},{status});}
}
