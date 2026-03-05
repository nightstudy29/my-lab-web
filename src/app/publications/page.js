"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaNewspaper, FaMagnifyingGlass } from "react-icons/fa6";
import papers from '../../data/papers.json';
import patents from '../../data/patents.json';

// ✅ JSON 데이터에서 연도 자동 추출 (코드 수정 없이 자동 반영)
const getYearsFromData = (data) =>
  [...new Set(data.map(item => String(item.year)))]
    .sort((a, b) => b - a);

// ✅ 논문 아이템
function PaperItem({ item }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ paddingBottom: '8px' }}>
      <Link href={item.url || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <h3
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            fontSize: 'clamp(1.1rem, 4vw, 1.2rem)',
            color: hovered ? '#004094' : '#222',
            fontWeight: '700', marginBottom: '8px', lineHeight: '1.4',
            cursor: 'pointer', transition: 'color 0.2s', wordBreak: 'break-word'
          }}
          dangerouslySetInnerHTML={{ __html: item.title }}
        />
      </Link>
      {item.authors && (
        <div
          style={{ fontSize: '0.95rem', color: '#555', marginBottom: '6px', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: item.authors.replace(/\s*[‐–-]\s*/g, '-') }}
        />
      )}
      {item.conference && (
        <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '10px' }}>
          <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#004094' }}>{item.conference}</span>
        </div>
      )}
      {item.news && item.news.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {item.news.slice(0, 6).map((newsItem, index) => (
            <a key={index} href={newsItem.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', backgroundColor: '#f0f7ff',
                border: '1px solid #cce0ff', borderRadius: '15px',
                textDecoration: 'none', color: '#004094', fontSize: '0.75rem', fontWeight: 'bold'
              }}
            >
              <FaNewspaper size={11} /> {newsItem.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ 특허 아이템
function PatentItem({ item }) {
  const [hovered, setHovered] = useState(false);
  const isRegistered = item.type === 'Registered';
  const borderColor = isRegistered ? '#27ae60' : '#e67e22';
  return (
    <div style={{
      padding: '15px 20px', borderLeft: `4px solid ${borderColor}`,
      backgroundColor: '#fafafa', borderRadius: '0 8px 8px 0',
      borderTop: '1px solid #eee', borderBottom: '1px solid #eee', borderRight: '1px solid #eee'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '5px' }}>
        <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.1rem)', fontWeight: '700', margin: 0, lineHeight: '1.3', flex: 1, wordBreak: 'break-word' }}>
          {item.url && item.url !== '#' ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
              style={{ color: hovered ? '#004094' : '#333', textDecoration: 'none', transition: 'color 0.2s' }}>
              {item.title}
            </a>
          ) : <span style={{ color: '#333' }}>{item.title}</span>}
        </h3>
        <span style={{
          fontSize: '0.7rem', fontWeight: 'bold', color: borderColor,
          border: `1px solid ${borderColor}`, padding: '2px 6px', borderRadius: '4px',
          whiteSpace: 'nowrap', alignSelf: 'center'
        }}>{item.type}</span>
      </div>
      {item.koreanTitle && <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>{item.koreanTitle}</div>}
      <div style={{ fontSize: '0.95rem', color: '#444', marginBottom: '10px' }}>
        <span style={{ fontWeight: '600', marginRight: '5px' }}>Inv.</span>{item.inventors}
      </div>
      <div style={{
        backgroundColor: '#eee', padding: '6px 12px', borderRadius: '4px',
        fontSize: '0.85rem', color: '#555', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center'
      }}>
        <span><strong>App:</strong> {item.applicationNumber} ({item.applicationDate})</span>
        {isRegistered && (
          <><span style={{ color: '#ccc' }}>|</span>
          <span style={{ color: '#006400' }}><strong>Reg:</strong> {item.registrationNumber} ({item.registrationDate})</span></>
        )}
      </div>
    </div>
  );
}

// ✅ 메인 페이지
export default function PublicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("papers");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeYear, setActiveYear] = useState(String(new Date().getFullYear()));

  const currentData = activeTab === 'papers' ? papers : patents;

  const groupedData = useMemo(() => {
    const filtered = currentData.filter((item) => {
      const query = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        (item.authors && item.authors.toLowerCase().includes(query)) ||
        (item.inventors && item.inventors.toLowerCase().includes(query)) ||
        (item.conference && item.conference.toLowerCase().includes(query)) ||
        (item.number && item.number.toLowerCase().includes(query)) ||
        String(item.year).includes(query)
      );
    });
    const groups = filtered.reduce((acc, item) => {
      if (!acc[item.year]) acc[item.year] = [];
      acc[item.year].push(item);
      return acc;
    }, {});
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);
    return { groups, sortedYears, totalCount: filtered.length };
  }, [currentData, searchTerm]);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      let current = groupedData.sortedYears[0];
      for (const year of [...groupedData.sortedYears].reverse()) {
        const el = document.getElementById(`pub-year-${year}`);
        if (el && el.offsetTop <= scrollPos) { current = year; break; }
      }
      if (current) setActiveYear(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupedData.sortedYears]);

  const scrollToYear = (year) => {
    const el = document.getElementById(`pub-year-${year}`);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setActiveYear(String(new Date().getFullYear()));
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative' }}>

      {/* ===== 메인 콘텐츠 ===== */}
      <div style={{ padding: '60px 20px', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: '50px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', color: '#333', marginBottom: '20px', fontWeight: '800' }}>
            Publications
          </h1>
          <div style={{ display: 'flex', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
            {['papers', 'patents'].map((tab) => (
              <button key={tab} onClick={() => handleTabChange(tab)} style={{
                padding: '10px 15px', fontSize: '1.1rem', fontWeight: 'bold',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '4px solid #004094' : '4px solid transparent',
                color: activeTab === tab ? '#004094' : '#888',
                cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-2px'
              }}>
                {tab === 'papers' ? 'Journal Papers' : 'Patents'}
              </button>
            ))}
          </div>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '20px' }}>
            Total {activeTab === 'papers' ? 'Papers' : 'Patents'}: <strong>{currentData.length}</strong>
            {searchTerm && ` (Found: ${groupedData.totalCount})`}
          </p>
          <div style={{ position: 'relative', maxWidth: '500px', display: 'flex', alignItems: 'center' }}>
            <FaMagnifyingGlass style={{ position: 'absolute', left: '15px', color: '#888', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={activeTab === 'papers' ? "Search papers..." : "Search patents..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%', padding: '12px 15px 12px 45px', fontSize: '1rem',
                border: `2px solid ${searchFocused ? '#004094' : '#e0e0e0'}`,
                borderRadius: '30px', outline: 'none', transition: 'border-color 0.2s'
              }}
            />
          </div>
        </div>

        {/* 리스트 */}
        {groupedData.sortedYears.length > 0 ? (
          groupedData.sortedYears.map((year) => (
            <div key={year} id={`pub-year-${year}`} style={{ marginBottom: '60px' }}>
              <div style={{
                position: 'sticky', top: '0', zIndex: 10, backgroundColor: '#fff',
                padding: '20px 0', borderBottom: '2px solid #eee', marginBottom: '30px',
                display: 'flex', alignItems: 'baseline', gap: '12px'
              }}>
                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#004094', margin: 0, fontWeight: '800' }}>
                  {year}
                </h2>
                <span style={{ color: '#888', fontWeight: '500', fontSize: '1.1rem' }}>
                  ({groupedData.groups[year].length})
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {groupedData.groups[year].map((item) => (
                  <li key={item.id} style={{ marginBottom: '40px' }}>
                    {activeTab === 'papers' ? <PaperItem item={item} /> : <PatentItem item={item} />}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div style={{ padding: '50px 0', textAlign: 'center', color: '#888', fontSize: '1.2rem' }}>
            No {activeTab} found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      {/* ===== 연도 네비게이션 (News와 동일 스타일) ===== */}
      <div style={{
        width: '120px',
        minWidth: '120px',
        flexShrink: 0,
      }}>
        <div style={{ position: 'sticky', top: '120px', marginTop: '10px' }}>
          <div style={{ position: 'relative', paddingLeft: '20px' }}>

            {/* 세로선 */}
            <div style={{
              position: 'absolute', left: '26px', top: '10px', bottom: '10px',
              width: '2px', backgroundColor: '#e9ecef', zIndex: 0,
            }} />

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', zIndex: 1 }}>
              {/* ✅ JSON에 있는 연도만 표시 - 자동 반영 */}
              {getYearsFromData(currentData).map((year) => {
                const hasData = !!groupedData.groups[year];
                const isActive = activeYear === year;
                return (
                  <li key={year} style={{ display: 'flex', alignItems: 'center', cursor: hasData ? 'pointer' : 'default' }}>
                    <button
                      onClick={() => hasData && scrollToYear(year)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '15px',
                        background: 'none', border: 'none', padding: 0,
                        cursor: hasData ? 'pointer' : 'default', textDecoration: 'none',
                      }}
                    >
                      {/* 도트 */}
                      <div style={{
                        width: isActive ? '14px' : '10px',
                        height: isActive ? '14px' : '10px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#004094' : '#fff',
                        border: `2px solid ${isActive ? '#004094' : '#ced4da'}`,
                        boxShadow: isActive ? '0 0 0 4px rgba(0,64,148,0.1)' : 'none',
                        transform: isActive ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        flexShrink: 0,
                      }} />
                      {/* 연도 텍스트 */}
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: isActive ? '800' : '500',
                        color: isActive ? '#004094' : '#adb5bd',
                        transform: isActive ? 'translateX(5px)' : 'translateX(0)',
                        display: 'inline-block',
                        transition: 'all 0.3s ease',
                      }}>
                        {year}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 모바일에서 네비 숨김 */}
      <style jsx>{`
        @media (max-width: 1080px) {
          div[style*="min-width: 120px"] {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}