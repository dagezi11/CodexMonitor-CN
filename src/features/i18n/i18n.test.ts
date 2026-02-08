// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { i18n, resolveLanguage } from "./i18n";
import { commonTranslations } from "./commonTranslations";

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

function flattenObject(
  value: unknown,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      flattenObject(entry, nextKey, result);
      continue;
    }
    result[nextKey] = String(entry ?? "");
  }
  return result;
}

describe("commonTranslations consistency", () => {
  it("keeps en/zh-CN keys aligned", () => {
    const enKeys = Object.keys(flattenObject(commonTranslations.en)).sort();
    const zhKeys = Object.keys(flattenObject(commonTranslations["zh-CN"])).sort();
    expect(zhKeys).toEqual(enKeys);
  });

  it("keeps interpolation placeholders aligned", () => {
    const en = flattenObject(commonTranslations.en);
    const zh = flattenObject(commonTranslations["zh-CN"]);
    const tokenPattern = /{{\s*([\w.]+)\s*}}/g;

    for (const key of Object.keys(en)) {
      const enTokens = new Set<string>();
      const zhTokens = new Set<string>();
      for (const match of en[key].matchAll(tokenPattern)) {
        enTokens.add(match[1]);
      }
      for (const match of (zh[key] ?? "").matchAll(tokenPattern)) {
        zhTokens.add(match[1]);
      }
      expect(Array.from(zhTokens).sort()).toEqual(Array.from(enTokens).sort());
    }
  });

  it("zh-CN english words stay in whitelist only", () => {
    const zh = flattenObject(commonTranslations["zh-CN"]);
    const allowedByToken = [
      /Codex/i,
      /Git/i,
      /Worktree/i,
      /Agent/i,
      /Diff/i,
      /API/i,
      /Composer/i,
      /English/i,
      /Orbit/i,
      /OAuth/i,
      /ChatGPT/i,
      /PR/i,
      /PATH/i,
      /CODEX_HOME/i,
      /AGENTS\.md/i,
      /config\.toml/i,
      /WSL2/i,
      /pnpm/i,
      /npm/i,
      /MB|GB|KB/i,
      /value|count|start|end|suffix/i,
      /Dimillian/i,
      /Enter/i,
      /run/i,
      /dev/i,
      /install/i,
      /npm|pnpm/i,
      /\{\{\w+\}\}/,
    ];

    const allowedByKey: Record<string, RegExp[]> = {
      "requestInput.requestProgress": [/current/i, /total/i],
      "approvalToast.approveEnter": [/Enter/i],
    };

    const englishChunk = /[A-Za-z][A-Za-z0-9_.-]*/g;

    for (const [key, text] of Object.entries(zh)) {
      const chunks = text.match(englishChunk) ?? [];
      for (const chunk of chunks) {
        const isInterpolationVariable =
          text.includes(`{{${chunk}}}`) || text.includes(`{{ ${chunk} }}`);
        if (isInterpolationVariable) {
          continue;
        }
        const keyPatterns = allowedByKey[key] ?? [];
        const isAllowed =
          keyPatterns.some((pattern) => pattern.test(chunk)) ||
          allowedByToken.some((pattern) => pattern.test(chunk));
        expect(
          isAllowed,
          `Unexpected english token in zh-CN: ${key} -> ${chunk}`,
        ).toBe(true);
      }
    }
  });
});
