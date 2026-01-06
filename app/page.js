'use client';

import { useState, useMemo, useEffect } from 'react';

// ===== ตั้งค่า URL ของ Google Apps Script =====
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyIZD4ZpfgrPGe5VWKy208rVY8ShARzo5EKeql04Y3_MOxVsev3fmEsIBoT_U-IgS5GHw/exec';

// รายชื่อพนักงาน
const defaultEmployees = [
  'จุฑามาศ',
  'ขนิษฐา', 
  'ณัฐธิดา',
  'วรรณา',
  'จารุวรรณ',
  'นริศรา',
  'อภินันท์'
];

// สีพื้นหลังสำหรับแต่ละพนักงาน
const employeeColors = {
  'จุฑามาศ': '#c62828',
  'ขนิษฐา': '#1565c0',
  'ณัฐธิดา': '#2e7d32',
  'วรรณา': '#6a1b9a',
  'จารุวรรณ': '#e65100',
  'นริศรา': '#00838f',
  'อภินันท์': '#4527a0'
};

const extraColors = ['#d84315', '#00695c', '#283593', '#ad1457', '#558b2f', '#7b1fa2', '#1976d2'];

const getEmployeeColor = (name) => {
  if (employeeColors[name]) return employeeColors[name];
  const index = name.length % extraColors.length;
  return extraColors[index];
};

