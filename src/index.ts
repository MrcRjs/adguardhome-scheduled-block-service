/* eslint-disable no-console */

import {
  blockAGHServices,
  getAGHBlockedStatus,
  getBlockableServicesIDs,
  unblockALLAGHServices,
} from "./AGHService/index.js";

const USAGE_MSG =
  "aghblock [block|unblock|unblockall|list|status] <service,service2,service3>";

(async function init() {
  const envVarsDefined = verifyDefinedEnvVariables([
    "AGH_SERVER",
    "AGH_USER",
    "AGH_USER",
  ]);
  if (envVarsDefined.missing) {
    console.error(envVarsDefined.missingErrorMsg);
    return -1;
  }
  try {
    if (process.argv.length > 2) {
      const command = process.argv[2];
      if (command === "block") {
        if (process.argv.length > 3) {
          const blockServices = process.argv[3].split(",");
          await blockAGHServices(blockServices);
          return 0;
        } else {
          console.error("Missing list of services to block: ", USAGE_MSG);
          return -1;
        }
      } else if (command === "status") {
        const currentlyBlocked = await getAGHBlockedStatus();
        console.log("[AGH] Currently blocking:", currentlyBlocked.join(", "));
        return 0;
      } else if (command === "list") {
        const servicesList = Array.from(
          new Set(await getBlockableServicesIDs())
        ).join(",");
        console.log("[AGH] Available services to block\n", servicesList);
        return 0;
      } else if (command === "unblockall") {
        await unblockALLAGHServices();
        console.log("[AGH] All services are unblocked now, have fun!");
        return 0;
      } else {
        console.error("Usage: ");
        return -2;
      }
    } else {
      console.error("Usage: ", USAGE_MSG);
      return -2;
    }
  } catch (err) {
    console.error(err);
    return -1;
  }
})();

function verifyDefinedEnvVariables(requiredVars: string[] = []) {
  const missingVars: string[] = [];
  for (const envVar of requiredVars) {
    if (process.env[envVar] === undefined) {
      missingVars.push(envVar);
    }
  }
  if (missingVars.length > 0) {
    const missingErrorMsg = `[Error] ${missingVars.join(
      ", "
    )} environment variables undefined.`;
    return { missing: true, missingVars, missingErrorMsg };
  }

  return { missing: false };
}
