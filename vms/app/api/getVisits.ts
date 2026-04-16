
import { VolunteerVisit } from "../volunteers/types/visits";

export async function getVisits(): Promise<VolunteerVisit[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/visits`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(`Failed to fetch visits: ${res.status} ${res.statusText}`);
      return [];
    }

    const visitsData: VolunteerVisit[] = await res.json();

    return visitsData;
  } catch (error) {
    console.error("Error fetching visits:", error);
    return [];
  }
}

export default getVisits;