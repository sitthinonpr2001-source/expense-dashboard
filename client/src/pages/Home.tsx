import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, BarChart3, Trash2, Edit2 } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Expense {
  id: string;
  date: string;
  item: string;
  category: string;
  amount: number;
  paid: boolean;
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", date: "2026-05-18", item: "ค่าอินเทอร์เน็ต", category: "ยูทิลิตี้", amount: 640.93, paid: true },
    { id: "2", date: "2026-05-15", item: "ค่าไฟเดือน เม.ย.", category: "ยูทิลิตี้", amount: 2450.0, paid: false },
    { id: "3", date: "2026-05-10", item: "สมาชิก Netflix", category: "ความบันเทิง", amount: 419.0, paid: true },
  ]);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortData, setSortData] = useState("date-desc");

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const monthDisplay = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`;

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // Filter and sort expenses
  let filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.item.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesStatus = filterStatus === "all" || (filterStatus === "paid" ? exp.paid : !exp.paid);
    return matchesSearch && matchesStatus;
  });

  if (sortData === "date-asc") {
    filteredExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sortData === "date-desc") {
    filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (sortData === "amount-desc") {
    filteredExpenses.sort((a, b) => b.amount - a.amount);
  } else if (sortData === "amount-asc") {
    filteredExpenses.sort((a, b) => a.amount - b.amount);
  }

  // Calculate summaries
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpense = expenses.filter(exp => exp.paid).reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpense = totalExpense - paidExpense;

  // Chart data
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#94a3b8", "#8b5cf6"],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard บันทึกรายจ่าย</h1>
                <p className="text-slate-500 text-sm">จัดการการเงินของคุณอย่างมืออาชีพ</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Time Selector */}
        <div className="flex items-center justify-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-xl font-semibold min-w-[200px] text-center text-slate-900">{monthDisplay}</span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="hover:bg-slate-100">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-l-indigo-500 bg-white">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">ยอดรวมเดือนนี้</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-emerald-500 bg-white">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">จ่ายแล้ว</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">฿{paidExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-rose-500 bg-white">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">ยอดค้างชำระ</p>
            <p className="text-3xl font-bold text-rose-600 mt-2">฿{pendingExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <Card className="p-6 bg-white flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-widest">สัดส่วนรายจ่าย</h3>
            <div className="w-full max-w-[250px]">
              <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, cutout: "70%" }} />
            </div>
          </Card>

          {/* Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <Input
                  placeholder="ค้นหารายการ..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                    <SelectItem value="pending">ค้างชำระ</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortData} onValueChange={setSortData}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">ใหม่สุด</SelectItem>
                    <SelectItem value="date-asc">เก่าสุด</SelectItem>
                    <SelectItem value="amount-desc">แพงสุด</SelectItem>
                    <SelectItem value="amount-asc">ถูกสุด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">✓</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">วันที่</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">รายการ</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">หมวดหมู่</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={exp.paid}
                          onChange={() => {
                            setExpenses(expenses.map(e => e.id === exp.id ? { ...e, paid: !e.paid } : e));
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{exp.date}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{exp.item}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{exp.category}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">฿{exp.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-center flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
