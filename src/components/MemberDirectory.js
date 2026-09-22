"use client";

// 포털 Directory — 로그인한 멤버가 보는 연락처 포함 명단 (컴팩트). (/api/members)

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

  const Avatar = ({ m, size = 36 }) => m.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- R2/로컬 썸네일
    <img src={m.photoUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#f1f3f5" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#eef1f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#adb5bd", flexShrink: 0 }}><FaIcons.FaUser size={size * 0.4} /></div>
  );

  const Links = ({ m }) => (
    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
      {m.links.cv && <a href={m.links.cv} target="_blank" rel="noopener noreferrer" style={iconBtn("#d32f2f")} title="CV"><FaIcons.FaFilePdf /></a>}
      {m.links.scholar && <a href={m.links.scholar} target="_blank" rel="noopener noreferrer" style={iconBtn("#4285F4")} title="Scholar"><SiGoogle /></a>}
      {m.links.linkedin && <a href={m.links.linkedin} target="_blank" rel="noopener noreferrer" style={iconBtn("#0077B5")} title="LinkedIn"><SiLinkedin /></a>}
      {m.links.orcid && <a href={m.links.orcid} target="_blank" rel="noopener noreferrer" style={iconBtn("#A6CE39")} title="ORCID"><SiOrcid /></a>}
    </div>
  );

  const Badges = ({ m }) => (
    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      <span style={badge("#eef2f7", "#3c4a5c")}>{POSITION_LABELS_KO[m.position] || m.position}</span>
      <span style={badge(...degreeColor(m.degree))}>{m.degree}</span>
      {m.status === "graduated" && <span style={badge("#fce8e6", "#c5221f")}>Graduated{m.yearLeft ? ` ${m.yearLeft}` : ""}</span>}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ color: "#333", margin: 0 }}>📇 Member Directory <span style={{ fontSize: "0.9rem", color: "#999", fontWeight: "normal" }}>{!isLoading && `${members.length}명`}</span></h2>
        <div style={{ display: "flex", gap: "4px", background: "#f1f3f5", padding: "3px", borderRadius: "20px" }}>
          {[["active", "Active"], ["graduated", "Graduated"], ["all", "All"]].map(([k, label]) => (
            <button key={k} onClick={() => { if (k !== status) { setIsLoading(true); setStatus(k); } }}
              style={{ padding: "5px 12px", borderRadius: "16px", border: "none", background: status === k ? "#fff" : "transparent", color: status === k ? "#004094" : "#777", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", boxShadow: status === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>불러오는 중...</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>표시할 멤버가 없습니다.</div>
      ) : mobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {members.map((m) => (
            <div key={m.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: "10px", padding: "10px 12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Avatar m={m} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "0.95rem", color: "#333" }}>{m.nameKor}</strong>
                  {m.nameEng && <span style={{ color: "#888", fontSize: "0.78rem" }}>{m.nameEng}</span>}
                  {m.yearJoined && <span style={{ ...badge("#e7f5ff", "#004094"), marginLeft: "auto" }}>{m.yearJoined}</span>}
                </div>
                <div style={{ marginTop: "4px" }}><Badges m={m} /></div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {m.email && <span>✉️ {m.email}</span>}
                  {m.phone && <span>📞 {m.phone}</span>}
                  {m.kakaoId && <span>💬 {m.kakaoId}</span>}
                  {m.currentPosition && <span style={{ color: "#004094" }}>{m.currentPosition}</span>}
                </div>
                <div style={{ marginTop: "6px" }}><Links m={m} /></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e9ecef" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: "0.84rem" }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr style={{ textAlign: "left", color: "#666", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                <th style={th}>Member</th>
                <th style={th}>Contact</th>
                <th style={th}>Links</th>
                <th style={{ ...th, textAlign: "right" }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderTop: "1px solid #f1f3f5" }}>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <Avatar m={m} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#222" }}>{m.nameKor}</strong>
                          {m.nameEng && <span style={{ color: "#888", fontSize: "0.78rem" }}>{m.nameEng}</span>}
                          {m.yearJoined && <span style={badge("#e7f5ff", "#004094")}>{m.yearJoined}</span>}
                        </div>
                        <div style={{ marginTop: "3px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <Badges m={m} />
                          {m.currentPosition && <span style={{ fontSize: "0.76rem", color: "#004094" }}>{m.currentPosition}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, color: "#495057", whiteSpace: "nowrap" }}>
                    {m.email && <div style={row}><FaIcons.FaEnvelope color="#adb5bd" size={11} /> {m.email}</div>}
                    {m.phone && <div style={row}><FaIcons.FaPhoneAlt color="#adb5bd" size={11} /> {m.phone}</div>}
                    {m.kakaoId && <div style={row}><SiKakaotalk color="#e6c800" size={11} /> {m.kakaoId}</div>}
                  </td>
                  <td style={td}><Links m={m} /></td>
                  <td style={{ ...td, textAlign: "right", fontSize: "0.75rem", color: "#adb5bd", whiteSpace: "nowrap" }}>
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

const th = { padding: "9px 12px", fontWeight: "600" };
const td = { padding: "9px 12px", verticalAlign: "middle" };
const row = { display: "flex", alignItems: "center", gap: "6px", lineHeight: 1.7 };
const badge = (bg, col) => ({ fontSize: "0.68rem", padding: "1px 6px", background: bg, color: col, borderRadius: "4px", fontWeight: "bold", whiteSpace: "nowrap" });
const iconBtn = (bg) => ({ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", background: bg, color: "#fff", borderRadius: "5px", fontSize: "0.75rem", textDecoration: "none" });

function degreeColor(degree) {
  switch ((degree || "").toUpperCase()) {
    case "PHD": return ["#e6f4ea", "#137333"];
    case "MS": return ["#fce8e6", "#c5221f"];
    case "BS": return ["#e8f0fe", "#1967d2"];
    case "POSTDOC": return ["#fff4e5", "#b26a00"];
    case "VISITOR": return ["#f3e8fd", "#8e24aa"];
    case "INTERN": return ["#f1f3f4", "#5f6368"];
    default: return ["#f1f3f4", "#5f6368"];
  }
}
