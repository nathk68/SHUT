import { CameraConfig } from './stream';

export interface Festival {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  location: string;
  ownerId: string;
  cameras: CameraConfig[];
  createdAt: string;
}
