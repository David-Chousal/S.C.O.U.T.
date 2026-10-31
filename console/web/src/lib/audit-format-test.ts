import { describe, expect, test } from "vitest";
import { actionLabel, changeLines, targetLabel } from "./audit-format";
import { ago } from "./format";

describe("audit format", () => {
  test("action codes read as words, unknown codes pass through", () => {
    expect(actionLabel("buoy.tx_count")).toBe("Requested transmit count");
    expect(actionLabel("something.new")).toBe("something.new");
  });

  test("a renamed buoy's numeric target reads as Buoy N", () => {
    expect(targetLabel({ action: "buoy.rename", target: "1" })).toBe("Buoy 1");
    expect(targetLabel({ action: "user.role", target: "a@b.test" })).toBe("a@b.test");
  });

  test("changes list each changed field as before → after", () => {
    const entry = { before_json: '{"requested":null,"reported":3}', after_json: '{"requested":2}' };
    expect(changeLines(entry)).toEqual(["Requested: nothing → 2"]);
  });

  test("a field only set afterwards shows its new value", () => {
    expect(changeLines({ before_json: null, after_json: '{"role":"member"}' })).toEqual(["Role: member"]);
  });

  test("no snapshots or unreadable JSON give no lines", () => {
    expect(changeLines({ before_json: null, after_json: null })).toEqual([]);
    expect(changeLines({ before_json: null, after_json: "{oops" })).toEqual([]);
  });
});

describe("ago", () => {
  const now = Date.UTC(2026, 9, 30, 12, 0);
  test("steps from minutes to hours to days", () => {
    expect(ago(now - 20_000, now)).toBe("just now");
    expect(ago(now - 12 * 60_000, now)).toBe("12 min ago");
    expect(ago(now - 5 * 3600_000, now)).toBe("5 h ago");
    expect(ago(now - 3 * 86400_000, now)).toBe("3 d ago");
    expect(ago(null, now)).toBe("—");
  });
});
