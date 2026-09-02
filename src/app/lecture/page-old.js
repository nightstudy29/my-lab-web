"use client";

import { useState, useMemo } from "react";
import { FaFileLines, FaChartSimple, FaBullhorn, FaArrowUpRightFromSquare } from "react-icons/fa6";
import classData from "../../data/classmaterial.json";
import styles from "./page.module.css";

// 자료 유형별 아이콘 / 라벨
const TYPE_META = {
  slide: { label: "강의자료", icon: FaFileLines },
  grade: { label: "성적", icon: FaChartSimple },
  notice: { label: "공지", icon: FaBullhorn },
};

export default function LecturePage() {
  const { semester, courses } = classData;
  const [activeCourseId, setActiveCourseId] = useState(courses[0]?.id);

  const activeCourse = courses.find((c) => c.id === activeCourseId);

  const sortedMaterials = useMemo(() => {
    if (!activeCourse) return [];
    return activeCourse.materials
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const dateDiff = new Date(b.item.date) - new Date(a.item.date);
        if (dateDiff !== 0) return dateDiff;
        // 날짜가 같으면 배열에서 나중에 추가된 항목(= 더 아래에 있는 항목)이 위로 오도록
        return b.index - a.index;
      })
      .map(({ item }) => item);
  }, [activeCourse]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{semester}</p>
        <h1 className={styles.title}>Lecture</h1>
        <p className={styles.desc}>
          담당 과목별 강의자료와 공지를 확인할 수 있습니다.
        </p>
      </div>

      {/* 과목 탭 */}
      <div className={styles.tabs} role="tablist">
        {courses.map((course) => (
          <button
            key={course.id}
            role="tab"
            aria-selected={course.id === activeCourseId}
            className={`${styles.tab} ${
              course.id === activeCourseId ? styles.tabActive : ""
            }`}
            onClick={() => setActiveCourseId(course.id)}
          >
            {course.name}
          </button>
        ))}
      </div>

      {/* 자료 리스트 */}
      <div className={styles.list}>
        {sortedMaterials.length === 0 && (
          <p className={styles.empty}>등록된 자료가 없습니다.</p>
        )}

        {sortedMaterials.map((item) => {
          const meta = TYPE_META[item.type] ?? TYPE_META.slide;
          const Icon = meta.icon;
          return (
            <a
              key={item.id}
              href={item.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.item}
            >
              <div className={`${styles.badge} ${styles[`badge_${item.type}`] || ""}`}>
                <Icon size={13} />
                <span>{meta.label}</span>
              </div>

              <div className={styles.itemBody}>
                <span className={styles.itemDate}>{item.date}</span>
                <span className={styles.itemTitle}>{item.title}</span>
              </div>

              <FaArrowUpRightFromSquare size={13} className={styles.itemLinkIcon} />
            </a>
          );
        })}
      </div>
    </div>
  );
}