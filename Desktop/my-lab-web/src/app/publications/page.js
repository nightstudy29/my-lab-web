"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { FaNewspaper, FaMagnifyingGlass, FaLightbulb } from "react-icons/fa6"; 
import papers from '../../data/papers.json';
import patents from '../../data/patents.json';

export default function PublicationsPage() {
  const [searchTerm, setSearchTerm] = useState(""); 
  const [activeTab, setActiveTab] = useState("papers");

  const currentData = activeTab === 'papers' ? papers : patents;

  if (!currentData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No data found.</div>;
  }

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
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '1000px',   
      width: '100%',        
      margin: '0 auto',      
      boxSizing: 'border-box' 
    }}>

      {/* 1. 페이지 헤더 + 탭 + 검색창 */}
      <div style={{ marginBottom: '50px' }}>
        {/* [수정 1] Research Output -> Publications 로 변경 */}
        <h1 style={{ 
          fontSize: 'clamp(2rem, 5vw, 2.5rem)', 
          color: '#333', 
          marginBottom: '20px' 
        }}>
          Publications
        </h1>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
          <button 
            onClick={() => { setActiveTab('papers'); setSearchTerm(''); }}
            style={{
              padding: '10px 15px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'papers' ? '4px solid #004094' : '4px solid transparent',
              color: activeTab === 'papers' ? '#004094' : '#888',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Journal Papers
          </button>
          <button 
            onClick={() => { setActiveTab('patents'); setSearchTerm(''); }}
            style={{
              padding: '10px 15px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'patents' ? '4px solid #004094' : '4px solid transparent',
              color: activeTab === 'patents' ? '#004094' : '#888',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Patents
          </button>
        </div>

        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '20px' }}>
          Total {activeTab === 'papers' ? 'Papers' : 'Patents'}: <strong>{currentData.length}</strong> 
          {searchTerm && ` (Found: ${groupedData.totalCount})`}
        </p>

        <div style={{ 
          position: 'relative', 
          maxWidth: '500px',
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <FaMagnifyingGlass style={{ position: 'absolute', left: '15px', color: '#888' }} />
          <input 
            type="text" 
            placeholder={activeTab === 'papers' ? "Search papers..." : "Search patents..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px 12px 45px',
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '30px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#004094'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>
      </div>

      {/* 2. 리스트 출력 */}
      {groupedData.sortedYears.length > 0 ? (
        groupedData.sortedYears.map((year) => (
          <div key={year} style={{ marginBottom: '60px' }}>

            {/* [수정 2] 연도와 카운트 같은 줄에 표시 (Flexbox & baseline 정렬) */}
            <div style={{ 
              position: 'sticky', 
              top: '0',
              zIndex: 10,
              backgroundColor: '#fff', // 스크롤 시 겹침 방지용 배경색
              padding: '20px 0',
              borderBottom: '2px solid #eee',
              marginBottom: '30px',
              display: 'flex',         // Flexbox 사용
              alignItems: 'baseline',  // 텍스트 베이스라인 정렬
              gap: '12px'              // 연도와 숫자 사이 간격
            }}>
              <h2 style={{ 
                fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                color: '#004094', 
                margin: 0 
              }}>
                {year}
              </h2>
              <span style={{ 
                color: '#888', 
                fontWeight: '500', 
                fontSize: '1.1rem' 
              }}>
                ({groupedData.groups[year].length})
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {groupedData.groups[year].map((item) => (
                <li key={item.id} style={{ marginBottom: '40px' }}>
                  
                  {/* [CASE 1] 논문(Papers) UI */}
                  {activeTab === 'papers' && (
                    <>
                      <Link href={item.url || "#"} target="_blank" style={{ textDecoration: 'none' }}>
                        <h3 
                          style={{ 
                            fontSize: 'clamp(1.1rem, 4vw, 1.2rem)', 
                            color: '#222', 
                            fontWeight: '700', 
                            marginBottom: '8px', 
                            lineHeight: '1.4', 
                            cursor: 'pointer', 
                            transition: 'color 0.2s',
                            wordBreak: 'break-word'
                          }}
                          onMouseOver={(e) => e.target.style.color = '#004094'}
                          onMouseOut={(e) => e.target.style.color = '#222'}
                          dangerouslySetInnerHTML={{ __html: item.title }} 
                        />
                      </Link>

                      <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '6px', lineHeight: '1.6' }}
                           dangerouslySetInnerHTML={{ __html: item.authors ? item.authors.replace(/\s*[‐–-]\s*/g, '-') : "" }} />

                      <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '10px' }}>
                        <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#004094' }}>{item.conference}</span>
                      </div>

                      {item.news && item.news.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                          {item.news.slice(0, 6).map((newsItem, index) => (
                            <a key={index} href={newsItem.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', backgroundColor: '#f0f7ff', border: '1px solid #cce0ff', borderRadius: '15px', textDecoration: 'none', color: '#004094', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              <FaNewspaper /> {newsItem.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* [CASE 2] 특허(Patents) UI */}
                  {activeTab === 'patents' && (
                    <div style={{ 
                      padding: '15px 20px',
                      borderLeft: `4px solid ${item.type === 'Registered' ? '#27ae60' : '#e67e22'}`, 
                      backgroundColor: '#fafafa',
                      borderRadius: '0 8px 8px 0',
                      borderTop: '1px solid #eee',
                      borderBottom: '1px solid #eee',
                      borderRight: '1px solid #eee'
                    }}>

                      {/* 1. 제목 + 배지 */}
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
                            <a href={item.url} target="_blank" rel="noopener noreferrer" 
                               style={{ color: '#333', textDecoration: 'none' }}
                               onMouseOver={(e) => e.target.style.color = '#004094'}
                               onMouseOut={(e) => e.target.style.color = '#333'}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <span style={{ color: '#333' }}>{item.title}</span>
                          )}
                        </h3>
                        
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold', 
                          color: item.type === 'Registered' ? '#27ae60' : '#e67e22',
                          border: `1px solid ${item.type === 'Registered' ? '#27ae60' : '#e67e22'}`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          alignSelf: 'center'
                        }}>
                          {item.type}
                        </span>
                      </div>

                      {/* 2. 한글 제목 */}
                      {item.koreanTitle && (
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                          {item.koreanTitle}
                        </div>
                      )}
                      
                      {/* 3. 발명자 */}
                      <div style={{ fontSize: '0.95rem', color: '#444', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '600', marginRight: '5px' }}>Inv.</span> 
                        {item.inventors}
                      </div>
                      
                      {/* 4. 상세 정보 */}
                      <div style={{ 
                        backgroundColor: '#eee', 
                        padding: '6px 12px', 
                        borderRadius: '4px', 
                        fontSize: '0.85rem', 
                        color: '#555',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '15px',
                        alignItems: 'center'
                      }}>
                        <span style={{ display: 'flex', gap: '5px' }}>
                          <strong>App:</strong> {item.applicationNumber} ({item.applicationDate})
                        </span>

                        {item.type === 'Registered' && (
                          <>
                            <span style={{ color: '#ccc' }}>|</span>
                            <span style={{ display: 'flex', gap: '5px', color: '#006400' }}>
                              <strong>Reg:</strong> {item.registrationNumber} ({item.registrationDate})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div style={{ padding: '50px 0', textAlign: 'center', color: '#888', fontSize: '1.2rem' }}>
          No {activeTab} found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}