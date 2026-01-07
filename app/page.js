'use client';

import { useState, useMemo, useEffect } from 'react';

// ===== ตั้งค่า Supabase =====
const SUPABASE_URL = 'https://kylizhmvqpzdhylzvwog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bGl6aG12cXB6ZGh5bHp2d29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzY4NzUsImV4cCI6MjA4MzI1Mjg3NX0.01L8sSvU55QVugeukEqAUBRQUMtstUuQXtZqYWjRFdA';

// รายชื่อพนักงานเริ่มต้น
const defaultEmployees = [
  'จุฑามาศ',
  'ขนิษฐา', 
  'ณัฐธิดา',
  'วรรณา',
  'จารุวรรณ',
  'นริศรา',
  'อภินันท์'
];

// สีพื้นหลังสำหรับแต่ละพนักงาน - Modern gradient colors
const employeeGradients = {
  'จุฑามาศ': 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
  'ขนิษฐา': 'linear-gradient(135deg, #4facfe, #00f2fe)',
  'ณัฐธิดา': 'linear-gradient(135deg, #43e97b, #38f9d7)',
  'วรรณา': 'linear-gradient(135deg, #a855f7, #6366f1)',
  'จารุวรรณ': 'linear-gradient(135deg, #f97316, #facc15)',
  'นริศรา': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'อภินันท์': 'linear-gradient(135deg, #8b5cf6, #d946ef)'
};

const extraGradients = [
  'linear-gradient(135deg, #f43f5e, #fb7185)',
  'linear-gradient(135deg, #14b8a6, #22d3ee)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
  'linear-gradient(135deg, #84cc16, #a3e635)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #0ea5e9, #38bdf8)'
];

const getEmployeeGradient = (name) => {
  if (employeeGradients[name]) return employeeGradients[name];
  const index = name.length % extraGradients.length;
  return extraGradients[index];
};

