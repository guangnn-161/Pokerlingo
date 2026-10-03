import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { progressSummary } from "@/lib/learning";
import { progressSummarySchema } from "@pokerlingo/contracts/learning";
export async function GET(){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const data=progressSummarySchema.parse(await progressSummary(user.id));
 return NextResponse.json({data},{headers:{"Cache-Control":"no-store"}});
}
