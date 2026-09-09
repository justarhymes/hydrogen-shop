import type {MountainEvent} from '~/data/events';

export function EventList({events}: {events: MountainEvent[]}) {
  return (
    <ol className="grid gap-px border border-primary/10 bg-primary/10">
      {events.map((event) => (
        <li
          key={event.id}
          className="grid gap-4 bg-contrast p-5 md:grid-cols-[10rem_1fr_auto] md:items-center"
        >
          <time dateTime={event.date} className="text-lead font-medium">
            {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(`${event.date}T12:00:00`))}
          </time>
          <div className="grid gap-1">
            <span className="text-fine uppercase tracking-[0.12em] opacity-60">
              {event.category}
            </span>
            <h2 className="text-lead font-medium">{event.title}</h2>
            <span className="text-sm opacity-70">{event.location}</span>
          </div>
          <a href={event.sourceUrl} target="_blank" rel="noreferrer">
            Official details ↗
          </a>
        </li>
      ))}
    </ol>
  );
}
