-- CreateEnum
CREATE TYPE "NivoStudija" AS ENUM ('OSNOVNE', 'MASTER', 'DOKTORSKE', 'SPECIJALISTIČKE');

-- CreateEnum
CREATE TYPE "TipKorisnika" AS ENUM ('ADMINISTRATOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "AkademskaStatus" AS ENUM ('REDOVAN', 'MIROVANJE', 'DIPLOMIRAO', 'ISPISAN');

-- CreateEnum
CREATE TYPE "StatusMolbe" AS ENUM ('NA_ČEKANJU', 'ODOBRENA', 'ODBIJENA');

-- CreateEnum
CREATE TYPE "TipRoka" AS ENUM ('ISPITNI_ROK', 'KOLOKVIJUMSKA_NEDELJA');

-- CreateEnum
CREATE TYPE "ParametarOcene" AS ENUM ('TEZINA', 'PRAKTIČNOST', 'KVALITET_NASTAVE', 'ORGANIZACIJA', 'KORISNOST');

-- CreateTable
CREATE TABLE "Fakultet" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "adresa" TEXT,
    "website" TEXT,

    CONSTRAINT "Fakultet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AkreditacionoTelo" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "zemlja" TEXT,

    CONSTRAINT "AkreditacionoTelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AkreditacijaFakulteta" (
    "id" SERIAL NOT NULL,
    "fakultetId" INTEGER NOT NULL,
    "akreditacionoTeloId" INTEGER NOT NULL,
    "datumAkreditacije" TIMESTAMP(3) NOT NULL,
    "datumIsteka" TIMESTAMP(3),

    CONSTRAINT "AkreditacijaFakulteta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Katedra" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "fakultetId" INTEGER NOT NULL,

    CONSTRAINT "Katedra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodZaBiranje" (
    "id" SERIAL NOT NULL,
    "fakultetId" INTEGER NOT NULL,
    "akademskaGodina" TEXT NOT NULL,
    "pocetakPerioda" TIMESTAMP(3) NOT NULL,
    "krajPerioda" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodZaBiranje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupaNotifikacija" (
    "id" SERIAL NOT NULL,
    "fakultetId" INTEGER NOT NULL,
    "nivoStudija" "NivoStudija" NOT NULL,

    CONSTRAINT "GrupaNotifikacija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikacija" (
    "id" SERIAL NOT NULL,
    "grupaNotifikacijaId" INTEGER NOT NULL,
    "naslov" TEXT NOT NULL,
    "sadrzaj" TEXT NOT NULL,
    "datumObjavljivanja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikacija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Smer" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "nivoStudija" "NivoStudija" NOT NULL,
    "fakultetId" INTEGER NOT NULL,

    CONSTRAINT "Smer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "smerId" INTEGER NOT NULL,
    "naziv" TEXT NOT NULL,
    "godina" INTEGER NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AkreditacijaPrograma" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "akreditacionoTeloId" INTEGER NOT NULL,
    "datumAkreditacije" TIMESTAMP(3) NOT NULL,
    "datumIsteka" TIMESTAMP(3),

    CONSTRAINT "AkreditacijaPrograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modul" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    "podrazumevajuci" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Modul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IzborniBlok" (
    "id" SERIAL NOT NULL,
    "modulId" INTEGER NOT NULL,
    "semestar" INTEGER NOT NULL,
    "ukupnoIzbornih" INTEGER NOT NULL,
    "potrebnoBirati" INTEGER NOT NULL,

    CONSTRAINT "IzborniBlok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kurs" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "opis" TEXT,
    "fakultetId" INTEGER NOT NULL,

    CONSTRAINT "Kurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IzvodjenjeKursa" (
    "id" SERIAL NOT NULL,
    "kursId" INTEGER NOT NULL,
    "akademskaGodina" TEXT NOT NULL,
    "espb" INTEGER NOT NULL,
    "nivoStudija" "NivoStudija" NOT NULL,
    "katedraId" INTEGER NOT NULL,

    CONSTRAINT "IzvodjenjeKursa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KursUModulu" (
    "id" SERIAL NOT NULL,
    "izvodjenjeKursaId" INTEGER NOT NULL,
    "modulId" INTEGER NOT NULL,
    "godinaStudija" INTEGER NOT NULL,
    "semestar" INTEGER NOT NULL,
    "izborni" BOOLEAN NOT NULL DEFAULT false,
    "izborniBlokId" INTEGER,

    CONSTRAINT "KursUModulu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Korisnik" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "lozinka" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "prezime" TEXT NOT NULL,
    "tip" "TipKorisnika" NOT NULL,

    CONSTRAINT "Korisnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Administrator" (
    "id" SERIAL NOT NULL,
    "korisnikId" INTEGER NOT NULL,

    CONSTRAINT "Administrator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "korisnikId" INTEGER NOT NULL,
    "brojIndeksa" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpisStudenta" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "modulId" INTEGER NOT NULL,
    "akademskaGodina" TEXT NOT NULL,
    "godinaStudija" INTEGER NOT NULL,
    "nivoStudija" "NivoStudija" NOT NULL,
    "naBudzetu" BOOLEAN NOT NULL,

    CONSTRAINT "UpisStudenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusStudenta" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "AkademskaStatus" NOT NULL,
    "datumOd" TIMESTAMP(3) NOT NULL,
    "datumDo" TIMESTAMP(3),
    "napomena" TEXT,

    CONSTRAINT "StatusStudenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinansijskaObaveza" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "iznos" DECIMAL(10,2) NOT NULL,
    "svrha" TEXT NOT NULL,
    "datumDospeca" TIMESTAMP(3) NOT NULL,
    "placeno" BOOLEAN NOT NULL DEFAULT false,
    "datumUplate" TIMESTAMP(3),

    CONSTRAINT "FinansijskaObaveza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Molba" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sadrzaj" TEXT NOT NULL,
    "status" "StatusMolbe" NOT NULL DEFAULT 'NA_ČEKANJU',
    "datumPodnosenja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "administratorId" INTEGER,
    "datumOdgovora" TIMESTAMP(3),
    "napomenaOdgovora" TEXT,

    CONSTRAINT "Molba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiranjePredmeta" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "kursUModuluId" INTEGER NOT NULL,
    "datumBiranja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BiranjePredmeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlasaIspitnogRoka" (
    "id" SERIAL NOT NULL,
    "sifra" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "fakultetId" INTEGER NOT NULL,

    CONSTRAINT "KlasaIspitnogRoka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealizacijaIspitnogRoka" (
    "id" SERIAL NOT NULL,
    "klasaIspitnogRokaId" INTEGER NOT NULL,
    "akademskaGodina" TEXT NOT NULL,
    "pocetakRoka" TIMESTAMP(3) NOT NULL,
    "krajRoka" TIMESTAMP(3) NOT NULL,
    "pocetakPrijavljivanja" TIMESTAMP(3) NOT NULL,
    "krajPrijavljivanja" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealizacijaIspitnogRoka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlasaKolokvijumskeNedelje" (
    "id" SERIAL NOT NULL,
    "sifra" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "fakultetId" INTEGER NOT NULL,

    CONSTRAINT "KlasaKolokvijumskeNedelje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealizacijaKolokvijumskeNedelje" (
    "id" SERIAL NOT NULL,
    "klasaKolokvijumskeNedeljeId" INTEGER NOT NULL,
    "akademskaGodina" TEXT NOT NULL,
    "pocetakNedelje" TIMESTAMP(3) NOT NULL,
    "krajNedelje" TIMESTAMP(3) NOT NULL,
    "pocetakPrijavljivanja" TIMESTAMP(3) NOT NULL,
    "krajPrijavljivanja" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealizacijaKolokvijumskeNedelje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MogucnostPrijavljivanja" (
    "id" SERIAL NOT NULL,
    "izvodjenjeKursaId" INTEGER NOT NULL,
    "realizacijaIspitnogRokaId" INTEGER,
    "realizacijaKolokvijumskeNedeljeId" INTEGER,

    CONSTRAINT "MogucnostPrijavljivanja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrijavaIspita" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "izvodjenjeKursaId" INTEGER NOT NULL,
    "realizacijaIspitnogRokaId" INTEGER NOT NULL,
    "datumPrijave" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "polozio" BOOLEAN,
    "ocena" INTEGER,
    "poeni" INTEGER,
    "napomena" TEXT,

    CONSTRAINT "PrijavaIspita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrijavaKolokvijuma" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "izvodjenjeKursaId" INTEGER NOT NULL,
    "realizacijaKolokvijumskeNedeljeId" INTEGER NOT NULL,
    "datumPrijave" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obaveznaAktivnost" BOOLEAN NOT NULL,
    "polozio" BOOLEAN,
    "poeni" INTEGER,

    CONSTRAINT "PrijavaKolokvijuma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinskaMera" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "opis" TEXT NOT NULL,
    "pocetakMere" TIMESTAMP(3) NOT NULL,
    "krajMere" TIMESTAMP(3),
    "zabranjeniKurseviIds" INTEGER[],
    "zabranaSvihPredmeta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DisciplinskaMera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcenaKursa" (
    "id" SERIAL NOT NULL,
    "kursId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "parametar" "ParametarOcene" NOT NULL,
    "ocena" INTEGER NOT NULL,
    "komentar" TEXT,

    CONSTRAINT "OcenaKursa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AkreditacijaFakulteta_fakultetId_idx" ON "AkreditacijaFakulteta"("fakultetId");

-- CreateIndex
CREATE INDEX "AkreditacijaFakulteta_akreditacionoTeloId_idx" ON "AkreditacijaFakulteta"("akreditacionoTeloId");

-- CreateIndex
CREATE INDEX "Katedra_fakultetId_idx" ON "Katedra"("fakultetId");

-- CreateIndex
CREATE INDEX "PeriodZaBiranje_fakultetId_idx" ON "PeriodZaBiranje"("fakultetId");

-- CreateIndex
CREATE INDEX "GrupaNotifikacija_fakultetId_idx" ON "GrupaNotifikacija"("fakultetId");

-- CreateIndex
CREATE INDEX "Notifikacija_grupaNotifikacijaId_idx" ON "Notifikacija"("grupaNotifikacijaId");

-- CreateIndex
CREATE INDEX "Smer_fakultetId_idx" ON "Smer"("fakultetId");

-- CreateIndex
CREATE INDEX "Program_smerId_idx" ON "Program"("smerId");

-- CreateIndex
CREATE INDEX "AkreditacijaPrograma_programId_idx" ON "AkreditacijaPrograma"("programId");

-- CreateIndex
CREATE INDEX "AkreditacijaPrograma_akreditacionoTeloId_idx" ON "AkreditacijaPrograma"("akreditacionoTeloId");

-- CreateIndex
CREATE INDEX "Modul_programId_idx" ON "Modul"("programId");

-- CreateIndex
CREATE INDEX "IzborniBlok_modulId_idx" ON "IzborniBlok"("modulId");

-- CreateIndex
CREATE INDEX "Kurs_fakultetId_idx" ON "Kurs"("fakultetId");

-- CreateIndex
CREATE INDEX "IzvodjenjeKursa_kursId_idx" ON "IzvodjenjeKursa"("kursId");

-- CreateIndex
CREATE INDEX "IzvodjenjeKursa_katedraId_idx" ON "IzvodjenjeKursa"("katedraId");

-- CreateIndex
CREATE UNIQUE INDEX "IzvodjenjeKursa_kursId_akademskaGodina_key" ON "IzvodjenjeKursa"("kursId", "akademskaGodina");

-- CreateIndex
CREATE INDEX "KursUModulu_izvodjenjeKursaId_idx" ON "KursUModulu"("izvodjenjeKursaId");

-- CreateIndex
CREATE INDEX "KursUModulu_modulId_idx" ON "KursUModulu"("modulId");

-- CreateIndex
CREATE INDEX "KursUModulu_izborniBlokId_idx" ON "KursUModulu"("izborniBlokId");

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_email_key" ON "Korisnik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Administrator_korisnikId_key" ON "Administrator"("korisnikId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_korisnikId_key" ON "Student"("korisnikId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_brojIndeksa_key" ON "Student"("brojIndeksa");

-- CreateIndex
CREATE INDEX "UpisStudenta_studentId_idx" ON "UpisStudenta"("studentId");

-- CreateIndex
CREATE INDEX "UpisStudenta_modulId_idx" ON "UpisStudenta"("modulId");

-- CreateIndex
CREATE INDEX "StatusStudenta_studentId_idx" ON "StatusStudenta"("studentId");

-- CreateIndex
CREATE INDEX "FinansijskaObaveza_studentId_idx" ON "FinansijskaObaveza"("studentId");

-- CreateIndex
CREATE INDEX "Molba_studentId_idx" ON "Molba"("studentId");

-- CreateIndex
CREATE INDEX "Molba_administratorId_idx" ON "Molba"("administratorId");

-- CreateIndex
CREATE INDEX "BiranjePredmeta_studentId_idx" ON "BiranjePredmeta"("studentId");

-- CreateIndex
CREATE INDEX "BiranjePredmeta_kursUModuluId_idx" ON "BiranjePredmeta"("kursUModuluId");

-- CreateIndex
CREATE UNIQUE INDEX "BiranjePredmeta_studentId_kursUModuluId_key" ON "BiranjePredmeta"("studentId", "kursUModuluId");

-- CreateIndex
CREATE INDEX "KlasaIspitnogRoka_fakultetId_idx" ON "KlasaIspitnogRoka"("fakultetId");

-- CreateIndex
CREATE INDEX "RealizacijaIspitnogRoka_klasaIspitnogRokaId_idx" ON "RealizacijaIspitnogRoka"("klasaIspitnogRokaId");

-- CreateIndex
CREATE INDEX "KlasaKolokvijumskeNedelje_fakultetId_idx" ON "KlasaKolokvijumskeNedelje"("fakultetId");

-- CreateIndex
CREATE INDEX "RealizacijaKolokvijumskeNedelje_klasaKolokvijumskeNedeljeId_idx" ON "RealizacijaKolokvijumskeNedelje"("klasaKolokvijumskeNedeljeId");

-- CreateIndex
CREATE INDEX "MogucnostPrijavljivanja_izvodjenjeKursaId_idx" ON "MogucnostPrijavljivanja"("izvodjenjeKursaId");

-- CreateIndex
CREATE INDEX "MogucnostPrijavljivanja_realizacijaIspitnogRokaId_idx" ON "MogucnostPrijavljivanja"("realizacijaIspitnogRokaId");

-- CreateIndex
CREATE INDEX "MogucnostPrijavljivanja_realizacijaKolokvijumskeNedeljeId_idx" ON "MogucnostPrijavljivanja"("realizacijaKolokvijumskeNedeljeId");

-- CreateIndex
CREATE INDEX "PrijavaIspita_studentId_idx" ON "PrijavaIspita"("studentId");

-- CreateIndex
CREATE INDEX "PrijavaIspita_izvodjenjeKursaId_idx" ON "PrijavaIspita"("izvodjenjeKursaId");

-- CreateIndex
CREATE INDEX "PrijavaIspita_realizacijaIspitnogRokaId_idx" ON "PrijavaIspita"("realizacijaIspitnogRokaId");

-- CreateIndex
CREATE UNIQUE INDEX "PrijavaIspita_studentId_izvodjenjeKursaId_realizacijaIspitn_key" ON "PrijavaIspita"("studentId", "izvodjenjeKursaId", "realizacijaIspitnogRokaId");

-- CreateIndex
CREATE INDEX "PrijavaKolokvijuma_studentId_idx" ON "PrijavaKolokvijuma"("studentId");

-- CreateIndex
CREATE INDEX "PrijavaKolokvijuma_izvodjenjeKursaId_idx" ON "PrijavaKolokvijuma"("izvodjenjeKursaId");

-- CreateIndex
CREATE INDEX "PrijavaKolokvijuma_realizacijaKolokvijumskeNedeljeId_idx" ON "PrijavaKolokvijuma"("realizacijaKolokvijumskeNedeljeId");

-- CreateIndex
CREATE UNIQUE INDEX "PrijavaKolokvijuma_studentId_izvodjenjeKursaId_realizacijaK_key" ON "PrijavaKolokvijuma"("studentId", "izvodjenjeKursaId", "realizacijaKolokvijumskeNedeljeId");

-- CreateIndex
CREATE INDEX "DisciplinskaMera_studentId_idx" ON "DisciplinskaMera"("studentId");

-- CreateIndex
CREATE INDEX "OcenaKursa_kursId_idx" ON "OcenaKursa"("kursId");

-- CreateIndex
CREATE INDEX "OcenaKursa_studentId_idx" ON "OcenaKursa"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "OcenaKursa_kursId_studentId_parametar_key" ON "OcenaKursa"("kursId", "studentId", "parametar");

-- AddForeignKey
ALTER TABLE "AkreditacijaFakulteta" ADD CONSTRAINT "AkreditacijaFakulteta_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkreditacijaFakulteta" ADD CONSTRAINT "AkreditacijaFakulteta_akreditacionoTeloId_fkey" FOREIGN KEY ("akreditacionoTeloId") REFERENCES "AkreditacionoTelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Katedra" ADD CONSTRAINT "Katedra_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodZaBiranje" ADD CONSTRAINT "PeriodZaBiranje_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupaNotifikacija" ADD CONSTRAINT "GrupaNotifikacija_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikacija" ADD CONSTRAINT "Notifikacija_grupaNotifikacijaId_fkey" FOREIGN KEY ("grupaNotifikacijaId") REFERENCES "GrupaNotifikacija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Smer" ADD CONSTRAINT "Smer_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_smerId_fkey" FOREIGN KEY ("smerId") REFERENCES "Smer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkreditacijaPrograma" ADD CONSTRAINT "AkreditacijaPrograma_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkreditacijaPrograma" ADD CONSTRAINT "AkreditacijaPrograma_akreditacionoTeloId_fkey" FOREIGN KEY ("akreditacionoTeloId") REFERENCES "AkreditacionoTelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modul" ADD CONSTRAINT "Modul_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzborniBlok" ADD CONSTRAINT "IzborniBlok_modulId_fkey" FOREIGN KEY ("modulId") REFERENCES "Modul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kurs" ADD CONSTRAINT "Kurs_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzvodjenjeKursa" ADD CONSTRAINT "IzvodjenjeKursa_kursId_fkey" FOREIGN KEY ("kursId") REFERENCES "Kurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzvodjenjeKursa" ADD CONSTRAINT "IzvodjenjeKursa_katedraId_fkey" FOREIGN KEY ("katedraId") REFERENCES "Katedra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KursUModulu" ADD CONSTRAINT "KursUModulu_izvodjenjeKursaId_fkey" FOREIGN KEY ("izvodjenjeKursaId") REFERENCES "IzvodjenjeKursa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KursUModulu" ADD CONSTRAINT "KursUModulu_modulId_fkey" FOREIGN KEY ("modulId") REFERENCES "Modul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KursUModulu" ADD CONSTRAINT "KursUModulu_izborniBlokId_fkey" FOREIGN KEY ("izborniBlokId") REFERENCES "IzborniBlok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_korisnikId_fkey" FOREIGN KEY ("korisnikId") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_korisnikId_fkey" FOREIGN KEY ("korisnikId") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpisStudenta" ADD CONSTRAINT "UpisStudenta_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpisStudenta" ADD CONSTRAINT "UpisStudenta_modulId_fkey" FOREIGN KEY ("modulId") REFERENCES "Modul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusStudenta" ADD CONSTRAINT "StatusStudenta_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinansijskaObaveza" ADD CONSTRAINT "FinansijskaObaveza_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Molba" ADD CONSTRAINT "Molba_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Molba" ADD CONSTRAINT "Molba_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "Administrator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiranjePredmeta" ADD CONSTRAINT "BiranjePredmeta_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiranjePredmeta" ADD CONSTRAINT "BiranjePredmeta_kursUModuluId_fkey" FOREIGN KEY ("kursUModuluId") REFERENCES "KursUModulu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlasaIspitnogRoka" ADD CONSTRAINT "KlasaIspitnogRoka_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealizacijaIspitnogRoka" ADD CONSTRAINT "RealizacijaIspitnogRoka_klasaIspitnogRokaId_fkey" FOREIGN KEY ("klasaIspitnogRokaId") REFERENCES "KlasaIspitnogRoka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlasaKolokvijumskeNedelje" ADD CONSTRAINT "KlasaKolokvijumskeNedelje_fakultetId_fkey" FOREIGN KEY ("fakultetId") REFERENCES "Fakultet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealizacijaKolokvijumskeNedelje" ADD CONSTRAINT "RealizacijaKolokvijumskeNedelje_klasaKolokvijumskeNedeljeI_fkey" FOREIGN KEY ("klasaKolokvijumskeNedeljeId") REFERENCES "KlasaKolokvijumskeNedelje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MogucnostPrijavljivanja" ADD CONSTRAINT "MogucnostPrijavljivanja_izvodjenjeKursaId_fkey" FOREIGN KEY ("izvodjenjeKursaId") REFERENCES "IzvodjenjeKursa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MogucnostPrijavljivanja" ADD CONSTRAINT "MogucnostPrijavljivanja_realizacijaIspitnogRokaId_fkey" FOREIGN KEY ("realizacijaIspitnogRokaId") REFERENCES "RealizacijaIspitnogRoka"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MogucnostPrijavljivanja" ADD CONSTRAINT "MogucnostPrijavljivanja_realizacijaKolokvijumskeNedeljeId_fkey" FOREIGN KEY ("realizacijaKolokvijumskeNedeljeId") REFERENCES "RealizacijaKolokvijumskeNedelje"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaIspita" ADD CONSTRAINT "PrijavaIspita_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaIspita" ADD CONSTRAINT "PrijavaIspita_izvodjenjeKursaId_fkey" FOREIGN KEY ("izvodjenjeKursaId") REFERENCES "IzvodjenjeKursa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaIspita" ADD CONSTRAINT "PrijavaIspita_realizacijaIspitnogRokaId_fkey" FOREIGN KEY ("realizacijaIspitnogRokaId") REFERENCES "RealizacijaIspitnogRoka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaKolokvijuma" ADD CONSTRAINT "PrijavaKolokvijuma_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaKolokvijuma" ADD CONSTRAINT "PrijavaKolokvijuma_izvodjenjeKursaId_fkey" FOREIGN KEY ("izvodjenjeKursaId") REFERENCES "IzvodjenjeKursa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaKolokvijuma" ADD CONSTRAINT "PrijavaKolokvijuma_realizacijaKolokvijumskeNedeljeId_fkey" FOREIGN KEY ("realizacijaKolokvijumskeNedeljeId") REFERENCES "RealizacijaKolokvijumskeNedelje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinskaMera" ADD CONSTRAINT "DisciplinskaMera_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcenaKursa" ADD CONSTRAINT "OcenaKursa_kursId_fkey" FOREIGN KEY ("kursId") REFERENCES "Kurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcenaKursa" ADD CONSTRAINT "OcenaKursa_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
