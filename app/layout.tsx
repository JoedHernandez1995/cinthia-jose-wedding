import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "José & Cinthia — 7 de Noviembre 2026",
  description: "Invitación de boda de José & Cinthia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <style>{`
          @font-face{font-family:'Slight';src:url('/fonts/Slight-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
          @font-face{font-family:'Poppins';src:url('/fonts/Poppins-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
          @font-face{font-family:'Poppins';src:url('/fonts/Poppins-Medium.ttf') format('truetype');font-weight:500;font-style:normal;font-display:swap}
          @font-face{font-family:'Poppins';src:url('/fonts/Poppins-SemiBold.ttf') format('truetype');font-weight:600;font-style:normal;font-display:swap}
          html,body{margin:0;background:#f3f1ed;font-family:'Poppins',sans-serif;-webkit-font-smoothing:antialiased}
          a{color:#2b2926;text-decoration:none}
          a:hover{color:#8a7a63}
          ::selection{background:#e3d9c8}
          @keyframes spin-vinyl{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          @keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
