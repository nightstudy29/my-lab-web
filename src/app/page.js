"use client";

import Link from "next/link";
import { FaArrowRight, FaAtom, FaLayerGroup, FaMicrochip } from "react-icons/fa6"; // 아이콘 로드
import newsData from "../data/news.json"; // 뉴스 데이터

export default function Home() {
  // 최신 뉴스 3개 가져오기 (날짜순 정렬)
  const latestNews = [...newsData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div style={{ width: '100%' }}>

      {/* 1. Hero Section (메인 배너) */}
      <div style={{ 
        minHeight: '420px', 
        backgroundColor: '#002b5e', 
        backgroundImage: 'linear-gradient(135deg, #002b5e 0%, #004094 100%)', 
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        color: '#fff',
        padding: '40px 20px' // 여백 살짝 조정
      }}>
        
        {/* 내부 컨테이너 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', // 로고와 텍스트의 세로 중앙을 맞춤
          justifyContent: 'center', 
          gap: '60px', // [수정] 로고가 커졌으므로 간격도 조금 더 넓힘
          flexWrap: 'wrap',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          
          {/* [왼쪽] 로고 이미지 - 사이즈 대폭 확대 */}
          <div style={{ flexShrink: 0 }}>
            <img 
              src="/images/logo/lab_logo_trans.png" 
              alt="SMID Lab Logo" 
              style={{ 
                height: '325px', // [수정] 110px -> 200px로 확 키움!
                width: 'auto', 
                objectFit: 'contain',
                // 로고가 커졌으니 그림자도 조금 더 깊게 설정
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))'
              }} 
            />
          </div>

          {/* [오른쪽] 텍스트 콘텐츠 */}
          <div style={{ 
            textAlign: 'left', 
            maxWidth: '650px'
          }}>
            {/* 소속 정보 */}
            <p style={{ 
              fontSize: '1.05rem', 
              fontWeight: '500', 
              color: '#cce0ff', 
              marginBottom: '12px', 
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
            }}>
              Dept. of Materials Science & Engineering, SNU
            </p>

            {/* 연구실 이름 */}
            <h1 style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', 
              fontWeight: '800', 
              marginBottom: '20px', 
              letterSpacing: '-0.5px', 
              lineHeight: '1.2',
              wordBreak: 'keep-all'
            }}>
              Semiconductor Materials & <br/>Intelligent Devices Lab
            </h1>

            {/* 슬로건 */}
            <p style={{ 
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', 
              opacity: '0.9', 
              marginBottom: '30px', 
              lineHeight: '1.6'
            }}>
              Pioneering the future of electronics through <br/>
              <strong>Atomic-Scale Materials</strong>, <strong>3D Integration</strong>, and <strong>In-Sensor AI</strong>.
            </p>

            {/* 버튼들 */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <Link href="/research" style={{ 
                padding: '12px 30px', 
                backgroundColor: '#fff', color: '#004094', 
                borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                Our Research
              </Link>
              <Link href="/contact" style={{ 
                padding: '12px 30px', 
                border: '2px solid #fff', 
                color: '#fff', 
                borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none'
              }}>
                Join Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Research Highlights (슬림 버전) */}
      <div style={{ 
        padding: '60px 20px', // [수정] 상하 여백 90px -> 60px 축소
        maxWidth: '1200px', 
        margin: '0 auto', 
        textAlign: 'center' 
      }}>
        <h2 style={{ 
          fontSize: '2rem', // [수정] 크기 살짝 축소
          marginBottom: '40px', // [수정] 제목 하단 여백 60px -> 40px 축소
          color: '#333', 
          fontWeight: '800' 
        }}>
          Research Highlights
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // 최소폭 살짝 조정
          gap: '30px' // [수정] 카드 사이 간격 40px -> 30px 축소
        }}>
          
          {/* Topic 1 */}
          <div style={{ 
            padding: '30px 25px', // [수정] 카드 내부 여백 40px -> 30px 축소
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            border: '1px solid #eee', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.04)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '65px', height: '65px', // [수정] 아이콘 배경 크기 80px -> 65px 축소
              backgroundColor: '#eef4ff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '18px' // [수정] 25px -> 18px 축소
            }}>
              <FaAtom size={30} color="#004094" /> {/* 아이콘 크기도 살짝 축소 */}
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', fontWeight: '700', color: '#111', lineHeight: '1.3' }}>
              Low-Dimensional Materials<br/>& Nanostructures
            </h3>
            <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.95rem' }}>
              Synthesis of <strong>atomically thin membranes</strong> and <strong>functional nanostructures</strong> to engineer novel physical and chemical properties.
            </p>
          </div>

          {/* Topic 2 */}
          <div style={{ 
            padding: '30px 25px', 
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            border: '1px solid #eee', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.04)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '65px', height: '65px', 
              backgroundColor: '#eef4ff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '18px' 
            }}>
              <FaLayerGroup size={30} color="#004094" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', fontWeight: '700', color: '#111', lineHeight: '1.3' }}>
              Heterogeneous<br/>3D Integration
            </h3>
            <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.95rem' }}>
              Universal platform for stacking diverse functional layers vertically using <strong>freestanding nanomembranes</strong> without lattice constraints.
            </p>
          </div>

          {/* Topic 3 */}
          <div style={{ 
            padding: '30px 25px', 
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            border: '1px solid #eee', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.04)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '65px', height: '65px', 
              backgroundColor: '#eef4ff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '18px' 
            }}>
              <FaMicrochip size={30} color="#004094" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', fontWeight: '700', color: '#111', lineHeight: '1.3' }}>
              Intelligent Sensors<br/>& Free-Form Electronics
            </h3>
            <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.95rem' }}>
              <strong>AI-enabled sensing platforms</strong> (In-Sensor AI) capable of conforming to any shape for next-generation applications.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Latest News (슬림 버전) */}
      <div style={{ backgroundColor: '#f8fafc', padding: '60px 20px' }}> {/* [수정] 90px -> 60px 패딩 축소 */}
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* 헤더 부분 여백 조정 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px' // [수정] 50px -> 30px 여백 축소
          }}>
            <h2 style={{ fontSize: '1.8rem', color: '#333', margin: 0, fontWeight: '800' }}>Latest News</h2>
            <Link href="/news" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: '#004094', 
              textDecoration: 'none', 
              fontWeight: 'bold', 
              fontSize: '1rem' // [수정] 1.1rem -> 1rem
            }}>
              View All <FaArrowRight size={14} />
            </Link>
          </div>

          {/* 뉴스 카드 그리드 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px' // [수정] 30px -> 20px 간격 축소
          }}>
            {latestNews.map((news) => (
              <div key={news.id} style={{ 
                backgroundColor: '#fff', 
                padding: '25px', // [수정] 카드 내부 패딩 35px -> 25px 축소
                borderRadius: '12px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s', 
                border: '1px solid #eee'
              }}>
                <span style={{ 
                  fontSize: '0.85rem', // [수정] 0.95 -> 0.85rem
                  color: '#004094', 
                  fontWeight: 'bold', 
                  marginBottom: '8px', // [수정] 12px -> 8px
                  display: 'block' 
                }}>
                  {news.date}
                </span>
                <h3 style={{ 
                  fontSize: '1.1rem', // [수정] 1.25 -> 1.1rem
                  marginBottom: '12px', // [수정] 20px -> 12px
                  lineHeight: '1.4', 
                  flexGrow: 1, 
                  fontWeight: '700', 
                  color: '#222'
                }}>
                  {news.title}
                </h3>
                <Link 
                  href={`/news#news-${news.id}`} 
                  style={{ 
                    color: '#666', 
                    textDecoration: 'none', 
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px' 
                  }}
                >
                  Read more <span style={{ fontSize: '0.7rem' }}>▶</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}