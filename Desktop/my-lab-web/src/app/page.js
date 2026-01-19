"use client";

import Link from "next/link";
import { FaArrowRight, FaAtom, FaLayerGroup, FaBrain } from "react-icons/fa6"; // 아이콘 로드
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
        height: '540px', 
        backgroundColor: '#002b5e', 
        backgroundImage: 'linear-gradient(135deg, #002b5e 0%, #004094 100%)', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: '#fff',
        padding: '0 20px'
      }}>
        
        {/* 소속 정보 */}
        <p style={{ 
          fontSize: '1.1rem', 
          fontWeight: '500', 
          color: '#cce0ff', 
          marginBottom: '15px', 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
        }}>
          Dept. of Materials Science & Engineering, Seoul National University
        </p>

        {/* 연구실 이름 */}
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '25px', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
          Semiconductor Materials & <br/>Intelligent Devices Lab
        </h1>
        
        {/* 슬로건: 3대 키워드 강조 */}
        <p style={{ fontSize: '1.3rem', maxWidth: '850px', opacity: '0.9', marginBottom: '45px', lineHeight: '1.6' }}>
          Pioneering the future of electronics through <br/>
          <strong>Atomic-Scale Materials</strong>, <strong>3D Integration</strong>, and <strong>In-Sensor AI</strong>.
        </p>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/research" style={{ 
            padding: '14px 35px', backgroundColor: '#fff', color: '#004094', 
            borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            Our Research
          </Link>
          <Link href="/contact" style={{ 
            padding: '14px 35px', border: '2px solid #fff', color: '#fff', 
            borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none',
            transition: 'background-color 0.2s'
          }}>
            Join Us
          </Link>
        </div>
      </div>

      {/* 2. Research Highlights (최종 수정됨) */}
      <div style={{ padding: '90px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '60px', color: '#333', fontWeight: '800' }}>Research Highlights</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '40px' 
        }}>
          
          {/* Topic 1: Materials & Nanostructures */}
          <div style={{ padding: '40px 30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#eef4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
              <FaAtom size={36} color="#004094" />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px', fontWeight: '700', color: '#111' }}>
              Low-Dimensional Materials<br/>& Nanostructures
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1rem' }}>
              Synthesis of <strong>atomically thin membranes</strong> and <strong>functional nanostructures</strong> to engineer novel physical and chemical properties.
            </p>
          </div>

          {/* Topic 2: 3D Integration */}
          <div style={{ padding: '40px 30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#eef4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
              <FaLayerGroup size={36} color="#004094" />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px', fontWeight: '700', color: '#111' }}>
              Heterogeneous<br/>3D Integration
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1rem' }}>
              Universal platform for stacking diverse functional layers vertically using <strong>freestanding nanomembranes</strong> without lattice constraints.
            </p>
          </div>

          {/* Topic 3: Intelligent Sensors */}
          <div style={{ padding: '40px 30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#eef4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
              <FaBrain size={36} color="#004094" />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px', fontWeight: '700', color: '#111' }}>
              Intelligent Sensors<br/>& Free-Form Electronics
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1rem' }}>
              <strong>AI-enabled sensing platforms</strong> (In-Sensor AI) capable of conforming to any shape for next-generation applications.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Latest News (자동 업데이트) */}
      <div style={{ backgroundColor: '#f8fafc', padding: '90px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.2rem', color: '#333', margin: 0, fontWeight: '800' }}>Latest News</h2>
            <Link href="/news" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004094', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
              View All <FaArrowRight />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            {latestNews.map((news) => (
              <div key={news.id} style={{ 
                backgroundColor: '#fff', padding: '35px', borderRadius: '16px', 
                boxShadow: '0 5px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s', border: '1px solid #eee'
              }}>
                <span style={{ 
                  fontSize: '0.95rem', color: '#004094', fontWeight: 'bold', 
                  marginBottom: '12px', display: 'block' 
                }}>
                  {news.date}
                </span>
                <h3 style={{ 
                  fontSize: '1.25rem', marginBottom: '20px', lineHeight: '1.4', flexGrow: 1, fontWeight: '700', color: '#222'
                }}>
                  {news.title}
                </h3>
                <Link href={`/news`} style={{ color: '#666', textDecoration: 'none', fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Read more <span style={{ fontSize: '0.8rem' }}>▶</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recruiting Banner */}
      <div style={{ 
        padding: '100px 20px', 
        textAlign: 'center', 
        backgroundColor: '#004094', 
        color: '#fff',
        backgroundImage: 'radial-gradient(circle at center, #0050b3 0%, #004094 100%)'
      }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '25px', fontWeight: '800' }}>Join SMID Lab</h2>
        <p style={{ fontSize: '1.3rem', maxWidth: '700px', margin: '0 auto 40px auto', opacity: '0.9', lineHeight: '1.6' }}>
          We are looking for passionate <strong>Graduate Students</strong> ready to lead the future of electronics research.
        </p>
        <Link href="/contact" style={{ 
          display: 'inline-block', padding: '16px 45px', 
          backgroundColor: '#fff', color: '#004094', 
          fontSize: '1.1rem', fontWeight: 'bold', 
          borderRadius: '50px', textDecoration: 'none',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
        }}>
          Contact Us
        </Link>
      </div>

    </div>
  );
}