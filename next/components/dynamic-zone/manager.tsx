'use client';

import dynamic from 'next/dynamic';
import React from 'react';

interface DynamicZoneComponent {
  __component: string;
  id: number;
  documentId?: string;
  [key: string]: unknown;
}

interface Props {
  dynamicZone: DynamicZoneComponent[];
  locale: string;
}

const componentMapping: { [key: string]: any } = {
  'dynamic-zone.hero': dynamic(() => import('./hero').then((mod) => mod.Hero)),
  'dynamic-zone.cta': dynamic(() => import('./cta').then((mod) => mod.CTA)),

};

const DynamicZoneManager: React.FC<Props> = ({ dynamicZone, locale }) => {
  return (
    <div>
      {dynamicZone.map((componentData, index) => {
        const Component = componentMapping[componentData.__component];
        if (!Component) {
          console.warn(`No component found for: ${componentData.__component}`);
          return null;
        }
        return (
          <Component
            key={`${componentData.__component}-${componentData.id}-${index}`}
            {...componentData}
            locale={locale}
          />
        );
      })}
    </div>
  );
};

export default DynamicZoneManager;