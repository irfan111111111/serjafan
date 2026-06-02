import "dotenv/config";
import { db } from ".";
import { appSettings, user } from "./schema";

async function main() {
  await db
    .insert(user)
    .values({
      id: "usr_admin_serjafan",
      name: "SERJAFAN Administrator",
      email: "admin@serjafan.id",
      emailVerified: true,
      role: "ADMIN"
    })
    .onConflictDoNothing();

  await db
    .insert(appSettings)
    .values({
      key: "global",
      value: JSON.stringify({
        platformFee: 3000,
        promoCode: "",
        promoDiscount: 0,
        serviceArea: "Kota Padang",
        supportPhone: "+62xxxxxxxxxx"
      })
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: JSON.stringify({
          platformFee: 3000,
          promoCode: "",
          promoDiscount: 0,
          serviceArea: "Kota Padang",
          supportPhone: "+62xxxxxxxxxx"
        }),
        updatedAt: new Date()
      }
    });

  console.log("Seeded SERJAFAN production base data.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
