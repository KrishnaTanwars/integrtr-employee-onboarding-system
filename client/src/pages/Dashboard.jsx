import { useEffect, useState } from "react";
import { getAllOnboardings, getConfig } from "../services/api";
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Database,
  Layers,
  Activity,
  Sparkles
} from "lucide-react";

import OnboardingForm from "../components/OnboardingForm";
import OnboardingTable from "../components/OnboardingTable";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const fetchConfig = async () => {
    try {
      const response = await getConfig();
      if (response.success && response.data?.use_mock_sf) {
        setMockMode(true);
      }
    } catch (err) {
      console.error("Dashboard Config Fetch Error:", err);
    }
  };

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await getAllOnboardings();
      setData(response.data || []);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchData(true);

    const interval = setInterval(() => fetchData(false), 3000);
    return () => clearInterval(interval);
  }, []);

  // Stats calculation
  const totalRequests = data.length;
  const completedRequests = data.filter((item) => item.status === "success").length;
  const failedRequests = data.filter((item) => item.status === "failed").length;
  const pendingRequests = data.filter((item) => item.status === "pending").length;

  // Filtered requests
  const filteredData = data.filter((item) => {
    const matchesSearch = 
      item.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = deptFilter === "all" || item.department === deptFilter;
    
    return matchesSearch && matchesDept;
  });

  // Get unique departments for filter dropdown
  const departments = ["all", ...new Set(data.map((item) => item.department).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* SaaS Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-lg text-white shadow-md shadow-indigo-200">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">INTEGRTR Workflow Hub</h1>
              <p className="text-xs text-slate-500 font-medium">Enterprise Onboarding Operations</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Database className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span>Supabase PostgreSQL Connected</span>
            </div>

            {mockMode && (
              <div className="flex items-center space-x-1.5 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 font-semibold shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Mock SuccessFactors Active</span>
              </div>
            )}

            <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
              T9
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Cards Grid */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="p-3.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Requests</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalRequests}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="p-3.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Pipelines</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{pendingRequests}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="p-3.5 rounded-lg bg-green-50 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Completed Hires</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{completedRequests}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="p-3.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Failed / Blocked</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{failedRequests}</h3>
            </div>
          </div>
        </section>

        {/* Filter Toolbar */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by employee name, email or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all capitalize"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Onboarding Input Form */}
          <div className="lg:col-span-4 sticky top-24">
            <OnboardingForm onSuccess={() => fetchData(false)} />
          </div>

          {/* Right Column - Workflow Table View */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Activity className="h-5 w-5 text-indigo-500" />
                <h2 className="font-bold text-slate-800 text-base">Onboarding Pipelines</h2>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {filteredData.length} records found
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                Loading onboarding data...
              </div>
            ) : (
              <OnboardingTable
                data={filteredData}
                refresh={() => fetchData(false)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
