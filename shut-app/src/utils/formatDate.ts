import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatEventDate(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return `Aujourd'hui, ${format(date, 'HH:mm', { locale: fr })}`;
  if (isTomorrow(date)) return `Demain, ${format(date, 'HH:mm', { locale: fr })}`;
  return format(date, "EEEE d MMMM, HH:mm", { locale: fr });
}

export function formatEventTime(isoString: string): string {
  return format(parseISO(isoString), 'HH:mm', { locale: fr });
}

export function formatSectionDate(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return 'Demain';
  return format(date, 'EEEE d MMMM', { locale: fr });
}

export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: fr });
}
