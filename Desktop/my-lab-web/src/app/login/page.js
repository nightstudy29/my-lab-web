"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as FaIcons from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  
  // 상태 관리
  const [step, setStep] = useState('login_input'); 
  
  // 입력 값
  const [userID, setUserID] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [tempSecret, setTempSecret] = useState(''); 

  // 회원가입용
  const [regName, setRegName] = useState('');
  const [regID, setRegID] = useState('');
  const [regPW, setRegPW] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // 1. 페이지 들어오자마자 유효기간 검사
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      
      // ⏰ 유효기간 체크 (expiry가 없거나, 현재 시간이 expiry보다 크면 만료)
      if (!userData.expiry || Date.now() > userData.expiry) {
        localStorage.removeItem('user'); // 만료됐으니 삭제
        return; // 로그인 페이지에 머무름
      }

      // 아직 싱싱하면 포털로 이동
      router.push('/labportal');
    }
  }, []);

  // 2. [로그인] 아이디/비번 검증 요청
  const handleCheckPw = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            loginStep: 'check_pw', 
            userID: userID,        
            password: password 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.status === 'setup_needed') {
            setTempSecret(data.tempSecret);
            setStep('setup_needed');
        } else if (data.status === 'otp_needed') {
            setStep('otp_needed');
        }
      } else {
        alert(data.message || '로그인 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 연결 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. [로그인] OTP 번호 검증 요청 (3시간 유효기간 로직 포함)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            loginStep: 'verify_otp',
            userID: userID,
            token: otpToken,
            tempSecret: tempSecret || null 
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        // ⏰ 3시간(ms 단위) 유효기간 설정
        const THREE_HOURS = 3 * 60 * 60 * 1000; 
        const expiryTime = Date.now() + THREE_HOURS;

        const sessionData = {
          ...data.user,
          expiry: expiryTime // 유효기간 추가
        };

        // 로컬 스토리지에 저장하고 이동
        localStorage.setItem('user', JSON.stringify(sessionData));
        router.push('/labportal'); 
      } else {
        alert(data.message || '인증번호가 틀렸습니다.');
      }
    } catch (error) {
        console.error("OTP Error:", error);
        alert('인증 오류 발생: 서버와 연결할 수 없거나 코드가 잘못되었습니다.');
    } finally {
        setIsLoading(false);
    }
  };
  
  // 4. [회원가입] 신청 (수정된 부분!)
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userID: regID,  // 👈 [중요] userId -> userID 로 수정됨 (대소문자 일치)
            password: regPW, 
            name: regName 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('가입 신청 완료! 관리자 승인을 기다려주세요.');
        setStep('login_input');
        setRegName(''); setRegID(''); setRegPW('');
      } else {
        alert(data.message || '가입 신청 실패'); // data.error -> data.message로 통일
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
              type="text" placeholder="User ID" 
              value={userID} onChange={(e) => setUserID(e.target.value)} 
              style={inputStyle} required
            />
            <input 
              type="password" placeholder="Password" 
              value={password} onChange={(e) => setPassword(e.target.value)} 
              style={inputStyle} required
            />
            
            <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>
              {isLoading ? 'Checking...' : 'Login'}
            </button>
            
            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <button type="button" onClick={() => setStep('register')} 
                style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
                <FaIcons.FaUserPlus /> 신입생 가입 신청
              </button>
            </div>
          </form>
        )}

        {/* 2. QR 코드 스캔 단계 (최초 1회) */}
        {step === 'setup_needed' && (
            <div style={{animation: 'fadeIn 0.5s'}}>
              <div style={{backgroundColor:'#f1f3f5', padding:'15px', borderRadius:'10px', marginBottom:'15px'}}>
                <p style={{fontSize:'0.9rem', color:'#004094', fontWeight:'bold', margin:'0 0 10px 0'}}>🔒 최초 보안 설정</p>
                <p style={{fontSize:'0.8rem', color:'#555', margin:0}}>Google Authenticator 앱을 켜고<br/>아래 QR 코드를 스캔하세요.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', border:'1px solid #eee', padding:'10px', borderRadius:'10px' }}>
                 <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`otpauth://totp/SMID-LAB:${userID}?secret=${tempSecret}&issuer=SMID-LAB`)}`}
                    alt="OTP QR Code" 
                 />
              </div>
              <form onSubmit={handleVerifyOtp}>
                 <input type="text" maxLength="6" placeholder="인증번호 6자리" 
                   value={otpToken} onChange={(e) => setOtpToken(e.target.value)} 
                   style={{...inputStyle, textAlign:'center', letterSpacing:'5px', fontSize:'1.2rem'}} autoFocus required />
                 <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>등록 및 로그인</button>
              </form>
            </div>
        )}

        {/* 3. OTP 번호 입력 단계 (평소) */}
        {step === 'otp_needed' && (
            <div style={{animation: 'fadeIn 0.5s'}}>
              <p style={{fontSize:'0.9rem', color:'#555', marginBottom:'20px'}}>OTP 앱의 인증번호 6자리를 입력하세요.</p>
              <form onSubmit={handleVerifyOtp}>
                 <input type="text" maxLength="6" placeholder="000000" 
                   value={otpToken} onChange={(e) => setOtpToken(e.target.value)} 
                   style={{...inputStyle, textAlign:'center', letterSpacing:'5px', fontSize:'1.5rem'}} autoFocus required />
                 <button type="submit" disabled={isLoading} style={btnStyle('#004094')}>
                     {isLoading ? 'Verifying...' : 'Confirm'}
                 </button>
              </form>
            </div>
        )}

        {/* 4. 회원가입 신청 화면 */}
        {step === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', color: '#004094' }}>연구원 등록 신청</h3>
            <input type="text" placeholder="이름 (Name)" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} required />
            <input type="text" placeholder="아이디 (ID)" value={regID} onChange={(e) => setRegID(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="비밀번호 (PW)" value={regPW} onChange={(e) => setRegPW(e.target.value)} style={inputStyle} required />
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