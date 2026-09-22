"use client";

// 논문 업적 정보 입력 필드 묶음 — 논문 관리 패널(접이식)과 업적 탭 패널에서 공용.
//   <PaperAchievementFields form={form} onChange={(k, v) => ...} />
// form 은 ACH_FIELDS 키를 가진 객체 (값은 문자열/숫자/null)

import { Input, Select, Textarea, Field, FormGrid, span2 } from "./ui";
import { PUB_TYPES, ROLES, QUARTILES, ACH_LABELS } from "@/lib/achievementConstants";

export function emptyAchievement() {
  return { pub_type: "", institution: "", submitted_on: "", published_on: "", volume_pages: "", issn: "", eissn: "", author_count: "", role: "", funding: "", if_submit: "", jcr_submit: "", quartile_submit: "", if_publish: "", jcr_publish: "", quartile_publish: "", notes: "" };
}
export function achievementFromPaper(p) {
  const f = emptyAchievement();
  for (const k of Object.keys(f)) f[k] = p?.[k] ?? "";
  return f;
}

export default function PaperAchievementFields({ form, onChange }) {
  const T = (k, extra = {}) => (
    <Field label={ACH_LABELS[k]}><Input value={form[k] ?? ""} onChange={(e) => onChange(k, e.target.value)} {...extra} /></Field>
  );
  return (
    <FormGrid cols={3}>
      <Field label={ACH_LABELS.pub_type}>
        <Select value={form.pub_type ?? ""} onChange={(e) => onChange("pub_type", e.target.value)}>
          <option value="">-</option>{PUB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label={ACH_LABELS.role}>
        <Select value={form.role ?? ""} onChange={(e) => onChange("role", e.target.value)}>
          <option value="">-</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
      </Field>
      {T("institution", { placeholder: "SNU / MIT …" })}
      {T("submitted_on", { type: "date" })}
      {T("published_on", { type: "date" })}
      {T("author_count", { type: "number", min: 1 })}
      {T("volume_pages", { placeholder: "28/31/6562" })}
      {T("issn", { placeholder: "0935-9648" })}
      {T("eissn", { placeholder: "1521-4095" })}
      {T("if_submit", { type: "number", step: "0.001" })}
      {T("jcr_submit", { placeholder: "2/146 (98.97%)" })}
      <Field label={ACH_LABELS.quartile_submit}>
        <Select value={form.quartile_submit ?? ""} onChange={(e) => onChange("quartile_submit", e.target.value)}>
          <option value="">-</option>{QUARTILES.map((q) => <option key={q} value={q}>{q}</option>)}
        </Select>
      </Field>
      {T("if_publish", { type: "number", step: "0.001" })}
      {T("jcr_publish", { placeholder: "2/146 (98.97%)" })}
      <Field label={ACH_LABELS.quartile_publish}>
        <Select value={form.quartile_publish ?? ""} onChange={(e) => onChange("quartile_publish", e.target.value)}>
          <option value="">-</option>{QUARTILES.map((q) => <option key={q} value={q}>{q}</option>)}
        </Select>
      </Field>
      <Field label={ACH_LABELS.funding} hint="사사 표기 (없으면 비움)" className={span2}><Input value={form.funding ?? ""} onChange={(e) => onChange("funding", e.target.value)} /></Field>
      <Field label={ACH_LABELS.notes}><Textarea rows={1} value={form.notes ?? ""} onChange={(e) => onChange("notes", e.target.value)} /></Field>
    </FormGrid>
  );
}
