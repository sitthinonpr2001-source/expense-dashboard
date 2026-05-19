import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, BarChart3, Trash2, Edit2, Palette, TrendingUp } from "lucide-react";
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
  amountType?: "total" | "monthly";
  isRecurring?: boolean;
  recurringId?: string;
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
  expenseId: string;
}

interface CategoryColor {
  category: string;
  color: string;
}

interface RecurringExpense {
  id: string;
  item: string;
  category: string;
  amount: number;
  recurringDay: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  paidMonths?: Record<string, boolean>;
}

interface HomeProps {
  onDataChange?: (expenses: Expense[], recurringExpenses: RecurringExpense[]) => void;
}

const DEFAULT_EXPENSES = [
  { id: "1", date: "2026-05-18", item: "ค่าอินเทอร์เน็ต", category: "ยูทิลิตี้", amount: 640.93, paid: true, paymentType: "full" as const, amountType: "total" as const },
  { id: "2", date: "2026-05-15", item: "ค่าไฟเดือน เม.ย.", category: "ยูทิลิตี้", amount: 2450.0, paid: false, paymentType: "full" as const, amountType: "total" as const },
  { id: "3", date: "2026-05-10", item: "สมาชิก Netflix", category: "ความบันเทิง", amount: 419.0, paid: true, paymentType: "full" as const, amountType: "total" as const },
  { id: "4", date: "2026-04-20", item: "ค่าเช่าห้อง", category: "ที่พัก", amount: 5000.0, paid: true, paymentType: "full" as const, amountType: "total" as const },
  { id: "5", date: "2026-04-15", item: "ค่าอาหาร", category: "อาหาร", amount: 1200.0, paid: true, paymentType: "full" as const, amountType: "total" as const },
  { id: "6", date: "2026-04-10", item: "ค่าเดินทาง", category: "เดินทาง", amount: 500.0, paid: false, paymentType: "full" as const, amountType: "total" as const },
  { id: "7", date: "2026-05-01", item: "ซื้อโน้ตบุ๊ก", category: "อุปกรณ์", amount: 30000.0, paid: false, paymentType: "installment" as const, installmentMonths: 6, amountType: "total" as const },
  { id: "8", date: "2026-04-01", item: "ซื้อโทรศัพท์", category: "อุปกรณ์", amount: 15000.0, paid: true, paymentType: "installment" as const, installmentMonths: 3, amountType: "total" as const },
];

const DEFAULT_RECURRING = [
  { id: "r1", item: "ค่าเช่าห้อง", category: "ที่พัก", amount: 5000, recurringDay: 20, isActive: true, startDate: "2026-01-01", paidMonths: {} },
  { id: "r2", item: "ค่าอินเทอร์เน็ต", category: "ยูทิลิตี้", amount: 640.93, recurringDay: 18, isActive: true, startDate: "2026-01-01", paidMonths: {} },
];

const DEFAULT_COLOR_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const DEFAULT_COLORS = [
  { category: "ยูทิลิตี้", color: "#6366f1" },
  { category: "ความบันเทิง", color: "#10b981" },
  { category: "ที่พัก", color: "#f59e0b" },
  { category: "อาหาร", color: "#ef4444" },
  { category: "เดินทาง", color: "#8b5cf6" },
  { category: "อุปกรณ์", color: "#ec4899" },
];

