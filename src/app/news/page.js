"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import newsData from '../../data/news.json';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaLink } from "react-icons/fa";
import styles from './page.module.css';

const getCategoryColor = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('announcement') || cat.includes('opening')) return '#d32f2f';
  if (cat.includes('paper')) return '#004094';
  if (cat.includes('award')) return '#f57f17';
  if (cat.includes('conference')) return '#673ab7';
  if (cat.includes('event') || cat.includes('outing')) return '#2e7d32';
  return '#555';
};

// ===== NewsCard 컴포넌트 =====
function NewsCard({ item, anchorId }) {
  const [imgIndex, setImgIndex] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);
  const textRef = useRef(null);

  const hasImages = item.images && item.images.length > 0;
  const hasMultipleImages = item.images && item.images.length > 1;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const checkClamped = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight } = textRef.current;
        setIsClamped(scrollHeight > clientHeight);
      }
    };
    const timer = setTimeout(checkClamped, 100);
    window.addEventListener('resize', checkClamped);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkClamped);
    };
  }, [item.description]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      setImgIndex(Math.round(scrollLeft / width) + 1);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: direction * width, behavior: 'smooth' });
    }
  };

  return (
    <article id={anchorId} className={styles.card} style={{
      flexDirection: isMobile ? 'column' : 'row',  // ✅ JS 분기
    }}>

      {/* 이미지 영역 */}
      {hasImages && (
        <div className={styles.imageContainer} style={{
          width: isMobile ? '100%' : '280px',       // ✅ JS 분기
          minWidth: isMobile ? '0' : '280px',
          height: isMobile ? '220px' : '100%',
          borderRight: isMobile ? 'none' : '1px solid #f0f0f0',
          borderBottom: isMobile ? '1px solid #f0f0f0' : 'none',
        }}>
          {hasMultipleImages && (
            <>
              <button onClick={() => scroll(-1)} className={styles.sliderBtn} style={{ left: '5px' }}>
                <FaChevronLeft size={12} />
              </button>
              <button onClick={() => scroll(1)} className={styles.sliderBtn} style={{ right: '5px' }}>
                <FaChevronRight size={12} />
              </button>
            </>
          )}

          <div ref={scrollRef} onScroll={handleScroll} className={styles.imageSlider}>
            {item.images.map((imgSrc, idx) => (
              <div key={idx} className={styles.imageSlide}>
                <Image
                  src={imgSrc}
                  alt={`${item.title} 이미지 ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="280px"
                />
              </div>
            ))}
          </div>

          {hasMultipleImages && (
            <div className={styles.imageCounter}>
              {imgIndex} / {item.images.length}
            </div>
          )}
        </div>
      )}

      {/* 텍스트 영역 */}
      <div className={styles.cardBody}>

        {/* 카테고리 + 날짜 */}
        <div className={styles.cardMeta}>
          <span
            className={styles.category}
            style={{ backgroundColor: getCategoryColor(item.category) }}
          >
            {item.category}
          </span>
          <span className={styles.date}>
            <FaCalendarAlt size={10} /> {item.date}
          </span>
        </div>

        {/* 제목 */}
        <h2 className={styles.cardTitle}>{item.title}</h2>

        {/* 본문 */}
        <div className={styles.cardText}>
          <p
            ref={textRef}
            className={isExpanded ? styles.descExpanded : styles.descClamped}
          >
            {item.description}
          </p>
          {(isClamped || isExpanded) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={styles.readMoreBtn}
            >
              {isExpanded ? "Show Less" : "Read More..."}
            </button>
          )}
        </div>

        {/* 링크 버튼 */}
        {item.link && (
          <div className={styles.linkWrapper}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkBtn}
            >
              <FaLink size={10} /> Link
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

// ===== 메인 페이지 =====
export default function NewsPage() {
  const sortedNews = [...(newsData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const newsByYear = sortedNews.reduce((acc, item) => {
    const year = item.date.substring(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});
  const years = Object.keys(newsByYear).sort((a, b) => b - a);

  const [activeYear, setActiveYear] = useState(years[0]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1000);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 300;

      // ✅ 위/아래 스크롤 모두 정확히 작동
      let currentYear = years[years.length - 1];
      for (const year of [...years].reverse()) {
        const element = document.getElementById(`year-${year}`);
        if (element && element.offsetTop <= scrollPosition) {
          currentYear = year;
          break;
        }
      }
      setActiveYear(currentYear);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [years]);

  return (
    <div className={styles.wrapper}>

      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>Lab News</h1>
        <p className={styles.subtitle}>SMID Lab의 최신 소식과 일상을 공유합니다.</p>
      </div>

      <div className={styles.layout}>

        {/* 뉴스 피드 */}
        <div className={styles.feed}>
          {years.map((year) => (
            <div key={year} id={`year-${year}`} className={styles.yearGroup}>
              <div className={styles.yearHeader}>
                <h2 className={styles.yearTitle}>{year}</h2>
                <div className={styles.yearDivider} />
              </div>
              <div className={styles.cardList}>
                {newsByYear[year].map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    anchorId={`news-${item.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 연도 네비게이션 */}
        {!isMobile && (
          <aside className={styles.yearNav}>
            <div className={styles.yearNavSticky}>
              <div className={styles.yearNavInner}>
                <div className={styles.yearNavLine} />
                <ul className={styles.yearNavList}>
                  {years.map((year) => {
                    const isActive = activeYear === year;
                    return (
                      <li key={year} className={styles.yearNavItem}>
                        <a href={`#year-${year}`} className={styles.yearNavLink}>
                          <div className={isActive ? styles.dotActive : styles.dot} />
                          <span className={isActive ? styles.yearLabelActive : styles.yearLabel}>
                            {year}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}