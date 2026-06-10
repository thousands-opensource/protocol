import { NextApiRequest, NextApiResponse } from 'next';
import { diContainer } from '../../../inversify.config';
import IIdentityRepository from '../../../repositories/interfaces/IIdentityRepository';
import { IdentityDoc } from '@repo/schemas';
import { IIdentity } from '@repo/interfaces';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IdentityDoc | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newIdentity: IIdentity = req.body;

    // Validate required fields
    if (!newIdentity.identityName || !newIdentity.identityType || !newIdentity.startDate) {
      return res.status(400).json({ 
        error: 'Missing required fields. identityName, identityType, and startDate are required.' 
      });
    }

    const identityRepository = diContainer.get<IIdentityRepository>('IIdentityRepository');
    const createdIdentity = await identityRepository.addIdentity(newIdentity);
    
    return res.status(201).json(createdIdentity);
  } catch (error) {
    console.error('Error adding identity:', error);
    return res.status(500).json({ error: 'Failed to add identity' });
  }
}
