import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cosmetics = [
  ["rookie","SKIN","Neon Rookie",0,"COMMON","🤖"],
  ["cyber","SKIN","Cyber Violet",450,"RARE","🟣"],
  ["solar","SKIN","Solar Gold",900,"EPIC","🟡"],
  ["void","SKIN","Void Walker",1600,"LEGENDARY","👾"],
  ["halo","HAT","Neon Halo",300,"RARE","😇"],
  ["crown","HAT","Pixel Crown",750,"EPIC","👑"],
  ["visor","HAT","Holo Visor",500,"RARE","🥽"],
  ["spark","TRAIL","Spark Trail",350,"COMMON","✨"],
  ["fire","TRAIL","Fire Trail",800,"EPIC","🔥"],
  ["rainbow","TRAIL","Rainbow Trail",1200,"LEGENDARY","🌈"],
  ["stars","EFFECT","Star Burst",600,"EPIC","💫"],
  ["heart","EFFECT","Heart Pop",250,"COMMON","💖"]
];

for (const [id,type,name,price,rarity,icon] of cosmetics) {
  await prisma.cosmetic.upsert({
    where:{id}, update:{type,name,price,rarity,icon},
    create:{id,type,name,price,rarity,icon}
  });
}

const now = new Date();
const end = new Date(now); end.setDate(end.getDate()+30);
const season = await prisma.season.upsert({
  where:{id:"season-01"},
  update:{active:true, startsAt:now, endsAt:end},
  create:{id:"season-01",name:"Neon Horizon",number:1,startsAt:now,endsAt:end,active:true}
});

const pass = [
  [1,100,null],[2,0,"spark"],[3,150,null],[4,0,"halo"],[5,250,null],
  [6,0,"cyber"],[7,300,null],[8,0,"stars"],[9,500,null],[10,0,"void"]
];
for (const [tier,coins,cosmeticId] of pass) {
  await prisma.passReward.upsert({
    where:{seasonId_tier:{seasonId:season.id,tier}},
    update:{coins,cosmeticId},
    create:{seasonId:season.id,tier,coins,cosmeticId}
  });
}
console.log("Seed complete");
await prisma.$disconnect();
