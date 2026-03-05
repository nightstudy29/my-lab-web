"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { FaNewspaper, FaMagnifyingGlass, FaLightbulb } from "react-icons/fa6";
import papers from '../../data/papers.json';
import patents from '../../data/patents.json';

// ✅ 논문 아이템 컴포넌트 분리
function PaperItem({ item }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ paddingBottom: '8px' }}>

      {/* 제목 */}
      <Link href={item.url || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <h3
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            fontSize: 'clamp(1.1rem, 4vw, 1.2rem)',
            color: hovered ? '#004094' : '#222',
            fontWeight: '700',
            marginBottom: '8px',
            lineHeight: '1.4',
            cursor: 'pointer',
            transition: 'color 0.2s',
            wordBreak: 'break-word'
          }}
          dangerouslySetInnerHTML={{ __html: item.title }}
        />
      </Link>

      {/* 저자 */}
      {item.authors && (
        <div
          style={{ fontSize: '0.95rem', color: '#555', marginBottom: '6px', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: item.authors.replace(/\s*[‐–-]\s*/g, '-') }}
        />
      )}

      {/* 저널명 */}
      {item.conference && (
        <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '10px' }}>
          <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#004094' }}>{item.conference}</span>
        </div>
      )}

      {/* 뉴스 배지 */}
      {item.news && item.news.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {item.news.slice(0, 6).map((newsItem, index) => (
            <a
              key={index}
              href={newsItem.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px',
                backgroundColor: '#f0f7ff',
                border: '1px solid #cce0ff',
                borderRadius: '15px',
                textDecoration: 'none',
                color: '#004094',
                fontSize: '0.75rem',
                fontWeight: 'bold'
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

// ✅ 특허 아이템 컴포넌트 분리
function PatentItem({ item }) {
  const [hovered, setHovered] = useState(false);
  const isRegistered = item.type === 'Registered';
  const borderColor = isRegistered ? '#27ae60' : '#e67e22';

  return (
    <div style={{
      padding: '15px 20px',
      borderLeft: `4px solid ${borderColor}`,
      backgroundColor: '#fafafa',
      borderRadius: '0 8px 8px 0',
      borderTop: '1px solid #eee',
      borderBottom: '1px solid #eee',
      borderRight: '1px solid #eee'
    }}>

      {/* 제목 + 배지 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '5px' }}>
        <h3 style={{
          fontSize: 'clamp(1rem, 4vw, 1.1rem)',
          fontWeight: '700',
          margin: 0,
          lineHeight: '1.3',
          flex: 1,
          wordBreak: 'break-word'
        }}>
          {item.url && item.url !== '#' ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{ color: hovered ? '#004094' : '#333', textDecoration: 'none', transition: 'color 0.2s' }}
            >
              {item.title}
            </a>
          ) : (
            <span style={{ color: '#333' }}>{item.title}</span>
          )}
        </h3>
        <span style={{
          fontSize: '0.7rem', fontWeight: 'bold',
          color: borderColor, border: `1px solid ${borderColor}`,
          padding: '2px 6px', borderRadius: '4px',
          whiteSpace: 'nowrap', alignSelf: 'center'
        }}>
          {item.type}
        </span>
      </div>

      {/* 한글 제목 */}
      {item.koreanTitle && (
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>{item.koreanTitle}</div>
      )}

      {/* 발명자 */}
      <div style={{ fontSize: '0.95rem', color: '#444', marginBottom: '10px' }}>
        <span style={{ fontWeight: '600', marginRight: '5px' }}>Inv.</span>
        {item.inventors}
      </div>

      {/* 상세 정보 */}
      <div style={{
        backgroundColor: '#eee', padding: '6px 12px', borderRadius: '4px',
        fontSize: '0.85rem', color: '#555',
        display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center'
      }}>
        <span><strong>App:</strong> {item.applicationNumber} ({item.applicationDate})</span>
        {isRegistered && (
          <>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ color: '#006400' }}>
              <strong>Reg:</strong> {item.registrationNumber} ({item.registrationDate})
            </span>
          </>
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
      const year = item.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(item);
      return acc;
    }, {});

    const sortedYears = Object.keys(groups).sort((a, b) => b - a);
    return { groups, sortedYears, totalCount: filtered.length };
  }, [currentData, searchTerm]);

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1000px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

      {/* ===== 헤더 ===== */}
      <div style={{ marginBottom: '50px' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', color: '#333', marginBottom: '20px', fontWeight: '800' }}>
          Publications
        </h1>

        {/* 탭 */}
        <div style={{ display: 'flex', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
          {['papers', 'patents'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
              style={{
                padding: '10px 15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '4px solid #004094' : '4px solid transparent',
                color: activeTab === tab ? '#004094' : '#888',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              {tab === 'papers' ? 'Journal Papers' : 'Patents'}
            </button>
          ))}
        </div>

        {/* 카운트 */}
        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '20px' }}>
          Total {activeTab === 'papers' ? 'Papers' : 'Patents'}: <strong>{currentData.length}</strong>
          {searchTerm && ` (Found: ${groupedData.totalCount})`}
        </p>

        {/* 검색창 */}
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
              width: '100%',
              padding: '12px 15px 12px 45px',
              fontSize: '1rem',
              border: `2px solid ${searchFocused ? '#004094' : '#e0e0e0'}`,
              borderRadius: '30px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </div>
      </div>

      {/* ===== 리스트 ===== */}
      {groupedData.sortedYears.length > 0 ? (
        groupedData.sortedYears.map((year) => (
          <div key={year} style={{ marginBottom: '60px' }}>

            {/* 연도 헤더 */}
            <div style={{
              position: 'sticky', top: '0', zIndex: 10,
              backgroundColor: '#fff',
              padding: '20px 0',
              borderBottom: '2px solid #eee',
              marginBottom: '30px',
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
                  {activeTab === 'papers'
                    ? <PaperItem item={item} />
                    : <PatentItem item={item} />
                  }
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
  );
}