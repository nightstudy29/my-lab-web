"use client";

import { useState } from 'react';
import equipmentData from '../../data/equipment.json'; 
import { FaMicroscope } from "react-icons/fa6"; 

export default function EquipmentPage() {
  return (
    <div style={{ 
      padding: '80px 20px', 
      maxWidth: '1200px', 
      width: '100%', 
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      
      {/* 1. 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#333' }}>Research Equipment</h1>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>
         </p>
      </div>

      {/* 2. 장비 그리드 리스트 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '30px'
      }}>
        {equipmentData.map((item) => (
          <EquipmentCard key={item.id} item={item} />
        ))}
      </div>

    </div>
  );
}

// 개별 장비 카드 컴포넌트
function EquipmentCard({ item }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{ 
        border: '1px solid #eee', 
        borderRadius: '12px', 
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
        transform: isHovered ? 'translateY(-5px)' : 'none',
        transition: 'all 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 이미지 영역 */}
      <div style={{ 
        width: '100%', 
        height: '240px', 
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              transition: 'transform 0.5s ease'
            }}
            className={isHovered ? "zoom-image" : ""}
          />
        ) : (
          <FaMicroscope size={50} color="#ccc" />
        )}
      </div>

      {/* 텍스트 영역 */}
      <div style={{ padding: '25px' }}>
        {/* ★ 수정된 부분: HTML 태그 적용 가능하도록 변경 (dangerouslySetInnerHTML) */}
        <h3 
          style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.4rem' }}
          dangerouslySetInnerHTML={{ __html: item.name }} 
        />
        
        {item.model && (
          <p style={{ 
            margin: '0 0 15px 0', 
            fontSize: '0.9rem', 
            color: '#004094', 
            fontWeight: '600',
            backgroundColor: '#eef4ff',
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {item.model}
          </p>
        )}
        
        {/* ★ 수정된 부분: 설명에도 HTML 태그 적용 (단위 등) */}
        <p 
          style={{ margin: 0, color: '#666', lineHeight: '1.5', fontSize: '1rem' }}
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      </div>
    </div>
  );
}