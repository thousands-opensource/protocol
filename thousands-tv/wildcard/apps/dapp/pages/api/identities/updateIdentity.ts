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
    const updatedIdentity: IIdentity = req.body;

    // Validate required fields
    if (!updatedIdentity._id) {
      return res.status(400).json({ 
        error: '_id is required for updating an identity' 
      });
    }

    if (!updatedIdentity.identityName || !updatedIdentity.identityType || !updatedIdentity.startDate) {
      return res.status(400).json({ 
        error: 'Missing required fields. identityName, identityType, and startDate are required.' 
      });
    }

    const identityRepository = diContainer.get<IIdentityRepository>('IIdentityRepository');
    const identity = await identityRepository.updateIdentity(updatedIdentity);
    
    return res.status(200).json(identity);
  } catch (error) {
    console.error('Error updating identity:', error);
    return res.status(500).json({ error: 'Failed to update identity' });
  }
}
