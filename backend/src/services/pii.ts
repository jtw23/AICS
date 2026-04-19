const PII_RULES: { pattern: RegExp; label: string }[] = [
  // 주민등록번호
  { pattern: /\d{6}-[1-4]\d{6}/g, label: '[주민등록번호]' },
  // 카드번호 (16자리 숫자, 구분자 포함)
  { pattern: /\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/g, label: '[카드번호]' },
  // 전화번호 (010, 02, 070 등)
  {
    pattern: /(?:010|011|016|017|018|019|02|0[3-9]\d)[- ]?\d{3,4}[- ]?\d{4}/g,
    label: '[전화번호]',
  },
  // 이메일
  { pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, label: '[이메일]' },
  // 계좌번호 (은행 계좌 형태)
  { pattern: /\d{3,6}-\d{2,6}-\d{4,8}(-\d{1,3})?/g, label: '[계좌번호]' },
  // 여권번호 (M12345678 형태)
  { pattern: /[A-Z][A-Z0-9]\d{7}/g, label: '[여권번호]' },
];

export function maskPii(text: string): string {
  let result = text;
  for (const rule of PII_RULES) {
    result = result.replace(rule.pattern, rule.label);
  }
  return result;
}
