'use client';

import dynamic from 'next/dynamic';
import type { SwaggerUIProps } from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic<SwaggerUIProps>(
  () => import('swagger-ui-react').then(mod => mod.default),
  { ssr: false }
);

export default function SwaggerPage() {
  return (
    <main className="min-h-screen bg-white">
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        displayRequestDuration
      />
    </main>
  );
}
