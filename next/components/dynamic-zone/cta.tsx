'use client';

import Link from 'next/link';
import React from 'react';

import { Container } from '../container';
import { Button } from '../elements/button';

export const CTA = ({
  heading,
  sub_heading,
  CTAs,
  locale,
}: {
  heading: string;
  sub_heading: string;
  CTAs: any[];
  locale: string;
}) => {
  return (
    <div className="relative py-40">
      <Container className="flex flex-col md:flex-row justify-between items-center w-full px-8">
        <div className="flex flex-col">
          {heading}
          <p className="max-w-md mt-8 text-center md:text-left text-sm md:text-base mx-auto md:mx-0 text-neutral-400">
            {sub_heading}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {CTAs &&
            CTAs.map((cta, index) => (
              <Button
                as={Link}
                key={index}
                href={`/${locale}${cta.URL}`}
                variant={cta.variant}
                className="py-3"
              >
                {cta.text}
              </Button>
            ))}
        </div>
      </Container>
    </div>
  );
};