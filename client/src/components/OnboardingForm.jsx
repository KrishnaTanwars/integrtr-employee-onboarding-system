import { useState } from "react";
import { createOnboarding } from "../services/api";
import { 
  User, 
  Mail, 
  Briefcase, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

export default function OnboardingForm({ onSuccess }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text, detail }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async () => {
    setMessage(null);

    if (!form.first_name || !form.last_name || !form.email || !form.department) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        initiated_by: "web-ui",
        idempotency_key: `${form.email.trim()}-${crypto.randomUUID()}`,
      };

      const response = await createOnboarding(payload);

      if (response.success === false) {
        const d = response.data;
        const detail = d?.failed_step
          ? `Step failed: ${d.failed_step}. ${d.advice || ""}`
          : response.message || response.error || "Onboarding incomplete.";
        setMessage({ type: "error", text: "Onboarding partially failed.", detail });
      } else {
        setMessage({ type: "success", text: "Onboarding pipeline initialized successfully!" });
        setForm({ first_name: "", last_name: "", email: "", department: "" });
      }

      if (onSuccess) await onSuccess();
    } catch (err) {
      const resp = err?.response?.data;
      if (resp?.data?.failed_step) {
        setMessage({
          type: "error",
          text: `Step failed: ${resp.data.failed_step}`,
          detail: `${resp.data.advice || ""} ${resp.data.error_details || ""}`.trim(),
        });
      } else {
        setMessage({
          type: "error",
          text: resp?.error || err.message || "Something went wrong.",
        });
      }
      if (onSuccess) await onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
      <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
        <UserPlus className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-bold text-slate-800">Add New Employee</h2>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg text-sm flex items-start space-x-3 border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight">{message.text}</p>
            {message.detail && <p className="mt-1 text-xs opacity-90 leading-relaxed break-words">{message.detail}</p>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              name="first_name"
              type="text"
              placeholder="e.g. Stephen"
              value={form.first_name}
              onChange={handleChange}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              name="last_name"
              type="text"
              placeholder="e.g. Curry"
              value={form.last_name}
              onChange={handleChange}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Employee Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="e.g. stephen@company.com"
              value={form.email}
              onChange={handleChange}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <input
              name="department"
              type="text"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={handleChange}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm shadow-indigo-150 transition-all cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing...</span>
          </>
        ) : (
          <span>Start Onboarding Flow</span>
        )}
      </button>
    </div>
  );
}