export default function Home({ onDataChange }: HomeProps) {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const saved = localStorage.getItem('recurringExpenses');
      return saved ? JSON.parse(saved) : DEFAULT_RECURRING;
    } catch {
      return DEFAULT_RECURRING;
    }
  });

  const [categoryColors, setCategoryColors] = useState<CategoryColor[]>(() => {
    try {
      const saved = localStorage.getItem('categoryColors');
      return saved ? JSON.parse(saved) : DEFAULT_COLORS;
    } catch {
      return DEFAULT_COLORS;
    }
  });

  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortData, setSortData] = useState("date-desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item: "",
    category: "",
    amount: "",
    paymentType: "full" as "full" | "installment",
    installmentMonths: 3,
    amountType: "total" as "total" | "monthly",
  });

  const [recurringFormData, setRecurringFormData] = useState({
    item: "",
    category: "",
    amount: "",
    recurringDay: "1",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
  });

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const monthDisplay = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`;

  const allCategories = Array.from(new Set([
    ...expenses.map(e => e.category),
    ...recurringExpenses.map(r => r.category)
  ]));

  const getCategoryColor = (category: string): string => {
    const found = categoryColors.find(cc => cc.category === category);
    if (found) return found.color;
    const newColor = DEFAULT_COLOR_PALETTE[categoryColors.length % DEFAULT_COLOR_PALETTE.length];
    setCategoryColors([...categoryColors, { category, color: newColor }]);
    return newColor;
  };

  const updateCategoryColor = (category: string, color: string) => {
    setCategoryColors(categoryColors.map(cc => 
      cc.category === category ? { ...cc, color } : cc
    ));
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const generateInstallmentRows = (targetDate: Date): InstallmentRow[] => {
    const rows: InstallmentRow[] = [];
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    expenses.forEach(exp => {
      if (exp.paymentType === "installment" && exp.installmentMonths) {
        const startDate = new Date(exp.date);
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();

        for (let i = 0; i < exp.installmentMonths; i++) {
          const monthDate = new Date(startYear, startMonth + i, 1);
          
          if (monthDate.getFullYear() === targetYear && monthDate.getMonth() === targetMonth) {
            const monthlyAmount = exp.amountType === "total" 
              ? exp.amount / exp.installmentMonths 
              : exp.amount;
            
            rows.push({
              id: `${exp.id}-inst-${i}`,
              item: exp.item,
              category: exp.category,
              monthlyAmount: monthlyAmount,
              currentMonth: i + 1,
              totalMonths: exp.installmentMonths,
              paid: exp.paid,
              originalDate: exp.date,
              expenseId: exp.id,
            });
          }
        }
      }
    });

    return rows;
  };

  const getExpensesForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthExpenses = expenses.filter(exp => {
      if (exp.paymentType === "installment") return false;
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === year && expDate.getMonth() === month;
    });

    const recurringForMonth = recurringExpenses
      .filter(r => {
        if (!r.isActive) return false;
        const startDate = r.startDate ? new Date(r.startDate) : null;
        const endDate = r.endDate ? new Date(r.endDate) : null;
        const currentMonthDate = new Date(year, month, 1);
        
        if (startDate && currentMonthDate < startDate) return false;
        if (endDate && currentMonthDate > endDate) return false;
        return true;
      })
      .map(r => {
        const monthKey = `${year}-${month}`;
        const isPaid = r.paidMonths?.[monthKey] || false;
        return {
          id: `${r.id}-${year}-${month}`,
          date: new Date(year, month, r.recurringDay).toISOString().split('T')[0],
          item: r.item,
          category: r.category,
          amount: r.amount,
          paid: isPaid,
          paymentType: "full" as const,
          isRecurring: true,
          recurringId: r.id,
        };
      });

    return [...monthExpenses, ...recurringForMonth];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item || !formData.category || !formData.amount) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingId) {
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
              amountType: formData.paymentType === "installment" ? formData.amountType : "total",
            }
          : exp
      ));
      setEditingId(null);
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(),
        date: formData.date,
        item: formData.item,
        category: formData.category,
        amount: parseFloat(formData.amount),
        paid: false,
        paymentType: formData.paymentType,
        installmentMonths: formData.paymentType === "installment" ? formData.installmentMonths : undefined,
        amountType: formData.paymentType === "installment" ? formData.amountType : "total",
      };
      setExpenses([newExpense, ...expenses]);
      
      if (!categoryColors.find(cc => cc.category === formData.category)) {
        getCategoryColor(formData.category);
      }
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      item: "",
      category: "",
      amount: "",
      paymentType: "full",
      installmentMonths: 3,
      amountType: "total",
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
      amountType: expense.amountType || "total",
    });
    setEditingId(expense.id);
  };

  const handleEditInstallment = (row: InstallmentRow) => {
    const expense = expenses.find(e => e.id === row.expenseId);
    if (expense) {
      handleEdit(expense);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("ยืนยันการลบรายการนี้?")) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recurringFormData.item || !recurringFormData.category || !recurringFormData.amount) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingRecurringId) {
      setRecurringExpenses(recurringExpenses.map(r => 
        r.id === editingRecurringId
          ? {
              ...r,
              item: recurringFormData.item,
              category: recurringFormData.category,
              amount: parseFloat(recurringFormData.amount),
              recurringDay: parseInt(recurringFormData.recurringDay),
              startDate: recurringFormData.startDate,
              endDate: recurringFormData.endDate || undefined,
            }
          : r
      ));
      setEditingRecurringId(null);
    } else {
      const newRecurring: RecurringExpense = {
        id: Date.now().toString(),
        item: recurringFormData.item,
        category: recurringFormData.category,
        amount: parseFloat(recurringFormData.amount),
        recurringDay: parseInt(recurringFormData.recurringDay),
        isActive: true,
        startDate: recurringFormData.startDate,
        endDate: recurringFormData.endDate || undefined,
        paidMonths: {},
      };
      setRecurringExpenses([...recurringExpenses, newRecurring]);
    }

    setRecurringFormData({ item: "", category: "", amount: "", recurringDay: "1", startDate: new Date().toISOString().split('T')[0], endDate: "" });
    setShowRecurringForm(false);
  };

  const handleEditRecurring = (recurring: RecurringExpense) => {
    setRecurringFormData({
      item: recurring.item,
      category: recurring.category,
      amount: recurring.amount.toString(),
      recurringDay: recurring.recurringDay.toString(),
      startDate: recurring.startDate || new Date().toISOString().split('T')[0],
      endDate: recurring.endDate || "",
    });
    setEditingRecurringId(recurring.id);
    setShowRecurringForm(true);
  };

  const handleDeleteRecurring = (id: string) => {
    if (confirm("ยืนยันการลบรายจ่ายประจำเดือนนี้?")) {
      const updated = recurringExpenses.filter(r => r.id !== id);
      setRecurringExpenses(updated);
      if (onDataChange) onDataChange(expenses, updated);
    }
  };

  // Save expenses to localStorage
  React.useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    if (onDataChange) onDataChange(expenses, recurringExpenses);
  }, [expenses, onDataChange, recurringExpenses]);

  // Save recurring expenses to localStorage
  React.useEffect(() => {
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  // Save category colors to localStorage
  React.useEffect(() => {
    localStorage.setItem('categoryColors', JSON.stringify(categoryColors));
  }, [categoryColors]);

  const handleToggleRecurring = (id: string) => {
    setRecurringExpenses(recurringExpenses.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const monthExpenses = getExpensesForMonth();
  const installmentRows = generateInstallmentRows(currentDate);

  const allRowsForMonth = [
    ...monthExpenses.map(exp => ({
      ...exp,
      isInstallment: false,
      isRecurring: exp.isRecurring || false,
      monthlyAmount: exp.amount,
      currentMonth: 0,
      totalMonths: 0,
      expenseId: exp.id,
    })),
    ...installmentRows.map(row => ({
      ...row,
      isInstallment: true,
      isRecurring: false,
      paid: row.paid,
      amount: row.monthlyAmount,
    })),
  ];

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

  const totalExpense = allRowsForMonth.reduce((sum, exp) => sum + (exp.monthlyAmount || exp.amount), 0);
  const paidExpense = allRowsForMonth.filter(exp => exp.paid).reduce((sum, exp) => sum + (exp.monthlyAmount || exp.amount), 0);
  const pendingExpense = totalExpense - paidExpense;

  const categoryTotals: Record<string, number> = {};
  allRowsForMonth.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + (exp.monthlyAmount || exp.amount);
  });

  const chartColors = Object.keys(categoryTotals).map(cat => getCategoryColor(cat));
  const chartTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const categoryPercentages: Record<string, number> = {};
  Object.keys(categoryTotals).forEach(cat => {
    categoryPercentages[cat] = parseFloat(((categoryTotals[cat] / chartTotal) * 100).toFixed(1));
  });

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: chartColors,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
            <Button
              onClick={() => setLocation("/yearly")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              สรุปรายปี
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-xl font-semibold min-w-[200px] text-center text-slate-900">{monthDisplay}</span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="hover:bg-slate-100">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

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
              <>
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
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทจำนวนเงิน</label>
                  <Select value={formData.amountType} onValueChange={(value) => setFormData({ ...formData, amountType: value as "total" | "monthly" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">ทั้งหมด</SelectItem>
                      <SelectItem value="monthly">ต่องวด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
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
            <div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                {editingId ? "อัปเดต" : "บันทึก"}
              </Button>
            </div>
            {editingId && (
              <div>
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
                      amountType: "total",
                    });
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            )}
          </form>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Card className="p-6 bg-white">
              <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-widest">สัดส่วนรายจ่าย</h3>
              <div className="space-y-4">
                <div className="w-full max-w-[250px] mx-auto">
                  {Object.keys(categoryTotals).length > 0 ? (
                    <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, cutout: "70%" }} />
                  ) : (
                    <div className="text-center text-slate-400 py-8">ไม่มีข้อมูลในเดือนนี้</div>
                  )}
                </div>
                {Object.keys(categoryTotals).length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {Object.keys(categoryTotals).map((cat, idx) => (
                      <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: chartColors[idx] }}
                          />
                          <span className="text-sm text-slate-700">{cat}</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">{categoryPercentages[cat]}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  สีหมวดหมู่
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowColorEditor(!showColorEditor)}
                  className="text-xs"
                >
                  {showColorEditor ? "ปิด" : "แก้ไข"}
                </Button>
              </div>
              
              <div className="space-y-3">
                {categoryColors.map(cc => (
                  <div key={cc.category} className="flex items-center gap-3">
                    {showColorEditor ? (
                      <>
                        <input
                          type="color"
                          value={cc.color}
                          onChange={(e) => updateCategoryColor(cc.category, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border border-slate-200"
                        />
                        <span className="text-sm text-slate-700 flex-1">{cc.category}</span>
                        <span className="text-xs text-slate-400">{cc.color}</span>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full border border-slate-200"
                          style={{ backgroundColor: cc.color }}
                        />
                        <span className="text-sm text-slate-700">{cc.category}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {Object.keys(categoryTotals).length > 0 && (
              <Card className="p-6 bg-white">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">รายละเอียดเปอร์เซ็นต์</h3>
                <div className="space-y-3">
                  {Object.keys(categoryTotals).map((cat, idx) => (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: chartColors[idx] }}
                        />
                        <span className="text-sm text-slate-700">{cat}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{categoryPercentages[cat]}%</div>
                        <div className="text-xs text-slate-500">฿{categoryTotals[cat].toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
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
                      filteredExpenses.map(exp => {
                        const categoryColor = getCategoryColor(exp.category);
                        return (
                          <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={exp.paid}
                              onChange={() => {
                                if ((exp as any).isRecurring) {
                                  const year = currentDate.getFullYear();
                                  const month = currentDate.getMonth();
                                  const monthKey = `${year}-${month}`;
                                  setRecurringExpenses(recurringExpenses.map(r => 
                                    r.id === (exp as any).recurringId
                                      ? {
                                          ...r,
                                          paidMonths: {
                                            ...r.paidMonths,
                                            [monthKey]: !r.paidMonths?.[monthKey],
                                          },
                                        }
                                      : r
                                  ));
                                } else if (exp.isInstallment) {
                                  const originalId = (exp as any).expenseId;
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
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-200"
                                  style={{ backgroundColor: categoryColor }}
                                />
                                <span className="text-sm text-slate-600">{exp.category}</span>
                                {(exp as any).isRecurring && (
                                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">ประจำเดือน</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                              <div>
                                ฿{(exp.monthlyAmount || exp.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                              </div>
                              {exp.isInstallment && (
                                <span className="text-xs text-slate-500 block">
                                  งวด {(exp as any).currentMonth}/{(exp as any).totalMonths}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center flex gap-2 justify-center">
                              {!(exp as any).isRecurring && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                                  onClick={() => {
                                    if (exp.isInstallment) {
                                      handleEditInstallment(exp as any);
                                    } else {
                                      handleEdit(exp as Expense);
                                    }
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                              {!(exp as any).isRecurring && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                                  onClick={() => {
                                    if (exp.isInstallment) {
                                      handleDelete((exp as any).expenseId);
                                    } else {
                                      handleDelete(exp.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              {(exp as any).isRecurring && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                                  onClick={() => handleDeleteRecurring((exp as any).recurringId)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
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
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">รายจ่ายประจำเดือน</h2>
            <Button
              onClick={() => {
                setShowRecurringForm(!showRecurringForm);
                setEditingRecurringId(null);
                setRecurringFormData({ item: "", category: "", amount: "", recurringDay: "1", startDate: new Date().toISOString().split('T')[0], endDate: "" });
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {showRecurringForm ? "ยกเลิก" : "+ เพิ่มรายจ่ายประจำเดือน"}
            </Button>
          </div>

          {showRecurringForm && (
            <Card className="p-6 bg-white">
              <h3 className="text-sm font-semibold mb-4">
                {editingRecurringId ? "แก้ไขรายจ่ายประจำเดือน" : "เพิ่มรายจ่ายประจำเดือนใหม่"}
              </h3>
              <form onSubmit={handleAddRecurring} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รายการ</label>
                  <Input
                    type="text"
                    placeholder="เช่น ค่าเช่า"
                    value={recurringFormData.item}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, item: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
                  <Input
                    type="text"
                    placeholder="หมวดหมู่"
                    value={recurringFormData.category}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, category: e.target.value })}
                    list="categoryList"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนเงิน</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={recurringFormData.amount}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={recurringFormData.recurringDay}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, recurringDay: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เริ่ม</label>
                  <Input
                    type="date"
                    value={recurringFormData.startDate}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สิ้นสุด</label>
                  <Input
                    type="date"
                    value={recurringFormData.endDate}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 lg:col-span-1">
                  {editingRecurringId ? "อัปเดต" : "บันทึก"}
                </Button>
              </form>
            </Card>
          )}

          {recurringExpenses.length > 0 && (
            <Card className="p-6 bg-white">
              <div className="space-y-3">
                {recurringExpenses.map(recurring => (
                  <div key={recurring.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{recurring.item}</p>
                      <p className="text-sm text-slate-500">
                        {recurring.category} • วันที่ {recurring.recurringDay}
                        {recurring.startDate && ` • เริ่ม: ${recurring.startDate}`}
                        {recurring.endDate && ` • สิ้นสุด: ${recurring.endDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-slate-900">฿{recurring.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
                      <input
                        type="checkbox"
                        checked={recurring.isActive}
                        onChange={() => handleToggleRecurring(recurring.id)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                        title="เปิด/ปิด"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                        onClick={() => handleEditRecurring(recurring)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => handleDeleteRecurring(recurring.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
