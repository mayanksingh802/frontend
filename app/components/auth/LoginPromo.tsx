"use client";

import { useState } from "react";
import MfaIllustration from "./MfaIllustration";

const slides = [
  {
    title: "MFA for all accounts",
    description: (
      <>
        Secure online accounts with CORPIZ 2FA.
        <br />
        Back up OTP secrets and never lose access
        <br />
        to your accounts.
      </>
    ),
  },
];

export default function LoginPromo() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slide = slides[activeSlide];

  return (
    <section className="login-promo">
      <div className="promo-socials"></div>

      <div className="promo-content">
        <div className="promo-image">
          <MfaIllustration />
        </div>

        <h2>{slide.title}</h2>

        <p>{slide.description}</p>

        <button type="button" className="learn-more-button">
          Learn more
        </button>
      </div>

      <div className="promo-dots">

          <div className="promo-dots">
            <button
              type="button"
              className="promo-dot side"
              aria-label="Previous slide"
              onClick={() => {}}
            />

            <button
              type="button"
              className="promo-dot active"
              aria-label="Current slide"
            />

            <button
              type="button"
              className="promo-dot side"
              aria-label="Next slide"
              onClick={() => {}}
            />
          </div>
      </div>
    </section>
  );
}
