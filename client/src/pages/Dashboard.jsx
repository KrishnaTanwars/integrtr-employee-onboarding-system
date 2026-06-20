import { useEffect, useState } from "react";
import { getAllOnboardings } from "../services/api";

import OnboardingForm from "../components/OnboardingForm";
import OnboardingTable from "../components/OnboardingTable";

export default function Dashboard() {
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
try {
setLoading(true);

  const response = await getAllOnboardings();

  console.log("📋 Dashboard Data:", response);

  setData(response.data || []);
} catch (err) {
  console.error("Dashboard Fetch Error:", err);
} finally {
  setLoading(false);
}

};

useEffect(() => {
fetchData();

const interval = setInterval(fetchData, 5000);

return () => clearInterval(interval);

}, []);

return ( <div className="p-5"> <OnboardingForm onSuccess={fetchData} />

  {loading ? (
    <p className="mt-4">Loading onboardings...</p>
  ) : (
    <OnboardingTable
      data={data}
      refresh={fetchData}
    />
  )}
</div>


);
}
