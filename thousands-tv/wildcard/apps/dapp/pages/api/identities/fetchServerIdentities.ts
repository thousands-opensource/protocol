import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IIdentityRepository from "@/repositories/interfaces/IIdentityRepository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { serverId } = req.body;

    if (!serverId) {
      return res.status(400).json({ message: "serverId is required" });
    }

    const identityRepository = diContainer.get<IIdentityRepository>("IIdentityRepository");
    const identities = await identityRepository.getIdentities();

    return res.status(200).json({ identities });
  } catch (error) {
    console.error("Error fetching server identities:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
