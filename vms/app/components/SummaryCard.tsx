

const AppointmentsCard = ({ title, value, iconSrc }: { title: string; value: string | number; iconSrc: string }) => {
  return (
    <div className="summary-card relative w-full h-32 rounded-3xl p-4 text-white overflow-hidden
                    bg-gradient-to-b from-[#CD5000] to-[#9F0059]">
      
      <div className="relative z-10">
        <p className="text-sm font-bold">{title}</p>
        <h1 className="text-3xl font-bold mt-2">{value}</h1>
      </div>

      <img
        src={iconSrc}
        alt={`Summary Icon Card for ${title}`}
        className="absolute right-0 bottom-0 h-24 w-auto object-contain block"
      />

    </div>
  );
};

export default AppointmentsCard;