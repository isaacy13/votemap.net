import { isMock } from "./config";
import { createMockApi } from "./mock";
import { createChainApi } from "./chain";
import type { VoteMapApi } from "./types";

export function getApi(): VoteMapApi {
    return isMock() ? createMockApi() : createChainApi();
}
