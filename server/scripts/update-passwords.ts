import bcrypt from "bcryptjs";
import { initDatabase, prisma } from "../src/config/db.js";

async function main() {
  console.log("==> Updating all user passwords to Matrix@4290...");
  await initDatabase();
  
  const newHash = await bcrypt.hash("Matrix@4290", 10);
  const result = await prisma.user.updateMany({
    data: {
      passwordHash: newHash,
    },
  });

  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      role: true,
    },
  });

  console.log(`[SUCCESS] Updated ${result.count} users with new password: Matrix@4290`);
  users.forEach((u) => {
    console.log(` - [${u.role}] ${u.email} (${u.fullName})`);
  });
}

main()
  .catch((err) => {
    console.error("Error updating passwords:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
