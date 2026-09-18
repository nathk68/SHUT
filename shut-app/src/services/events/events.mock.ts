import * as Crypto from 'expo-crypto';
import { IEventsService } from './events.service';
import { LiveEvent } from '../../types';
import { EventStatus } from '../../config/constants';
import { MOCK_EVENTS } from '../_mock-data/events';
import { getStoredData, setStoredData } from '../../utils/storage';

const STORAGE_KEY = '@shut_events';

export class MockEventsService implements IEventsService {
  private async getAll(): Promise<LiveEvent[]> {
    const stored = await getStoredData<LiveEvent[]>(STORAGE_KEY);
    if (stored) return stored;
    await setStoredData(STORAGE_KEY, MOCK_EVENTS);
    return [...MOCK_EVENTS];
  }

  private async saveAll(events: LiveEvent[]): Promise<void> {
    await setStoredData(STORAGE_KEY, events);
  }

  async getUpcomingEvents(): Promise<LiveEvent[]> {
    const all = await this.getAll();
    return all
      .filter(e => e.status === 'scheduled')
      .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime));
  }

  async getLiveEvents(): Promise<LiveEvent[]> {
    const all = await this.getAll();
    return all.filter(e => e.status === 'live');
  }

  async getAllEvents(): Promise<LiveEvent[]> {
    return this.getAll();
  }

  async getEventById(id: string): Promise<LiveEvent | null> {
    const all = await this.getAll();
    return all.find(e => e.id === id) || null;
  }

  async getEventsByFestival(festivalId: string): Promise<LiveEvent[]> {
    const all = await this.getAll();
    return all
      .filter(e => e.festivalId === festivalId)
      .sort((a, b) => b.scheduledStartTime.localeCompare(a.scheduledStartTime));
  }

  async createEvent(event: Omit<LiveEvent, 'id' | 'createdAt'>): Promise<LiveEvent> {
    const all = await this.getAll();
    const newEvent: LiveEvent = {
      ...event,
      id: `evt-${Crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    all.push(newEvent);
    await this.saveAll(all);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<LiveEvent>): Promise<LiveEvent> {
    const all = await this.getAll();
    const index = all.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    all[index] = { ...all[index], ...updates };
    await this.saveAll(all);
    return all[index];
  }

  async deleteEvent(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter(e => e.id !== id);
    await this.saveAll(filtered);
  }

  async setEventStatus(id: string, status: EventStatus): Promise<LiveEvent> {
    const updates: Partial<LiveEvent> = { status };
    if (status === 'live') {
      updates.actualStartTime = new Date().toISOString();
    } else if (status === 'ended') {
      updates.actualEndTime = new Date().toISOString();
    }
    return this.updateEvent(id, updates);
  }

  async incrementViewerCount(_id: string, _delta: 1 | -1): Promise<void> {
    // mock: no-op
  }
}
