import { useState } from "react";
import { retryOnboarding } from "../services/api";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  User, 
  AlertCircle,
  Hash,
  Mail
} from "lucide-react";

export default function OnboardingTable({ data, refresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRetry = async (e, id) => {
    e.stopPropagation();
    setRetryingId(id);
    try {
      await retryOnboarding(id);
      // Wait a moment for server background thread to initiate
      setTimeout(refresh, 500);
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setRetryingId(false);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 bg-white">
        <Hash className="h-10 w-10 text-slate-300 stroke-1 mb-3 animate-pulse" />
        <p className="font-semibold text-slate-600">No onboarding requests active</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">Submit the onboarding form on the left to start a new hire automation flow.</p>
      </div>
    );
  }

  // Calculate completed steps out of 4
  const getStepProgress = (item) => {
    const steps = [
      item.sf_status, 
      item.slack_team_status, 
      item.slack_hr_status, 
      item.slack_employee_status
    ];
    const completed = steps.filter(s => s === "success").length;
    const failed = steps.filter(s => s === "failed").length;
    const progress = (completed / 4) * 100;
    return { completed, failed, progress };
  };

  // Helper to determine if a step is active/running
  const isStepActive = (item, stepName) => {
    if (item.status !== "pending") return false;
    
    if (stepName === "sf") {
      return item.sf_status === "pending";
    }
    if (stepName === "team") {
      return item.sf_status === "success" && item.slack_team_status === "pending";
    }
    if (stepName === "hr") {
      return item.sf_status === "success" && item.slack_team_status === "success" && item.slack_hr_status === "pending";
    }
    if (stepName === "employee") {
      return item.sf_status === "success" && item.slack_team_status === "success" && item.slack_hr_status === "success" && item.slack_employee_status === "pending";
    }
    return false;
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6 w-10"></th>
              <th className="py-4 px-6">Employee</th>
              <th className="py-4 px-6">Department</th>
              <th className="py-4 px-6">Pipeline Progress</th>
              <th className="py-4 px-6 text-center">Overall</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const { completed, failed, progress } = getStepProgress(item);
              const isExpanded = expandedId === item.id;
              const hasFailedStep = failed > 0;

              return (
                <>
                  {/* Row */}
                  <tr 
                    key={item.id} 
                    onClick={() => toggleExpand(item.id)}
                    className={`hover:bg-slate-50/70 transition-all cursor-pointer group ${isExpanded ? 'bg-indigo-50/20' : ''}`}
                  >
                    <td className="py-4 px-6 text-slate-400 group-hover:text-slate-600 transition-colors">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-900 transition-colors">{item.employee_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center"><Mail className="h-3 w-3 mr-1" />{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {item.department}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-[180px]">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1.5">
                          <span>{completed}/4 completed</span>
                          {hasFailedStep && <span className="text-red-500">1 blocked</span>}
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            style={{ width: `${progress}%` }} 
                            className={`h-full rounded-full transition-all duration-500 ${
                              hasFailedStep ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-indigo-600 animate-pulse'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <OverallBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {hasFailedStep ? (
                        <button
                          onClick={(e) => handleRetry(e, item.id)}
                          disabled={retryingId === item.id}
                          className="inline-flex items-center space-x-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {retryingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          <span>Retry Flow</span>
                        </button>
                      ) : item.status === "pending" ? (
                        <div className="flex items-center justify-end space-x-1.5 text-xs text-indigo-600 font-semibold">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Processing</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium select-none">Active</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50 border-t border-slate-100">
                      <td colSpan="6" className="py-6 px-8 border-b border-slate-200/60">
                        <div className="max-w-2xl">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Workflow Execution Timeline</h4>
                          
                          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2.5 before:bottom-2 before:w-0.5 before:bg-slate-200">
                            
                            {/* Step 1: SuccessFactors */}
                            <TimelineStep 
                              title="1. SAP SuccessFactors Core Profile"
                              status={item.sf_status}
                              isActive={isStepActive(item, "sf")}
                              error={item.sf_error}
                              advice="Verify that username formats comply and GLA sandbox tokens are refreshed."
                              action={
                                item.sf_employee_id && (
                                  <div className="mt-2 flex items-center space-x-2 text-xs">
                                    <span className="font-semibold text-slate-500">ID:</span>
                                    <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{item.sf_employee_id}</span>
                                    {item.profile_url && (
                                      <a 
                                        href={item.profile_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-0.5"
                                      >
                                        <span>SF Link</span>
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                )
                              }
                            />

                            {/* Step 2: Slack Team */}
                            <TimelineStep 
                              title="2. Welcome Message (Team Channel)"
                              status={item.slack_team_status}
                              isActive={isStepActive(item, "team")}
                              error={item.slack_team_error}
                              advice="Ensure SLACK_TEAM_WEBHOOK_URL environment variable is set and correctly formatted."
                            />

                            {/* Step 3: Slack HR */}
                            <TimelineStep 
                              title="3. HR Review Notification (HR Channel)"
                              status={item.slack_hr_status}
                              isActive={isStepActive(item, "hr")}
                              error={item.slack_hr_error}
                              advice="Ensure SLACK_HR_WEBHOOK_URL is verified and accessible."
                            />

                            {/* Step 4: Slack Employee */}
                            <TimelineStep 
                              title="4. Employee Direct Welcome Notification"
                              status={item.slack_employee_status}
                              isActive={isStepActive(item, "employee")}
                              error={item.slack_employee_error}
                              advice="Ensure employee contact methods are correctly configured and webhook/email parameters are reachable."
                            />

                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Timeline Step Component
function TimelineStep({ title, status, isActive, error, advice, action }) {
  let stepIcon;
  let statusColor = "text-slate-400";
  let bgClass = "bg-white border-slate-200";

  if (isActive) {
    stepIcon = <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    statusColor = "text-amber-700 font-semibold";
    bgClass = "bg-amber-50 border-amber-300 ring-4 ring-amber-100/50";
  } else if (status === "success") {
    stepIcon = <CheckCircle2 className="h-4 w-4 text-white" />;
    statusColor = "text-slate-700 font-medium";
    bgClass = "bg-green-500 border-green-600";
  } else if (status === "failed") {
    stepIcon = <XCircle className="h-4 w-4 text-white" />;
    statusColor = "text-red-700 font-semibold";
    bgClass = "bg-red-500 border-red-600";
  } else {
    stepIcon = <Clock className="h-4 w-4 text-slate-400" />;
    statusColor = "text-slate-400";
    bgClass = "bg-slate-100 border-slate-200";
  }

  return (
    <div className="relative flex items-start space-x-3.5 pl-1.5">
      {/* Icon Wrapper */}
      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 z-10 ${bgClass}`}>
        {stepIcon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm ${statusColor}`}>{title}</p>
        
        {isActive && (
          <p className="text-xs text-amber-600 mt-0.5 animate-pulse">Running automation job in background...</p>
        )}

        {action}

        {status === "failed" && (
          <div className="mt-2.5 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Integration Error</span>
            </div>
            <p className="font-mono bg-red-100/50 p-1.5 rounded text-[10px] select-all leading-normal break-all">{error}</p>
            {advice && (
              <p className="text-slate-500 mt-1"><span className="font-bold text-red-700">Mitigation:</span> {advice}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Status Badges
function OverallBadge({ status }) {
  const styles = {
    success: "bg-green-50 text-green-700 border-green-200 font-bold",
    failed: "bg-red-50 text-red-700 border-red-200 font-bold",
    pending: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border tracking-wide uppercase select-none ${
        styles[status] || styles.pending
      }`}
    >
      {status === "pending" ? (
        <span className="flex items-center space-x-1">
          <Loader2 className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
          <span>Pending</span>
        </span>
      ) : (
        status || "pending"
      )}
    </span>
  );
}