import { eq } from "drizzle-orm";
import { db } from "./index";
import { questTemplates, scenarioRevisions, users } from "./schema";

const prompt = (state: unknown) => JSON.stringify(state);
const solution = (bestAction: {type:string;size?:string}, selected: Record<string,number>, reference: number) => JSON.stringify({
  bestAction, selectedEvs: selected, referenceEvBb: reference,
  explanationMd: "This is a seeded learning fixture; production revisions should be authored from the approved learning pipeline.",
  assumptions: ["Seed fixture only."], engineVersion: "seed-v1", calculationMethod: "reference"
});

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@pokerlingo.local"));
  const user = admin ?? (await db.insert(users).values({id:"dev-admin",email:"admin@pokerlingo.local",name:"Development Admin",role:"admin"}).returning())[0];
  const rows = [
    {scenarioId:"demo-preflop-aqs",version:1,game:"nlhe",title:"BTN AQs facing BB 3-bet",topic:"preflop",difficulty:2,rulesVersion:"nlhe-v1",state:{heroHand:"A♠ Q♠",board:[],prompt:"BTN opens 2.5bb. BB 3-bets to 10bb. Effective stack 100bb. What is your action?",actions:["fold","call","raise"]},tags:["preflop","3bet"],best:{type:"raise",size:"25bb"},ev:{fold:-0.4,call:0.05,raise:0.2},ref:0.2},
    {scenarioId:"demo-postflop",version:1,game:"nlhe",title:"Turn value decision",topic:"postflop",difficulty:3,rulesVersion:"nlhe-v1",state:{heroHand:"A♠ K♠",board:["K♦","8♣","3♥","2♠"],prompt:"You face a half-pot bet on the turn. Choose an action.",actions:["fold","call","raise"]},tags:["postflop","value"],best:{type:"raise",size:"2.5x"},ev:{fold:-1,call:0.4,raise:0.8},ref:0.8}
  ];
  for (const row of rows) {
    await db.insert(scenarioRevisions).values({
      scenarioId:row.scenarioId,version:row.version,game:row.game,title:row.title,topic:row.topic,difficulty:row.difficulty,rulesVersion:row.rulesVersion,
      promptJson:prompt(row.state),solutionJson:solution(row.best,row.ev,row.ref),tagsJson:JSON.stringify(row.tags),status:"published",source:"seed"
    }).onConflictDoNothing();
  }
  const quests = [
    {id:"daily-practice",cadence:"daily" as const,key:"daily_practice",rulesJson:JSON.stringify({type:"attempts",target:3}),xpReward:15},
    {id:"weekly-mastery",cadence:"weekly" as const,key:"weekly_mastery",rulesJson:JSON.stringify({type:"score",target:200}),xpReward:40},
    {id:"recovery-preflop",cadence:"recovery" as const,key:"recovery_preflop",rulesJson:JSON.stringify({type:"mistake",tag:"overfold",target:1}),xpReward:20}
  ];
  for (const q of quests) await db.insert(questTemplates).values(q).onConflictDoNothing();
  console.log("Seeded learning fixtures for", user?.email);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
