export interface IDonationService {
  createCheckout(amountCents: number): Promise<{ url: string }>;
}
