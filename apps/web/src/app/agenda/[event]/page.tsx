import { EnhanceMenuBreadcrumbs } from '@/app/menu-breadcrumbs';
import { resolveCmsImage } from '@/common/resolve-cms-image';
import { truncateStringAtWord } from '@/common/truncate-string-at-word';
import { Button } from '@/components/button';
import { Container } from '@/components/container';
import { RemoteMdx } from '@/components/remote-mdx';
import { ShareBar } from '@/components/share-bar';
import { Typography } from '@/components/typography';
import { cx } from '@/cva.config';
import { getEventBySlug } from '@/services/cms/get-event-by-slug';
import slugify from '@sindresorhus/slugify';
import { IconArrowLeft, IconCalendarEvent, IconExternalLink, IconMapPin, IconTicket } from '@tabler/icons-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Metadata } from 'next';
import Image from 'next/image';
import { default as Link } from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AddToCalendarDropdown } from '../add-to-calendar-dropdown';
import { OpenInMapDropdown } from './open-in-map-dropdown';

interface Props {
  params: { event: string };
}

export const revalidate = 300;

export default async function EventPage({ params }: Props) {
  const event = await getEventBySlug(params.event);

  if (!event) return redirect('/agenda');
  const { title, subject, intro, content, address, cover, addressName, eventbrite, eventbriteTitle, report } = event;

  const hasPassed = new Date(event.end) < new Date();
  const showReport = Boolean(report) && hasPassed;

  const end = new Date(event.end);
  const start = new Date(event.start);

  return (
    <>
      <EnhanceMenuBreadcrumbs append={title} />

      <div className={cx('relative -mt-14 h-[300px] w-full overflow-hidden object-fill', hasPassed && 'grayscale')}>
        {cover && (
          <Image
            className="object-cover"
            src={resolveCmsImage({ ext: cover.ext!, hash: cover.hash! }).toString()}
            fill
            alt={cover.alt || title}
          />
        )}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-main p-6 text-center text-5xl font-bold text-white">
          {format(start, 'eeee d MMMM', { locale: nl })}
        </div>
      </div>
      <Container>
        <Button component={Link} href="/agenda" variant="text" startIcon={<IconArrowLeft />} className="mt-2">
          Overzicht
        </Button>
        {hasPassed && (
          <Typography variant="h1" component="span" className="inline-block rounded bg-primary-dark p-3 text-white">
            {showReport ? 'Verslag' : 'Afgelopen'}
          </Typography>
        )}
        <Typography variant="h1" className="mt-12">
          {title}
        </Typography>
        {!hasPassed && (
          <div className="mt-12 flex flex-wrap gap-4 px-4">
            <Button component="span" className="hover:bg-primary-dark focus:bg-primary-dark">
              {format(start, 'eeee d MMMM', { locale: nl })} | {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
            </Button>
            <OpenInMapDropdown address={address}>
              <Button variant="outlined" startIcon={<IconMapPin />}>
                {addressName}
              </Button>
            </OpenInMapDropdown>
            {eventbrite && (
              <Button
                component="a"
                variant="outlined"
                target="__blank"
                href={eventbrite}
                rel="noopener noreferrer"
                startIcon={<IconTicket />}
                endIcon={<IconExternalLink size={16} />}
              >
                Ticket bestellen
              </Button>
            )}
            <AddToCalendarDropdown
              end={end}
              start={start}
              eventTitle={title}
              eventDetails={intro}
              eventLocation={address}
            >
              <Button variant="outlined" startIcon={<IconCalendarEvent />}>
                Save the date
              </Button>
            </AddToCalendarDropdown>
          </div>
        )}
        <Typography className="font-bold">{intro}</Typography>
        <Typography>Onderwerp: {subject}</Typography>
        <RemoteMdx content={showReport ? report! : content} />
        <div className="mt-6">
          <ShareBar title={title} />
        </div>
      </Container>
    </>
  );
}

export async function generateMetadata({ params }: { params: { event: string } }): Promise<Metadata> {
  const event = await getEventBySlug(params.event);

  if (!event) return notFound();

  function images() {
    if (!event.cover || !event.cover.ext || !event.cover.hash || !event.cover.mime) return;

    const rootURL = resolveCmsImage({
      ext: event.cover.ext,
      hash: event.cover.hash,
      width: 1200,
      height: 630,
    });

    const url = new URL(rootURL.pathname + rootURL.search, 'https://regels.overheid.nl').toString();

    return {
      url,
      width: 1200,
      height: 630,
      secureUrl: url,
      type: event.cover.mime,
      alt: event.cover.alt || undefined,
    };
  }

  return {
    title: `${event.title} - Agenda - regels.overheid.nl`,
    description: truncateStringAtWord(event.intro || '', 100),
    alternates: {
      canonical: `https://regels.overheid.nl/blog/${event.id}/${slugify(event.title)}`,
    },
    openGraph: {
      title: event.title,
      description: truncateStringAtWord(event.intro || '', 150),
      images: images(),
      url: `https://regels.overheid.nl/agenda/${params.event}`,
      type: 'article',
      siteName: 'regels.overheid.nl',
      locale: 'nl_NL',
    },
    twitter: {
      title: event.title,
      site: 'https://regels.ovherheid.nl',
      card: 'summary',
      images: images(),
    },
  };
}
