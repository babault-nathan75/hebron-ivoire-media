import "dotenv/config";
import { addAdmin, setUserPasswordHash } from "../db";
import { ensureAdminUser, hashPassword, normalizeEmail } from "../_core/adminAuth";

// Usage : pnpm admin:add <email> [mot-de-passe]
// Enregistre l'administrateur dans la base (table admins). Sans mot de passe, il se connecte par code e-mail.
const [rawEmail, password] = process.argv.slice(2);
if (!rawEmail || (password !== undefined && password.length < 8)) {
  console.error("Usage : pnpm admin:add <email> [mot-de-passe (8+ caractères)]");
  process.exit(1);
}
const email = normalizeEmail(rawEmail);

async function main() {
  await addAdmin(email, "console");
  const openId = await ensureAdminUser(email);
  if (password) await setUserPasswordHash(openId, await hashPassword(password));
  console.log(`Administrateur enregistré : ${email}${password ? " (mot de passe défini)" : " (connexion par code e-mail)"}.`);
}

main().then(
  () => process.exit(0),
  error => {
    console.error(error);
    process.exit(1);
  },
);
