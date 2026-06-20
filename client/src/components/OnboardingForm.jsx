import { useState } from "react";
import { createOnboarding } from "../services/api";

export default function OnboardingForm({ onSuccess }) {
const [form, setForm] = useState({
name: "",
email: "",
department: "",
});

const [loading, setLoading] = useState(false);

const handleChange = (e) => {
setForm({
...form,
[e.target.name]: e.target.value,
});
};

const submit = async () => {
try {
if (!form.name || !form.email || !form.department) {
alert("All fields are required");
return;
}

  setLoading(true);

  const response = await createOnboarding(form);

  console.log("🚀 Create Response:", response);

  if (response.success === false) {
    alert(response.message || "Failed to create onboarding");
    return;
  }

  alert("✅ Onboarding Started Successfully");

  setForm({
    name: "",
    email: "",
    department: "",
  });

  if (onSuccess) {
    await onSuccess();
  }
} catch (err) {
  console.error(err);

  alert(
    err?.response?.data?.message ||
      err.message ||
      "Something went wrong"
  );
} finally {
  setLoading(false);
}

};

return ( <div className="p-4 border rounded"> <h2 className="text-xl font-bold mb-3">
New Employee Onboarding </h2>

  <input
    name="name"
    placeholder="Employee Name"
    value={form.name}
    onChange={handleChange}
    className="border p-2 w-full mb-2"
  />

  <input
    name="email"
    placeholder="Employee Email"
    value={form.email}
    onChange={handleChange}
    className="border p-2 w-full mb-2"
  />

  <input
    name="department"
    placeholder="Department"
    value={form.department}
    onChange={handleChange}
    className="border p-2 w-full mb-4"
  />

  <button
    onClick={submit}
    disabled={loading}
    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
  >
    {loading ? "Creating..." : "Start Onboarding"}
  </button>
</div>

);
}
