export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  description: string | null;
  url: string | null;
  isAllDay: boolean;
}

export interface CalendarResponse {
  events: CalendarEvent[];
}

export interface CalendarError {
  error: string;
}
