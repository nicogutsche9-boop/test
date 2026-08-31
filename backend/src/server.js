import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { signUser, requireAuth, requireAdmin } from "./auth.js";
import { GAME_RULES, calculateReward, applyXp } from "./gameRules.js";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",").map(x=>x.trim()) || true }));
app.use(express.json({ limit:"100kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

const publicUser = u => ({id:u.id,email:u.email,displayName:u.displayName,coins:u.coins,xp:u.xp,level:u.level,isAdmin:u.isAdmin});

app.get("/api/health", (_,res)=>res.json({ok:true,service:"arcadeverse-api"}));

app.post("/api/auth/register", async (req,res)=>{
  const parsed=z.object({email:z.string().email().max(200),password:z.string().min(8).max(100),displayName:z.string().min(2).max(24)}).safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:"Ungültige Eingaben."});
  const {email,password,displayName}=parsed.data;
  const exists=await prisma.user.findUnique({where:{email:email.toLowerCase()}});
  if(exists) return res.status(409).json({error:"E-Mail ist bereits registriert."});
  const passwordHash=await bcrypt.hash(password,12);
  const user=await prisma.user.create({
    data:{email:email.toLowerCase(),passwordHash,displayName,isAdmin:email.toLowerCase()===process.env.ADMIN_EMAIL?.toLowerCase(),
      inventory:{create:{cosmeticId:"rookie"}}}
  });
  res.status(201).json({token:signUser(user),user:publicUser(user)});
});

app.post("/api/auth/login", async (req,res)=>{
  const parsed=z.object({email:z.string().email(),password:z.string()}).safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:"Ungültige Eingaben."});
  const user=await prisma.user.findUnique({where:{email:parsed.data.email.toLowerCase()}});
  if(!user || !(await bcrypt.compare(parsed.data.password,user.passwordHash))) return res.status(401).json({error:"E-Mail oder Passwort falsch."});
  res.json({token:signUser(user),user:publicUser(user)});
});

app.get("/api/me",requireAuth,async(req,res)=>{
  const user=await prisma.user.findUnique({where:{id:req.user.sub},include:{inventory:{include:{cosmetic:true}}}});
  if(!user)return res.status(404).json({error:"User nicht gefunden."});
  res.json({user:publicUser(user),inventory:user.inventory.map(x=>x.cosmetic)});
});

app.get("/api/games",(_,res)=>res.json({games:Object.keys(GAME_RULES)}));

