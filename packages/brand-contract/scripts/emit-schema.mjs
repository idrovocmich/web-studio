// Writes dist/brand.schema.json so brand.json files get editor autocompletion and validation.
import { writeFile } from "node:fs/promises";
import { z } from "zod";
import { brandSchema } from "../dist/index.js";

const schema = z.toJSONSchema(brandSchema, { io: "input", unrepresentable: "any" });
schema.title = "web-studio brand";
schema.description = "Contrato de marca de web-studio (@idrovocmich/brand-contract).";
await writeFile(
  new URL("../dist/brand.schema.json", import.meta.url),
  `${JSON.stringify(schema, null, 2)}\n`,
);
console.log("brand-contract: brand.schema.json generado.");
