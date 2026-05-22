import { describe, expect, it } from "vitest";
import { STROKE_DATA } from "../data/strokeData";
import { hourToChinese, numberToChinese, timeToPhrase } from "../time";

describe("numberToChinese", () => {
  it("renders 0..59 the way clock times are spoken", () => {
    expect(numberToChinese(0)).toBe("零");
    expect(numberToChinese(5)).toBe("五");
    expect(numberToChinese(10)).toBe("十");
    expect(numberToChinese(11)).toBe("十一");
    expect(numberToChinese(20)).toBe("二十");
    expect(numberToChinese(28)).toBe("二十八");
    expect(numberToChinese(59)).toBe("五十九");
  });

  it("uses 兩 for two o'clock", () => {
    expect(hourToChinese(2)).toBe("兩");
    expect(hourToChinese(12)).toBe("十二");
  });
});

describe("timeToPhrase", () => {
  const at = (h: number, m: number) => timeToPhrase(new Date(2026, 0, 1, h, m));

  it("composes period + hour + minute correctly", () => {
    expect(at(9, 28).text).toBe("上午九點二十八分");
    expect(at(12, 30).text).toBe("中午十二點半");
    expect(at(0, 0).text).toBe("午夜十二點整");
    expect(at(14, 45).text).toBe("下午兩點四十五分");
    expect(at(20, 5).text).toBe("晚上八點五分");
  });

  it("never references a glyph missing from the baked stroke data", () => {
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m++) {
        const { text } = at(h, m);
        for (const ch of text) {
          expect(STROKE_DATA[ch], `missing glyph ${ch} for ${h}:${m}`).toBeDefined();
        }
      }
    }
  });
});
