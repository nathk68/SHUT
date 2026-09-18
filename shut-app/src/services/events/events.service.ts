import { LiveEvent } from '../../types';
import { EventStatus } from '../../config/constants';

export interface IEventsService {
  getUpcomingEvents(): Promise<LiveEvent[]>;
  getLiveEvents(): Promise<LiveEvent[]>;
  getAllEvents(): Promise<LiveEvent[]>;
  getEventById(id: string): Promise<LiveEvent | null>;
  getEventsByFestival(festivalId: string): Promise<LiveEvent[]>;
  createEvent(event: Omit<LiveEvent, 'id' | 'createdAt'>): Promise<LiveEvent>;
  updateEvent(id: string, updates: Partial<LiveEvent>): Promise<LiveEvent>;
  deleteEvent(id: string): Promise<void>;
  setEventStatus(id: string, status: EventStatus): Promise<LiveEvent>;
  incrementViewerCount(id: string, delta: 1 | -1): Promise<void>;
}
