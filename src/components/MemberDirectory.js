"use client";

// 포털 Directory — 로그인한 멤버가 보는 연락처 포함 명단 (컴팩트). (/api/members)

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaEnvelope, FaPhone, FaUser, FaFilePdf, FaLinkedin } from "react-icons/fa6";
import { SiGooglescholar, SiOrcid, SiKakaotalk } from "react-icons/si";
import { apiFetch } from "@/lib/apiClient";
import { POSITION_LABELS_KO } from "@/lib/memberConstants";
import { Card, Table, td, Badge, Empty, Segment, useToast } from "./ui";

const DEGREE_COLOR = { PhD: "green", MS: "red", BS: "blue", Postdoc: "orange", Visitor: "gray", Intern: "gray", TBD: "gray" };

export default function MemberDirectory({ mobile }) {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  // 로딩 표시는 status 를 바꾸는 세그먼트에서 켜고, 여기서는 결과만 반영
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/members?status=${status}`)
      .then((d) => { if (!cancelled) setMembers(d.members || []); })
      .catch((e) => { if (!cancelled) toast.error(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [status, toast]);

  const Avatar = ({ m, size = 36 }) => m.photoUrl ? (
    <Image src={m.photoUrl} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#f1f3f5" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#eef1f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#adb5bd", flexShrink: 0 }}><FaUser size={size * 0.4} /></div>
  );

  const Links = ({ m }) => (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {m.links.cv && <a href={m.links.cv} target="_blank" rel="noopener noreferrer" style={iconBtn("#d32f2f")} title="CV"><FaFilePdf /></a>}
      {m.links.scholar && <a href={m.links.scholar} target="_blank" rel="noopener noreferrer" style={iconBtn("#4285F4")} title="Scholar"><SiGooglescholar /></a>}
      {m.links.linkedin && <a href={m.links.linkedin} target="_blank" rel="noopener noreferrer" style={iconBtn("#0077B5")} title="LinkedIn"><FaLinkedin /></a>}
      {m.links.orcid && <a href={m.links.orcid} target="_blank" rel="noopener noreferrer" style={iconBtn("#A6CE39")} title="ORCID"><SiOrcid /></a>}
    </div>
  );

  const Badges = ({ m }) => (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      <Badge>{POSITION_LABELS_KO[m.position] || m.position}</Badge>
      <Badge color={DEGREE_COLOR[m.degree] || "gray"}>{m.degree}</Badge>
      {m.status === "graduated" && <Badge color="red">Graduated{m.yearLeft ? ` ${m.yearLeft}` : ""}</Badge>}
    </div>
  );

  const Name = ({ m }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
      <strong style={{ fontSize: "0.95rem", color: "#222" }}>{m.nameKor}</strong>
      {m.nameEng && <span style={{ color: "#8a94a0", fontSize: "0.78rem" }}>{m.nameEng}</span>}
      {m.yearJoined && <Badge color="blue">{m.yearJoined}</Badge>}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: "#333", margin: 0 }}>📇 Member Directory <span style={{ fontSize: "0.9rem", color: "#999", fontWeight: 400 }}>{!isLoading && `${members.length}명`}</span></h2>
        <Segment value={status} onChange={(v) => { if (v !== status) { setIsLoading(true); setStatus(v); } }} options={[["active", "Active"], ["graduated", "Graduated"], ["all", "All"]]} />
      </div>

      {isLoading ? <Card><Empty>불러오는 중...</Empty></Card> : members.length === 0 ? <Card><Empty>표시할 멤버가 없습니다.</Empty></Card> : mobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <Card key={m.id} style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Avatar m={m} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Name m={m} />
                <div style={{ marginTop: 4 }}><Badges m={m} /></div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                  {m.email && <span>✉️ {m.email}</span>}
                  {m.phone && <span>📞 {m.phone}</span>}
                  {m.kakaoId && <span>💬 {m.kakaoId}</span>}
                  {m.currentPosition && <span style={{ color: "#004094" }}>{m.currentPosition}</span>}
                </div>
                <div style={{ marginTop: 6 }}><Links m={m} /></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card tight>
          <Table>
            <thead><tr><th>Member</th><th>Contact</th><th>Links</th><th style={{ textAlign: "right" }}>Updated</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar m={m} />
                      <div style={{ minWidth: 0 }}>
                        <Name m={m} />
                        <div style={{ marginTop: 3, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <Badges m={m} />
                          {m.currentPosition && <span style={{ fontSize: "0.76rem", color: "#004094" }}>{m.currentPosition}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#495057", whiteSpace: "nowrap", fontSize: "0.84rem" }}>
                    {m.email && <div style={row}><FaEnvelope color="#adb5bd" size={11} /> {m.email}</div>}
                    {m.phone && <div style={row}><FaPhone color="#adb5bd" size={11} /> {m.phone}</div>}
                    {m.kakaoId && <div style={row}><SiKakaotalk color="#e6c800" size={11} /> {m.kakaoId}</div>}
                  </td>
                  <td><Links m={m} /></td>
                  <td className={td.muted} style={{ textAlign: "right" }}>{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}

const row = { display: "flex", alignItems: "center", gap: 6, lineHeight: 1.7 };
const iconBtn = (bg) => ({ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: bg, color: "#fff", borderRadius: 5, fontSize: "0.75rem", textDecoration: "none" });
