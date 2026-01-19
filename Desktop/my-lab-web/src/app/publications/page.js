"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
// 1. 아이콘 추가 (FaLightbulb: 특허 아이콘)
import { FaNewspaper, FaMagnifyingGlass, FaLightbulb } from "react-icons/fa6"; 
import papers from '../../data/papers.json';
import patents from '../../data/patents.json'; // 2. 특허 데이터 임포트

export default function PublicationsPage() {
  const [searchTerm, setSearchTerm] = useState(""); 
  const [activeTab, setActiveTab] = useState("papers"); // 3. 탭 상태 관리 ('papers' 또는 'patents')

  // 4. 현재 탭에 맞는 데이터 선택
  const currentData = activeTab === 'papers' ? papers : patents;

  // 데이터 안전장치
  if (!currentData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No data found.</div>;
  }

  // 5. 검색 및 그룹화 로직 (papers와 patents 공용)
  const groupedData = useMemo(() => {
    // (1) 먼저 검색어로 필터링
    const filtered = currentData.filter((item) => {
      const query = searchTerm.toLowerCase();
      // 논문/특허 공통 및 개별 필드 검색
      return (
        item.title.toLowerCase().includes(query) ||
        (item.authors && item.authors.toLowerCase().includes(query)) ||   // 논문 저자
        (item.inventors && item.inventors.toLowerCase().includes(query)) || // 특허 발명자
        (item.conference && item.conference.toLowerCase().includes(query)) || // 논문 저널
        (item.number && item.number.toLowerCase().includes(query)) ||     // 특허 번호
        String(item.year).includes(query)
      );
    });

    // (2) 필터링된 데이터를 연도별로 그룹화
    const groups = filtered.reduce((acc, item) => {
      const year = item.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(item);
      return acc;
    }, {});

    // (3) 연도 내림차순 정렬
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);

    return { groups, sortedYears, totalCount: filtered.length };
  }, [currentData, searchTerm]); // 데이터나 검색어가 바뀔 때 재계산

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
        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '20px' }}>
          Research Output
        </h1>

        {/* [추가됨] 탭 버튼 영역 */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
          <button 
            onClick={() => { setActiveTab('papers'); setSearchTerm(''); }} // 탭 바꿀때 검색어 초기화
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

        {/* 검색창 UI */}
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

      {/* 2. 리스트 출력 (논문/특허 공통 구조 사용) */}
      {groupedData.sortedYears.length > 0 ? (
        groupedData.sortedYears.map((year) => (
          <div key={year} style={{ marginBottom: '60px' }}>
            
            {/* Sticky Year Header */}
            <div style={{ 
              position: 'sticky', 
              top: '70px',
              backgroundColor: '#fff',
              padding: '10px 0',
              borderBottom: '3px solid #004094', 
              marginBottom: '30px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'baseline',
              gap: '15px'
            }}>
              <h2 style={{ fontSize: '2rem', color: '#004094', margin: 0 }}>{year}</h2>
              <span style={{ color: '#888', fontWeight: '500' }}>
                ({groupedData.groups[year].length})
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {groupedData.groups[year].map((item) => (
                <li key={item.id} style={{ marginBottom: '40px' }}>
                  
                  {/* ================================================= */}
                  {/* [CASE 1] 논문(Papers)일 때 보여줄 UI */}
                  {/* ================================================= */}
                  {activeTab === 'papers' && (
                    <>
                      <Link href={item.url || "#"} target="_blank" style={{ textDecoration: 'none' }}>
                        <h3 
                          style={{ fontSize: '1.2rem', color: '#222', fontWeight: '700', marginBottom: '8px', lineHeight: '1.4', cursor: 'pointer', transition: 'color 0.2s' }}
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

                  {/* ================================================= */}
                  {/* [CASE 2] 특허(Patents)일 때 보여줄 UI */}
                  {/* ================================================= */}
                  {activeTab === 'patents' && (
                    <div style={{ 
                      paddingLeft: '15px', 
                      borderLeft: `4px solid ${item.type === 'Registered' ? '#27ae60' : '#e67e22'}`, 
                      backgroundColor: '#fafafa',
                      padding: '25px',
                      borderRadius: '0 8px 8px 0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {/* 1. 상단 뱃지 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <FaLightbulb style={{ color: '#f39c12', fontSize: '1.1rem' }} />
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: '#fff',
                          backgroundColor: item.type === 'Registered' ? '#27ae60' : '#e67e22',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.type}
                        </span>
                      </div>
                      
                      {/* 2. 영문 제목 */}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '5px', lineHeight: '1.4' }}>
                        {item.url && item.url !== '#' ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#333', textDecoration: 'none', transition: 'color 0.2s' }}
                             onMouseOver={(e) => e.target.style.color = '#004094'}
                             onMouseOut={(e) => e.target.style.color = '#333'}
                          >
                            {item.title}
                          </a>
                        ) : (
                          <span style={{ color: '#333' }}>{item.title}</span>
                        )}
                      </h3>

                      {/* 3. 한글 제목 */}
                      {item.koreanTitle && (
                        <p style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#555', fontWeight: '500' }}>
                          KO: {item.koreanTitle}
                        </p>
                      )}
                      
                      {/* 4. 발명자 */}
                      <p style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#444' }}>
                        <strong>Inventors:</strong> {item.inventors}
                      </p>
                      
                      {/* 5. 상세 정보 박스 (출원/등록 정보) */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', // 공간 있으면 가로 배치, 좁으면 세로 배치
                        gap: '15px',
                        backgroundColor: '#fff',
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        padding: '15px'
                      }}>
                        
                        {/* (A) 출원 정보 (항상 있음) */}
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Application (출원)
                          </p>
                          <p style={{ margin: '0', fontSize: '0.95rem', color: '#333' }}>
                            <span style={{ fontWeight: '600' }}>Date:</span> {item.applicationDate}
                          </p>
                          <p style={{ margin: '0', fontSize: '0.95rem', color: '#333' }}>
                            <span style={{ fontWeight: '600' }}>No:</span> {item.applicationNumber}
                          </p>
                        </div>

                        {/* (B) 등록 정보 (Registered일 때만 표시) */}
                        {item.type === 'Registered' && (
                          <div style={{ borderLeft: '2px solid #eee', paddingLeft: '15px' }}> {/* 구분선 효과 */}
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#27ae60', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              Registration (등록)
                            </p>
                            <p style={{ margin: '0', fontSize: '0.95rem', color: '#333' }}>
                              <span style={{ fontWeight: '600' }}>Date:</span> {item.registrationDate}
                            </p>
                            <p style={{ margin: '0', fontSize: '0.95rem', color: '#333' }}>
                              <span style={{ fontWeight: '600' }}>No:</span> {item.registrationNumber}
                            </p>
                          </div>
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