const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const formatThaiDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${thaiMonthsShort[d.getMonth()]}`;
};

const formatThaiDateFull = (dateStr) => {
  const d = new Date(dateStr);
  const year = (d.getFullYear() + 543).toString().slice(-2);
  return `${d.getDate()} ${thaiMonthsShort[d.getMonth()]} ${year}`;
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
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [loadTime, setLoadTime] = useState(null);
  const [saveTime, setSaveTime] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    const startTime = performance.now();
    
    try {
      const leavesRes = await fetch(`${SCRIPT_URL}?action=getLeaves`);
      const leavesData = await leavesRes.json();
      if (leavesData.success) {
        setLeaves(leavesData.data);
      }
      
      const empRes = await fetch(`${SCRIPT_URL}?action=getEmployees`);
      const empData = await empRes.json();
      if (empData.success && empData.data.length > 0) {
        setEmployees(empData.data);
      }
      
      const endTime = performance.now();
      setLoadTime(Math.round(endTime - startTime));
    } catch (err) {
      console.log('ใช้ข้อมูล demo');
      setLoadTime(0);
    }
    setLoadingData(false);
  };

  const leaveMap = useMemo(() => {
    const map = new Map();
    leaves.forEach(l => {
      let d = new Date(l.startDate);
      const end = new Date(l.endDate);
      while (d <= end) {
        const k = d.toISOString().slice(0, 10);
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
    if (!day || !employee) return;
    const dateStr = new Date(month.getFullYear(), month.getMonth(), day).toISOString().slice(0, 10);
    
    if (leaveMap.has(dateStr)) {
      notify('วันนี้มีคนลาแล้ว', false);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
      } else {
        let d = new Date(startDate);
        while (d <= new Date(dateStr)) {
          if (leaveMap.has(d.toISOString().slice(0, 10))) {
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

  const clear = () => { setStartDate(null); setEndDate(null); };

  const submit = async () => {
    if (!employee || !startDate) return;
    setLoading(true);
    setSaveTime(null);
    
    const startTime = performance.now();
    const now = new Date();
    const createdDate = now.toISOString().slice(0, 10);
    const createdTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    const newLeave = { 
      id: Date.now(), 
      name: employee, 
      startDate, 
      endDate: endDate || startDate,
      createdDate,
      createdTime
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addLeave', ...newLeave })
      });
      const data = await res.json();
      
      const endTime = performance.now();
      setSaveTime(Math.round(endTime - startTime));
      
      if (data.success) {
        setLeaves([...leaves, newLeave]);
        clear();
        setEmployee('');
        notify(`บันทึกแล้ว (${Math.round(endTime - startTime)} ms)`);
      } else {
        notify(data.message || 'เกิดข้อผิดพลาด', false);
      }
    } catch (err) {
      setLeaves([...leaves, newLeave]);
      clear();
      setEmployee('');
      notify('บันทึกแล้ว (offline)');
    }
    
    setLoading(false);
  };

  const addEmployee = async () => {
    if (!newEmployeeName.trim()) return;
    
    const name = newEmployeeName.trim();
    if (employees.includes(name)) {
      notify('มีชื่อนี้แล้ว', false);
      return;
    }

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addEmployee', name })
      });
    } catch (err) {}

    setEmployees([...employees, name]);
    setNewEmployeeName('');
    setShowAddEmployee(false);
    notify('เพิ่มพนักงานแล้ว');
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

  const today = new Date().toISOString().slice(0, 10);
  const daysCount = startDate ? (endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / 864e5) + 1 : 1) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#d0d0d0',
      fontFamily: "'Prompt', sans-serif"
    }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: toast.ok ? '#1a1a1a' : '#c62828',
          color: 'white',
          padding: '14px 24px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}>{toast.msg}</div>
      )}
      
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)',
          background: '#1a1a1a',
          color: 'white',
          padding: '14px 18px',
          borderRadius: 12,
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          minWidth: 220,
          border: '2px solid #333'
        }}>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #444' }}>
            วันลา: {formatThaiDateFull(tooltip.date)}
          </div>
          {tooltip.data.map((item, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < tooltip.data.length - 1 ? '1px solid #333' : 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: getEmployeeColor(item.name) }}></span>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>บันทึกเมื่อ {formatThaiDateFull(item.createdDate)} เวลา {item.createdTime} น.</div>
            </div>
          ))}
        </div>
      )}
      
      <header style={{
        background: '#1a1a1a',
        color: 'white',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>📅 ระบบลาพักร้อน</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {loadTime !== null && (
            <span style={{ background: '#4caf50', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
              โหลด: {loadTime} ms
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: '#4fc3f7', letterSpacing: 1 }}>QC TEAM</span>
        </div>
      </header>

      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: 28,
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 28,
        alignItems: 'start'
      }}>
        <aside>
          <div style={{
            background: 'white',
            border: '3px solid #888',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            paddingBottom: 20
          }}>
            <div style={{
              background: '#1a1a1a',
              color: 'white',
              padding: '16px 20px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: '13px 13px 0 0'
            }}>ลงทะเบียนลา</div>
            
            <div style={{
              margin: '18px 20px 0',
              padding: '14px 16px',
              background: '#fffde7',
              border: '3px solid #fbc02d',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: '#5d4037'
            }}>
              {!employee ? '① เลือกพนักงานก่อน' : !startDate ? '② คลิกวันเริ่มต้นในปฏิทิน' : !endDate ? '③ คลิกวันสิ้นสุด หรือบันทึกเลย' : '✓ พร้อมบันทึก!'}
            </div>

            <div style={{ margin: '20px 20px 0' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>พนักงาน</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select 
                  value={employee} 
                  onChange={e => { setEmployee(e.target.value); clear(); }}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    fontSize: 15,
                    fontFamily: 'inherit',
                    border: '3px solid #999',
                    borderRadius: 10,
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(n => <option key={n}>{n}</option>)}
                </select>
                <button 
                  onClick={() => setShowAddEmployee(true)}
                  style={{
                    width: 52,
                    background: '#2e7d32',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 26,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >+</button>
              </div>
            </div>

            {showAddEmployee && (
              <div style={{
                margin: '12px 20px 0',
                padding: 14,
                background: '#e8f5e9',
                border: '3px solid #4caf50',
                borderRadius: 10
              }}>
                <input 
                  type="text" 
                  placeholder="ชื่อพนักงานใหม่"
                  value={newEmployeeName}
                  onChange={e => setNewEmployeeName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '2px solid #999',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    marginBottom: 10,
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addEmployee} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, background: '#4caf50', color: 'white' }}>เพิ่ม</button>
                  <button onClick={() => { setShowAddEmployee(false); setNewEmployeeName(''); }} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, background: '#e0e0e0', color: '#333' }}>ยกเลิก</button>
                </div>
              </div>
            )}

            {startDate && (
              <div style={{
                margin: '20px 20px 0',
                padding: 18,
                background: '#e3f2fd',
                border: '3px solid #1976d2',
                borderRadius: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#1565c0', marginBottom: 4, fontWeight: 500 }}>เริ่มต้น</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0d47a1' }}>{formatThaiDate(startDate)}</div>
                  </div>
                  {endDate && (
                    <>
                      <div style={{ fontSize: 22, color: '#1976d2' }}>➜</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#1565c0', marginBottom: 4, fontWeight: 500 }}>สิ้นสุด</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#0d47a1' }}>{formatThaiDate(endDate)}</div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ marginTop: 14, textAlign: 'center', fontSize: 36, fontWeight: 700, color: '#0d47a1' }}>{daysCount} วัน</div>
              </div>
            )}

            <div style={{ margin: '20px 20px 0', display: 'flex', gap: 10 }}>
              <button 
                onClick={submit} 
                disabled={loading || !startDate || !employee}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: loading || !startDate || !employee ? '#aaa' : '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: loading || !startDate || !employee ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
              {startDate && (
                <button 
                  onClick={clear}
                  style={{
                    padding: '14px 18px',
                    background: 'white',
                    color: '#333',
                    border: '3px solid #999',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >ล้าง</button>
              )}
            </div>
            
            {saveTime !== null && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#4caf50', fontWeight: 500 }}>
                บันทึกใช้เวลา {saveTime} ms
              </div>
            )}
          </div>
        </aside>

        <main>
          <div style={{
            background: 'white',
            border: '3px solid #888',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1a1a1a',
              color: 'white',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button 
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                style={{
                  width: 44,
                  height: 44,
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 18,
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >◄</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{thaiMonths[month.getMonth()]}</div>
                <div style={{ fontSize: 16, opacity: 0.8 }}>{month.getFullYear() + 543}</div>
              </div>
              <button 
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                style={{
                  width: 44,
                  height: 44,
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 18,
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >►</button>
            </div>

            {loadingData && (
              <div style={{
                background: '#fff3e0',
                color: '#e65100',
                padding: 10,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                borderBottom: '2px solid #ffb74d'
              }}>กำลังโหลดข้อมูล...</div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#f0f0f0',
              borderBottom: '3px solid #888'
            }}>
              {days.map((d, i) => (
                <div key={d} style={{
                  padding: 14,
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  color: i === 0 || i === 6 ? '#c62828' : '#333'
                }}>{d}</div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: 'white'
            }}>
              {calendar.map((day, i) => {
                if (!day) return (
                  <div key={`e${i}`} style={{
                    minHeight: 110,
                    padding: 10,
                    borderRight: i % 7 === 6 ? 'none' : '2px solid #bbb',
                    borderBottom: '2px solid #bbb',
                    background: '#f0f0f0'
                  }} />
                );
                
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const dateStr = date.toISOString().slice(0, 10);
                const data = leaveMap.get(dateStr) || [];
                const hasLeave = data.length > 0;
                const isToday = dateStr === today;
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                const range = inRange(dateStr);
                const start = isStart(dateStr);
                const end = isEnd(dateStr);
                const canClick = employee && !hasLeave;

                let cellBg = 'white';
                if (start || end) cellBg = '#1a1a1a';
                else if (range) cellBg = '#bbdefb';
                else if (isToday) cellBg = '#e65100';
                else if (hasLeave) cellBg = '#fff8e1';

                return (
                  <div 
                    key={day}
                    onClick={() => canClick && handleClick(day)}
                    onMouseEnter={(e) => {
                      if (hasLeave) handleMouseEnter(e, data, dateStr);
                      if (startDate && !endDate && canClick) setHover(dateStr);
                    }}
                    onMouseLeave={() => { setTooltip(null); setHover(null); }}
                    style={{
                      minHeight: 110,
                      padding: 10,
                      borderRight: (i + 1) % 7 === 0 ? 'none' : '2px solid #bbb',
                      borderBottom: '2px solid #bbb',
                      display: 'flex',
                      flexDirection: 'column',
                      background: cellBg,
                      cursor: canClick ? 'pointer' : 'default'
                    }}
                  >
                    <span style={{
                      width: 34,
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: (start || end) ? 'white' : isToday ? '#e65100' : weekend ? '#c62828' : '#333',
                      borderRadius: 8,
                      background: (start || end) ? 'transparent' : isToday ? '#fff' : 'transparent'
                    }}>{day}</span>
                    
                    {hasLeave && (
                      <div style={{ flex: 1, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {data.map((item, j) => (
                          <div key={j} style={{
                            backgroundColor: getEmployeeColor(item.name),
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#ffffff',
                            textAlign: 'center',
                            letterSpacing: 1
                          }}>
                            {item.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              display: 'flex',
              gap: 24,
              padding: '16px 24px',
              background: '#f0f0f0',
              borderTop: '3px solid #888'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#333' }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: '#fff8e1', border: '3px solid #ffb74d' }}></span> มีคนลา
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#333' }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: '#1a1a1a' }}></span> วันที่เลือก
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#333' }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: '#e65100' }}></span> วันนี้
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
