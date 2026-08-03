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
import { SiteFooter } from "@/components/sections/SiteFooter";
import styles from "./InvitationPage.module.css";

/**
 * Composition root for the single-page wedding invitation. Each section owns
 * its own copy, styling, and local state — this component only decides
 * ordering and the shared page chrome (envelope overlay + fixed nav).
 */
export function InvitationPage() {
  return (
    <div className={styles.page}>
      <EnvelopeIntro />

      <div className={styles.container}>
        <NavBar />
        <HeroSection />
        <StorySection />
        <ParentsBlessingSection />
        <SongSection />
        <PhotoMarquee />
        <VenueDetailsSection />
        <RsvpSection />
        <LocationSection />
        <DressCodeSection />
        <FaqSection />
        <GiftSection />
        <RecommendationsSection />
        <SiteFooter />
      </div>
    </div>
  );
}
