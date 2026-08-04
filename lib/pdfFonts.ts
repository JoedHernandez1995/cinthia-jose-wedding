import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { brandFonts } from "@/lib/brandTheme";

const fontsDir = path.join(process.cwd(), "public", "fonts");

/**
 * Registers the site's self-hosted fonts with react-pdf so the confirmation PDF actually uses the
 * same typography as the web invitation instead of falling back to Helvetica. Must run once before
 * any `renderToBuffer`/`renderToStream` call — imported for its side effect by `lib/pdf.tsx`.
 * Neither font has an italic file, so no italic weight is registered; the PDF never uses
 * `fontStyle: "italic"` for that reason (react-pdf can't synthesize a real italic from a regular
 * weight).
 */
Font.register({
  family: brandFonts.label,
  fonts: [
    { src: path.join(fontsDir, "Poppins-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "Poppins-Medium.ttf"), fontWeight: 500 },
    { src: path.join(fontsDir, "Poppins-SemiBold.ttf"), fontWeight: 600 },
  ],
});

Font.register({
  family: brandFonts.display,
  fonts: [{ src: path.join(fontsDir, "Slight-Regular.ttf"), fontWeight: 400 }],
});
