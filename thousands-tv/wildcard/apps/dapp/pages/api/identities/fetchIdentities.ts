import { NextApiRequest, NextApiResponse } from 'next';
import { diContainer } from '../../../inversify.config';
import IIdentityRepository from '../../../repositories/interfaces/IIdentityRepository';
import { IdentityDoc } from '@repo/schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IdentityDoc[] | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const identityRepository = diContainer.get<IIdentityRepository>('IIdentityRepository');
    const identities = await identityRepository.getIdentities();
    return res.status(200).json(identities);
  } catch (error) {
    console.error('Error fetching identities:', error);
    return res.status(500).json({ error: 'Failed to fetch identities' });
  }
}
