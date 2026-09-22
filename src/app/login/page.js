"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as FaIcons from "react-icons/fa";
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function LoginPage() {
  const router = useRouter();

  // 'login_input' | 'setup_needed' | 'otp_needed' | 'change_password' | 'register'
  const [step, setStep] = useState('login_input');

  // 로그인 입력값
  const [userID, setUserID] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');

  // 서버가 발급한 중간 단계 토큰 + (최초 설정 시) QR 이미지
  const [stepToken, setStepToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // 회원가입 입력값
  const [regName, setRegName] = useState('');
  const [regID, setRegID] = useState('');
  const [regPW, setRegPW] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // 1. 이미 로그인된 세션(httpOnly 쿠키)이 있으면 바로 포털로
  useEffect(() => {
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => { if (data?.user) router.replace('/labportal'); })
      .catch(() => {});
  }, [router]);

  const resetToLogin = () => {
    setStep('login_input');
    setOtpToken('');
    setStepToken('');
    setQrDataUrl('');
    setPassword('');
  };

  // 2. [로그인 1단계] 아이디/비번 확인
  const handleCheckPw = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginStep: 'check_pw', userID, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || '로그인 실패');
        return;
      }

      if (data.status === 'setup_needed') {
        setStepToken(data.setupToken);
        setQrDataUrl(data.qrDataUrl);
        setStep('setup_needed');
      } else if (data.status === 'otp_needed') {
        setStepToken(data.pwToken);
        setStep('otp_needed');
      }
    } catch (err) {
      console.error(err);
      alert('서버 연결 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. [로그인 2단계] OTP 검증 → 서버가 세션 쿠키 발급
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginStep: 'verify_otp', userID, token: otpToken, stepToken }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // 관리자가 초기화한 임시 비밀번호로 들어왔으면 새 비밀번호를 먼저 설정
        if (data.mustChangePassword) {
          setStep('change_password');
          return;
        }
        router.replace('/labportal');
        return;
      }

      alert(data.message || '인증번호가 틀렸습니다.');
      // 중간 토큰이 만료된 경우엔 처음부터
      if (res.status === 401 && /만료/.test(data.message || '')) resetToLogin();
    } catch (error) {
      console.error("OTP Error:", error);
      alert('인증 오류 발생: 서버와 연결할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. [회원가입] 신청
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: regID, password: regPW, name: regName }),
      });
      const data = await res.json();

      if (res.ok) {
        alert('가입 신청 완료! 관리자 승인을 기다려주세요.');
        setStep('login_input');
        setRegName(''); setRegID(''); setRegPW('');
      } else {
        alert(data.message || '가입 신청 실패');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 화면 렌더링 ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
      <div style={{ padding: '40px', background: '#fff', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>

        <div style={{ marginBottom: '20px' }}>
          <FaIcons.FaLock size={40} color="#004094" />
          <h2 style={{ margin: '15px 0 5px', color: '#333' }}>SMID Lab Portal</h2>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Secure Access System</p>
        </div>

        {/* 1. ID/PW 입력 단계 */}
        {step === 'login_input' && (
          <form onSubmit={handleCheckPw} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text" placeholder="User ID" autoComplete="username"
              value={userID} onChange={(e) => setUserID(e.target.value)}
              style={inputStyle} required
            />
            <input
              type="password" placeholder="Password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle} required
            />

            <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>
              {isLoading ? 'Checking...' : 'Login'}
            </button>

            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button type="button" onClick={() => setStep('register')}
                style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
                <FaIcons.FaUserPlus /> 신입생 가입 신청
              </button>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa' }}>
                비밀번호나 OTP를 잃어버렸다면 교수님께 초기화를 요청하세요.
              </p>
            </div>
          </form>
        )}

        {/* 2. QR 코드 스캔 단계 (최초 1회) — QR은 서버에서 생성한 data URL */}
        {step === 'setup_needed' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ backgroundColor: '#f1f3f5', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
              <p style={{ fontSize: '0.9rem', color: '#004094', fontWeight: 'bold', margin: '0 0 10px 0' }}>🔒 최초 보안 설정</p>
              <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>Google Authenticator 앱을 켜고<br />아래 QR 코드를 스캔하세요.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', border: '1px solid #eee', padding: '10px', borderRadius: '10px' }}>
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- data URL이라 next/image 최적화 대상이 아님
                <img src={qrDataUrl} alt="OTP QR Code" width={180} height={180} />
              )}
            </div>
            <form onSubmit={handleVerifyOtp}>
              <input type="text" inputMode="numeric" maxLength="6" placeholder="인증번호 6자리" autoComplete="one-time-code"
                value={otpToken} onChange={(e) => setOtpToken(e.target.value)}
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem' }} autoFocus required />
              <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>
                {isLoading ? 'Verifying...' : '등록 및 로그인'}
              </button>
              <button type="button" onClick={resetToLogin} style={btnStyle('#aaa')}>처음으로</button>
            </form>
          </div>
        )}

        {/* 3. OTP 번호 입력 단계 (평소) */}
        {step === 'otp_needed' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '20px' }}>OTP 앱의 인증번호 6자리를 입력하세요.</p>
            <form onSubmit={handleVerifyOtp}>
              <input type="text" inputMode="numeric" maxLength="6" placeholder="000000" autoComplete="one-time-code"
                value={otpToken} onChange={(e) => setOtpToken(e.target.value)}
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem' }} autoFocus required />
              <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>
                {isLoading ? 'Verifying...' : 'Confirm'}
              </button>
              <button type="button" onClick={resetToLogin} style={btnStyle('#aaa')}>처음으로</button>
            </form>
          </div>
        )}

        {/* 4. 임시 비밀번호로 로그인한 경우 — 새 비밀번호 설정 (건너뛸 수 없음) */}
        {step === 'change_password' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ backgroundColor: '#fff4e5', padding: '15px', borderRadius: '10px', marginBottom: '15px', textAlign: 'left' }}>
              <p style={{ fontSize: '0.9rem', color: '#b26a00', fontWeight: 'bold', margin: '0 0 6px 0' }}>🔑 새 비밀번호를 설정해주세요</p>
              <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>관리자가 발급한 임시 비밀번호로 로그인했습니다. 계속하려면 본인만 아는 새 비밀번호로 바꿔야 합니다.</p>
            </div>
            <ChangePasswordForm
              forced
              currentLabel="임시 비밀번호"
              onSuccess={() => router.replace('/labportal')}
            />
          </div>
        )}

        {/* 5. 회원가입 신청 화면 */}
        {step === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', color: '#004094' }}>연구원 등록 신청</h3>
            <input type="text" placeholder="이름 (Name)" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} required />
            <input type="text" placeholder="아이디 (영문/숫자 3~20자)" autoComplete="username" value={regID} onChange={(e) => setRegID(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="비밀번호 (8자 이상)" autoComplete="new-password" minLength={8} value={regPW} onChange={(e) => setRegPW(e.target.value)} style={inputStyle} required />
            <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>{isLoading ? 'Processing...' : '신청하기'}</button>
            <button type="button" onClick={() => setStep('login_input')} style={btnStyle('#aaa')}>취소</button>
          </form>
        )}

      </div>
      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', transition: 'border 0.2s', width: '100%', boxSizing: 'border-box' };
const btnStyle = (bg) => ({ padding: '12px', background: bg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '5px', width: '100%' });
