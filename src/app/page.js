"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa6";
import newsData from "../data/news.json";
import styles from "./page.module.css";

// ===== 파티클 캔버스 컴포넌트 =====
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 파티클 생성
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 연결선 그리기
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(180, 210, 255, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 파티클 그리기
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 210, 255, 0.6)";
        ctx.fill();

        // 이동
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ===== 리서치 토픽 =====
const researchTopics = [
  {
    image: "/images/research/topic_1.png",
    title: <>Low-Dimensional Materials<br />& Nanostructures</>,
    desc: <>Synthesis of <strong>atomically thin membranes</strong> and <strong>functional nanostructures</strong> to engineer novel physical and chemical properties.</>,
  },
  {
    image: "/images/research/topic_2.jpg",
    title: <>Heterogeneous<br />3D Integration</>,
    desc: <>Universal platform for stacking diverse functional layers vertically using <strong>freestanding nanomembranes</strong> without lattice constraints.</>,
  },
  {
    image: "/images/research/topic_3.jpg",
    title: <>Intelligent Sensors<br />& Free-Form Electronics</>,
    desc: <><strong>AI-enabled sensing platforms</strong> (In-Sensor AI) capable of conforming to any shape for next-generation applications.</>,
  },
];

// ===== 메인 홈 =====
export default function Home() {
  const [isMobile, setIsMobile] = useState(null);
  const mobile = isMobile !== false;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const latestNews = [...newsData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div style={{ width: "100%" }}>

      {/* ===== Hero Section ===== */}
      <div className={styles.hero}>

        {/* 파티클 배경 */}
        <ParticleCanvas />

        {/* 로고를 배경에 크게 */}
        {!mobile && (
          <div className={styles.heroBgLogo}>
            <Image
              src="/images/logo/lab_logo_trans.png"
              alt=""
              fill
              style={{ objectFit: "contain", opacity: 0.07 }}
              priority
            />
          </div>
        )}

        {/* 콘텐츠 */}
        <div className={styles.heroContent}>

          {/* 모바일: 로고 작게 위에 */}
          {mobile && (
            <Image
              src="/images/logo/lab_logo_trans.png"
              alt="SMID Lab Logo"
              width={140}
              height={140}
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0 4px 20px rgba(0,100,255,0.3))",
                marginBottom: "24px",
              }}
              priority
            />
          )}

          <p className={styles.heroEyebrow}>
            Dept. of Materials Science & Engineering, SNU
          </p>

          <h1 className={styles.heroTitle}>
            Semiconductor<br />
            Materials &<br />
            Intelligent Devices Lab
          </h1>

          <p className={styles.heroDesc}>
            Pioneering the future of electronics through{" "}
            <strong>Atomic-Scale Materials</strong>,{" "}
            <strong>3D Integration</strong>, and{" "}
            <strong>In-Sensor AI</strong>.
          </p>

          <div className={styles.heroBtns}>
            <Link href="/research" className={styles.btnPrimary}>
              Our Research
            </Link>
            <Link href="/contact" className={styles.btnOutline}>
              Join Us
            </Link>
          </div>
        </div>

        {/* 데스크탑: 로고 오른쪽에 */}
        {!mobile && (
          <div className={styles.heroLogoWrap}>
            <Image
              src="/images/logo/lab_logo_trans.png"
              alt="SMID Lab Logo"
              width={380}
              height={380}
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0 0 60px rgba(100,160,255,0.35))",
              }}
              priority
            />
          </div>
        )}
      </div>

      {/* ===== Research Highlights ===== */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>What We Do</div>
        <h2 className={styles.sectionTitle}>Research Highlights</h2>
        <div className={styles.cardGrid}>
          {researchTopics.map((topic, index) => (
            <div key={index} className={styles.researchCard}>
              <div className={styles.cardImageWrap}>
                <Image
                  src={topic.image}
                  alt=""
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{topic.title}</h3>
                <p className={styles.cardDesc}>{topic.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Latest News ===== */}
      <div className={styles.newsBg}>
        <div className={styles.newsInner}>
          <div className={styles.newsHeader}>
            <div>
              <div className={styles.sectionLabel} style={{ color: "#004094" }}>Stay Updated</div>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Latest News</h2>
            </div>
            <Link href="/news" className={styles.viewAll}>
              View All <FaArrowRight size={13} />
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