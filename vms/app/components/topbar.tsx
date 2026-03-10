import Image from "next/image";

export default function Topbar() {
    return (
        <nav className ="w-full h-20 flex items-center justify-end px-8 bg-white z-0">
            <div className = "flex items-center gap-6">

                <button className = "relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors border border-gray-200">
                    notifications
                </button>

                <div className = "h-8 w-[1px] bg-gray-200"></div>

                <div className = "flex items-center gap-3">
                    <div className="relative h-13 w-13 shrink-0">
                        <Image
                            src = "/profile-pic.png"
                            alt = "Profile Picture"
                            fill
                            className = "object-cover rounded-full"
                        />
                    </div>
                    <div className = "">
                        <p className = "text-sm font-semibold text-gray-900 leading-tight">Name Surname</p>
                        <p className ="text-xs text-gray-500">Title</p>
                    </div>
                </div>
            </div>
        </nav>
    );
}