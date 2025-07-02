require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

const app = express();
const PORT = 2000;

app.get("/", (req, res) => {
  res.send("RAH POWER BOT HOSTING is running");
});

app.listen(PORT, () => {
  console.log(`Express server started on port ${PORT}`);
});

let users = {};
if (fs.existsSync("users.json")) {
  users = JSON.parse(fs.readFileSync("users.json"));
}

bot.start((ctx) => {
  const welcome = `👋 Welcome ${ctx.from.first_name}!\n🤖 This is RAH POWER BOT HOSTING.\n\n📁 Use /upload to upload your bot file.\n🛠️ Use /mybots to view your uploaded files.`;
  ctx.reply(welcome, Markup.keyboard([["📂 Upload", "📦 My Bots"], ["🧑‍💻 Contact Admin"]]).resize());
});

bot.command("upload", (ctx) => {
  ctx.reply("📂 Please send your .js or .zip bot file:");
});

bot.hears("📂 Upload", (ctx) => {
  ctx.reply("📂 Please send your .js or .zip bot file:");
});

bot.command("mybots", (ctx) => {
  const userId = ctx.from.id.toString();
  if (!users[userId] || users[userId].files.length === 0) {
    return ctx.reply("📦 You haven't uploaded any bot files yet.");
  }
  let reply = "📁 Your uploaded files:\n";
  users[userId].files.forEach((file, i) => {
    reply += `#${i + 1}: ${file}\n`;
  });
  ctx.reply(reply);
});

bot.hears("📦 My Bots", (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, "/mybots");
});

bot.command("dashboard", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("⛔ Access denied.");
  const totalUsers = Object.keys(users).length;
  let text = `👑 Admin Dashboard\n\n📊 Total Users: ${totalUsers}\n`;
  for (const uid in users) {
    text += `\n👤 ${users[uid].name} (${uid})\n📁 Files: ${users[uid].files.join(", ")}\n`;
  }
  ctx.reply(text);
});

bot.command("deletebot", (ctx) => {
  const userId = ctx.from.id.toString();
  const userFolder = path.join(__dirname, "uploads", userId);
  if (fs.existsSync(userFolder)) {
    fs.rmSync(userFolder, { recursive: true, force: true });
  }
  if (users[userId]) {
    users[userId].files = [];
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  }
  ctx.reply("🗑️ All your uploaded bot files have been deleted.");
});

bot.on("document", async (ctx) => {
  const userId = ctx.from.id.toString();
  const username = ctx.from.first_name;
  const fileName = ctx.message.document.file_name;
  const fileId = ctx.message.document.file_id;

  const link = await ctx.telegram.getFileLink(fileId);
  const userDir = path.join(__dirname, "uploads", userId);
  fs.mkdirSync(userDir, { recursive: true });

  const filePath = path.join(userDir, fileName);
  const res = await fetch(link.href);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));

  if (!users[userId]) {
    users[userId] = { name: username, files: [] };
  }
  users[userId].files.push(fileName);
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

  ctx.reply(`✅ File uploaded: ${fileName}`);
});

bot.hears("🧑‍💻 Contact Admin", (ctx) => {
  ctx.reply("📩 Contact Admin: @@rahbro22");
});

bot.launch();
                 
