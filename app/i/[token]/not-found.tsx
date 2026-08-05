export default function GuestNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        gap: 8,
        fontFamily: "var(--font-label)",
        color: "var(--color-ink)",
      }}
    >
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, margin: 0 }}>
        Invitación no encontrada
      </h1>
      <p style={{ color: "var(--color-muted)", maxWidth: 360 }}>
        Este enlace no es válido o ya expiró. Si creés que esto es un error, contactanos directamente.
      </p>
    </div>
  );
}
