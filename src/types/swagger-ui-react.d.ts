declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react';

  export type SwaggerUIProps = {
    url?: string;
    spec?: Record<string, unknown>;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    displayRequestDuration?: boolean;
    [key: string]: unknown;
  };

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module 'swagger-ui-react/swagger-ui.css';
