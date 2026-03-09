import { openApiComponents } from '@/lib/openapi/components';
import { adminPeriodiRealizacijePaths } from '@/lib/openapi/paths/adminPeriodiRealizacije';
import { adminUpisAnalitikaPaths } from '@/lib/openapi/paths/adminUpisAnalitika';
import { authPaths } from '@/lib/openapi/paths/auth';
import { fakultetiAndNotificationsPaths } from '@/lib/openapi/paths/fakultetiNotifications';
import { molbePaths } from '@/lib/openapi/paths/molbe';
import { studentBiranjePaths } from '@/lib/openapi/paths/studentBiranje';
import { studentPrijavaRatingsPaths } from '@/lib/openapi/paths/studentPrijavaRatings';

const openApiPaths = {
  ...authPaths,
  ...fakultetiAndNotificationsPaths,
  ...molbePaths,
  ...studentBiranjePaths,
  ...studentPrijavaRatingsPaths,
  ...adminPeriodiRealizacijePaths,
  ...adminUpisAnalitikaPaths,
};

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Studentska Sluzba API',
    version: '1.0.0',
    description: 'OpenAPI specifikacija za backend rute u aplikaciji.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth' },
    { name: 'Fakulteti' },
    { name: 'Notifikacije' },
    { name: 'Molbe' },
    { name: 'Student' },
    { name: 'Admin' },
    { name: 'Analitika' },
  ],
  paths: openApiPaths,
  components: openApiComponents,
} as const;
