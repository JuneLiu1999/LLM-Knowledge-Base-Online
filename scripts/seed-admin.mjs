#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('用法: node scripts/seed-admin.mjs <username> <password>');
  process.exit(1);
}

if (username.length < 3) {
  console.error('用户名至少 3 个字符');
  process.exit(1);
}

if (password.length < 8) {
  console.error('密码至少 8 个字符');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.error(`管理员 ${username} 已存在`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.create({
    data: { username, passwordHash },
  });

  console.log(`✓ 已创建超级管理员: ${admin.username}`);
  console.log(`  ID: ${admin.id}`);
  console.log(`  登录入口: https://read.aigameplay.cn/admin/login`);
} finally {
  await prisma.$disconnect();
}
