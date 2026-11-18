import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.config';
import { IDonationService } from './donation.service';

export class FirebaseDonationService implements IDonationService {
  async createCheckout(amountCents: number): Promise<{ url: string }> {
    const callable = httpsCallable<{ amountCents: number }, { url: string }>(
      functions,
      'createDonationCheckout',
    );
    const result = await callable({ amountCents });
    return { url: result.data.url };
  }
}
