import "dotenv/config";
import { ensureAdminUser, hashPassword } from "../_core/adminAuth";
import { isAdminEmail, setUserPasswordHash } from "../db";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error("Usage : pnpm admin:password <email> <mot-de-passe (8+ caractères)>");
  process.exit(1);
}
async function main() {
  if (!(await isAdminEmail(email))) {
    console.error("Cet e-mail n'est pas administrateur (ADMIN_EMAILS ou espace admin).");
    process.exit(1);
  }
  const openId = await ensureAdminUser(email);
  await setUserPasswordHash(openId, await hashPassword(password));
  console.log(`Mot de passe défini pour ${email}.`);
}

main().then(
  () => process.exit(0),
  error => {
    console.error(error);
    process.exit(1);
  },
);
