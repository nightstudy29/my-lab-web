"use client";

import { useState, useMemo, useEffect } from "react";
import { FaFileLines, FaChartSimple, FaBullhorn, FaArrowUpRightFromSquare } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import styles from "./page.module.css";

// 자료 유형별 아이콘 / 라벨
const TYPE_META = {
  slide: { label: "강의자료", icon: FaFileLines },
  grade: { label: "성적", icon: FaChartSimple },
  notice: { label: "공지", icon: FaBullhorn },
};

// "결정학 기초 (Basics of Crystallography)" -> "결정학 기초"
// 괄호 앞부분만 탭에 짧게 표시하고, 전체 이름은 별도 줄에 보여줍니다.
function getShortCourseLabel(fullName) {
  if (!fullName) return "";
  const idx = fullName.indexOf(" (");
  return idx === -1 ? fullName : fullName.slice(0, idx);
}

export default function LecturePage() {
  const [semester, setSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [materialsByCourse, setMaterialsByCourse] = useState({});
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // 1) 현재 활성 학기 조회
      const { data: semesterRow, error: semesterError } = await supabase
        .from("semesters")
        .select("*")
        .eq("is_current", true)
        .maybeSingle();

      if (semesterError || !semesterRow) {
        console.error("학기 조회 실패:", semesterError);
        setIsLoading(false);
        return;
      }
      setSemester(semesterRow);

      // 2) 그 학기의 과목들 조회 (sort_order 순)
      const { data: courseRows, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("semester_id", semesterRow.id)
        .order("sort_order", { ascending: true });

      if (courseError || !courseRows) {
        console.error("과목 조회 실패:", courseError);
        setIsLoading(false);
        return;
      }
      setCourses(courseRows);
      if (courseRows.length > 0) setActiveCourseId(courseRows[0].id);

      // 3) 그 과목들의 자료 전부 조회 (한 번에 가져와서 클라이언트에서 과목별로 묶기)
      const courseIds = courseRows.map((c) => c.id);
      if (courseIds.length > 0) {
        const { data: materialRows, error: materialError } = await supabase
          .from("materials")
          .select("*")
          .in("course_id", courseIds);

        if (materialError) {
          console.error("자료 조회 실패:", materialError);
        } else {
          const grouped = {};
          for (const m of materialRows) {
            if (!grouped[m.course_id]) grouped[m.course_id] = [];
            grouped[m.course_id].push(m);
          }
          setMaterialsByCourse(grouped);
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  const sortedMaterials = useMemo(() => {
    const list = materialsByCourse[activeCourseId] || [];
    return [...list].sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      // 날짜가 같으면 seq(삽입 순서) 기준으로 최근 등록분이 위로
      return b.seq - a.seq;
    });
  }, [materialsByCourse, activeCourseId]);

  const activeCourse = courses.find((c) => c.id === activeCourseId);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>불러오는 중입니다...</p>
      </div>
    );
  }

  if (!semester || courses.length === 0) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>등록된 학기/과목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{semester.label}</p>
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
            title={course.name}
            className={`${styles.tab} ${
              course.id === activeCourseId ? styles.tabActive : ""
            }`}
            onClick={() => setActiveCourseId(course.id)}
          >
            {getShortCourseLabel(course.name)}
          </button>
        ))}
      </div>

      {/* 선택된 과목 풀네임 */}
      {activeCourse && (
        <div className={styles.activeCourseName}>{activeCourse.name}</div>
      )}

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
              href={item.file_url}
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