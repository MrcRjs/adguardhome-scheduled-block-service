import fetch, { RequestInit } from "node-fetch";
const { AGH_SERVER, AGH_USER, AGH_PASS } = process.env;

interface BlockableService {
  id: string;
  name: string;
  icon_svg: string;
  rules: [];
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



export async function blockAGHServices(services: string[]) {
  // TODO: Validate services input is an actual blockable service
  // const blockableServicesRes = await getBlockableServicesIDs();

  const blockedServices = await fetchAGHAPI(
    AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES
  );

  const uniqueServices: string[] = Array.from(
    new Set([...services, ...blockedServices])
  );

  await fetchAGHAPI(
    AGH_ENDPOINTS.SET_BLOCKED_SERVICES,
    { method: "POST" },
    uniqueServices
  );

  const blockedServicesUpdated = await fetchAGHAPI(
    AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES
  );

  console.log("[AGH] Now blocking ", JSON.stringify(blockedServicesUpdated));
}

export async function unblockALLAGHServices() {
  const blockServicesResponse = await fetchAGHAPI(
    AGH_ENDPOINTS.SET_BLOCKED_SERVICES,
    { method: "POST" },
    []
  );
  console.log(blockServicesResponse);
}

export async function getBlockableServicesIDs() {
  const blockableServicesRes = await fetchAGHAPI(
    AGH_ENDPOINTS.BLOCKABLE_SERVICES
  );
  return blockableServicesRes.blocked_services.map(
    (bserv: BlockableService) => bserv.id
  );
}

export async function getAGHBlockedStatus() {
  return await fetchAGHAPI(AGH_ENDPOINTS.CURRENT_BLOCKED_SERVICES);
}
