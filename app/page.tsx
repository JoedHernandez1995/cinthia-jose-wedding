"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#c9a877";

const faqs = [
  { n: "01", q: "¿Puedo traer un invitado?", a: "Debido a espacio limitado, solo podremos recibir a los invitados indicados en la invitación. Agradecemos su comprensión." },
  { n: "02", q: "¿Están invitados los niños?", a: "Aunque adoramos a los más pequeños, hemos decidido que nuestra celebración sea solo para adultos. Agradecemos su comprensión." },
  { n: "03", q: "¿La ceremonia y recepción son al aire libre?", a: "Sí, todo el evento será al aire libre. La recepción se realizará bajo un toldo cubierto, sin aire acondicionado." },
  { n: "04", q: "¿Puedo tomar fotos durante la ceremonia?", a: "Preferimos que no. Contamos con fotografía y videografía profesional para eso. Te pedimos guardar el teléfono y disfrutar el momento con nosotros." },
  { n: "05", q: "¿Hay algún código de vestimenta?", a: "Sí, pedimos con cariño vestir de color negro. Encuentras todos los detalles en la sección de Vestimenta." },
];

const WHATSAPP_NUMBER = "50499999999";
const YES_MESSAGE = "¡Hola! Confirmo que asistiré a la boda de José & Cinthia el 7 de noviembre. ¡Nos vemos ahí! 🎉";
const NO_MESSAGE = "Hola, lamentablemente no podré asistir a la boda de José & Cinthia el 7 de noviembre. ¡Muchas felicidades a ambos!";
const PINTEREST_MEN = "https://www.pinterest.com/search/pins/?q=traje%20negro%20boda%20elegante";
const PINTEREST_WOMEN = "https://www.pinterest.com/search/pins/?q=vestido%20largo%20negro%20gala";
const RECOMMENDATIONS_LINK = "https://docs.google.com/document/d/PON-AQUI-TU-DOCUMENTO/edit";

// Marquee photo ids — falls back to a gray placeholder if the file is missing in /public/photos
const marqueeIds = [
  "marquee-1", "marquee-2", "marquee-3", "marquee-4", "marquee-5",
  "marquee-1-b", "marquee-2-b", "marquee-3-b", "marquee-4-b", "marquee-5-b",
];

const revealIds = [
  "hero", "historia", "padres", "cancion", "detalles", "comollegar",
  "vestimenta", "recomendaciones", "rsvp", "gift", "faq", "footer",
];

const giftAccounts = [
  { label: "CUENTA EN LEMPIRAS · HONDURAS", line1: "Banco: BAC Honduras", line2: "Cuenta de ahorros: 000-000-0000 · José López", copyText: "000-000-0000" },
  { label: "CUENTA EN DÓLARES · HONDURAS", line1: "Banco: Banco Atlántida", line2: "Cuenta de ahorros: 000-000-0000 · Cinthia Cruz", copyText: "000-000-0000" },
  { label: "VENMO · PARA INVITADOS EN EE.UU.", line1: "@Jose-Cinthia-Boda", line2: "", copyText: "@Jose-Cinthia-Boda" },
];

function Reveal({ id, revealed, children }: { id: string; revealed: Set<string>; children: React.ReactNode }) {
  const shown = revealed.has(id);
  return (
    <div
      data-reveal-id={id}
      style={{
        opacity: shown ? 1 : 0,
        transform: `translateY(${shown ? 0 : 22}px)`,
        transition: "opacity .9s cubic-bezier(.16,.8,.24,1),transform .9s cubic-bezier(.16,.8,.24,1)",
      }}
    >
      {children}
    </div>
  );
}

