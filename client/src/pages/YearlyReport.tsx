import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Card } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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

interface YearlyReportProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
}

export default function YearlyReport({ expenses, recurringExpenses }: YearlyReportProps) {
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const getMonthlyExpenses = () => {
    const monthlyData = Array(12).fill(0);
    
    expenses.forEach(exp => {
      if (exp.paymentType === "full") {
        const expDate = new Date(exp.date);
        if (expDate.getFullYear() === selectedYear) {
          const month = expDate.getMonth();
          monthlyData[month] += exp.amount;
        }
      } else if (exp.paymentType === "installment") {
        const startDate = new Date(exp.date);
        const months = exp.installmentMonths || 1;
        const monthlyAmount = (exp.amountType === "total" ? exp.amount / months : exp.amount);
        
        for (let i = 0; i < months; i++) {
          const installmentDate = new Date(startDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          if (installmentDate.getFullYear() === selectedYear) {
            const month = installmentDate.getMonth();
            monthlyData[month] += monthlyAmount;
          }
        }
      }
    });

    // Add recurring expenses
    recurringExpenses.forEach(recurring => {
      for (let month = 0; month < 12; month++) {
        const startDate = recurring.startDate ? new Date(recurring.startDate) : null;
        const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
        const currentMonthDate = new Date(selectedYear, month, 1);
        
        if (startDate && currentMonthDate < startDate) continue;
        if (endDate && currentMonthDate > endDate) continue;
        
        monthlyData[month] += recurring.amount;
      }
    });

    return monthlyData;
  };

  const monthlyData = getMonthlyExpenses();
  const totalYearly = monthlyData.reduce((a, b) => a + b, 0);
  const averageMonthly = totalYearly / 12;
  const maxMonth = Math.max(...monthlyData);
  const minMonth = Math.min(...monthlyData);

  const lineChartData = {
    labels: monthNames,
    datasets: [
      {
        label: "รายจ่ายรายเดือน",
        data: monthlyData,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  const barChartData = {
    labels: monthNames,
    datasets: [
      {
        label: "รายจ่ายรายเดือน",
        data: monthlyData,
        backgroundColor: [
          "#6366f1",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
          "#f97316",
          "#06b6d4",
          "#a855f7",
          "#f43f5e",
          "#0ea5e9",
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">สรุปข้อมูลรายปี</h1>
            <p className="text-slate-600">ดูสรุปรายจ่ายและแนวโน้มตลอดทั้งปี</p>
          </div>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={() => setSelectedYear(selectedYear - 1)}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-2xl font-bold text-slate-900 min-w-[120px] text-center">
            {selectedYear}
          </div>
          <Button
            onClick={() => setSelectedYear(selectedYear + 1)}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white border-l-4 border-l-indigo-600">
            <p className="text-sm font-medium text-slate-600 mb-2">รวมทั้งปี</p>
            <p className="text-3xl font-bold text-slate-900">
              ฿{totalYearly.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-6 bg-white border-l-4 border-l-green-600">
            <p className="text-sm font-medium text-slate-600 mb-2">เฉลี่ยต่อเดือน</p>
            <p className="text-3xl font-bold text-slate-900">
              ฿{averageMonthly.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-6 bg-white border-l-4 border-l-amber-600">
            <p className="text-sm font-medium text-slate-600 mb-2">เดือนที่มากที่สุด</p>
            <p className="text-3xl font-bold text-slate-900">
              ฿{maxMonth.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-6 bg-white border-l-4 border-l-red-600">
            <p className="text-sm font-medium text-slate-600 mb-2">เดือนที่น้อยที่สุด</p>
            <p className="text-3xl font-bold text-slate-900">
              ฿{minMonth.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-slate-900 mb-4">แนวโน้มรายจ่ายรายเดือน</h2>
            <div className="h-80">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </Card>

          {/* Bar Chart */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-slate-900 mb-4">เปรียบเทียบรายจ่ายรายเดือน</h2>
            <div className="h-80">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </Card>
        </div>

        {/* Monthly Details Table */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-slate-900 mb-4">รายละเอียดรายจ่ายรายเดือน</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">เดือน</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">รายจ่าย</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">เปอร์เซ็นต์</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">เทียบกับเฉลี่ย</th>
                </tr>
              </thead>
              <tbody>
                {monthNames.map((month, index) => {
                  const amount = monthlyData[index];
                  const percentage = ((amount / totalYearly) * 100).toFixed(1);
                  const diff = amount - averageMonthly;
                  const diffPercent = ((diff / averageMonthly) * 100).toFixed(1);
                  
                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900 font-medium">{month}</td>
                      <td className="py-3 px-4 text-right text-slate-900 font-semibold">
                        ฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{percentage}%</td>
                      <td className={`py-3 px-4 text-right font-semibold ${diff >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {diff >= 0 ? "+" : ""}{diffPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
