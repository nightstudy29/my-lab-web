"use client";  // 👈 이 한 줄이 없어서 에러가 난 겁니다!

import Link from "next/link";
import { FaNewspaper } from "react-icons/fa6"; 
import papers from '../../data/papers.json';

export default function PublicationsPage() {
  // 최신순 정렬
  const sortedPapers = papers.sort((a, b) => b.year - a.year);

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. 페이지 헤더 */}
      <div style={{ marginBottom: '50px', borderBottom: '2px solid #004094', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', margin: 0 }}>Publications</h1>
        <p style={{ color: '#666', marginTop: '10px', fontSize: '1rem' }}>
          Total: {sortedPapers.length}
        </p>
      </div>

      {/* 2. 논문 리스트 */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sortedPapers.map((paper) => (
          <li key={paper.id} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px dashed #eee' }}>
            
            {/* [제목] */}
            <Link 
              href={paper.url} 
              target="_blank" 
              style={{ textDecoration: 'none' }}
            >
              <h2 style={{ 
                fontSize: '1.25rem',
                color: '#004094', 
                fontWeight: '700',
                marginBottom: '8px',
                lineHeight: '1.4',
                cursor: 'pointer',
              }}>
                {paper.title}
              </h2>
            </Link>

            {/* [저자] */}
            <div 
              style={{ fontSize: '1rem', color: '#444', marginBottom: '6px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ 
                __html: paper.authors.replace(/\s*[‐–-]\s*/g, '-') 
              }} 
            />

            {/* [저널/학회 + 연도] */}
            <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '10px' }}>
              <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#222' }}>
                {paper.conference}
              </span>
              <span>, {paper.year}</span>
            </div>

            {/* [뉴스 링크 영역] */}
            {paper.news && paper.news.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#004094', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  backgroundColor: '#eef4ff',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Press
                </span>
                
                {/* 최대 6개까지만 표시 */}