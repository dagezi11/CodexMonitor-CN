// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { i18n, resolveLanguage } from "./i18n";

describe("i18n.resolveLanguage", () => {
  it("returns explicit supported preference directly", () => {
    expect(resolveLanguage("en", ["zh-CN"])).toBe("en");
    expect(resolveLanguage("zh-CN", ["en-US"])).toBe("zh-CN");
  });

  it("maps system zh-* to zh-CN", () => {
    expect(resolveLanguage("system", ["zh-TW"])).toBe("zh-CN");
    expect(resolveLanguage("system", ["zh"])).toBe("zh-CN");
  });

  it("maps other system languages to en fallback", () => {
    expect(resolveLanguage("system", ["ja-JP"])).toBe("en");
    expect(resolveLanguage("system", [])).toBe("en");
  });
});

describe("i18n fallback", () => {
  it("falls back to english when key is missing", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("settings:display.theme")).toBe("Theme");
    expect(i18n.t("settings:display.non_existing_key", { defaultValue: "x" })).toBe("x");
  });
});