const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const formatThaiDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${thaiMonthsShort[d.getMonth()]}`;
};

const formatThaiDateFull = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const year = (d.getFullYear() + 543).toString().slice(-2);
  return `${d.getDate()} ${thaiMonthsShort[d.getMonth()]} ${year}`;
};

const toLocalDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const supabaseFetch = async (table, method = 'GET', body = null, query = '') => {
  const options = {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : ''
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, options);
  return res.json();
};

export default function Home() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState(defaultEmployees);
  const [month, setMonth] = useState(new Date());
  const [employee, setEmployee] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [loadTime, setLoadTime] = useState(null);
  const [saveTime, setSaveTime] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    const startTime = performance.now();
    
    try {
      const [leavesData, empData] = await Promise.all([
        supabaseFetch('leaves', 'GET', null, '?select=*&order=created_at.desc'),
        supabaseFetch('employees', 'GET', null, '?select=*&order=name.asc')
      ]);
      
      if (leavesData.message || empData.message) {
        setError(leavesData.message || empData.message);
        setLoadingData(false);
        return;
      }
      
      if (Array.isArray(leavesData)) {
        setLeaves(leavesData.map(l => ({
          id: l.id,
          name: l.name,
          startDate: l.start_date,
          endDate: l.end_date,
          createdDate: l.created_date,
          createdTime: l.created_time
        })));
      }
      
      if (Array.isArray(empData) && empData.length > 0) {
        setEmployees(empData.map(e => e.name));
      }
      
      const endTime = performance.now();
      setLoadTime(Math.round(endTime - startTime));
    } catch (err) {
      console.error('Load error:', err);
      setError('ไม่สามารถเชื่อมต่อ Supabase: ' + err.message);
    }
    setLoadingData(false);
  };

  const leaveMap = useMemo(() => {
    const map = new Map();
    leaves.forEach(l => {
      let d = new Date(l.startDate + 'T00:00:00');
      const end = new Date(l.endDate + 'T00:00:00');
      while (d <= end) {
        const k = toLocalDateStr(d);
        map.set(k, [...(map.get(k) || []), { 
          name: l.name, 
          createdDate: l.createdDate,
          createdTime: l.createdTime 
        }]);
        d.setDate(d.getDate() + 1);
      }
    });
    return map;
  }, [leaves]);

  const calendar = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  }, [month]);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleClick = (day) => {
    if (!day) return;
    
    // ป้องกันคลิกขณะกำลังโหลดข้อมูล
    if (loadingData) {
      notify('กรุณารอโหลดข้อมูลก่อน', false);
      return;
    }
    
    const dateStr = toLocalDateStr(new Date(month.getFullYear(), month.getMonth(), day));

    // เช็คว่าวันนี้มีคนลาแล้วหรือไม่
    if (leaveMap.has(dateStr)) {
      notify('วันนี้มีคนลาแล้ว', false);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
      setEmployee('');
    } else {
      if (dateStr < startDate) {
        // เช็คว่าวันใหม่ที่เลือกมีคนลาไหม
        if (leaveMap.has(dateStr)) {
          notify('วันนี้มีคนลาแล้ว', false);
          return;
        }
        setStartDate(dateStr);
      } else {
        // เช็คทุกวันในช่วงที่เลือกว่ามีคนลาอยู่ไหม
        let d = new Date(startDate + 'T00:00:00');
        while (d <= new Date(dateStr + 'T00:00:00')) {
          if (leaveMap.has(toLocalDateStr(d))) {
            notify('ช่วงนี้มีวันที่ลาแล้ว', false);
            return;
          }
          d.setDate(d.getDate() + 1);
        }
        setEndDate(dateStr);
      }
    }
  };

  const inRange = (dateStr) => {
    if (!startDate) return false;
    const end = endDate || hover;
    if (!end) return dateStr === startDate;
    const s = startDate < end ? startDate : end;
    const e = startDate < end ? end : startDate;
    return dateStr >= s && dateStr <= e;
  };

  const isStart = (dateStr) => dateStr === startDate;
  const isEnd = (dateStr) => dateStr === (endDate || (hover && hover > startDate ? hover : null));

  const clear = () => { setStartDate(null); setEndDate(null); setEmployee(''); };

  const submit = async () => {
    if (!employee || !startDate) return;
    setLoading(true);
    setSaveTime(null);
    
    const startTime = performance.now();
    const now = new Date();
    const createdDate = toLocalDateStr(now);
    const createdTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    const newLeave = { 
      name: employee, 
      start_date: startDate, 
      end_date: endDate || startDate,
      created_date: createdDate,
      created_time: createdTime
    };

    try {
      const result = await supabaseFetch('leaves', 'POST', newLeave);
      
      const endTime = performance.now();
      setSaveTime(Math.round(endTime - startTime));
      
      if (result && result[0]) {
        setLeaves([...leaves, {
          id: result[0].id,
          name: result[0].name,
          startDate: result[0].start_date,
          endDate: result[0].end_date,
          createdDate: result[0].created_date,
          createdTime: result[0].created_time
        }]);
        clear();
        notify(`บันทึกแล้ว (${Math.round(endTime - startTime)} ms)`);
      } else if (result.message) {
        notify(result.message, false);
      }
    } catch (err) {
      notify('เกิดข้อผิดพลาด: ' + err.message, false);
    }
    
    setLoading(false);
  };

  const handleMouseEnter = (e, data, dateStr) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      data,
      date: dateStr
    });
  };

  const today = toLocalDateStr(new Date());
  const daysCount = startDate ? (endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / 864e5) + 1 : 1) : 0;

  const cellHeight = isMobile ? 70 : 120;
  const cellPadding = isMobile ? 6 : 10;
  const dayNumSize = isMobile ? 24 : 36;
  const fontSize = isMobile ? 10 : 13;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-20%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          left: isMobile ? 24 : 'auto',
          background: toast.ok 
            ? 'linear-gradient(135deg, #10b981, #059669)' 
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '16px 28px',
          borderRadius: 16,
          fontSize: 15,
          fontWeight: 600,
          zIndex: 999,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.3s ease-out'
        }}>{toast.msg}</div>
      )}
      
      {/* Tooltip */}
      {tooltip && !isMobile && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          padding: '18px 22px',
          borderRadius: 16,
          zIndex: 1000,
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          minWidth: 240,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            fontSize: 13, 
            color: 'rgba(255,255,255,0.6)', 
            marginBottom: 12, 
            paddingBottom: 12, 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 16 }}>📅</span>
            {formatThaiDateFull(tooltip.date)}
          </div>
          {tooltip.data.map((item, i) => (
            <div key={i} style={{ 
              padding: '10px 0', 
              borderBottom: i < tooltip.data.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' 
            }}>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 700, 
                marginBottom: 6, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10 
              }}>
                <span style={{ 
                  width: 14, 
                  height: 14, 
                  borderRadius: 6, 
                  background: getEmployeeGradient(item.name),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}></span>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', paddingLeft: 24 }}>
                บันทึกเมื่อ {formatThaiDateFull(item.createdDate)} • {item.createdTime} น.
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        color: 'white',
        padding: isMobile ? '16px 20px' : '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? 18 : 24, 
          fontWeight: 700, 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <span style={{ 
            fontSize: isMobile ? 24 : 32,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}>🏖️</span>
          ระบบลาพักร้อน
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          {loadTime !== null && (
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.9)', 
              color: 'white', 
              padding: '6px 14px', 
              borderRadius: 20, 
              fontSize: 12, 
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              ⚡ {loadTime} ms
            </span>
          )}
          <span style={{ 
            fontSize: isMobile ? 13 : 15, 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 1
          }}>QC TEAM</span>
        </div>
      </header>

      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: isMobile ? 16 : 32,
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '360px 1fr',
        gap: isMobile ? 20 : 32,
        alignItems: 'start'
      }}>
        {/* Sidebar */}
        <aside style={{ width: '100%' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #334155)',
              color: 'white',
              padding: '20px 24px',
              fontSize: 17,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{ fontSize: 20 }}>✍️</span>
              ลงทะเบียนลา
            </div>
            
            <div style={{
              margin: '20px 20px 0',
              padding: '16px 18px',
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 15px rgba(251, 191, 36, 0.2)'
            }}>
              <span style={{ fontSize: 18 }}>
                {!startDate ? '👆' : !endDate ? '📅' : !employee ? '✏️' : '✅'}
              </span>
              {!startDate ? 'คลิกวันเริ่มต้นในปฏิทิน' : !endDate ? 'คลิกวันสิ้นสุด หรือพิมพ์ชื่อเลย' : !employee ? 'พิมพ์ชื่อพนักงาน' : 'พร้อมบันทึก!'}
            </div>

            {startDate && (
              <div style={{ margin: '20px 20px 0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: '#475569', 
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>ชื่อพนักงาน</label>
                <input 
                  type="text"
                  value={employee} 
                  onChange={e => setEmployee(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && employee && submit()}
                  placeholder="พิมพ์ชื่อพนักงาน..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    fontSize: 16,
                    fontFamily: 'inherit',
                    border: '2px solid #e2e8f0',
                    borderRadius: 14,
                    background: 'white',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}

            {startDate && (
              <div style={{
                margin: '20px 20px 0',
                padding: 20,
                background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                borderRadius: 16,
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>เริ่มต้น</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#5b21b6' }}>{formatThaiDate(startDate)}</div>
                  </div>
                  {endDate && (
                    <>
                      <div style={{ 
                        fontSize: 24, 
                        color: '#8b5cf6',
                        background: 'white',
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)'
                      }}>→</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>สิ้นสุด</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#5b21b6' }}>{formatThaiDate(endDate)}</div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ 
                  marginTop: 16, 
                  textAlign: 'center', 
                  fontSize: 42, 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>{daysCount} วัน</div>
              </div>
            )}

            <div style={{ margin: '20px 20px', display: 'flex', gap: 12 }}>
              <button 
                onClick={submit} 
                disabled={loading || !startDate || !employee}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: loading || !startDate || !employee 
                    ? '#cbd5e1' 
                    : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: loading || !startDate || !employee ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !startDate || !employee 
                    ? 'none' 
                    : '0 10px 30px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading ? (
                  <>
                    <span style={{ 
                      width: 18, 
                      height: 18, 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>💾 บันทึก</>
                )}
              </button>
              {startDate && (
                <button 
                  onClick={clear}
                  style={{
                    padding: '16px 20px',
                    background: 'white',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >ล้าง</button>
              )}
            </div>
            
            {saveTime !== null && (
              <div style={{ 
                marginBottom: 20, 
                textAlign: 'center', 
                fontSize: 13, 
                color: '#10b981', 
                fontWeight: 600 
              }}>
                ⚡ บันทึกใช้เวลา {saveTime} ms
              </div>
            )}
          </div>
        </aside>

        {/* Calendar */}
        <main style={{ width: '100%' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            {/* Calendar header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #334155)',
              color: 'white',
              padding: isMobile ? '16px 20px' : '24px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button 
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                style={{
                  width: isMobile ? 44 : 52,
                  height: isMobile ? 44 : 52,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 14,
                  color: 'white',
                  fontSize: 20,
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >◀</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: isMobile ? 22 : 30, 
                  fontWeight: 800,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>{thaiMonths[month.getMonth()]}</div>
                <div style={{ 
                  fontSize: isMobile ? 14 : 16, 
                  opacity: 0.7,
                  fontWeight: 500,
                  marginTop: 4
                }}>พ.ศ. {month.getFullYear() + 543}</div>
              </div>
              <button 
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                style={{
                  width: isMobile ? 44 : 52,
                  height: isMobile ? 44 : 52,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 14,
                  color: 'white',
                  fontSize: 20,
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >▶</button>
            </div>

            {loadingData && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                color: '#92400e',
                padding: 14,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}>
                <span style={{ 
                  width: 18, 
                  height: 18, 
                  border: '2px solid rgba(146, 64, 14, 0.3)', 
                  borderTopColor: '#92400e',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                กำลังโหลดข้อมูล...
              </div>
            )}
            
            {error && (
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                color: '#dc2626',
                padding: 16,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}>
                ❌ {error}
                <button onClick={loadData} style={{ 
                  padding: '8px 16px', 
                  background: '#dc2626', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 8, 
                  cursor: 'pointer', 
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: 13
                }}>ลองใหม่</button>
              </div>
            )}

            {/* Day headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
            }}>
              {days.map((d, i) => (
                <div key={d} style={{
                  padding: isMobile ? 12 : 18,
                  textAlign: 'center',
                  fontSize: isMobile ? 13 : 15,
                  fontWeight: 800,
                  color: i === 0 ? '#ef4444' : i === 6 ? '#f97316' : '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#fafafa'
            }}>
              {calendar.map((day, i) => {
                if (!day) return (
                  <div key={`e${i}`} style={{
                    minHeight: cellHeight,
                    padding: cellPadding,
                    borderRight: i % 7 === 6 ? 'none' : '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#f8fafc'
                  }} />
                );
                
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const dateStr = toLocalDateStr(date);
                const data = leaveMap.get(dateStr) || [];
                const hasLeave = data.length > 0;
                const isToday = dateStr === today;
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                const range = inRange(dateStr);
                const start = isStart(dateStr);
                const end = isEnd(dateStr);
                const canClick = !hasLeave && !loadingData;
                const isHovered = hoverCell === dateStr;

                let cellBg = 'white';
                let cellShadow = 'none';
                if (start || end) {
                  cellBg = 'linear-gradient(135deg, #8b5cf6, #6366f1)';
                  cellShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
                } else if (range) {
                  cellBg = 'linear-gradient(135deg, #ede9fe, #ddd6fe)';
                } else if (isToday) {
                  cellBg = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
                  cellShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
                } else if (hasLeave) {
                  cellBg = 'linear-gradient(135deg, #fef9c3, #fef08a)';
                } else if (isHovered && canClick) {
                  cellBg = '#f1f5f9';
                }

                return (
                  <div 
                    key={day}
                    onClick={() => canClick && handleClick(day)}
                    onMouseEnter={(e) => {
                      setHoverCell(dateStr);
                      if (hasLeave && !isMobile) handleMouseEnter(e, data, dateStr);
                      if (startDate && !endDate && canClick) setHover(dateStr);
                    }}
                    onMouseLeave={() => { setTooltip(null); setHover(null); setHoverCell(null); }}
                    style={{
                      minHeight: cellHeight,
                      padding: cellPadding,
                      borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      background: cellBg,
                      cursor: canClick ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      boxShadow: cellShadow,
                      position: 'relative',
                      zIndex: (start || end || isToday) ? 2 : 1
                    }}
                  >
                    <span style={{
                      width: dayNumSize,
                      height: dayNumSize,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? 13 : 17,
                      fontWeight: 800,
                      color: (start || end) ? 'white' : isToday ? 'white' : weekend ? (date.getDay() === 0 ? '#ef4444' : '#f97316') : '#334155',
                      borderRadius: 10,
                      background: 'transparent'
                    }}>{day}</span>
                    
                    {hasLeave && (
                      <div style={{ 
                        flex: 1, 
                        marginTop: isMobile ? 4 : 8, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: isMobile ? 3 : 5 
                      }}>
                        {data.map((item, j) => (
                          <div key={j} style={{
                            background: getEmployeeGradient(item.name),
                            padding: isMobile ? '5px 4px' : '10px 12px',
                            borderRadius: isMobile ? 6 : 10,
                            fontSize: fontSize,
                            fontWeight: 700,
                            color: '#ffffff',
                            textAlign: 'center',
                            letterSpacing: isMobile ? 0 : 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}>
                            {isMobile ? item.name.slice(0, 4) : item.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              gap: isMobile ? 16 : 28,
              padding: isMobile ? '16px 20px' : '20px 32px',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 12 : 14, fontWeight: 600, color: '#475569' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg, #fef9c3, #fef08a)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}></span> มีคนลา
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 12 : 14, fontWeight: 600, color: '#475569' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)' }}></span> วันที่เลือก
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 12 : 14, fontWeight: 600, color: '#475569' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)' }}></span> วันนี้
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
