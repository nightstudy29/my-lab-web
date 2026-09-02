// src/lib/supabaseAdmin.js
//
// ⚠️ 서버 사이드(API 라우트)에서만 import 하세요.
// 절대 클라이언트 컴포넌트("use client")에서 이 파일을 import하면 안 됩니다 —
// service_role key가 브라우저에 노출되어 DB 전체가 뚫립니다.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);