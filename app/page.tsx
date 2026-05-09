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
            <li><a href="#portfolios" className="hover:text-white/80">Portfolios</a></li>
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
              href="#chatbot-cta"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:bg-brand-dark"
            >
              Ask the assistant →
            </a>
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

      {/* Content cards */}
      <section
        id="portfolios"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-20"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Cost-of-Living Support",
              body:
                "From the Power Saving Bonus to the Get Active Kids Voucher, find practical help available to Victorian families.",
            },
            {
              title: "Small & Family Business",
              body:
                "Backing local small businesses across St Albans with grants, advice and tailored support programs.",
            },
            {
              title: "Veterans",
              body:
                "Honouring our veterans and their families, and ensuring they have the recognition and support they deserve.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white/95 p-6 shadow-xl shadow-black/10 backdrop-blur"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <span className="text-lg font-bold">★</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Chatbot prompt */}
      <section
        id="chatbot-cta"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-24"
      >
        <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-black/10 md:p-10">
          <div className="grid gap-6 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">
                New
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
                Got a question? Ask Natalie&rsquo;s AI assistant.
              </h2>
              <p className="mt-3 text-gray-600">
                Look for the chat bubble in the bottom-right corner. The
                assistant can answer questions about Natalie&rsquo;s work,
                portfolios, electorate services and how to get in touch — by
                pulling answers directly from
                {" "}
                <span className="font-medium">nataliesuleyman.com.au</span>.
              </p>
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                <li>• &ldquo;What support is there with the cost of living?&rdquo;</li>
                <li>• &ldquo;How do I contact the electorate office?&rdquo;</li>
                <li>• &ldquo;What is Natalie doing for small business?&rdquo;</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-brand/5 p-5 text-sm text-gray-700">
              <p className="font-semibold text-brand">Demo notice</p>
              <p className="mt-1">
                This is a demonstration site only. Responses are AI-generated
                and may contain errors. For official enquiries please call the
                electorate office on (03) 9367 9925.
              </p>
            </div>
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
