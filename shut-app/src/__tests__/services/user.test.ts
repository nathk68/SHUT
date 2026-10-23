import { MockUserService } from '../../services/user/user.mock';
import type { UpdateProfilePayload } from '../../types/profile';

describe('MockUserService', () => {
  let service: MockUserService;

  beforeEach(() => {
    service = new MockUserService();
  });

  it('getUserById returns null for unknown user', async () => {
    const result = await service.getUserById('nonexistent');
    expect(result).toBeNull();
  });

  it('getUserById returns user for known id', async () => {
    const result = await service.getUserById('user-viewer-001');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('user-viewer-001');
  });

  it('updateProfile merges fields onto existing user', async () => {
    const payload: UpdateProfilePayload = { bio: 'New bio', experience: 'confirme' };
    const updated = await service.updateProfile('user-viewer-001', payload);
    expect(updated.bio).toBe('New bio');
    expect(updated.experience).toBe('confirme');
  });

  it('updateProfile throws for unknown user', async () => {
    await expect(service.updateProfile('nonexistent', {})).rejects.toThrow();
  });

  it('uploadAvatar returns a mock URL', async () => {
    const url = await service.uploadAvatar('user-viewer-001', 'file:///local/image.jpg');
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });
});
