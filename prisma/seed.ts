// prisma/seed.ts

import * as bcrypt from 'bcryptjs'
import { PrismaClient, NivoStudija, TipKorisnika, AkademskiStatus } from '../generated/prisma_client/client'
import { PrismaPg } from '@prisma/adapter-pg'



const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    await prisma.$executeRaw`TRUNCATE TABLE "Fakultet" CASCADE`

    console.log('pocinjem seeding...')

    const fakultet = await prisma.fakultet.create({
        data: {
            naziv: 'Fakultet Organizacionih Nauka',
            adresa: 'Jove Ilica 154, 11010 Beograd Srbija',
            website: 'fon.bg.ac.rs',
        },
    })

    const nat = await prisma.akreditacionoTelo.create({
        data: { naziv: 'NAT', zemlja: 'Srbija' },
    })

    const asinn = await prisma.akreditacionoTelo.create({
        data: { naziv: 'ASINN', zemlja: 'Nemačka' },
    })

    await prisma.akreditacijaFakulteta.createMany({
        data: [
            {
                fakultetId: fakultet.id,
                akreditacionoTeloId: nat.id,
                datumAkreditacije: new Date('2014-01-01'),
            },
            {
                fakultetId: fakultet.id,
                akreditacionoTeloId: asinn.id,
                datumAkreditacije: new Date('2014-06-01'),
            },
        ],
    })

    const katedre = await Promise.all([
        'Katedra za ekonomiju, poslovno planiranje i međunarodni menadžment',
        'Katedra za elektronsko poslovanje',
        'Katedra za finansijski menadžment i računovodstvo',
        'Katedra za industrijsko i menadžment inženjerstvo',
        'Katedra za informacione sisteme',
        'Katedra za informacione tehnologije',
        'Katedra za interdisciplinarna istraživanja u menadžmentu',
        'Katedra za marketing menadžment i komunikacije',
        'Katedra za matematiku',
        'Katedra za menadžment i upravljanje projektima',
        'Katedra za menadžment kvaliteta i standardizaciju',
        'Katedra za menadžment ljudskih resursa',
        'Katedra za menadžment tehnologije, inovacija i održivog razvoja',
        'Katedra za operaciona istraživanja i statistiku',
        'Katedra za organizaciju poslovnih sistema',
        'Katedra za računarski integrisanu proizvodnju i logistiku',
        'Katedra za softversko inženjerstvo',
        'Katedra za upravljanje proizvodnjom i pružanjem uslugama',
        'Katedra za upravljanje sistemima',
    ].map((naziv) =>
        prisma.katedra.create({
            data: { naziv, fakultetId: fakultet.id },
        })
    ))

    // Create notification groups for each academic level
    const grupaOsnovne = await prisma.grupaNotifikacija.create({
        data: {
            fakultetId: fakultet.id,
            nivoStudija: NivoStudija.OSNOVNE,
            notifikacije: {
                createMany: {
                    data: [
                        {
                            naslov: 'Početak akademske godine 2025/2026',
                            sadrzaj: 'Obaveštavaju se studenti osnovnih studija da akademska godina 2025/2026 počinje 1. oktobra 2025. godine. Molimo sve studente da se pravovremeno prijave na studentski portal.',
                            datumObjavljivanja: new Date('2025-09-15'),
                        },
                        {
                            naslov: 'Period za biranje predmeta',
                            sadrzaj: 'Period za biranje predmeta za zimski semestar akademske 2025/2026 godine traje od 20. septembra do 30. septembra 2025. godine. Studenti su dužni da izaberu predmete u skladu sa svojim modulom.',
                            datumObjavljivanja: new Date('2025-09-18'),
                        },
                        {
                            naslov: 'Izmene u rasporedu konsultacija',
                            sadrzaj: 'Obaveštavaju se studenti da su konsultacije sa profesorima privremeno izmenjene zbog vanrednih okolnosti. Novi termini konsultacija biće objavljeni na sajtu fakulteta.',
                            datumObjavljivanja: new Date('2025-10-10'),
                        },
                        {
                            naslov: 'Prijava za studentske stipendije',
                            sadrzaj: 'Otvoren je konkurs za dodelu studentskih stipendija za akademsku 2025/2026 godinu. Rok za podnošenje prijava je 15. novembar 2025. Sva potrebna dokumenta možete pronaći na sajtu fakulteta.',
                            datumObjavljivanja: new Date('2025-10-25'),
                        },
                        {
                            naslov: 'Kolokvijumska nedelja - zimski semestar',
                            sadrzaj: 'Prva kolokvijumska nedelja za zimski semestar održaće se od 18. do 22. novembra 2025. godine. Studenti mogu prijaviti kolokvijume od 10. novembra.',
                            datumObjavljivanja: new Date('2025-11-05'),
                        },
                        {
                            naslov: 'Zimska pauza i ispitni rok',
                            sadrzaj: 'Nastava u zimskom semestru se završava 20. decembra 2025. Januarski ispitni rok počinje 13. januara 2026. Prijava ispita biće omogućena od 3. januara.',
                            datumObjavljivanja: new Date('2025-12-10'),
                        },
                    ],
                },
            },
        },
    })

    const grupaMaster = await prisma.grupaNotifikacija.create({
        data: {
            fakultetId: fakultet.id,
            nivoStudija: NivoStudija.MASTER,
            notifikacije: {
                createMany: {
                    data: [
                        {
                            naslov: 'Početak master studija 2025/2026',
                            sadrzaj: 'Obaveštavaju se studenti master akademskih studija da nastava počinje 1. oktobra 2025. godine. Svi studenti su dužni da se prijave na portal najkasnije do 25. septembra.',
                            datumObjavljivanja: new Date('2025-09-12'),
                        },
                        {
                            naslov: 'Izbor mentora za master rad',
                            sadrzaj: 'Studenti druge godine master studija mogu podneti zahtev za izbor mentora za master rad od 1. oktobra do 31. oktobra 2025. godine. Konsultacije sa potencijalnim mentorima su preporučene.',
                            datumObjavljivanja: new Date('2025-09-28'),
                        },
                        {
                            naslov: 'Naučna konferencija studenata',
                            sadrzaj: 'Fakultet organizuje naučnu konferenciju studenata master studija koja će se održati 5. decembra 2025. Pozivaju se svi studenti da prijave svoje radove do 15. novembra.',
                            datumObjavljivanja: new Date('2025-10-20'),
                        },
                    ],
                },
            },
        },
    })

    const grupaDoktorske = await prisma.grupaNotifikacija.create({
        data: {
            fakultetId: fakultet.id,
            nivoStudija: NivoStudija.DOKTORSKE,
            notifikacije: {
                createMany: {
                    data: [
                        {
                            naslov: 'Upis na doktorske studije 2025/2026',
                            sadrzaj: 'Obaveštavaju se kandidati koji su primljeni na doktorske studije da upis počinje 15. septembra 2025. Potrebno je doneti svu traženu dokumentaciju.',
                            datumObjavljivanja: new Date('2025-09-05'),
                        },
                        {
                            naslov: 'Seminar o metodologiji naučnog istraživanja',
                            sadrzaj: 'Organizuje se seminar o metodologiji naučnog istraživanja za studente prve godine doktorskih studija. Seminar će se održati 10. oktobra 2025. u amfiteatru 1.',
                            datumObjavljivanja: new Date('2025-09-25'),
                        },
                    ],
                },
            },
        },
    })

    const grupaSpecijalisticke = await prisma.grupaNotifikacija.create({
        data: {
            fakultetId: fakultet.id,
            nivoStudija: NivoStudija.SPECIJALISTIČKE,
            notifikacije: {
                createMany: {
                    data: [
                        {
                            naslov: 'Početak specijalističkih studija',
                            sadrzaj: 'Obaveštavaju se studenti specijalističkih studija da nastava počinje 8. oktobra 2025. Svi studenti moraju biti upisani do 1. oktobra.',
                            datumObjavljivanja: new Date('2025-09-20'),
                        },
                    ],
                },
            },
        },
    })

    const isit = await prisma.smer.create({
        data: {
            naziv: 'Informacioni Sistemi i Tehnologije',
            nivoStudija: NivoStudija.OSNOVNE,
            fakultetId: fakultet.id,
        },
    })

    const mio = await prisma.smer.create({
        data: {
            naziv: 'Menadžment i Organizacija',
            nivoStudija: NivoStudija.OSNOVNE,
            fakultetId: fakultet.id,
        },
    })


    const isit2022 = await prisma.program.create({
        data: {
            smerId: isit.id,
            naziv: 'ISiT2022',
            godina: 2022,
        },
    })


    const mio2022 = await prisma.program.create({
        data: {
            smerId: mio.id,
            naziv: 'MiO2022',
            godina: 2022,
        },
    })

    for (const program of [isit2022, mio2022]) {
        await prisma.akreditacijaPrograma.createMany({
            data: [
                {
                    programId: program.id,
                    akreditacionoTeloId: nat.id,
                    datumAkreditacije: new Date(`${program.godina}-09-01`),
                },
                {
                    programId: program.id,
                    akreditacionoTeloId: asinn.id,
                    datumAkreditacije: new Date(`${program.godina}-12-01`),
                },
            ],
        })
    }


    const isit2022Moduli = await Promise.all([
        prisma.modul.create({
            data: { naziv: 'Informacione Tehnologije', programId: isit2022.id },
        }),
        prisma.modul.create({
            data: { naziv: 'Softversko Inženjerstvo', programId: isit2022.id },
        })
    ])

    const mio2022Moduli = await Promise.all([
        prisma.modul.create({
            data: { naziv: 'Finansijski Menadžment', programId: mio2022.id },
        }),
        prisma.modul.create({
            data: { naziv: 'Marketing menadžment i komunikacije', programId: mio2022.id },
        })
    ])

    const kursevi = await Promise.all([
        'Baze podataka',
        'Elektronsko poslovanje',
        'Linearni statistički modeli',
        'Menadžment ljudskih resursa',
        'Modelovanje poslovnih procesa',
        'Operaciona istraživanja 1',
        'Operaciona istraživanja 2',
        'Pravne osnove informacionih sistema',
        'Programski jezici',
        'Računarske mreže i telekomunikacije',
        'Teorija odlučivanja',
        'Teorija sistema',
        'Ekološki menadžment',
        'Ekonometrijske metode',
        'Integrisana softverska rešenja',
        'Odnosi sa javnošću',
        'Simulacija u poslovnom odlučivanju',
        'Strateški marketing',
        'Upravljačko računovodstvo',
        'Upravljanje investicijama',
        'Upravljanje projektima',
        'Upravljanje promenama',
        'Operacioni menadžment',
        'Kontrola kvaliteta',
        'Logistika',
        'Lokacija i raspored objekata',
        'Menadžment inovacija',
        'Osnove programiranja',
        'Upravljački sistemi',
        'Inženjerske komunikacije i logistika',
        'Menadžment tehnologije i razvoja',
        'Metrološki sistem',
        'Normativno regulisanje kvaliteta',
        'Sistem kvaliteta',
        'Standardizacija',
        'Tehnologija upravljanja kvalitetom',
        'Upravljanje kvalitetom dokumentacije',
        'Algoritmi i strukture podataka',
        'Objektno-orijentisano programiranje',
        'Web programiranje',
        'Mobilne aplikacije',
        'Veštačka inteligencija',
        'Mašinsko učenje',
        'Računarska grafika',
        'Uvod u informacione sisteme',
        'Matematika 1',
        'Matematika 2',
        'Statistika',
        'Verovatnoća i statistika',
        'Diskretna matematika',
        'Osnove menadžmenta',
        'Organizaciono ponašanje',
        'Poslovna ekonomija',
        'Mikroekonomija',
        'Makroekonomija',
        'Finansijsko računovodstvo',
        'Menadžersko računovodstvo',
        'Poslovne finansije',
        'Investicije i hartije od vrednosti',
        'Digitalni marketing',
        'Istraživanje tržišta',
        'Brendiranje',
        'Upravljanje lancima snabdevanja',
        'Planiranje proizvodnje',
        'Six Sigma',
        'Agile metodologije',
        'Upravljanje rizicima',
    ].map((naziv) =>
        prisma.kurs.create({
            data: {
                naziv,
                opis: `Opis kursa: ${naziv}`,
                fakultetId: fakultet.id,
            },
        })
    ))


    const findKurs = (naziv: string) => kursevi.find(k => k.naziv === naziv)!


    const findKatedra = (keyword: string) =>
        katedre.find(k => k.naziv.toLowerCase().includes(keyword.toLowerCase()))!


    const informacioneTehnologije2022modul = isit2022Moduli.find(m => m.naziv === 'Informacione Tehnologije')!
    const swe2022modul = isit2022Moduli.find(m => m.naziv === 'Softversko Inženjerstvo')!

    const isitKurseviRealizacije = await Promise.all([
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Osnove programiranja').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione tehnologije').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Uvod u informacione sisteme').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione sisteme').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Matematika 1').id,
                akademskaGodina: '2025/2026',
                espb: 7,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('matematiku').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Diskretna matematika').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('matematiku').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Osnove menadžmenta').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('menadžment i upravljanje').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Algoritmi i strukture podataka').id,
                akademskaGodina: '2025/2026',
                espb: 7,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione tehnologije').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Objektno-orijentisano programiranje').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('softversko').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Baze podataka').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione sisteme').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Matematika 2').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('matematiku').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Verovatnoća i statistika').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('operaciona istraživanja').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Web programiranje').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('elektronsko poslovanje').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Mobilne aplikacije').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione tehnologije').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Računarska grafika').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione tehnologije').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Veštačka inteligencija').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione tehnologije').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Mašinsko učenje').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('informacione tehnologije').id,
            },
        }),
    ])

    // Link courses to IT module
    const izborniBlokInfoTehn2022 = await prisma.izborniBlok.create({
        data: {
            modulId: informacioneTehnologije2022modul.id,
            semestar: 2,
            ukupnoIzbornih: 3,
            potrebnoBirati: 1,
        },
    })


    const sweIzborniBlok2022 = await prisma.izborniBlok.create({
        data: {
            modulId: swe2022modul.id,
            semestar: 2,
            ukupnoIzbornih: 3,
            potrebnoBirati: 1,
        },
    })



    await prisma.kursUModulu.createMany({
        data: [
            // Semestar 1
            { izvodjenjeKursaId: isitKurseviRealizacije[0].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[1].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[2].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[3].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[4].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            // Semestar 2
            { izvodjenjeKursaId: isitKurseviRealizacije[5].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[6].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[7].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[8].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[9].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: izborniBlokInfoTehn2022.id },
            { izvodjenjeKursaId: isitKurseviRealizacije[10].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: izborniBlokInfoTehn2022.id },
            { izvodjenjeKursaId: isitKurseviRealizacije[11].id, modulId: informacioneTehnologije2022modul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: izborniBlokInfoTehn2022.id },
        ],
    })

    await prisma.kursUModulu.createMany({
        data: [
            // Semestar 1
            { izvodjenjeKursaId: isitKurseviRealizacije[0].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[1].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[2].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[3].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[4].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 1, izborni: false },
            // Semestar 2
            { izvodjenjeKursaId: isitKurseviRealizacije[5].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[6].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[7].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[8].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[9].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: sweIzborniBlok2022.id },
            { izvodjenjeKursaId: isitKurseviRealizacije[12].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: sweIzborniBlok2022.id },
            { izvodjenjeKursaId: isitKurseviRealizacije[13].id, modulId: swe2022modul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: sweIzborniBlok2022.id },
        ],
    })


    // MiO 2022 - Finansijski Menadžment module
    const fmModul = mio2022Moduli.find(m => m.naziv === 'Finansijski Menadžment')!

    const mgmtKursevi = await Promise.all([
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Mikroekonomija').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('ekonomiju').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Finansijsko računovodstvo').id,
                akademskaGodina: '2025/2026',
                espb: 7,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('finansijski menadžment').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Statistika').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('operaciona istraživanja').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Poslovna ekonomija').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('ekonomiju').id,
            },
        }),
        // Semester 2
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Poslovne finansije').id,
                akademskaGodina: '2025/2026',
                espb: 7,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('finansijski menadžment').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Makroekonomija').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('ekonomiju').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Menadžersko računovodstvo').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('finansijski menadžment').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Ekonometrijske metode').id,
                akademskaGodina: '2025/2026',
                espb: 5,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('operaciona istraživanja').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Upravljanje investicijama').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('finansijski menadžment').id,
            },
        }),
    ])

    await prisma.kursUModulu.createMany({
        data: [
            // Semester 1
            { izvodjenjeKursaId: mgmtKursevi[0].id, modulId: fmModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[1].id, modulId: fmModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[2].id, modulId: fmModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[3].id, modulId: fmModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: isitKurseviRealizacije[4].id, modulId: fmModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            // Semester 2
            { izvodjenjeKursaId: mgmtKursevi[4].id, modulId: fmModul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[5].id, modulId: fmModul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[6].id, modulId: fmModul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[7].id, modulId: fmModul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[8].id, modulId: fmModul.id, godinaStudija: 1, semestar: 2, izborni: false },
        ],
    })

    // MiO 2022 - Marketing menadžment i komunikacije
    const marketingModul = mio2022Moduli.find(m => m.naziv === 'Marketing menadžment i komunikacije')!

    const marketingKursevi = await Promise.all([
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Upravljanje lancima snabdevanja').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('menadžment ljudskih resursa').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Istraživanje tržišta').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('Katedra za interdisciplinarna istraživanja u menadžmentu').id,
            },
        }),
        prisma.izvodjenjeKursa.create({
            data: {
                kursId: findKurs('Organizaciono ponašanje').id,
                akademskaGodina: '2025/2026',
                espb: 6,
                nivoStudija: NivoStudija.OSNOVNE,
                katedraId: findKatedra('menadžment ljudskih resursa').id,
            },
        })
    ])

    const izborniBlokMarketing = await prisma.izborniBlok.create({
        data: {
            modulId: marketingModul.id,
            semestar: 2,
            ukupnoIzbornih: 2,
            potrebnoBirati: 1,
        },
    })

    await prisma.kursUModulu.createMany({
        data: [
            { izvodjenjeKursaId: mgmtKursevi[0].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[1].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[2].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[3].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[4].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 1, izborni: false },
            { izvodjenjeKursaId: mgmtKursevi[5].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: marketingKursevi[0].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 2, izborni: false },
            { izvodjenjeKursaId: marketingKursevi[1].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: izborniBlokMarketing.id },
            { izvodjenjeKursaId: marketingKursevi[2].id, modulId: marketingModul.id, godinaStudija: 1, semestar: 2, izborni: true, izborniBlokId: izborniBlokMarketing.id },
        ],
    })

    const adminPassword = await bcrypt.hash('admin123', 10)

    const admini = await Promise.all([
        prisma.korisnik.create({
            data: {
                email: 'admin1@fon.bg.ac.rs',
                lozinka: adminPassword,
                ime: 'Marko',
                prezime: 'Marković',
                tip: TipKorisnika.ADMINISTRATOR,
                administrator: {
                    create: {},
                },
            },
        }),
        prisma.korisnik.create({
            data: {
                email: 'admin2@fon.bg.ac.rs',
                lozinka: adminPassword,
                ime: 'Ana',
                prezime: 'Anić',
                tip: TipKorisnika.ADMINISTRATOR,
                administrator: {
                    create: {},
                },
            },
        }),
        prisma.korisnik.create({
            data: {
                email: 'admin3@fon.bg.ac.rs',
                lozinka: adminPassword,
                ime: 'Petar',
                prezime: 'Petrović',
                tip: TipKorisnika.ADMINISTRATOR,
                administrator: {
                    create: {},
                },
            },
        }),
    ])

    const studentHashedPassword = await bcrypt.hash('student123', 10)

    const studentNames = [
        { ime: 'Nikola', prezime: 'Nikolic' },
        { ime: 'Jovana', prezime: 'Jovanovic' },
        { ime: 'Stefan', prezime: 'Stefanovic' },
        { ime: 'Milica', prezime: 'Milic' },
        { ime: 'Luka', prezime: 'Lukic' },
        { ime: 'Ivana', prezime: 'Ivanovic' },
        { ime: 'Aleksandar', prezime: 'Aleksandrovic' },
        { ime: 'Jelena', prezime: 'Jelenkovic' },
        { ime: 'Milos', prezime: 'Miloševic' },
        { ime: 'Katarina', prezime: 'Katic' },
        { ime: 'Filip', prezime: 'Filipovic' },
        { ime: 'Teodora', prezime: 'Teodorovic' },
        { ime: 'Nemanja', prezime: 'Nemanic' },
        { ime: 'Sara', prezime: 'Saric' },
        { ime: 'Dimitrije', prezime: 'Dimitrijevic' },
        { ime: 'Mina', prezime: 'Minic' },
        { ime: 'Vuk', prezime: 'Vukovic' },
        { ime: 'Isidora', prezime: 'Isic' },
        { ime: 'Uros', prezime: 'Uroševic' },
        { ime: 'Tamara', prezime: 'Tamaric' },
    ]

    const sviModuli = [
        ...isit2022Moduli,
        ...mio2022Moduli,
    ]

    for (let i = 0; i < studentNames.length; i++) {
        const { ime, prezime } = studentNames[i]
        const brojIndeksa = `${2025}${String(i + 1).padStart(4, '0')}`
        const randomModul = sviModuli[Math.floor(Math.random() * sviModuli.length)]

        const student = await prisma.korisnik.create({
            data: {
                email: `${ime.toLowerCase()}.${prezime.toLowerCase()}@student.fon.bg.ac.rs`,
                lozinka: studentHashedPassword,
                ime,
                prezime,
                tip: TipKorisnika.STUDENT,
                student: {
                    create: {
                        brojIndeksa,
                        upisi: {
                            create: {
                                modulId: randomModul.id,
                                akademskaGodina: '2025/2026',
                                godinaStudija: 1,
                                nivoStudija: NivoStudija.OSNOVNE,
                                naBudzetu: Math.random() > 0.3,
                            },
                        },
                        statusHistorijat: {
                            create: {
                                status: AkademskiStatus.REDOVAN,
                                datumOd: new Date('2025-10-01'),
                            },
                        },
                    },
                },
            },
        })

        console.log(`Kreiran student: ${ime} ${prezime} (${brojIndeksa}) - Modul: ${randomModul.naziv}`)
    }

    console.log('Seeding zavrsen!')
    console.log(`Kreirano ${admini.length} admina`)
    console.log(`Kreirano ${studentNames.length} studenata`)
    console.log(`Kreirano ${kursevi.length} kurseva`)
    // console.log(`Kreirano ${isitKurseviRealizacije.length + fmKursevi.length + marketingKursevi.length + izborniIT.length} izvođenja kurseva`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })