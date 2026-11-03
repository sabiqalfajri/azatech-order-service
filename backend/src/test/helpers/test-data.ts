import { randomUUID } from "node:crypto";

export function createTestData(scope: string) {
  const run = randomUUID().slice(0, 8).toUpperCase();
  const prefix = `TST-${scope}-${run}`;
  let seq = 0;
  const next = () => ++seq;

  return {
    run,
    prefix,
    name: (label = "Item") => `${prefix} ${label} ${next()}`,
    code: () => `${prefix}-${next()}`, 
  };
}