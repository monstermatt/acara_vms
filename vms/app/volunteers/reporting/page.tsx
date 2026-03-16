export default function VolunteerReportingPage() {
  return (
    <main className = "main-container">
    <header className ="mb-8">
    <h2 className="page-header">Volunteer Reporting</h2>
    <p className="text-gray-500">Today's reports and audits</p>
    </header>

    <div className = 'flex'>
      <div className = "reporting-top-button">
        Appointments this month
      </div>

      <div className = "reporting-top-button">
        Charted Late
      </div>

      <div className = "reporting-top-button">
        Appointments on time (%)
      </div>
    </div>


    <div className = 'table-container'>
      <h1 className = 'text-black text-xl'>Volunteer Audits</h1>
      <table>
        <thead className = 'thead'>
          <tr>
            <th>Volunteer Name</th>
            <th>Appointment Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className = 'text-[#494949]'>
          <tr  className = 'border-1 border-[#DEDEDE]'>
            <td>John Doe</td>
            <td>2024-06-01</td>
            <td>On Time</td>
          </tr>
          <tr>
            <td>Jane Smith</td>
            <td>2024-06-02</td>
            <td>Late</td>
          </tr>
          {/* More rows as needed */}
        </tbody>
      </table>
    </div>

    </main>
  );
}