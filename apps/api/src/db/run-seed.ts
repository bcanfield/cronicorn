import resetDb from "@/api/db/reset";

resetDb(true).catch(console.error);
