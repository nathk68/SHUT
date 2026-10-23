import type { Metadata } from "next";
import { Space_Grotesk, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHUT — Live DJ Streaming",
  description:
    "SHUT redefinit le streaming DJ. Audio haute qualite, diffusion en direct, experience immersive sur iOS & Android.",
  openGraph: {
    title: "SHUT — Live DJ Streaming",
    description:
      "Rejoins la communaute SHUT et regarde des DJs en live.",
    type: "website",
    url: "https://shutdiffusion.com",
  },
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${archivo.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
