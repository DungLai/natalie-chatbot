import Image from "next/image";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background hero image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" />
      </div>

      {/* Top nav */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold">
              NS
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold uppercase tracking-wider">
                The Hon. Natalie Suleyman MP
              </p>
              <p className="text-xs text-white/70">
                State Member for St Albans
              </p>
            </div>
          </div>
          <ul className="hidden gap-7 text-sm font-medium md:flex">
            <li><a href="#about" className="hover:text-white/80">About</a></li>
            <li><a href="#electorate" className="hover:text-white/80">Electorate</a></li>
            <li><a href="#contact" className="hover:text-white/80">Contact</a></li>
          </ul>
          <a
            href="#contact"
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm hover:bg-white/90 md:inline-block"
          >
            Get in touch
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-24 pt-16 text-white md:pt-28">
        <div className="max-w-3xl">
          <p className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            Demo site · AI assistant preview
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Working hard for the people of St Albans.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
            Minister for Tourism, Sport and Major Events; Minister for Small
            and Family Business; Minister for Veterans. Proudly representing
            the diverse community of Melbourne&rsquo;s west.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://www.nataliesuleyman.com.au"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              Visit nataliesuleyman.com.au
            </a>
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="relative z-10 border-t border-white/10 bg-black/40 py-8 text-center text-xs text-white/70 backdrop-blur"
      >
        <p>
          Demo build · Not authorised by The Hon. Natalie Suleyman MP. Public
          information sourced from{" "}
          <a
            href="https://www.nataliesuleyman.com.au"
            className="underline hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            nataliesuleyman.com.au
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
