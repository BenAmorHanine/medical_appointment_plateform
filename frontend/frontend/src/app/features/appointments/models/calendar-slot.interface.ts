export interface CalendarSlotEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  classNames?: string[];
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    booked: number;
    capacity: number;
  };
}
