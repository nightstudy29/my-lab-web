// src/lib/supabaseClient.js
//
// 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트입니다.
// publishable key(구 anon key)를 쓰기 때문에 RLS(Row Level Security) 정책을
// 그대로 따릅니다 — 학생들이 보는 페이지는 이걸로 "읽기"만 하면 됩니다.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);