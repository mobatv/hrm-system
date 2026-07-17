import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Thêm FileDown vào đây
import { LogOut, UserPlus, Trash2, Users, FileDown } from 'lucide-react'; 
// Thêm dòng import XLSX này vào (Rất quan trọng!)
import * as XLSX from 'xlsx'; 

// THAY LINK NÀY THÀNH LINK HTTPS CỦA HÀO TRÊN TAB PORTS (PORT 5000)
const API_URL = 'https://site--hrm-backend--qcgl9jmzwsw7.code.run/api/employees'; 

function App() {
  const [user, setUser] = useState(null); 
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ fullName: '', username: '', password: '' });
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = { monday: 'T2', tuesday: 'T3', wednesday: 'T4', thursday: 'T5', friday: 'T6', saturday: 'T7', sunday: 'CN' };
  const shifts = ['Ca 1', 'Ca 2', 'Ca 3'];

  useEffect(() => { if (user) fetchEmployees(); }, [user]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API_URL);
      setEmployees(res.data);
    } catch (err) { console.error("Error:", err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { username: form.username, password: form.password });
      setUser(res.data.user);
      alert("Chào " + res.data.user.fullName + "!");
    } catch (err) { alert("Sai tài khoản hoặc mật khẩu!"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/add`, form);
      setForm({ fullName: '', username: '', password: '' });
      fetchEmployees();
      alert("✅ Thêm thành công!");
    } catch (err) { alert("❌ Lỗi thêm nhân viên!"); }
  };

  const handleShiftChange = async (empId, day, shift) => {
    if (user.role !== 'Admin' && user.id !== empId) return alert("Bạn không có quyền!");
    try {
      const emp = employees.find(e => e._id === empId);
      const currentShifts = emp.availability?.[day] || [];
      const updatedShifts = currentShifts.includes(shift) 
        ? currentShifts.filter(s => s !== shift) 
        : [...currentShifts, shift];
      await axios.put(`${API_URL}/update-availability/${empId}`, { availability: { ...emp.availability, [day]: updatedShifts } });
      fetchEmployees();
    } catch (err) { alert("Lỗi cập nhật!"); }
  };
  const exportToExcel = () => {
    try {
      // 1. Tạo mảng dữ liệu cho Excel
      const data = employees.map(emp => {
        const row = { "Nhân viên": emp.fullName };
        days.forEach(day => {
          const shifts = emp.availability?.[day] || [];
          row[dayLabels[day]] = shifts.join(', ') || 'Trống';
        });
        return row;
      });

      // 2. Tạo worksheet từ mảng dữ liệu
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lịch Làm Việc");

      // 3. Xuất file
      XLSX.writeFile(workbook, `Lich_Lam_Viec_${new Date().toLocaleDateString()}.xlsx`);
      alert("✅ Đã xuất file Excel thành công!");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi xuất file Excel!");
    }
  };

  const deleteEmployee = async (id) => {
    if (user.role !== 'Admin') return alert("Chỉ Admin mới được xóa!");
    if (window.confirm("Xóa nhân viên này?")) {
      try {
        await axios.delete(`${API_URL}/delete/${id}`);
        fetchEmployees();
      } catch (err) { alert("Lỗi xóa!"); }
    }
  };
  const clearAllAvailability = async () => {
    if (!window.confirm("⚠️ CẢNH BÁO: Hành động này sẽ XÓA SẠCH toàn bộ lịch làm việc của TẤT CẢ nhân viên. Hào có chắc chắn muốn làm điều này không?")) {
      return;
    }

    try {
      // Tạo mảng các Promise để xóa tất cả cùng lúc cho nhanh
      const clearPromises = employees.map(emp => {
        const emptyAvailability = {
          monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        };
        return axios.put(`${API_URL}/update-availability/${emp._id}`, { availability: emptyAvailability });
      });

      await Promise.all(clearPromises);
      fetchEmployees(); // Cập nhật lại danh sách sau khi xóa
      alert("✅ Đã xóa sạch lịch làm việc của toàn bộ thành viên!");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi xóa toàn bộ lịch!");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">🦊 Đăng Nhập HRM</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input placeholder="Tên đăng nhập" className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
              value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
            <input type="password" placeholder="Mật khẩu" className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            <button className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-all">Vào Hệ Thống</button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> HRM Smart Schedule
          </h1>
          <div className="flex items-center gap-4">
             <span className="bg-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600">{user.role}</span>
             <button onClick={() => setUser(null)} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-red-600 transition-all">
               <LogOut size={16}/> Thoát
             </button>
          </div>
        </div>
        {user.role === 'Admin' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <form onSubmit={handleSubmit} className="flex gap-4 justify-center flex-wrap">
              <input placeholder="Họ Tên" className="px-4 py-2 border rounded-lg outline-none" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
              <input placeholder="Tên đăng nhập" className="px-4 py-2 border rounded-lg outline-none" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              <input type="password" placeholder="Mật khẩu" className="px-4 py-2 border rounded-lg outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                <UserPlus size={18} /> Thêm
                <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2">
                <FileDown size={18} /> Xuất Excel
                <button onClick={clearAllAvailability} className="bg-red-100 text-red-600 px-6 py-2 rounded-lg hover:bg-red-200 transition-all flex items-center gap-2 border border-red-300">
              <Trash2 size={18} /> Xóa toàn bộ ca
              </button>
              </button>
              </button>
            </form>
          </div>
        )}
        {/* Lớp vỏ ngoài cùng để bo góc và đổ bóng */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  
  {/* LỚP VỎ MỚI: Cho phép vuốt ngang (Horizontal Scroll) */}
        <div className="overflow-x-auto"> 
    
      <table className="w-full text-center min-w-[800px]"> {/* Thêm min-w-[800px] để bảng không bị co quá mức */}
        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
          <tr>
          <th className="p-4 text-left sticky left-0 bg-slate-100 z-10">Nhân Viên</th> {/* Cố định cột tên nhân viên */}
          {days.map(day => <th key={day} className="p-4">{dayLabels[day]}</th>)}
          {user.role === 'Admin' && <th className="p-4">Hành Động</th>}
          </tr>
        </thead>
        <tbody className="text-sm">
        {employees.map(emp => (
          <tr key={emp._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="p-4 text-left font-medium text-slate-700 sticky left-0 bg-white z-10">{emp.fullName}</td> {/* Cố định tên khi vuốt */}
            {days.map(day => (
              <td key={day} className="p-2 border-l border-slate-50">
                <div className="flex flex-col gap-1">
                  {shifts.map(shift => (
                    <label key={shift} className={`flex items-center gap-2 cursor-pointer text-[11px] transition-colors ${user.id === emp._id || user.role === 'Admin' ? 'text-slate-500 hover:text-blue-600' : 'text-slate-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={emp.availability?.[day]?.includes(shift) || false} 
                        onChange={(e) => handleShiftChange(emp._id, day, shift)}
                        disabled={user.role !== 'Admin' && user.id !== emp._id}
                      /> {shift}
                    </label>
                  ))}
                </div>
              </td>
            ))}
            {user.role === 'Admin' && (
              <td className="p-4">
                <button onClick={() => deleteEmployee(emp._id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

          </div>
    </div>
  );
}
export default App ;
