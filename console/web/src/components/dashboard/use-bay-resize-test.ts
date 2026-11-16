import { describe, expect, test } from "vitest";
import { BAY_MAX_GROW_PX, heightFor } from "./use-bay-resize";

describe("bay height", () => {
  test("never below the content: at or under it the bay fits its content again", () => {
    expect(heightFor(300, 464)).toBeNull();
    expect(heightFor(470, 464)).toBeNull();
  });

  test("taller snaps to 20 px and stops 480 px past the content", () => {
    expect(heightFor(531, 464)).toBe(540);
    expect(heightFor(5000, 464)).toBe(940);
    expect(BAY_MAX_GROW_PX).toBe(480);
  });
});
