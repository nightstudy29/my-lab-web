"use client";

// 포털 Directory — 로그인한 멤버가 보는 연락처 포함 명단. (/api/members)

import { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa";
import { SiGoogle, SiLinkedin, SiOrcid, SiKakaotalk } from "react-icons/si";
import { POSITION_LABELS_KO } from "@/lib/memberConstants";

export default function MemberDirectory({ mobile }) {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  // 로딩 표시는 status 를 바꾸는 버튼 핸들러에서 켜고, 여기서는 결과만 반영
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/members?status=${status}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setMembers(d.members || []); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [status]);

  const Links = ({ m }) => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: mobile ? "flex-start" : "center" }}>
      {m.links.cv && <a href={m.links.cv} target="_blank" rel="noopener noreferrer" style={iconBtnStyle("#d32f2f")} title="CV"><FaIcons.FaFilePdf /></a>}
      {m.links.scholar && <a href={m.links.scholar} target="_blank" rel="noopener noreferrer" style={iconBtnStyle("#4285F4")} title="Scholar"><SiGoogle /></a>}
      {m.links.linkedin && <a href={m.links.linkedin} target="_blank" rel="noopener noreferrer" style={iconBtnStyle("#0077B5")} title="LinkedIn"><SiLinkedin /></a>}
      {m.links.orcid && <a href={m.links.orcid} target="_blank" rel="noopener noreferrer" style={iconBtnStyle("#A6CE39")} title="ORCID"><SiOrcid /></a>}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ color: "#333", margin: 0 }}>📇 Member Directory</h2>
        <div style={{ display: "flex", gap: "6px" }}>
          {[["active", "Active"], ["graduated", "Graduated"], ["all", "All"]].map(([k, label]) => (
            <button key={k} onClick={() => { if (k !== status) { setIsLoading(true); setStatus(k); } }} style={{ padding: "6px 12px", borderRadius: "20px", border: "1px solid #ddd", background: status === k ? "#004094" : "#fff", color: status === k ? "#fff" : "#555", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>데이터를 불러오는 중입니다...</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>표시할 멤버가 없습니다.</div>
      ) : mobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {members.map((m) => (
            <div key={m.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "1rem", color: "#333" }}>{m.nameKor}</strong>
                  {m.nameEng && <span style={{ color: "#888", fontSize: "0.85rem", marginLeft: "5px" }}>({m.nameEng})</span>}
                </div>
                {m.yearJoined && <span style={yearBadge}>{m.yearJoined}</span>}
              </div>
              <div style={{ display: "flex", gap: "5px", marginBottom: "8px", flexWrap: "wrap" }}>
                <span style={getStatusStyle(m.status)}>{m.status === "active" ? "Active" : `Graduated${m.yearLeft ? ` ${m.yearLeft}` : ""}`}</span>
                <span style={positionStyle}>{POSITION_LABELS_KO[m.position] || m.position}</span>
                <span style={getDegreeStyle(m.degree)}>{m.degree}</span>
              </div>
              {m.currentPosition && <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: "6px" }}>{m.currentPosition}</div>}
              <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: "8px" }}>
                {m.email && <div style={{ marginBottom: "3px" }}>✉️ {m.email}</div>}
                {m.phone && <div style={{ marginBottom: "3px" }}>📞 {m.phone}</div>}
                {m.kakaoId && <div>💬 {m.kakaoId}</div>}
              </div>
              <Links m={m} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderRadius: "12px", border: "1px solid #eee" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th style={th}>Member</th>
                <th style={th}>Contact</th>
                <th style={{ ...th, textAlign: "center" }}>Links</th>
                <th style={{ ...th, textAlign: "center" }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <td style={td}>
                    <div style={{ marginBottom: "4px" }}>
                      <strong style={{ fontSize: "1.05rem", color: "#333" }}>{m.nameKor}</strong>
                      {m.nameEng && <span style={{ color: "#888", fontSize: "0.9rem", marginLeft: "5px" }}>({m.nameEng})</span>}
                      {m.yearJoined && <span style={{ ...yearBadge, marginLeft: "8px" }}>{m.yearJoined}</span>}
                    </div>
                    {m.currentPosition && <div style={{ fontSize: "0.88rem", color: "#555", marginBottom: "6px" }}>{m.currentPosition}</div>}
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      <span style={getStatusStyle(m.status)}>{m.status === "active" ? "Active" : `Graduated${m.yearLeft ? ` ${m.yearLeft}` : ""}`}</span>
                      <span style={positionStyle}>{POSITION_LABELS_KO[m.position] || m.position}</span>
                      <span style={getDegreeStyle(m.degree)}>{m.degree}</span>
                    </div>
                  </td>
                  <td style={{ ...td, fontSize: "0.9rem" }}>
                    {m.email && <div style={contactRow}><FaIcons.FaEnvelope color="#adb5bd" /> {m.email}</div>}
                    {m.phone && <div style={contactRow}><FaIcons.FaPhoneAlt color="#adb5bd" /> {m.phone}</div>}
                    {m.kakaoId && <div style={contactRow}><SiKakaotalk color="#FEE500" /> {m.kakaoId}</div>}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}><Links m={m} /></td>
                  <td style={{ ...td, textAlign: "center", fontSize: "0.85rem", color: "#adb5bd" }}>
                    {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { padding: "15px", color: "#555" };
const td = { padding: "15px", verticalAlign: "top" };
const contactRow = { display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", color: "#495057" };
const yearBadge = { fontSize: "0.8rem", color: "#004094", fontWeight: "bold", background: "#e7f5ff", padding: "2px 6px", borderRadius: "4px" };
const positionStyle = { fontSize: "0.75rem", padding: "3px 8px", background: "#eef2f7", color: "#3c4a5c", borderRadius: "4px", fontWeight: "bold" };
const iconBtnStyle = (bg) => ({ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: bg, color: "#fff", borderRadius: "6px", fontSize: "1rem", textDecoration: "none" });

const getStatusStyle = (status) => {
  const active = status === "active";
  return { fontSize: "0.75rem", padding: "3px 8px", background: active ? "#e6f4ea" : "#fce8e6", color: active ? "#137333" : "#c5221f", borderRadius: "4px", fontWeight: "bold" };
};
const getDegreeStyle = (degree) => {
  let bg = "#e8eaed", col = "#3c4043";
  const d = (degree || "").toUpperCase();
  if (d === "PHD") { bg = "#188038"; col = "#fff"; }
  else if (d === "MS") { bg = "#c5221f"; col = "#fff"; }
  else if (d === "BS") { bg = "#1967d2"; col = "#fff"; }
  else if (d === "POSTDOC") { bg = "#ea8600"; col = "#fff"; }
  else if (d === "VISITOR") { bg = "#8e24aa"; col = "#fff"; }
  else if (d === "INTERN") { bg = "#5f6368"; col = "#fff"; }
  return { fontSize: "0.75rem", padding: "3px 8px", background: bg, color: col, borderRadius: "4px", fontWeight: "bold" };
};
