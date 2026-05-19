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
  paymentType: "full" | "installment";
  installmentMonths?: number;
}

interface InstallmentRow {
  id: string;
  item: string;
  category: string;
  monthlyAmount: number;
  currentMonth: number;
  totalMonths: number;
  paid: boolean;
  originalDate: string;
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", date: "2026-05-18", item: "ค่าอินเทอร์เน็ต", category: "ยูทิลิตี้", amount: 640.93, paid: true, paymentType: "full" },
    { id: "2", date: "2026-05-15", item: "ค่าไฟเดือน เม.ย.", category: "ยูทิลิตี้", amount: 2450.0, paid: false, paymentType: "full" },
    { id: "3", date: "2026-05-10", item: "สมาชิก Netflix", category: "ความบันเทิง", amount: 419.0, paid: true, paymentType: "full" },
    { id: "4", date: "2026-04-20", item: "ค่าเช่าห้อง", category: "ที่พัก", amount: 5000.0, paid: true, paymentType: "full" },
    { id: "5", date: "2026-04-15", item: "ค่าอาหาร", category: "อาหาร", amount: 1200.0, paid: true, paymentType: "full" },
    { id: "6", date: "2026-04-10", item: "ค่าเดินทาง", category: "เดินทาง", amount: 500.0, paid: false, paymentType: "full" },
    { id: "7", date: "2026-05-01", item: "ซื้อโน้ตบุ๊ก", category: "อุปกรณ์", amount: 30000.0, paid: false, paymentType: "installment", installmentMonths: 6 },
    { id: "8", date: "2026-04-01", item: "ซื้อโทรศัพท์", category: "อุปกรณ์", amount: 15000.0, paid: true, paymentType: "installment", installmentMonths: 3 },
  ]);
  
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortData, setSortData] = useState("date-desc");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item: "",
    category: "",
    amount: "",
    paymentType: "full" as "full" | "installment",
    installmentMonths: 3,
  });

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const monthDisplay = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`;

  // Get all categories
  const allCategories = Array.from(new Set(expenses.map(e => e.category)));

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // Generate installment rows for a specific month
  const generateInstallmentRows = (targetDate: Date): InstallmentRow[] => {
    const rows: InstallmentRow[] = [];
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    expenses.forEach(exp => {
      if (exp.paymentType === "installment" && exp.installmentMonths) {
        const startDate = new Date(exp.date);
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();

        // Calculate which month this installment is for
        for (let i = 0; i < exp.installmentMonths; i++) {
          const monthDate = new Date(startYear, startMonth + i, 1);
          
          if (monthDate.getFullYear() === targetYear && monthDate.getMonth() === targetMonth) {
            rows.push({
              id: `${exp.id}-inst-${i}`,
              item: exp.item,
              category: exp.category,
              monthlyAmount: exp.amount / exp.installmentMonths,
              currentMonth: i + 1,
              totalMonths: exp.installmentMonths,
              paid: exp.paid,
              originalDate: exp.date,
            });
          }
        }
      }
    });

    return rows;
  };

  // Filter expenses by current month
  const getExpensesForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return expenses.filter(exp => {
      if (exp.paymentType === "installment") return false; // Exclude installments, they're handled separately
      
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === year && expDate.getMonth() === month;
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item || !formData.category || !formData.amount) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingId) {
      // Update existing
      setExpenses(expenses.map(exp => 
        exp.id === editingId 
          ? {
              ...exp,
              date: formData.date,
              item: formData.item,
              category: formData.category,
              amount: parseFloat(formData.amount),
              paymentType: formData.paymentType,
              installmentMonths: formData.paymentType === "installment" ? formData.installmentMonths : undefined,
            }
          : exp
      ));
      setEditingId(null);
    } else {
      // Add new
      const newExpense: Expense = {
        id: Date.now().toString(),
        date: formData.date,
        item: formData.item,
        category: formData.category,
        amount: parseFloat(formData.amount),
        paid: false,
        paymentType: formData.paymentType,
        installmentMonths: formData.paymentType === "installment" ? formData.installmentMonths : undefined,
      };
      setExpenses([newExpense, ...expenses]);
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      item: "",
      category: "",
      amount: "",
      paymentType: "full",
      installmentMonths: 3,
    });
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      date: expense.date,
      item: expense.item,
      category: expense.category,
      amount: expense.amount.toString(),
      paymentType: expense.paymentType,
      installmentMonths: expense.installmentMonths || 3,
    });
    setEditingId(expense.id);
  };

  const handleDelete = (id: string) => {
    if (confirm("ยืนยันการลบรายการนี้?")) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  // Get expenses for current month
  const monthExpenses = getExpensesForMonth();
  const installmentRows = generateInstallmentRows(currentDate);

  // Combine both types for display
  const allRowsForMonth = [
    ...monthExpenses.map(exp => ({
      ...exp,
      isInstallment: false,
      monthlyAmount: exp.amount,
      currentMonth: 0,
      totalMonths: 0,
    })),
    ...installmentRows.map(row => ({
      ...row,
      isInstallment: true,
      paid: row.paid,
      amount: row.monthlyAmount,
    })),
  ];

  // Filter and sort expenses
  let filteredExpenses = allRowsForMonth.filter(exp => {
    const matchesSearch = exp.item.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesStatus = filterStatus === "all" || (filterStatus === "paid" ? exp.paid : !exp.paid);
    const matchesCategory = filterCategory === "all" || exp.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (sortData === "date-asc") {
    filteredExpenses.sort((a, b) => {
      const dateA = new Date(('originalDate' in a ? (a as any).originalDate : (a as any).date) || (a as any).date);
      const dateB = new Date(('originalDate' in b ? (b as any).originalDate : (b as any).date) || (b as any).date);
      return dateA.getTime() - dateB.getTime();
    });
  } else if (sortData === "date-desc") {
    filteredExpenses.sort((a, b) => {
      const dateA = new Date(('originalDate' in a ? (a as any).originalDate : (a as any).date) || (a as any).date);
      const dateB = new Date(('originalDate' in b ? (b as any).originalDate : (b as any).date) || (b as any).date);
      return dateB.getTime() - dateA.getTime();
    });
  } else if (sortData === "amount-desc") {
    filteredExpenses.sort((a, b) => (b.monthlyAmount || b.amount) - (a.monthlyAmount || a.amount));
  } else if (sortData === "amount-asc") {
    filteredExpenses.sort((a, b) => (a.monthlyAmount || a.amount) - (b.monthlyAmount || b.amount));
  }

  // Calculate summaries for current month
  const totalExpense = allRowsForMonth.reduce((sum, exp) => sum + (exp.monthlyAmount || exp.amount), 0);
  const paidExpense = allRowsForMonth.filter(exp => exp.paid).reduce((sum, exp) => sum + (exp.monthlyAmount || exp.amount), 0);
  const pendingExpense = totalExpense - paidExpense;

  // Chart data for current month
  const categoryTotals: Record<string, number> = {};
  allRowsForMonth.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + (exp.monthlyAmount || exp.amount);
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

        {/* Form Card */}
        <Card className="p-8 bg-white">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="text-indigo-500">+</span>
            {editingId ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">วันที่</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">รายการ</label>
              <Input
                type="text"
                placeholder="เช่น ค่าโฆษณา, ค่าเช่าที่"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
              <Input
                type="text"
                placeholder="พิมพ์หมวดหมู่"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                list="categoryList"
                required
              />
              <datalist id="categoryList">
                {allCategories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">รูปแบบการจ่าย</label>
              <Select value={formData.paymentType} onValueChange={(value) => setFormData({ ...formData, paymentType: value as "full" | "installment" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">เต็มจำนวน</SelectItem>
                  <SelectItem value="installment">ผ่อนชำระ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.paymentType === "installment" && (
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนเดือน</label>
                <Input
                  type="number"
                  min="2"
                  max="60"
                  value={formData.installmentMonths}
                  onChange={(e) => setFormData({ ...formData, installmentMonths: parseInt(e.target.value) })}
                />
              </div>
            )}
            <div className={formData.paymentType === "installment" ? "lg:col-span-1" : ""}>
              <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนเงิน</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className={formData.paymentType === "installment" ? "lg:col-span-1" : ""}>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                {editingId ? "อัปเดต" : "บันทึก"}
              </Button>
            </div>
            {editingId && (
              <div className={formData.paymentType === "installment" ? "lg:col-span-1" : ""}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      item: "",
                      category: "",
                      amount: "",
                      paymentType: "full",
                      installmentMonths: 3,
                    });
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <Card className="p-6 bg-white flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-widest">สัดส่วนรายจ่าย</h3>
            <div className="w-full max-w-[250px]">
              {Object.keys(categoryTotals).length > 0 ? (
                <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, cutout: "70%" }} />
              ) : (
                <div className="text-center text-slate-400 py-8">ไม่มีข้อมูลในเดือนนี้</div>
              )}
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
                />
              </div>
              <div className="flex gap-2 flex-wrap">
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
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
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
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={exp.paid}
                            onChange={() => {
                              if (exp.isInstallment) {
                                // For installments, mark the original expense as paid
                                const originalId = exp.id.split('-inst-')[0];
                                setExpenses(expenses.map(e => e.id === originalId ? { ...e, paid: !e.paid } : e));
                              } else {
                                setExpenses(expenses.map(e => e.id === exp.id ? { ...e, paid: !e.paid } : e));
                              }
                            }}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{('originalDate' in exp ? (exp as any).originalDate : (exp as any).date) || (exp as any).date}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{exp.item}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{exp.category}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ฿{(exp.monthlyAmount || exp.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          {exp.isInstallment && (
                            <span className="text-xs text-slate-500 block">
                              งวด {exp.currentMonth}/{exp.totalMonths}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center flex gap-2 justify-center">
                          {!exp.isInstallment && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                                onClick={() => handleEdit(exp as Expense)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => handleDelete(exp.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {exp.isInstallment && (
                            <span className="text-xs text-slate-400">ไม่สามารถแก้ไข</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        ไม่มีข้อมูลในเดือนนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
