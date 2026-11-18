import { IDonationService } from './donation.service';

export class MockDonationService implements IDonationService {
  async createCheckout(_amountCents: number): Promise<{ url: string }> {
    return { url: 'https://checkout.stripe.com/mock-session' };
  }
}
