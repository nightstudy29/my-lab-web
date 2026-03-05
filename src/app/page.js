"use client"; // isMobile useState 때문에 필요

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowRight, FaAtom, FaLayerGroup, FaMicrochip } from "react-icons/fa6";
import newsData from "../data/news.json";
import styles from "./page.module.css";

const researchTopics = [
  {
    icon: <FaAtom size={30} color="#004094" />,
    title: <>Low-Dimensional Materials<br />& Nanostructures</>,
    desc: <>Synthesis of <strong>atomically thin membranes</strong> and <strong>functional nanostructures</strong> to engineer novel physical and chemical properties.</>,
  },
  {
    icon: <FaLayerGroup size={30} color="#004094" />,
    title: <>Heterogeneous<br />3D Integration</>,
    desc: <>Universal platform for stacking diverse functional layers vertically using <strong>freestanding nanomembranes</strong> without lattice constraints.</>,
  },
  {
    icon: <FaMicrochip size={30} color="#004094" />,
    title: <>Intelligent Sensors<br />& Free-Form Electronics</>,
    desc: <><strong>AI-enabled sensing platforms</strong> (In-Sensor AI) capable of conforming to any shape for next-generation applications.</>,
  },
];

export default function Home() {
  // ✅ null로 시작 → hydration 전까지 모바일 기준 렌더링 (SSR 깜빡임 방지)
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check(); // 마운트 즉시 실행
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ✅ hydration 전 (null): 모바일 기준으로 렌더링
  const mobile = isMobile !== false;

  const latestNews = [...newsData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div style={{ width: "100%" }}>

      {/* 1. Hero Section */}
      <div className={styles.hero}>
        <div style={{
          display: "flex",
          flexDirection: mobile ? "column" : "row",   // ✅ JS 분기
          alignItems: "center",
          justifyContent: "center",
          gap: mobile ? "20px" : "60px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          textAlign: mobile ? "center" : "left",
        }}>

          {/* 로고 이미지 - ✅ 인라인 height 제거, isMobile 분기 */}
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/images/logo/lab_logo_trans.png"
              alt="SMID Lab Logo"
              width={325}
              height={325}
              style={{
                width: "auto",
                height: mobile ? "180px" : "325px",  // ✅ JS 분기
                objectFit: "contain",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.4))",
              }}
              priority
            />
          </div>

          {/* 텍스트 콘텐츠 */}
          <div style={{ maxWidth: "650px" }}>
            <p className={styles.heroSubtitle}>
              Dept. of Materials Science & Engineering, SNU
            </p>
            {/* ✅ br 태그 → 모바일에서 조건부 렌더링 */}
            <h1 className={styles.heroTitle}>
              Semiconductor Materials{!mobile && <br />} & Intelligent Devices Lab
            </h1>
            <p className={styles.heroDesc}>
              Pioneering the future of electronics through{" "}
              <strong>Atomic-Scale Materials</strong>, <strong>3D Integration</strong>, and <strong>In-Sensor AI</strong>.
            </p>
            <div style={{
              display: "flex",
              gap: "15px",
              justifyContent: mobile ? "center" : "flex-start",
              flexWrap: "wrap",
            }}>
              <Link href="/research" className={styles.btnPrimary}>
                Our Research
              </Link>
              <Link href="/contact" className={styles.btnOutline}>
                Join Us
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Research Highlights */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Research Highlights</h2>
        <div className={styles.cardGrid}>
          {researchTopics.map((topic, index) => (
            <div key={index} className={styles.researchCard}>
              <div className={styles.iconCircle}>
                {topic.icon}
              </div>
              <h3 className={styles.cardTitle}>{topic.title}</h3>
              <p className={styles.cardDesc}>{topic.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Latest News */}
      <div className={styles.newsBg}>
        <div className={styles.newsInner}>
          <div className={styles.newsHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Latest News</h2>
            <Link href="/news" className={styles.viewAll}>
              View All <FaArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.cardGrid}>
            {latestNews.map((news) => (
              <div key={news.id} className={styles.newsCard}>
                <span className={styles.newsDate}>{news.date}</span>
                <h3 className={styles.newsTitle}>{news.title}</h3>
                <Link href={`/news#news-${news.id}`} className={styles.readMore}>
                  Read more <span style={{ fontSize: "0.7rem" }}>▶</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}