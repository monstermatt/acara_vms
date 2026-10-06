export async function getOpportunityShifts(token: string): Promise<any[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/opportunity-shifts/`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },      
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(`Failed to fetch opportunity shifts: ${res.status} ${res.statusText}`);
      return [];
    }

    const shifts = await res.json();
    return shifts;
  } catch (error) {
    console.error("Error fetching opportunity shifts:", error);
    return [];
  }
}

export default getOpportunityShifts;
