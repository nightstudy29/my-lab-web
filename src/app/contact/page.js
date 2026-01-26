"use client";

import { FaEnvelope, FaLocationDot, FaMapLocationDot, FaUserGraduate, FaPhone } from "react-icons/fa6";

export default function ContactPage() {
  return (
    <div style={{ 
      padding: '80px 20px', 
      maxWidth: '1000px', 
      width: '100%', 
      margin: '0 auto', 
      boxSizing: 'border-box' 
    }}>

      {/* 1. 헤더 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          // [수정] clamp 적용
          fontSize: 'clamp(2rem, 5vw, 2.5rem)', 
          marginBottom: '20px', 
          color: '#333' 
        }}>
          Contact Us
        </h1>
      </div>

      {/* 2. [강조] 학생 모집 공고 (Graduate Students Only) */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        borderLeft: '5px solid #004094', 
        borderRadius: '8px', 
        padding: '30px', 
        marginBottom: '50px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px', color: '#004094' }}>
          <FaUserGraduate size={24} />
          {/* 제목 수정됨 */}
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Open Positions for Graduate Students</h2>
        </div>
        <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: '1.6', margin: 0 }}>
          {/* 본문 수정됨 (interns 삭제) */}
          We are always looking for highly motivated graduate students.<br/>
          If you are interested in our research, please send your <strong>CV and transcript</strong> to the email below.
        </p>
      </div>

      {/* 3. 이메일 카드 */}
      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #eee', 
        borderRadius: '16px', 
        padding: '40px', 
        textAlign: 'center',
        marginBottom: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          width: '60px', height: '60px', backgroundColor: '#f5f5f5', 
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px auto', color: '#333'
        }}>
          <FaEnvelope size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '10px' }}>Email Address</h2>
        <p style={{ color: '#666', marginBottom: '15px', fontSize: '1.1rem' }}>
          Prof. Jun Min Suh
        </p>
        <a 
          href="mailto:junminsuh@snu.ac.kr" 
          style={{ 
            fontSize: '1.6rem', 
            fontWeight: '800', 
            color: '#004094', 
            textDecoration: 'none',
            borderBottom: '2px solid transparent',
            transition: 'border-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.borderBottom = '2px solid #004094'}
          onMouseOut={(e) => e.target.style.borderBottom = '2px solid transparent'}
        >
          junminsuh@snu.ac.kr
        </a>
      </div>

      {/* 4. 주소 정보 (그리드 레이아웃) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '30px' 
      }}>
        
        {/* 교수실 (Office) */}
        <div style={{ padding: '30px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <FaLocationDot size={22} color="#004094" />
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>Professor Office</h3>
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#222', marginBottom: '5px' }}>
            Building 18, Room 405
          </p>
          
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', marginBottom: '15px', fontWeight: '500' }}>
            <FaPhone size={14} color="#004094" /> +82-2-880-8463
          </p>

          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
            Seoul National University<br/>
            1 Gwanak-ro, Gwanak-gu<br/>
            Seoul 08826, Republic of Korea
          </p>
          <a 
            href="https://maps.app.goo.gl/mVkc698chUkL4HrB9" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', color: '#004094', fontWeight: '600', fontSize: '0.95rem'
            }}
          >
            <FaMapLocationDot /> Google Maps
          </a>
        </div>

        {/* 연구실 (Lab) */}
        <div style={{ padding: '30px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <FaLocationDot size={22} color="#2e7d32" /> 
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>Student Lab</h3>
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#222', marginBottom: '5px' }}>
            Building 31, Room 204-3
          </p>
          
          {/* 학생 연구실 전화번호 (나중에 입력하기 쉽게 아이콘은 남겨둠) */}
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', marginBottom: '15px', fontWeight: '500' }}>
            <FaPhone size={14} color="#2e7d32" /> 
            {/* 👇 나중에 번호 나오면 아래 'TBD' 지우고 '02-xxx-xxxx' 적으시면 됩니다 */}
            TBD
          </p>

          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
            Seoul National University<br/>
            1 Gwanak-ro, Gwanak-gu<br/>
            Seoul 08826, Republic of Korea
          </p>
          <a 
            href="https://maps.app.goo.gl/LN8xpMhKz97z3xCF8" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', color: '#2e7d32', fontWeight: '600', fontSize: '0.95rem'
            }}
          >
            <FaMapLocationDot /> Google Maps
          </a>
        </div>

      </div>

    </div>
  );
}