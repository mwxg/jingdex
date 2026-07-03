import OpenCC from "opencc-js";
import { pinyin } from "pinyin-pro";
import { pinyinToZhuyin } from "pinyin-zhuyin";

const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });
const toTraditionalTw = OpenCC.Converter({ from: "cn", to: "tw" });

function normalizeTextPart(value: string) {
  return value.trim().normalize("NFC");
}

export function getCanonicalSimplified(value: string) {
  return normalizeTextPart(toSimplified(value));
}

export function getGeneratedTermForms(value: string) {
  const canonicalSimplified = getCanonicalSimplified(value);
  const generatedPinyin = normalizeTextPart(
    pinyin(canonicalSimplified, { toneType: "symbol" }),
  );

  return {
    canonicalSimplified,
    simplified: canonicalSimplified,
    traditional: normalizeTextPart(toTraditionalTw(canonicalSimplified)),
    pinyin: generatedPinyin,
    zhuyin: normalizeTextPart(pinyinToZhuyin(generatedPinyin)),
  };
}
