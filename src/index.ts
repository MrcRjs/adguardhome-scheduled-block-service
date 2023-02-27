/* eslint-disable no-console */
import fetch, { RequestInit } from "node-fetch";
const { AGH_SERVER, AGH_USER, AGH_PASS } = process.env;

const USAGE_MSG =
  "aghblock [block|unblock|blockall|unblockall|list|status] <service,service2,service3>";

async function main() {
  const environmentVariables = verifyDefinedEnvVariables([
    "AGH_SERVER",
    "AGH_USER",
    "AGH_USER",
  ]);
  if (environmentVariables.missing) {
    console.error(environmentVariables.missingErrorMsg);
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
        console.log("Currently blocking:", currentlyBlocked.join(","));
        return 0;
      } else if (command === "list") {
        const servicesList = Array.from(
          new Set(await getBlockableServicesIDs())
        ).join(",");
        console.log("Available services to block\n", servicesList);
        return 0;
      } else if (command === "blockall") {
        await blockAllAGHServices();
        console.log("\nAll services are blocked.");
        return 0;
      } else if (command === "unblockall") {
        await unblockAllAGHServices();
        console.log("All services are unblocked now, have fun!");
        return 0;
      } else {
        console.error(
          `Option [${command}] not found. \n`,
          "Usage: ",
          USAGE_MSG
        );
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
}

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

const AGH_ENDPOINTS = {
  /**
   * Get available services to use for blocking
   * ```
   *     'get':
   *      'tags':
   *      - 'blocked_services'
   *      'operationId': 'blockedServicesAll'
   *      'responses':
   *        '200':
   *          'description': 'OK.'
   *          'content':
   *            'application/json':
   *              'schema':
   *                '$ref': '#/components/schemas/BlockedServicesAll'
   * ```
   */
  BLOCKABLE_SERVICES: "/blocked_services/all",
  /**
   * Get blocked services list
   * ```
   * 'get':
   *      'tags':
   *      - 'blocked_services'
   *      'operationId': 'blockedServicesList'
   *      'responses':
   *        '200':
   *          'description': 'OK.'
   *          'content':
   *            'application/json':
   *              'schema':
   *                '$ref': '#/components/schemas/BlockedServicesArray'
   * ```
   */
  CURRENT_BLOCKED_SERVICES: "/blocked_services/list",
  /**
   * Set blocked services list
   * ```
   *   '/blocked_services/set':
   *    'post':
   *      'tags':
   *      - 'blocked_services'
   *      'operationId': 'blockedServicesSet'
   *      'requestBody':
   *        'content':
   *          'application/json':
   *            'schema':
   *              '$ref': '#/components/schemas/BlockedServicesArray'
   * ```
   */
  SET_BLOCKED_SERVICES: "/blocked_services/set",
};

interface BlockableService {
  id: string;
  name: string;
  icon_svg: string;
  rules: [];
}

async function fetchAGHAPI(
  route = "/status",
  options = { method: "GET" },
  body?: object
) {
  const params: RequestInit = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${AGH_USER}:${AGH_PASS}`).toString(
        "base64"
      )}`,
    },
    ...options,
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await fetch(AGH_SERVER + route, params);

  if (response.status >= 400) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  if (params.method === "GET") {
    return await response.json();
  }

  return response;
}

async function validateBlockableServices(
  services: string[]
): Promise<string[]> {
  const blockableServicesRes: Set<string> = new Set(
    await getBlockableServicesIDs()
  );
  const invalidServices: string[] = [];
  const validServices = services.filter((s) => {
    const serviceExists = blockableServicesRes.has(s);
    return serviceExists ? true : invalidServices.push(s) && false;
  });

  const USAGE_LIST_MSG =
    "\nTo view a full list of supported services run: aghblock list";
  const BLOCKLIST_SUPPORT_MSG =
    "\n\nTo learn more about creating custom blocklists in AdguardHome: \nhttps://github.com/AdguardTeam/AdGuardHome/wiki/Hosts-Blocklists\n\n";
  if (invalidServices.length > 0) {
    if (invalidServices.length > 1) {
      console.error(
        `\nServices "${invalidServices.join(",")}" are not supported.`,
        USAGE_LIST_MSG,
        BLOCKLIST_SUPPORT_MSG
      );
    } else {
      console.error(
        `\n[Warning] Service "${invalidServices[0]}" is not supported.`,
        USAGE_LIST_MSG,
        BLOCKLIST_SUPPORT_MSG
      );
    }
  }

  return validServices;
}

async function blockAGHServices(services: string[]) {
  const validServices = await validateBlockableServices(services);

  const currentlyBlockedServices = await fetchAGHAPI(
    AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES
  );

  const uniqueServices: string[] = Array.from(
    new Set([...validServices, ...currentlyBlockedServices])
  );

  await fetchAGHAPI(
    AGH_ENDPOINTS.SET_BLOCKED_SERVICES,
    { method: "POST" },
    uniqueServices
  );

  const blockedServicesUpdated = await fetchAGHAPI(
    AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES
  );

  console.log("Now blocking", blockedServicesUpdated.join(","));
}

async function unblockAllAGHServices() {
  const blockServicesResponse = await fetchAGHAPI(
    AGH_ENDPOINTS.SET_BLOCKED_SERVICES,
    { method: "POST" },
    []
  );
  console.log(blockServicesResponse);
}

async function blockAllAGHServices() {
  const blockableServices = await getBlockableServicesIDs();
  await fetchAGHAPI(
    AGH_ENDPOINTS.SET_BLOCKED_SERVICES,
    { method: "POST" },
    blockableServices
  );

  const blockedServicesUpdated = await fetchAGHAPI(
    AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES
  );

  console.log("Now blocking", blockedServicesUpdated.join(","));
}

async function getBlockableServicesIDs() {
  const blockableServicesRes = await fetchAGHAPI(
    AGH_ENDPOINTS.BLOCKABLE_SERVICES
  );
  return blockableServicesRes.blocked_services.map(
    (bserv: BlockableService) => bserv.id
  );
}

async function getAGHBlockedStatus() {
  return await fetchAGHAPI(AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES);
}

main();