function Photo({ id, style, alt }: { id: string; style: React.CSSProperties; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <div style={{ ...style, background: "#ddd7c9", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a63", fontSize: 10 }}>{alt}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/photos/${id}.webp`} alt={alt} style={style} onError={() => setErrored(true)} />;
}

export default function Home() {
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [rsvpChoice, setRsvpChoice] = useState<"yes" | "no" | null>(null);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const observer = new IntersectionObserver(
      (entries) => {
        let changedAny = false;
        const next = new Set(revealedRef.current);
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute("data-reveal-id");
            if (id && !next.has(id)) {
              next.add(id);
              changedAny = true;
              observer.unobserve(e.target);
            }
          }
        });
        if (changedAny) setRevealed(next);
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal-id]").forEach((el) => observer.observe(el));
    return () => {
      clearInterval(t);
      observer.disconnect();
    };
  }, []);

  const openEnvelope = () => {
    setClosing(true);
    setTimeout(() => {
      setEnvelopeOpen(true);
      setClosing(false);
    }, 700);
  };

  const copyAccount = (idx: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((c) => (c === idx ? -1 : c)), 1800);
  };

  const target = new Date("2026-11-07T16:00:00-06:00").getTime();
  const diff = Math.max(0, target - now);
  const day = 86400000, hr = 3600000, min = 60000;
  const pad = (n: number) => String(n).padStart(2, "0");
  const countdownUnits = [
    { label: "DÍAS", value: pad(Math.floor(diff / day)) },
    { label: "HORAS", value: pad(Math.floor((diff % day) / hr)) },
    { label: "MIN", value: pad(Math.floor((diff % hr) / min)) },
    { label: "SEG", value: pad(Math.floor((diff % min) / 1000)) },
  ];

  const calendarLink = `data:text/calendar;charset=utf-8,${encodeURIComponent(
    "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Boda de José & Cinthia\nLOCATION:Hacienda El Trapiche, Tegucigalpa, Honduras\nDTSTART:20261107T220000Z\nDTEND:20261108T040000Z\nDESCRIPTION:Celebración de la boda de José y Cinthia.\nEND:VEVENT\nEND:VCALENDAR"
  )}`;
  const dressLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("¡Hola! Tengo una duda sobre el atuendo para la boda de José & Cinthia.")}`;
  const yesLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(YES_MESSAGE)}`;
  const noLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(NO_MESSAGE)}`;
  const rsvpConfirmedText =
    rsvpChoice === "yes"
      ? "¡Gracias por confirmar! Nos vemos el 7 de noviembre 🎉"
      : "¡Gracias por avisarnos! Te vamos a extrañar.";
  const noBg = rsvpChoice === "no" ? "#2b2926" : "transparent";
  const noColor = rsvpChoice === "no" ? "#f3f1ed" : "#2b2926";

  return (
    <div style={{ background: "#f3f1ed", overflowX: "hidden", position: "relative" }}>
      {!envelopeOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50, background: "#f3f1ed",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 32, textAlign: "center",
            opacity: closing ? 0 : 1,
            pointerEvents: closing ? "none" : "auto",
            transition: "opacity .7s ease",
          }}
        >
          <div style={{ font: "600 10px/1.75 'Poppins',sans-serif", color: "#6b6459", marginBottom: 10, letterSpacing: ".15em" }}>TIENES UNA INVITACIÓN</div>
          <div style={{ font: "400 15px/1 'Cormorant Garamond',serif", fontStyle: "italic", color: "#6b6459", marginBottom: 28 }}>de</div>
          <div style={{ font: "400 clamp(38px,10vw,56px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 36 }}>José &amp; Cinthia</div>
          <button
            onClick={openEnvelope}
            style={{ all: "unset", cursor: "pointer", width: "min(320px,78vw)", aspectRatio: "920/720", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/envelope.png" alt="Sobre" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 18px 34px rgba(60,50,35,.18))" }} />
            <div style={{ position: "absolute", bottom: -34, font: "500 10px/1.75 'Poppins',sans-serif", color: "#6b6459", letterSpacing: ".15em" }}>PRESIONA PARA ABRIR</div>
          </button>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 28px", boxSizing: "border-box" }}>
        <nav style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 800,
          boxSizing: "border-box", zIndex: 30, background: "rgba(242,239,233,.92)", backdropFilter: "blur(6px)",
          display: "flex", justifyContent: "center", gap: 18, flexWrap: "nowrap", overflowX: "auto",
          WebkitOverflowScrolling: "touch", padding: "calc(18px + env(safe-area-inset-top)) 28px 18px",
          font: "500 10px/1.75 'Poppins',sans-serif", color: "#4a453d", borderBottom: "1px solid rgba(0,0,0,.06)",
          letterSpacing: ".15em", scrollbarWidth: "none",
        }}>
          <a href="#historia" style={{ flex: "none" }}>HISTORIA</a>
          <a href="#detalles" style={{ flex: "none" }}>DETALLES</a>
          <a href="#rsvp" style={{ flex: "none" }}>RSVP</a>
          <a href="#vestimenta" style={{ flex: "none" }}>VESTIMENTA</a>
          <a href="#recomendaciones" style={{ flex: "none" }}>RECOMENDACIONES</a>
          <a href="#faq" style={{ flex: "none" }}>PREGUNTAS</a>
        </nav>

        <section style={{ padding: "96px 0 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Reveal id="hero" revealed={revealed}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/monogram.png" alt="Monograma J&C" style={{ width: 208, height: 288, marginBottom: 8 }} />
            <div style={{ font: "400 clamp(32px,11vw,68px)/1.05 'Slight',cursive", color: "#2b2926", margin: "8px 0 18px" }}>José &amp; Cinthia</div>
            <div style={{ font: "500 10px/1.75 'Poppins',sans-serif", color: "#4a453d", marginBottom: 14, letterSpacing: ".15em" }}>07 NOVIEMBRE 2026</div>
            <div style={{ width: 24, height: 1, background: GOLD, margin: "0 auto 16px" }} />
            <div style={{ font: "400 italic 15px/1.6 'Cormorant Garamond',serif", color: "#6b6459" }}>
              Hacienda El Trapiche<br />Tegucigalpa, Honduras
            </div>
            <div style={{ position: "relative", width: "100%", maxWidth: 415, aspectRatio: "415/512", margin: "32px auto 0" }}>
              <div style={{ position: "absolute", top: "7%", left: "7.6%", width: "84.8%", height: "86.1%", borderRadius: "50%", boxShadow: "0 18px 32px rgba(60,50,35,.32)", zIndex: 1 }} />
              <Photo id="hero-photo" alt="Foto de la pareja" style={{ position: "absolute", top: "7%", left: "7.6%", width: "84.8%", height: "86.1%", zIndex: 2, filter: "grayscale(1)", clipPath: "ellipse(50% 50% at 50% 50%)", objectFit: "cover" }} />
            </div>
          </Reveal>
        </section>

        <section id="historia" style={{ padding: "26vh 0 96px", scrollMarginTop: 70, borderBottom: "1px solid rgba(0,0,0,.07)", boxSizing: "border-box" }}>
          <Reveal id="historia" revealed={revealed}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ font: "400 clamp(22px,8vw,40px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 16 }}>Nuestra Historia</div>
              <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div style={{ position: "relative", width: "100%", aspectRatio: "1101/1429", transition: "transform .5s cubic-bezier(.16,.8,.24,1)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/lace-frame.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }} />
                  <Photo id="couple-1" alt="Foto de la pareja" style={{ position: "absolute", top: "13%", left: "16%", width: "67%", height: "73%", zIndex: 2, filter: "grayscale(1)", transition: "filter .5s ease", objectFit: "cover" }} />
                </div>
              </div>
              <div>
                <div style={{ font: "400 italic 14.5px/1.85 'Cormorant Garamond',serif", color: "#3d3a34", display: "flex", flexDirection: "column", gap: 18 }}>
                  <p style={{ margin: 0 }}>Hace 11 años, nuestra historia comenzó en la universidad, dentro de un grupo de amigos. Con el tiempo, esas conversaciones fueron encontrando un espacio solo para nosotros dos, y desde entonces siempre nos hemos elegido el uno al otro, una y otra vez.</p>
                  <p style={{ margin: 0 }}>En la primavera de 2025, viajamos juntos a Nueva York. Una tarde, en Cornelia Street —una calle con un significado muy especial para nosotros— entre risas y nervios, nos comprometimos para siempre.</p>
                  <p style={{ margin: 0 }}>Ahora, rodeados de las personas que más amamos, no podemos esperar a celebrar el comienzo de nuestro próximo capítulo juntos.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section style={{ padding: "70px 0", textAlign: "center", borderTop: "1px solid rgba(0,0,0,.07)", boxSizing: "border-box" }}>
          <Reveal id="padres" revealed={revealed}>
            <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto 26px" }} />
            <p style={{ font: "400 italic 14.5px/1.85 'Cormorant Garamond',serif", color: "#3d3a34", maxWidth: 420, margin: "0 auto 30px" }}>Con la bendición de quienes nos dieron la vida y nos enseñaron a amar, damos este paso hacia la eternidad.</p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 40 }}>
              <div>
                <div style={{ font: "500 10px/1.75 'Poppins',sans-serif", color: GOLD, marginBottom: 10, letterSpacing: ".15em" }}>PADRES DE LA NOVIA</div>
                <div style={{ font: "400 italic 14px/1.7 'Cormorant Garamond',serif", color: "#3d3a34" }}>
                  <div>Carlos Alexis López Torres</div>
                  <div>María Isolina Velásquez Fuentes (Q.D.D.G.)</div>
                </div>
              </div>
              <div>
                <div style={{ font: "500 10px/1.75 'Poppins',sans-serif", color: GOLD, marginBottom: 10, letterSpacing: ".15em" }}>PADRES DEL NOVIO</div>
                <div style={{ font: "400 italic 14px/1.7 'Cormorant Garamond',serif", color: "#3d3a34" }}>
                  <div>Francisco Antonio Hernández Pon</div>
                  <div>Etna Elizabeth Alvarado Aguilar</div>
                </div>
              </div>
            </div>
            <p style={{ font: "400 italic 14.5px/1.85 'Cormorant Garamond',serif", color: "#3d3a34", maxWidth: 420, margin: "26px auto 0" }}>Acompañados por el amor de nuestras familias y llenos de gratitud por el camino que nos ha traído hasta aquí, tenemos el honor de invitarlos a compartir y ser testigos del inicio de nuestra vida juntos.</p>
          </Reveal>
        </section>

        <section style={{ padding: "96px 0", textAlign: "center", borderTop: "1px solid rgba(0,0,0,.07)", boxSizing: "border-box" }}>
          <Reveal id="cancion" revealed={revealed}>
            <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 20px" }}>
              <div style={{ width: "100%", height: "100%", animation: "spin-vinyl 8s linear infinite" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/vinyl.png" alt="Disco de vinilo" style={{ width: "100%", height: "100%", display: "block", borderRadius: "50%", boxShadow: "0 10px 24px rgba(60,50,35,.12)" }} />
                <Photo id="vinyl-center-photo" alt="Foto" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "38%", height: "38%", borderRadius: "50%", filter: "grayscale(1)", objectFit: "cover" }} />
              </div>
              <iframe
                src="https://legacy.invitarium.io/mu/451d742d570a415994"
                style={{ position: "absolute", left: "50%", bottom: -40, transform: "translateX(-50%) scale(.28)", transformOrigin: "center bottom", width: 220, height: 300, border: "none", background: "transparent" }}
                title="Reproductor de música"
                allow="autoplay"
              />
            </div>
            <div style={{ font: "400 clamp(22px,7vw,36px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 18 }}>Nuestra Canción</div>
            <div style={{ font: "400 italic 14.5px/1.8 'Cormorant Garamond',serif", color: "#6b6459", maxWidth: 380, margin: "0 auto" }}>
              Mucho antes de que hubiera una fecha, un lugar o una boda que planear, hubo pequeños momentos que poco a poco se convirtieron en nuestra historia. Esta canción es un pequeño recordatorio de ese camino.
            </div>
          </Reveal>
        </section>

        <section style={{ padding: 0, borderTop: "1px solid rgba(0,0,0,.07)", boxSizing: "border-box", overflow: "hidden" }}>
          <div style={{ display: "flex", width: "max-content", animation: "marquee-scroll 44s linear infinite", willChange: "transform" }}>
            {[...marqueeIds, ...marqueeIds].map((id, i) => (
              <Photo key={i} id={id} alt="Foto de la pareja" style={{ width: 242, height: 420, flex: "none", filter: "grayscale(1)", transform: "translateZ(0)", backfaceVisibility: "hidden", objectFit: "cover" }} />
            ))}
          </div>
        </section>

        <section id="detalles" style={{ padding: "150px 0 80px", borderTop: "1px solid rgba(0,0,0,.07)", scrollMarginTop: 70, boxSizing: "border-box" }}>
          <Reveal id="detalles" revealed={revealed}>
            <div style={{ textAlign: "center", font: "400 clamp(20px,8vw,38px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 22 }}>Lugar y Fecha</div>
            <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto 60px" }} />
            <div style={{ textAlign: "center", font: "400 italic 24px/1.4 'Cormorant Garamond',serif", color: "#2b2926", marginBottom: 10 }}>Hacienda El Trapiche</div>
            <div style={{ textAlign: "center", font: "500 11px/2 'Poppins',sans-serif", color: "#4a453d", letterSpacing: ".18em" }}>SÁBADO, 7 NOVIEMBRE DE 2026</div>
            <div style={{ textAlign: "center", font: "500 11px/2 'Poppins',sans-serif", color: "#4a453d", letterSpacing: ".18em", marginBottom: 44 }}>A PARTIR DE LAS 4:00 P.M.</div>
            <div style={{ position: "relative", marginBottom: 70 }}>
              <div style={{ overflow: "hidden", borderRadius: 2, width: "78%", transition: "transform .5s cubic-bezier(.16,.8,.24,1)" }}>
                <Photo id="venue-photo" alt="Foto de Hacienda El Trapiche" style={{ width: "100%", aspectRatio: "4/5", filter: "grayscale(1)", objectFit: "cover" }} />
              </div>
              <div style={{ position: "absolute", right: "-6%", bottom: -40, width: "64%", overflow: "hidden", borderRadius: 2, border: "6px solid #f3f1ed", boxShadow: "0 14px 26px rgba(60,50,35,.18)", transition: "transform .5s cubic-bezier(.16,.8,.24,1)" }}>
                <Photo id="venue-photo-2" alt="Foto de Hacienda El Trapiche" style={{ width: "100%", aspectRatio: "16/10", filter: "grayscale(1)", objectFit: "cover" }} />
              </div>
            </div>
            <div style={{ overflow: "hidden", borderRadius: 2, marginBottom: 40, transition: "transform .5s cubic-bezier(.16,.8,.24,1)" }}>
              <Photo id="venue-photo-3" alt="Foto de Hacienda El Trapiche" style={{ width: "100%", aspectRatio: "16/9", filter: "grayscale(1)", objectFit: "cover" }} />
            </div>
            <div style={{ width: 48, height: 1, background: GOLD, margin: "32px auto" }} />
            <div style={{ textAlign: "center", font: "500 13px/1.9 'Poppins',sans-serif", color: "#6b6459", marginBottom: 18, letterSpacing: ".15em" }}>NUESTRO PRÓXIMO CAPÍTULO COMIENZA EN</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 14, width: "100%", textAlign: "center" }}>
              {countdownUnits.map((u) => (
                <div key={u.label} style={{ minWidth: 56, textAlign: "center" }}>
                  <div style={{ font: "500 10px/1.75 'Poppins',sans-serif", color: "#2b2926", fontVariantNumeric: "tabular-nums", letterSpacing: ".15em" }}>{u.value}</div>
                  <div style={{ font: "500 10px/1.75 'Poppins',sans-serif", color: "#8a8477", marginTop: 6, letterSpacing: ".15em" }}>{u.label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 26 }}>
              <a href={calendarLink} download="Boda-Jose-Cinthia.ics" style={{ display: "inline-block", background: GOLD, color: "#2b2926", font: "500 10px/1.75 'Poppins',sans-serif", padding: "16px 32px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease" }}>Agregar al calendario</a>
            </div>
          </Reveal>
        </section>

        <section id="rsvp" style={{ padding: "96px 0", borderTop: "1px solid rgba(0,0,0,.07)", textAlign: "center", scrollMarginTop: 70, boxSizing: "border-box" }}>
          <Reveal id="rsvp" revealed={revealed}>
            <div style={{ font: "400 clamp(24px,8vw,38px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 14 }}>R.S.V.P</div>
            <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto 18px" }} />
            <p style={{ font: "400 10px/1.75 'Poppins',sans-serif", color: "#3d3a34", maxWidth: 360, margin: "0 auto 8px", letterSpacing: ".15em" }}>Agradeceremos confirmar tu asistencia antes del</p>
            <p style={{ font: "600 italic 20px/1.4 'Cormorant Garamond',serif", color: "#2b2926", margin: "0 0 34px" }}>1 de octubre, 2026</p>
            <div style={{ background: "#faf8f4", border: "1.5px solid rgba(43,41,38,.35)", borderRadius: 2, padding: "36px 28px", maxWidth: 340, margin: "0 auto" }}>
              {rsvpChoice && (
                <div style={{ font: "400 italic 15px/1.6 'Cormorant Garamond',serif", color: "#2b2926", marginBottom: 16 }}>{rsvpConfirmedText}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <a href={yesLink} onClick={() => setRsvpChoice("yes")} target="_blank" rel="noopener" style={{ display: "block", background: GOLD, color: "#2b2926", font: "500 11px/1.9 'Poppins',sans-serif", padding: 18, borderRadius: 2, letterSpacing: ".18em", border: `1.5px solid ${GOLD}`, transition: "background .3s ease,color .3s ease,border-color .3s ease" }}>SÍ ASISTIRÉ</a>
                <a href={noLink} onClick={() => setRsvpChoice("no")} target="_blank" rel="noopener" style={{ display: "block", background: noBg, color: noColor, border: "1.5px solid #2b2926", font: "500 11px/1.9 'Poppins',sans-serif", padding: 18, borderRadius: 2, letterSpacing: ".18em", transition: "background .3s ease,color .3s ease" }}>NO PODRÉ ASISTIR</a>
              </div>
            </div>
          </Reveal>
        </section>

        <section style={{ padding: "96px 0", borderTop: "1px solid rgba(0,0,0,.07)", boxSizing: "border-box" }}>
          <Reveal id="comollegar" revealed={revealed}>
            <div style={{ textAlign: "center", font: "400 clamp(20px,6.5vw,30px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 16 }}>Ubicación</div>
            <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto 24px" }} />
            <div style={{ textAlign: "center", font: "400 10px/1.75 'Poppins',sans-serif", color: "#3d3a34", marginBottom: 28, letterSpacing: ".15em" }}>Boulevard Suyapa, Tegucigalpa</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, font: "400 italic 14.5px/1.85 'Cormorant Garamond',serif", color: "#3d3a34", maxWidth: 420, margin: "0 auto 30px", textAlign: "center" }}>
              <p style={{ margin: 0 }}>La forma más cómoda de llegar es en Uber, fácil de conseguir en Tegucigalpa, busca &quot;Hacienda El Trapiche&quot; o &quot;La Cuisinete&quot; y llegarás sin problema.</p>
              <p style={{ margin: 0 }}>Si vienes en vehículo propio, busca los mismos nombres en tu GPS: encontrarás parqueo disponible en el lugar, incluyendo servicio de valet.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <a href="https://maps.google.com/?q=Hacienda+El+Trapiche+Tegucigalpa" style={{ display: "inline-block", background: GOLD, color: "#2b2926", font: "500 10px/1.75 'Poppins',sans-serif", padding: "16px 32px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease" }}>Ver ubicación en Google Maps</a>
            </div>
          </Reveal>
        </section>

        <section id="vestimenta" style={{ padding: "96px 0", borderTop: "1px solid rgba(0,0,0,.07)", scrollMarginTop: 70, boxSizing: "border-box" }}>
          <Reveal id="vestimenta" revealed={revealed}>
            <div style={{ textAlign: "center", font: "400 clamp(22px,8vw,38px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 22 }}>Vestimenta</div>
            <p style={{ textAlign: "center", font: "400 10px/1.75 'Poppins',sans-serif", color: "#3d3a34", maxWidth: 420, margin: "0 auto 30px", letterSpacing: ".15em" }}>Nos encantaría que el día de nuestra boda se sienta atemporal, elegante y romántico, en honor a los novios, te pedimos vestir de color negro.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#faf8f4", border: "1px solid rgba(43,41,38,.15)", borderRadius: 2, padding: "32px 28px", textAlign: "center", boxShadow: "0 10px 26px rgba(60,50,35,.08)" }}>
                <div style={{ width: 32, height: 1, background: GOLD, margin: "0 auto 18px" }} />
                <div style={{ font: "600 italic 18px/1.4 'Cormorant Garamond',serif", color: "#2b2926", marginBottom: 10, letterSpacing: ".05em" }}>Caballeros</div>
                <div style={{ font: "400 11px/1.8 'Poppins',sans-serif", color: "#4a453d", letterSpacing: ".1em" }}>Traje o esmoquin de color <b style={{ color: "#000", fontSize: 12.5 }}>negro</b>, camisa blanca, corbatín (no corbata) y zapatos <b style={{ color: "#090909", fontSize: 12.5 }}>negros</b>.</div>
                <a href={PINTEREST_MEN} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: 20, background: "transparent", color: "#8a6a3a", border: `1px solid ${GOLD}`, font: "500 9px/1.5 'Poppins',sans-serif", padding: "12px 24px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease,color .3s ease" }}>Ver Ejemplos</a>
              </div>
              <div style={{ background: "#faf8f4", border: "1px solid rgba(43,41,38,.15)", borderRadius: 2, padding: "32px 28px", textAlign: "center", boxShadow: "0 10px 26px rgba(60,50,35,.08)" }}>
                <div style={{ width: 32, height: 1, background: GOLD, margin: "0 auto 18px" }} />
                <div style={{ font: "600 italic 18px/1.4 'Cormorant Garamond',serif", color: "#2b2926", marginBottom: 10, letterSpacing: ".05em" }}>Damas</div>
                <div style={{ font: "400 11px/1.8 'Poppins',sans-serif", color: "#4a453d", letterSpacing: ".1em" }}>Vestido largo de gala, color <b style={{ color: "#000", fontSize: 12.5 }}>negro</b>.</div>
                <a href={PINTEREST_WOMEN} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: 20, background: "transparent", color: "#8a6a3a", border: `1px solid ${GOLD}`, font: "500 9px/1.5 'Poppins',sans-serif", padding: "12px 24px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease,color .3s ease" }}>Ver Ejemplos</a>
              </div>
            </div>
            <p style={{ textAlign: "center", margin: "24px 0 0" }}>
              <a href={dressLink} style={{ display: "inline-block", background: GOLD, color: "#2b2926", font: "500 10px/1.75 'Poppins',sans-serif", padding: "16px 32px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease" }}>Dudas sobre tu atuendo, presiona aquí</a>
            </p>
          </Reveal>
        </section>

        <section id="faq" style={{ padding: "96px 0", borderTop: "1px solid rgba(0,0,0,.07)", scrollMarginTop: 70, boxSizing: "border-box" }}>
          <Reveal id="faq" revealed={revealed}>
            <div style={{ textAlign: "center", font: "400 clamp(18px,8vw,38px)/1.1 'Slight',cursive", color: "#2b2926", marginBottom: 36 }}>Preguntas Frecuentes</div>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p style={{ font: "400 italic 14.5px/1.85 'Cormorant Garamond',serif", color: "#3d3a34", margin: "0 0 16px" }}>Si tienen dudas o alguna consulta en específico, por favor contactarse con <b>Paola Andino</b></p>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener" style={{ display: "inline-block", background: GOLD, color: "#2b2926", font: "500 10px/1.75 'Poppins',sans-serif", padding: "16px 32px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease" }}>Contactar por WhatsApp</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {faqs.map((f) => (
                <div key={f.n} style={{ padding: "22px 0", borderTop: "1px solid #e6e0d3", display: "flex", gap: 14 }}>
                  <div style={{ font: "400 italic 15px/1.4 'Cormorant Garamond',serif", color: GOLD, flex: "none" }}>{f.n}</div>
                  <div>
                    <div style={{ font: "600 10px/1.75 'Poppins',sans-serif", color: "#2b2926", marginBottom: 8, letterSpacing: ".15em" }}>{f.q}</div>
                    <div style={{ font: "400 10px/1.75 'Poppins',sans-serif", color: "#4a453d", letterSpacing: ".15em" }}>{f.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section style={{ padding: "96px 0", borderTop: "1px solid rgba(0,0,0,.07)", textAlign: "center", boxSizing: "border-box" }}>
          <Reveal id="gift" revealed={revealed}>
            <div style={{ font: "400 clamp(18px,7vw,34px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 14 }}>Más Que Un Regalo</div>
            <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto" }} />
            <p style={{ font: "400 10px/1.75 'Poppins',sans-serif", color: "#3d3a34", maxWidth: 400, margin: "30px auto 0", letterSpacing: ".15em" }}>Lo único que realmente necesitamos ese día es tenerlos cerca, celebrando con nosotros el inicio de esta nueva etapa. Su cariño y su presencia ya son suficiente. Si desean tener un gesto con nosotros, una contribución en efectivo para nuestra nueva etapa sería recibida con todo nuestro cariño.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340, margin: "28px auto 0", textAlign: "left" }}>
              {giftAccounts.map((acc, idx) => (
                <div key={acc.label} style={{ background: "#faf8f4", border: "1px solid #e6e0d3", borderRadius: 2, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ font: "600 10px/1.75 'Poppins',sans-serif", color: "#8a7a63", letterSpacing: ".15em" }}>{acc.label}</div>
                    <button onClick={() => copyAccount(idx, acc.copyText)} style={{ all: "unset", cursor: "pointer", font: "500 9px/1.5 'Poppins',sans-serif", color: "#8a7a63", letterSpacing: ".1em", borderBottom: "1px solid #8a7a63", flex: "none" }}>{copiedIdx === idx ? "COPIADO" : "COPIAR"}</button>
                  </div>
                  <div style={{ font: "400 10px/1.75 'Poppins',sans-serif", color: "#2b2926", letterSpacing: ".15em" }}>{acc.line1}</div>
                  {acc.line2 && <div style={{ font: "400 10px/1.75 'Poppins',sans-serif", color: "#2b2926", letterSpacing: ".15em" }}>{acc.line2}</div>}
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="recomendaciones" style={{ padding: "96px 0", borderTop: "1px solid rgba(0,0,0,.07)", scrollMarginTop: 70, boxSizing: "border-box" }}>
          <Reveal id="recomendaciones" revealed={revealed}>
            <div style={{ textAlign: "center", font: "400 clamp(18px,8vw,38px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 14 }}>Recomendaciones</div>
            <div style={{ width: 28, height: 1, background: GOLD, margin: "0 auto" }} />
            <p style={{ textAlign: "center", font: "400 10px/1.75 'Poppins',sans-serif", color: "#6b6459", maxWidth: 380, margin: "30px auto 30px", letterSpacing: ".15em" }}>Reunimos hospedaje, cabello y maquillaje, y alquiler de trajes de confianza en una sola lista.</p>
            <div style={{ textAlign: "center" }}>
              <a href={RECOMMENDATIONS_LINK} target="_blank" rel="noopener" style={{ display: "inline-block", background: GOLD, color: "#2b2926", font: "500 10px/1.75 'Poppins',sans-serif", padding: "16px 32px", borderRadius: 2, letterSpacing: ".15em", transition: "background .3s ease" }}>Ver lista de recomendaciones</a>
            </div>
          </Reveal>
        </section>

        <footer style={{ padding: "96px 0 72px", textAlign: "center", borderTop: "1px solid rgba(0,0,0,.07)", boxSizing: "border-box" }}>
          <Reveal id="footer" revealed={revealed}>
            <div style={{ margin: "0 auto 28px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/monogram.png" alt="Monograma J&C" style={{ width: 195, height: 263 }} />
            </div>
            <div style={{ font: "400 clamp(20px,6.5vw,32px)/1 'Slight',cursive", color: "#2b2926", marginBottom: 10 }}>José &amp; Cinthia</div>
            <div style={{ width: 20, height: 1, background: GOLD, margin: "0 auto 12px" }} />
            <div style={{ font: "500 10px/1.75 'Poppins',sans-serif", color: "#8a8477", letterSpacing: ".15em" }}>07 · 11 · 2026</div>
          </Reveal>
        </footer>
      </div>
    </div>
  );
}
