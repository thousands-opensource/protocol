import React from "react";
import { ChevronRight } from "lucide-react";
import { Image } from "@chakra-ui/react";
import { identities, Identity } from "@/utils/indentityUtil";

interface IdentitySelectionProps {
    onSelectIdentity: (identityId: string) => void;
}

/**
 * Identity selection component (items to boost)
 */
const IdentitySelection = ({ onSelectIdentity }: IdentitySelectionProps) => {
    return (
        <div
            className="space-y-6 rounded-xl p-3"
            style={{
                background: "linear-gradient(to right, #a32c24 60%, #471565)",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            }}
        >
            <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Image
                        src="/images/ServerNavigation/wildcardservercicle.svg"
                        alt="Credits"
                        width={7}
                        height={7}
                        className="w-4 h-4"
                    />
                    Select Boost ⚡️
                </h4>
            </div>

            <div className="relative rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 p-[1px] transition-all duration-300">
                <div className="bg-[#1A1B1F] rounded-xl p-6 space-y-4">
                    {identities.map((identity: Identity) => (
                        <div
                            key={identity.id}
                            className="flex items-center justify-between p-4 bg-[#1E1F23] rounded-lg ring-1 ring-white/5 hover:ring-blue-400/30 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                    {identity.avatarUrl ? (
                                        <Image
                                            src={identity.avatarUrl}
                                            alt={identity.name}
                                            className="rounded-full object-cover w-full h-full"
                                        />
                                    ) : identity.emoji ? (
                                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary-400 via-[#221f1f] to-[#592d27] flex items-center justify-center text-2xl">
                                            {identity.emoji}
                                        </div>
                                    ) : null}
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-small">
                                        {identity.name}
                                    </h3>
                                    {identity.price && (
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {identity.price}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => onSelectIdentity(identity.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-white rounded-lg transition-all duration-300"
                                style={{
                                    background:
                                        "linear-gradient(180deg, #49aad1 0%, #4271e2 100%)",
                                }}
                                onMouseEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.background =
                                        "linear-gradient(180deg, #6ec1e4 0%, #5a8de2 100%)";
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.background =
                                        "linear-gradient(180deg, #49aad1 0%, #4271e2 100%)";
                                }}
                            >
                                <span>Boost</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IdentitySelection;
