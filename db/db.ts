// @deno-types="https://esm.sh/@planetscale/database/dist/index.d.ts"
import "https://deno.land/std/dotenv/load.ts";
import { connect } from "npm:@planetscale/database";

const config = {
  host: Deno.env.get("DATABASE_HOST"),
  username: Deno.env.get("DATABASE_USERNAME"),
  password: Deno.env.get("DATABASE_PASSWORD"),
};

const db = connect(config);

console.log(db);
