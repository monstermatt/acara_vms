import { UserData } from "@/app/volunteers/types/volunteer";
import { MessageIcon } from "@/icons";

const trStyle = { border: "1px solid #DEDEDE", background: "#FFF" };
const tbodyStyle = { color: "#494949", fontFamily: "Quicksand", textAlign: "center" as const };

interface VolunteerTableProps {
  data: UserData[];
}

export default function VolunteerTable({ data }: VolunteerTableProps) {
  return (
    <div className='table-container'>
      <table className="w-full">
        <thead className='thead'>
          <tr>
            <th>Name</th>
            <th>Phone Number</th>
            <th>Gender</th>
            <th>Skills</th>
            <th>Schedule</th>
            <th>Languages</th>
            <th>Sub?</th>
            <th>Preferences</th>
            <th>Travel Distance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody style={tbodyStyle}>
          {data.length > 0 ? (
            data.map((volunteer) => (
              <tr key={volunteer.id} style={trStyle}>
                <td>{volunteer.user?.first_name} {volunteer.user?.last_name}</td>
                <td>{volunteer.phone_number}</td>
                <td>{volunteer.gender}</td>
                <td>
                  {volunteer.skills?.map((skill, index) => (
                    <span key={index}>{skill.skill_name}{index < volunteer.skills.length - 1 ? ", " : ""} </span>
                  ))}
                </td>
                <td>Pending</td>
                <td>{volunteer.languages?.map(lang => lang.language_name).join(", ")}</td>
                <td>{volunteer.sub_duty_preference ? "Yes" : "No"}</td>
                <td>
                  {volunteer.preferences?.map((pref, index) => (
                    <span key={index}>{pref.preference}{index < volunteer.preferences.length - 1 ? ", " : ""} </span>
                  ))}
                </td>
                <td>{volunteer.max_distance_preferred} miles</td>
                <td>
                  <div className="flex items-center justify-center gap-2 cursor-pointer">
                    <MessageIcon />
                    <span>Message</span>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="py-4">
                No volunteers found matching the criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}