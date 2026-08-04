"use client";

import { EnvelopeIntro } from "@/components/sections/EnvelopeIntro";
import { NavBar } from "@/components/sections/NavBar";
import { HeroSection } from "@/components/sections/HeroSection";
import { StorySection } from "@/components/sections/StorySection";
import { ParentsBlessingSection } from "@/components/sections/ParentsBlessingSection";
import { SongSection } from "@/components/sections/SongSection";
import { PhotoMarquee } from "@/components/sections/PhotoMarquee";
import { VenueDetailsSection } from "@/components/sections/VenueDetailsSection";
import { RsvpSection } from "@/components/sections/RsvpSection";
import { LocationSection } from "@/components/sections/LocationSection";
import { DressCodeSection } from "@/components/sections/DressCodeSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { GiftSection } from "@/components/sections/GiftSection";
import { RecommendationsSection } from "@/components/sections/RecommendationsSection";
import { ClosingImageSection } from "@/components/sections/ClosingImageSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import type { GuestViewModel } from "@/types/guest";
import styles from "./InvitationPage.module.css";

interface InvitationPageProps {
  /** Only set when rendered from a guest's personal `/i/[token]` page. Root `/` renders with no guest. */
  guest?: GuestViewModel;
}

/**
 * Composition root for the single-page wedding invitation. Each section owns
 * its own copy, styling, and local state — this component only decides
 * ordering and the shared page chrome (envelope overlay + fixed nav).
 */
export function InvitationPage({ guest }: InvitationPageProps) {
  return (
    <div className={styles.page}>
      <EnvelopeIntro guest={guest} />

      <div className={styles.container}>
        <NavBar />
        <HeroSection />
        <StorySection />
        <ParentsBlessingSection />
        <SongSection />
        <PhotoMarquee />
        <VenueDetailsSection />
        <RsvpSection guest={guest} />
        <LocationSection />
        <DressCodeSection />
        <FaqSection />
        <GiftSection />
        <RecommendationsSection />
        <ClosingImageSection />
        <SiteFooter />
      </div>
    </div>
  );
}
