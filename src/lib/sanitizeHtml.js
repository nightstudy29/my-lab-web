// src/lib/sanitizeHtml.js
//
// 논문 제목/저자처럼 "아래첨자·굵게·밑줄 정도만" 허용하고 싶은 문자열을
// dangerouslySetInnerHTML에 넣기 전에 정리합니다.
// 허용 태그 외에는 전부 제거하고, 허용 태그도 속성은 모두 떼어냅니다
// (onerror=, href="javascript:" 같은 게 들어올 틈이 없도록).

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "sub", "sup", "br"]);

export function sanitizeHtml(html) {
  if (!html) return "";
  return String(html).replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = match.startsWith("</");
    if (tag === "br") return "<br>";
    return isClosing ? `</${tag}>` : `<${tag}>`;
  });
}
