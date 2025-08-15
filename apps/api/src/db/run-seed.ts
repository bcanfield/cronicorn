import resetDb from "@/api/db/reset.js";

resetDb(true).catch(console.error);
