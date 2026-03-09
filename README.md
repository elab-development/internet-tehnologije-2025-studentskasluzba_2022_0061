# Studentska Sluzba App

## Opis aplikacije
Studentska Sluzba App je web aplikacija za digitalizaciju kljucnih procesa studentske sluzbe.  
Sistem pokriva:
- autentikaciju korisnika (student/admin),
- biranje predmeta i pregled licnih predmeta,
- prijavu ispita/kolokvijuma i unos ocena,
- upravljanje periodima prijave i realizacijama (admin),
- notifikacije i studentske molbe,
- prikaz API dokumentacije preko Swagger UI.

## Korišćene tehnologije - sažet prikaz
- `Next.js 15` + `React 18` + `TypeScript` (frontend i backend API rute),
- `Prisma ORM` + `PostgreSQL` (baza i pristup podacima),
- `Tailwind CSS` + `shadcn/radix` (UI sloj),
- `JWT` (`jsonwebtoken`) za autentifikaciju preko cookie-ja,
- `Swagger UI` + OpenAPI specifikacija za dokumentovanje API-ja,
- `Vitest` za unit i integration testove,
- eksterni API servisi: `Nager.Date` (državni praznici) i `Resend` (email potvrde).
- `recharts` za vizuelizaciju

## Pokretanje aplikacije

Ispod su jedine dve podržane varijante pokretanja.

### 1) Development: app lokalno, samo PostgreSQL u Docker-u
1. Instalirati zavisnosti:
```bash
npm install
```
2. Popuniti `.env` (skeleton dat u `.env.example`). Obavezno:
```env
DATABASE_URL=postgresql://postgres:prisma@localhost:5432/postgres?schema=public
JWT_SECRET=your-secret
JWT_MAX_AGE=3600
RESEND_API_KEY=apikey
RESEND_FROM_EMAIL=optional
```
3. Pokrenuti samo bazu:
```bash
docker compose -f docker-compose.postgres.yml up -d
```
4. Primeniti migracije:
```bash
npx prisma migrate deploy
```
5. Popuniti bazu sa početnim podacima
```bash
npx prisma db seed
```
6. Pokrenuti dev server lokalno:
```bash
npm run dev
```

App: `http://localhost:3000`  
Swagger: `http://localhost:3000/swagger`

### 2) Production-like: sve u Docker-u (full compose)
1. Popuni `.env.docker` na osnovu istog skeletona, obratiti pažnju na imena hostova za inter-kontejnersko umrežavanje:
```env
DATABASE_URL=postgresql://postgres:prisma@postgres:5432/postgres?schema=public
JWT_SECRET=your-secret
JWT_MAX_AGE=3600
RESEND_API_KEY=apikey
RESEND_FROM_EMAIL=optional
```
2. Pokrenuti kontejnerizovanu aplikaciju:
```bash
docker compose -f docker-compose.full.yml up --build -d
```

Napomena: `app` servis kreće tek kada `prisma-migrate` i `prisma-seed` završe uspešno.

### Stop komande
- Development DB:
```bash
docker compose -f docker-compose.postgres.yml down
```
- Full app:
```bash
docker compose -f docker-compose.full.yml down
```
- Full reset (uključujući bazu/volume):
```bash
docker compose -f docker-compose.full.yml down -v --remove-orphans
```

## Testiranje
```bash
npm run test
npm run test:unit
npm run test:integration
```
