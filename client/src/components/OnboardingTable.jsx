import { retryOnboarding } from "../services/api";

export default function OnboardingTable({ data, refresh }) {
  const retry = async (id) => {
    await retryOnboarding(id);
    refresh();
  };

  return (
    <div className="mt-5">
      <h2 className="text-xl font-bold mb-3">Onboarding Status</h2>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Name</th>
            <th>Email</th>
            <th>SF</th>
            <th>Team Slack</th>
            <th>HR Slack</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item._id} className="border">
              <td>{item.name}</td>
              <td>{item.email}</td>

              <td>{item.sfStatus}</td>
              <td>{item.slackTeamStatus}</td>
              <td>{item.slackHrStatus}</td>

              <td>
                {(item.sfStatus === "FAILED" ||
                  item.slackTeamStatus === "FAILED" ||
                  item.slackHrStatus === "FAILED") && (
                  <button
                    onClick={() => retry(item._id)}
                    className="bg-red-500 text-white px-2 py-1"
                  >
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}