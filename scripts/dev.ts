import * as cartographer from "../src/index.js";

console.log("Cartographer Phase 0 development entrypoint");

for (const entrypointName of Object.keys(cartographer)) {
  console.log(`- ${entrypointName}`);
}
