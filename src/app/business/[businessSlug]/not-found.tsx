import Link from 'next/link';

export default function BusinessSiteNotFound() {
  return (
    <main className="business-site business-site--missing">
      <section>
        <p className="eyebrow">Business Site unavailable</p>
        <h1>This protected Business surface could not be found.</h1>
        <p>The slug may not exist, the site may not be published, or persistence is unavailable.</p>
        <Link href="/">Return to Inomasa</Link>
      </section>
    </main>
  );
}
