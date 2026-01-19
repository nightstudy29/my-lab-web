import Link from 'next/link'; // 페이지 이동을 도와주는 기능

export default function Navbar() {
  return (
    <nav style={{ 
      padding: '20px', 
      borderBottom: '1px solid #ddd',
      display: 'flex',
      gap: '20px',
      background: 'white'
    }}>
      {/* 로고 혹은 연구실 이름 */}
      <div style={{ fontWeight: 'bold', marginRight: 'auto' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'black' }}>
          My Lab 🧪
        </Link>
      </div>

      {/* 메뉴 링크들 */}
      <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link>
      <Link href="/members" style={{ textDecoration: 'none', color: '#333' }}>Members</Link>
      <Link href="/publications" style={{ textDecoration: 'none', color: '#333' }}>Publications</Link>
    </nav>
  );
}