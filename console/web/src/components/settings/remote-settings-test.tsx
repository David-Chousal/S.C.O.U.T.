import { describe, expect, test } from "vitest";
import firmware from "../../../../worker/buoy-config.json";
import type { RemoteSetting } from "@/lib/api/types";
import { changedKeys, optionsOf } from "./remote-settings";

const REMOTE = firmware.remote as RemoteSetting[];
const spec = (key: string) => REMOTE.find((s) => s.key === key)!;

describe("remote settings helpers", () => {
  test("small ranges list every value; wide ones get a number field", () => {
    expect(optionsOf(spec("slot_phase_h"))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(optionsOf(spec("audio_clip_s"))).toEqual([0, 15, 30, 60]);
    expect(optionsOf(spec("conserve_mv"))).toBeNull();
  });

  test("changed keys compare against what the buoy is asked to run", () => {
    const wanted = REMOTE.map((s) => s.default);
    const form = Object.fromEntries(REMOTE.map((s) => [s.key, s.default]));
    expect(changedKeys(REMOTE, wanted, form)).toEqual([]);
    expect(changedKeys(REMOTE, wanted, { ...form, tx_count: 1 })).toEqual(["tx_count"]);
  });
});
