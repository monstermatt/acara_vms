import { BellIcon } from "@/icons"
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Topbar() {
    const { data: session, status } = useSession();
    const token = (session as any)?.accessToken;
    const userId = (session?.user as any)?.id; //retriever user id for all users
    const role = (session?.user as any)?.role; // Retrieve the user's role
    
    const [baseUser, setBaseUser] = useState<any>(null); // State for all users  

    useEffect(() => {
        async function fetchProfileData() {
          if (status !== "authenticated" || !token || !userId) return;
    
          try {
            const userRes = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}/`,
              {
                headers: {
                    Authorization: `Bearer ${token}`
                },
              }
            );
    
            if (!userRes.ok) throw new Error("Failed to fetch base user profile");
            const userData = await userRes.json();
            setBaseUser(userData);
            } catch (error) {
            console.error("Error loading profile:", error);
            }
        }
        fetchProfileData();
    }, [status, token, userId]); //only fetch when data changes


    return (
        <nav className ="w-full h-20 flex items-center justify-end px-8 bg-white z-0">
            <div className = "flex items-center gap-6">

                <button className = "relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors border border-gray-200">
                    {<BellIcon />}
                </button>

                <div className = "h-8 w-[1px] bg-gray-200"></div>

                <div className = "flex items-center gap-3">
                    <div className="relative h-13 w-13 shrink-0">
                        <Link href= "/profile"><Image
                            src = "/profile-pic.png"
                            alt = "Profile Picture"
                            fill
                            className = "object-cover rounded-full"
                        /></Link>
                    </div>
                    <div className = "">
                        <p className = "text-sm font-semibold text-gray-900 leading-tight">{baseUser?.first_name} {baseUser?.last_name}</p>
                        <p className ="text-xs text-gray-500">{baseUser?.role}</p>
                    </div>
                </div>
            </div>
        </nav>
    );
}