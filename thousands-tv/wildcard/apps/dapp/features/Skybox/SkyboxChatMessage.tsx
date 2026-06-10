import Image from "next/image";

const SkyboxChatMessage = ({
    username = "Sampson",
    timestamp = "12:30 AM",
    message = "Sampson strted a Skybox!!!",
    avatar = "/api/placeholder/48/48",
    teamLogo = null,
    teamColor = "#F9C74F",
}) => {
    return (
        <div className="w-full py-2 px-4 flex items-center">
            {/* Message content with gradient background */}
            <div className="flex-grow">
                <div
                    className="w-full bg-gradient-to-r from-[#27211E] to-transparent rounded-lg p-2 relative"
                    style={{
                        backgroundImage: `linear-gradient(to right, #27211E, rgba(39, 33, 30, 0.5), transparent), 
                              linear-gradient(to right, ${teamColor}33, ${teamColor}00)`,
                    }}
                >
                    {/* Left border with team color */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                        style={{ backgroundColor: teamColor }}
                    ></div>

                    <div className="flex items-start pl-2">
                        {/* User avatar moved inside the message container */}
                        <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                                <Image
                                    src={avatar}
                                    alt={username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            "/images/pfps/blake.jpg";
                                        console.log(
                                            `Failed to load image: ${avatar}`
                                        );
                                    }}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: "50%" }}
                                />
                            </div>
                        </div>

                        <div className="flex-grow">
                            {/* Username with team color and timestamp */}
                            <div className="flex items-center">
                                <span
                                    className="font-bold mr-2"
                                    style={{ color: teamColor }}
                                >
                                    {username}
                                </span>
                                <span className="text-gray-400 text-sm">
                                    {timestamp}
                                </span>
                            </div>
                            {/* Message text */}
                            <p className="text-white text-sm">{message}</p>{" "}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team logo/identifier on the right */}
            <div className="flex-shrink-0 ml-3">
                {teamLogo ? (
                    <Image
                        src={teamLogo}
                        alt="Team Logo"
                        className="w-8 h-8 rounded-full object-cover border-2"
                        style={{ borderColor: teamColor }}
                    />
                ) : (
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-md"
                        style={{
                            backgroundColor: teamColor,
                            boxShadow: `0 0 0 2px rgba(255, 255, 255, 0.5), 0 0 8px ${teamColor}`,
                        }}
                    >
                        6
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkyboxChatMessage;