app.post("/api/scores",requireAuth,async(req,res)=>{
  const parsed=z.object({gameId:z.enum(["target","collector","dodge","reaction","runner","memory","math","color","lane","stack"]),score:z.number().int().min(0).max(1000000)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Ungültiger Score."});
  const reward=calculateReward(parsed.data.gameId,parsed.data.score);
  const result=await prisma.$transaction(async tx=>{
    const user=await tx.user.findUnique({where:{id:req.user.sub}});
    if(!user)throw new Error("User missing");
    const progression=applyXp(user,reward.xp);
    const updated=await tx.user.update({where:{id:user.id},data:{coins:{increment:reward.coins},xp:progression.xp,level:progression.level}});
    const score=await tx.score.create({data:{userId:user.id,gameId:parsed.data.gameId,score:reward.score,coinsAwarded:reward.coins,xpAwarded:reward.xp}});
    const d=new Date().toISOString().slice(0,10);
    const daily=await tx.dailyChallenge.findMany({where:{dateKey:d}});
    for(const c of daily){
      let increment=0;
      if(c.challengeId==="plays") increment=1;
      if(c.challengeId==="score") increment=reward.score;
      if(c.gameId===parsed.data.gameId && c.challengeId!=="plays" && c.challengeId!=="score") increment=1;
      if(increment){
        const prev=await tx.challengeProgress.findUnique({where:{userId_challengeId_dateKey:{userId:user.id,challengeId:c.challengeId,dateKey:d}}});
        const next=Math.min(c.target,(prev?.value||0)+increment);
        const completed=next>=c.target;
        const wasCompleted=prev?.completed||false;
        await tx.challengeProgress.upsert({
          where:{userId_challengeId_dateKey:{userId:user.id,challengeId:c.challengeId,dateKey:d}},
          update:{value:next,completed},
          create:{userId:user.id,challengeId:c.challengeId,dateKey:d,value:next,completed}
        });
        if(completed&&!wasCompleted){
          await tx.user.update({where:{id:user.id},data:{coins:{increment:c.rewardCoins},xp:{increment:c.rewardXp}}});
        }
      }
    }
    const beforeBonus=await tx.user.findUnique({where:{id:user.id}});
    const finalProgression=applyXp(beforeBonus, 0);
    const finalUser=await tx.user.update({where:{id:user.id},data:{level:finalProgression.level,xp:finalProgression.xp}});
    return {updated:finalUser,score,progression:finalProgression};
  });
  res.status(201).json({score:result.score,coinsAwarded:result.score.coinsAwarded,xpAwarded:result.score.xpAwarded,user:publicUser(result.updated)});
});

app.get("/api/leaderboard/:gameId",async(req,res)=>{
  if(!GAME_RULES[req.params.gameId])return res.status(404).json({error:"Unknown game"});
  const rows=await prisma.score.findMany({where:{gameId:req.params.gameId},orderBy:{score:"desc"},take:50,include:{user:{select:{displayName:true}}}});
  res.json(rows.map((r,i)=>({rank:i+1,displayName:r.user.displayName,score:r.score,createdAt:r.createdAt})));
});

app.get("/api/shop",async(_,res)=>res.json(await prisma.cosmetic.findMany({orderBy:{price:"asc"}})));

app.post("/api/shop/buy/:id",requireAuth,async(req,res)=>{
  const id=req.params.id;
  const result=await prisma.$transaction(async tx=>{
    const item=await tx.cosmetic.findUnique({where:{id}});
    if(!item)throw Object.assign(new Error("Item fehlt"),{status:404});
    const user=await tx.user.findUnique({where:{id:req.user.sub}});
    const owns=await tx.inventory.findUnique({where:{userId_cosmeticId:{userId:user.id,cosmeticId:id}}});
    if(owns)return {user,item,already:true};
    if(user.coins<item.price)throw Object.assign(new Error("Nicht genug Coins"),{status:400});
    const updated=await tx.user.update({where:{id:user.id},data:{coins:{decrement:item.price}}});
    await tx.inventory.create({data:{userId:user.id,cosmeticId:id}});
    return {user:updated,item,already:false};
  });
  res.json({user:publicUser(result.user),item:result.item,alreadyOwned:result.already});
});

app.get("/api/pass",async(_,res)=>{
  const season=await prisma.season.findFirst({where:{active:true},include:{rewards:{orderBy:{tier:"asc"},include:{cosmetic:true}}}});
  res.json(season);
});

app.post("/api/pass/claim/:rewardId",requireAuth,async(req,res)=>{
  const reward=await prisma.passReward.findUnique({where:{id:req.params.rewardId},include:{season:true,cosmetic:true}});
  if(!reward)return res.status(404).json({error:"Reward nicht gefunden."});
  const result=await prisma.$transaction(async tx=>{
    const user=await tx.user.findUnique({where:{id:req.user.sub}});
    if(user.level<reward.tier)throw Object.assign(new Error("Level noch nicht erreicht"),{status:400});
    const existing=await tx.passClaim.findUnique({where:{userId_rewardId:{userId:user.id,rewardId:reward.id}}});
    if(existing)return {user};
    const updated=await tx.user.update({where:{id:user.id},data:{coins:{increment:reward.coins}}});
    await tx.passClaim.create({data:{userId:user.id,rewardId:reward.id}});
    if(reward.cosmeticId)await tx.inventory.upsert({where:{userId_cosmeticId:{userId:user.id,cosmeticId:reward.cosmeticId}},update:{},create:{userId:user.id,cosmeticId:reward.cosmeticId}});
    return {user:updated};
  });
  res.json({user:publicUser(result.user)});
});

function dateKey(){return new Date().toISOString().slice(0,10)}
async function ensureDailies(){
  const d=dateKey();
  const base=[
    ["plays","Spiele 3 Runden",null,3,150,80],
    ["score","Erreiche 5.000 Punkte",null,5000,200,100],
    ["target","Triff 25 Targets","target",25,175,90]
  ];
  for(const [challengeId,title,gameId,target,rewardCoins,rewardXp] of base){
    await prisma.dailyChallenge.upsert({where:{dateKey_challengeId:{dateKey:d,challengeId}},update:{},create:{dateKey:d,challengeId,title,gameId,target,rewardCoins,rewardXp}});
  }
}
app.get("/api/dailies",requireAuth,async(req,res)=>{
  await ensureDailies(); const d=dateKey();
  const challenges=await prisma.dailyChallenge.findMany({where:{dateKey:d}});
  const progress=await prisma.challengeProgress.findMany({where:{userId:req.user.sub,dateKey:d}});
  res.json(challenges.map(c=>({...c,value:progress.find(p=>p.challengeId===c.challengeId)?.value||0,completed:progress.find(p=>p.challengeId===c.challengeId)?.completed||false})));
});

app.get("/api/admin/users",requireAuth,requireAdmin,async(_,res)=>res.json(await prisma.user.findMany({select:{id:true,email:true,displayName:true,coins:true,xp:true,level:true,createdAt:true},orderBy:{createdAt:"desc"},take:100})));

app.post("/api/admin/dailies",requireAuth,requireAdmin,async(req,res)=>{
  const p=z.object({dateKey:z.string(),challengeId:z.string(),title:z.string(),gameId:z.string().nullable(),target:z.number().int().positive(),rewardCoins:z.number().int().nonnegative(),rewardXp:z.number().int().nonnegative()}).safeParse(req.body);
  if(!p.success)return res.status(400).json({error:"Ungültige Challenge."});
  res.json(await prisma.dailyChallenge.upsert({where:{dateKey_challengeId:{dateKey:p.data.dateKey,challengeId:p.data.challengeId}},update:p.data,create:p.data}));
});

app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({error:err.message||"Serverfehler."})});
app.listen(PORT,()=>console.log(`ArcadeVerse API listening on :${PORT}`));
