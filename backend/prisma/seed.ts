import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient, Prisma } from "@prisma/client";
import { STAGES, type StageKey } from "../src/shared/index.js";
import { computeJourney } from "../src/modules/workflow/stages.js";
import { applicableRequirementIds } from "../src/modules/requirements/engine.js";

const prisma = new PrismaClient();
if (
  process.env.NODE_ENV === "production" ||
  process.env.ALLOW_DEMO_SEED !== "true"
) {
  throw new Error(
    "Demo seeding is disabled. Set ALLOW_DEMO_SEED=true in a non-production environment to continue.",
  );
}
const DEV_PASSWORD = "lasbag";
const demoEmail = (username: string) => `${username}@demo.invalid`;
const LEGACY_DEMO_EMAILS: Record<string, string> = {
  [demoEmail("demo1")]: "applicant.start@lasbag-demo.local",
  [demoEmail("demo2")]: "applicant.stage5@lasbag-demo.local",
  [demoEmail("demo3")]: "applicant.laststage@lasbag-demo.local",
  [demoEmail("demo4")]: "applicant.completed@lasbag-demo.local",
  [demoEmail("demo5")]: "applicant.actionrequired@lasbag-demo.local",
  [demoEmail("officer1")]: "officer@lasbag-demo.local",
  [demoEmail("officer2")]: "officer.lirs@lasbag-demo.local",
  [demoEmail("officer3")]: "officer.lasbca@lasbag-demo.local",
  [demoEmail("professional1")]: "professional.architect@lasbag-demo.local",
  [demoEmail("professional2")]: "professional.engineer@lasbag-demo.local",
  [demoEmail("admin")]: "admin@lasbag-demo.local",
  [demoEmail("superadmin")]: "superadmin@lasbag-demo.local",
};
const DAY = 864e5,
  now = Date.now(),
  ago = (d: number) => new Date(now - d * DAY);
const ord = (k: string) => STAGES.find((s) => s.key === k)!.order;

/** Small but valid PDF so download/preview can be exercised end to end. Sample data only. */
const samplePdf = (title: string) => {
  const t = `SAMPLE DOCUMENT (development data) - ${title}`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${`BT /F1 14 Tf 60 780 Td (${t}) Tj ET`.length} >>\nstream\nBT /F1 14 Tf 60 780 Td (${t}) Tj ET\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const off: number[] = [];
  objs.forEach((o, i) => {
    off.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const x = out.length;
  out +=
    `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
    off.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("") +
    `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(out, "latin1");
};

const AGENCIES = [
  ["LASPPPA", "Lagos State Physical Planning Permit Authority"],
  ["LIRS", "Lagos State Internal Revenue Service"],
  ["DRAINAGE", "Lagos State Drainage Services"],
  ["LASBCA", "Lagos State Building Control Agency"],
  ["LSMTL", "Lagos State Materials Testing Laboratory"],
];
type C = Prisma.InputJsonValue | null;
// [code, name, agency, stage, documentType, slaHours, rule]
const DEFS: [string, string, string, StageKey, number | null, C][] = [
  ["SURVEY_PLAN", "Survey Plan", "LASPPPA", "REQUIREMENTS", 72, null],
  [
    "PLANNING_PARAMS",
    "Planning Parameters",
    "LASPPPA",
    "REQUIREMENTS",
    72,
    null,
  ],
  [
    "ARCH_DRAWINGS",
    "Architectural Drawings",
    "LASPPPA",
    "SUBMISSION",
    72,
    null,
  ],
  ["ENG_DRAWINGS", "Engineering Drawings", "LASPPPA", "SUBMISSION", 72, null],
  [
    "COFO",
    "Certificate of Occupancy (C of O)",
    "LASPPPA",
    "SUBMISSION",
    72,
    null,
  ],
  [
    "STRUCT_DRAWINGS",
    "Structural Drawings",
    "LASBCA",
    "SUBMISSION",
    96,
    { field: "floors", op: "gt", value: 3 },
  ],
  [
    "COREN_LETTER",
    "COREN Certified Engineer Letter of Commitment",
    "LASBCA",
    "SUBMISSION",
    96,
    { field: "floors", op: "gt", value: 3 },
  ],
  ["LIRS_TAX", "LIRS Tax Clearance", "LIRS", "CLEARANCES", 120, null],
  [
    "DRAINAGE",
    "Drainage Clearance",
    "DRAINAGE",
    "CLEARANCES",
    168,
    { field: "nearWaterOrDrainage", op: "eq", value: true },
  ],
  [
    "PLANNING_PERMIT",
    "Planning Permit",
    "LASPPPA",
    "PLANNING_PERMIT",
    240,
    null,
  ],
  [
    "AUTH_COMMENCE",
    "Authorization to Commence",
    "LASBCA",
    "AUTHORIZATION",
    120,
    null,
  ],
  [
    "FOUNDATION_INSPECTION",
    "Foundation Inspection",
    "LASBCA",
    "INSPECTIONS",
    96,
    null,
  ],
  ["LSMTL_TEST", "Materials Testing Report", "LSMTL", "INSPECTIONS", 168, null],
  ["FINAL_INSPECTION", "Final Inspection", "LASBCA", "COMPLETION", 96, null],
  [
    "COMPLETION_CERT",
    "Completion Certification",
    "LASBCA",
    "COMPLETION",
    120,
    null,
  ],
];

interface Scenario {
  username: string;
  first: string;
  last: string;
  ref: string;
  title: string;
  site: string;
  current: number;
  status: string;
  days: number;
  dueDays: number;
  answers: any;
  overrides: Record<string, string>;
  reasons?: Record<string, string>;
  notes: [string, string][];
}
const SCENARIOS: Scenario[] = [
  {
    username: "demo1",
    first: "Adebayo",
    last: "Ogunleye",
    ref: "LASBAG-DEV-2026-00448",
    title: "Proposed Mixed-Use Development",
    site: "",
    current: 1,
    status: "DRAFT",
    days: 1,
    dueDays: 0,
    answers: {},
    overrides: {},
    notes: [
      [
        "Welcome to LASBAG",
        "Tell us about your development and we'll show you exactly what you need.",
      ],
    ],
  },
  {
    username: "demo2",
    first: "Chinedu",
    last: "Okafor",
    ref: "LASBAG-DEV-2026-00421",
    title: "Five-Storey Residential Apartments",
    site: "Plot 8, Freedom Way, Lekki Phase 1, Lagos State",
    current: 5,
    status: "IN_REVIEW",
    days: 120,
    dueDays: 5,
    answers: {
      developmentType: "RESIDENTIAL",
      location: "Lekki Phase 1",
      floors: 5,
      isNewDevelopment: true,
      nearWaterOrDrainage: false,
      nearAirport: false,
    },
    overrides: {
      AUTH_COMMENCE: "REQUIRED",
      FOUNDATION_INSPECTION: "REQUIRED",
      LSMTL_TEST: "REQUIRED",
      FINAL_INSPECTION: "REQUIRED",
      COMPLETION_CERT: "REQUIRED",
    },
    notes: [
      ["Planning permit issued", "Your planning permit has been issued."],
      [
        "Next step",
        "Submit your commencement notice to receive authorization to commence.",
      ],
    ],
  },
  {
    username: "demo3",
    first: "Fatima",
    last: "Balogun",
    ref: "LASBAG-DEV-2026-00398",
    title: "Boutique Office Block",
    site: "12 Adeola Odeku Street, Victoria Island, Lagos State",
    current: 7,
    status: "IN_REVIEW",
    days: 260,
    dueDays: 3,
    answers: {
      developmentType: "COMMERCIAL",
      location: "Victoria Island",
      floors: 4,
      isNewDevelopment: true,
      nearWaterOrDrainage: false,
      nearAirport: false,
    },
    overrides: {
      FINAL_INSPECTION: "UNDER_REVIEW",
      COMPLETION_CERT: "REQUIRED",
    },
    notes: [
      [
        "You are almost there",
        "Your final inspection is under review. Submit completion documentation to finish.",
      ],
    ],
  },
  {
    username: "demo4",
    first: "Tunde",
    last: "Adeyemi",
    ref: "LASBAG-DEV-2026-00352",
    title: "Warehouse and Distribution Centre",
    site: "Plot 4, Ikeja Industrial Estate, Lagos State",
    current: 8,
    status: "COMPLETED",
    days: 330,
    dueDays: 0,
    answers: {
      developmentType: "INDUSTRIAL",
      location: "Ikeja",
      floors: 2,
      isNewDevelopment: true,
      nearWaterOrDrainage: true,
      nearAirport: false,
    },
    overrides: {},
    notes: [
      [
        "Approval journey completed",
        "Your completion certification is ready to download.",
      ],
    ],
  },
  {
    username: "demo5",
    first: "Ibrahim",
    last: "Yusuf",
    ref: "LASBAG-DEV-2026-00409",
    title: "Lagoon-Front Mixed-Use Development",
    site: "Plot 21, Admiralty Way, Lekki Phase 1, Lagos State",
    current: 3,
    status: "ACTION_REQUIRED",
    days: 45,
    dueDays: 2,
    answers: {
      developmentType: "MIXED_USE",
      location: "Lekki Phase 1",
      floors: 6,
      isNewDevelopment: true,
      nearWaterOrDrainage: true,
      nearAirport: false,
    },
    overrides: { DRAINAGE: "ACTION_NEEDED" },
    reasons: { DRAINAGE: "Additional information is required." },
    notes: [
      [
        "Additional information is required",
        "Please upload additional drainage documentation. Your other requirements are unaffected.",
      ],
    ],
  },
];

async function main() {
  const passwordHash = await argon2.hash(DEV_PASSWORD);
  const agency: Record<string, string> = {};
  for (const [code, name] of AGENCIES)
    agency[code] = (
      await prisma.agency.upsert({
        where: { code },
        create: { code, name },
        update: { name },
      })
    ).id;
  for (const [code, name, ag, stage, sla, rule] of DEFS) {
    const d = await prisma.requirementDefinition.upsert({
      where: { code },
      create: {
        code,
        name,
        description: `${name} for your development.`,
        agencyId: agency[ag],
        stage,
        mandatory: true,
        documentType: name,
        slaHours: sla,
      },
      update: {
        name,
        agencyId: agency[ag],
        stage,
        slaHours: sla,
        documentType: name,
      },
    });
    await prisma.requirementRule.deleteMany({
      where: { requirementDefinitionId: d.id },
    });
    await prisma.requirementRule.create({
      data: {
        requirementDefinitionId: d.id,
        condition: rule ?? Prisma.JsonNull,
      },
    });
  }
  const upsertUser = (
    email: string,
    first: string,
    last: string,
    role: any,
    agencyCode?: string,
  ) => {
    const legacyEmail = LEGACY_DEMO_EMAILS[email];
    if (legacyEmail)
      return prisma.user
        .updateMany({ where: { email: legacyEmail }, data: { email } })
        .then(() =>
          prisma.user.upsert({
            where: { email },
            create: {
              email,
              firstName: first,
              lastName: last,
              role,
              passwordHash,
              agencyId: agencyCode ? agency[agencyCode] : null,
            },
            update: {
              firstName: first,
              lastName: last,
              role,
              passwordHash,
              agencyId: agencyCode ? agency[agencyCode] : null,
            },
          }),
        );
    return prisma.user.upsert({
      where: { email },
      create: {
        email,
        firstName: first,
        lastName: last,
        role,
        passwordHash,
        agencyId: agencyCode ? agency[agencyCode] : null,
      },
      update: {
        firstName: first,
        lastName: last,
        role,
        passwordHash,
        agencyId: agencyCode ? agency[agencyCode] : null,
      },
    });
  };
  const officer = await upsertUser(
    demoEmail("officer1"),
    "Tolu",
    "Adeyemi",
    "MDA_OFFICER",
    "LASPPPA",
  );
  await upsertUser(
    demoEmail("officer2"),
    "Ngozi",
    "Eze",
    "MDA_OFFICER",
    "LIRS",
  );
  await upsertUser(
    demoEmail("officer3"),
    "Kunle",
    "Bakare",
    "MDA_OFFICER",
    "LASBCA",
  );
  await upsertUser(demoEmail("admin"), "Amaka", "Nwosu", "ADMIN");
  await upsertUser(demoEmail("superadmin"), "Segun", "Adebisi", "SUPER_ADMIN");
  for (const [e, f, l] of [
    [demoEmail("professional1"), "Yemi", "Coker"],
    [demoEmail("professional2"), "Halima", "Sani"],
  ])
    await prisma.professionalProfile.upsert({
      where: { userId: (await upsertUser(e, f, l, "PROFESSIONAL")).id },
      create: {
        userId: (await upsertUser(e, f, l, "PROFESSIONAL")).id,
        profession: e.includes("architect") ? "Architect" : "Engineer",
      },
      update: {},
    });

  const defs = await prisma.requirementDefinition.findMany({
    include: { rules: true },
  });
  const rules = defs.flatMap((d) =>
    d.rules.map((r) => ({
      id: r.id,
      requirementDefinitionId: d.id,
      condition: r.condition as any,
      active: r.active,
    })),
  );

  for (const sc of SCENARIOS) {
    const user = await upsertUser(
      demoEmail(sc.username),
      sc.first,
      sc.last,
      "APPLICANT",
    );
    const old = await prisma.application.findUnique({
      where: { reference: sc.ref },
    });
    if (old) {
      // idempotent reset of this scenario only
      await prisma.auditLog.deleteMany({ where: { entityId: old.id } });
      await prisma.document.deleteMany({ where: { applicationId: old.id } });
      await prisma.application.delete({ where: { id: old.id } });
    }
    const draft = sc.status === "DRAFT";
    const applicable = draft
      ? []
      : defs.filter((d) =>
          applicableRequirementIds(rules, sc.answers).includes(d.id),
        );
    const statusOf = (code: string, stage: string) =>
      sc.overrides[code] ??
      (ord(stage) < sc.current
        ? "VERIFIED"
        : ord(stage) === sc.current
          ? "VERIFIED"
          : "REQUIRED");
    const journey = computeJourney(
      applicable.map((d) => ({
        stage: d.stage as StageKey,
        mandatory: true,
        status: statusOf(d.code, d.stage),
      })),
    );
    const app = await prisma.application.create({
      data: {
        reference: sc.ref,
        applicantId: user.id,
        status: sc.status as any,
        currentStage: (journey.currentStage ?? "COMPLETION") as any,
        progress: draft ? 0 : journey.progress,
        submittedAt: draft ? null : ago(sc.days),
        completedAt: sc.status === "COMPLETED" ? ago(7) : null,
        createdAt: ago(sc.days + 2),
        project: {
          create: {
            title: sc.title,
            siteAddress: sc.site,
            developmentType: sc.answers.developmentType ?? "OTHER",
            floors: sc.answers.floors,
            answers: sc.answers,
          },
        },
        stages: {
          create: journey.stages.map((s) => ({
            stage: s.key as any,
            state: s.state as any,
          })),
        },
      },
    });

    const audits: Prisma.AuditLogCreateManyInput[] = [
      {
        userId: user.id,
        role: "APPLICANT",
        action: "APPLICATION_CREATED",
        entity: "Application",
        entityId: app.id,
        createdAt: ago(sc.days + 2),
      },
    ];
    const events: Prisma.ApplicationEventCreateManyInput[] = [
      {
        applicationId: app.id,
        type: "APPLICATION_CREATED",
        description: "Application created",
        actorRole: "APPLICANT",
        actorId: user.id,
        createdAt: ago(sc.days + 2),
      },
    ];
    if (!draft) {
      audits.push({
        userId: user.id,
        role: "APPLICANT",
        action: "APPLICATION_SUBMITTED",
        entity: "Application",
        entityId: app.id,
        newStatus: "SUBMITTED",
        createdAt: ago(sc.days),
      });
      events.push({
        applicationId: app.id,
        type: "APPLICATION_SUBMITTED",
        description: "Application submitted and received by LASBAG",
        actorRole: "APPLICANT",
        actorId: user.id,
        createdAt: ago(sc.days),
      });
      const doneStages = journey.stages.filter((s) => s.state === "COMPLETED");
      doneStages.forEach((s, i) =>
        events.push({
          applicationId: app.id,
          type: "STAGE_COMPLETED",
          description: `${s.label} completed`,
          createdAt: ago(sc.days - ((i + 1) * sc.days * 0.9) / 7),
        }),
      );
      // agency tasks: one per agency per stage, state follows the journey
      const seen = new Set<string>();
      for (const d of applicable) {
        const k = d.agencyId + d.stage;
        if (seen.has(k)) continue;
        seen.add(k);
        const o = ord(d.stage),
          st =
            o < sc.current
              ? "COMPLETED"
              : o === sc.current
                ? sc.status === "ACTION_REQUIRED"
                  ? "WAITING"
                  : "IN_PROGRESS"
                : "QUEUED";
        const task = await prisma.agencyTask.create({
          data: {
            applicationId: app.id,
            agencyId: d.agencyId,
            stage: d.stage,
            status: st as any,
            title: `${d.stage.replace("_", " ").toLowerCase()} review`,
          },
        });
        if (st !== "QUEUED")
          await prisma.sLA.create({
            data: {
              taskId: task.id,
              startTime: ago(st === "COMPLETED" ? sc.days / 2 : 3),
              dueTime:
                st === "COMPLETED"
                  ? ago(sc.days / 2 - 5)
                  : new Date(now + sc.dueDays * DAY),
              completedTime: st === "COMPLETED" ? ago(sc.days / 2 - 2) : null,
            },
          });
      }
    }
    for (const d of applicable) {
      const status = statusOf(d.code, d.stage);
      const r = await prisma.applicationRequirement.create({
        data: {
          applicationId: app.id,
          definitionId: d.id,
          status: status as any,
          statusReason: sc.reasons?.[d.code],
        },
      });
      if (
        ["REQUIRED", "ACTION_NEEDED"].includes(status) &&
        ord(d.stage) === sc.current
      )
        await prisma.sLA.create({
          data: {
            requirementId: r.id,
            startTime: ago(2),
            dueTime: new Date(now + sc.dueDays * DAY),
          },
        });
      if (!["VERIFIED", "UNDER_REVIEW", "ACTION_NEEDED"].includes(status))
        continue;
      const doc = await prisma.document.create({
        data: {
          applicationId: app.id,
          requirementId: r.id,
          documentType: d.name,
          uploadedById: user.id,
        },
      });
      const versions =
        status === "ACTION_NEEDED"
          ? [
              [
                "REJECTED",
                "The drainage impact statement is incomplete. Please attach the site drainage layout.",
              ],
            ]
          : d.code === "ARCH_DRAWINGS" && sc.current >= 5
            ? [
                ["REJECTED", "Title block missing plot number."],
                ["VERIFIED", null],
              ]
            : [[status === "VERIFIED" ? "VERIFIED" : "UNDER_REVIEW", null]];
      for (const [i, [vs, why]] of versions.entries()) {
        await prisma.documentVersion.create({
          data: {
            documentId: doc.id,
            version: i + 1,
            originalName: `${d.code.toLowerCase()}_v${i + 1}.pdf`,
            mimeType: "application/pdf",
            fileData: samplePdf(`${d.name} v${i + 1} - ${sc.ref}`),
            fileSize: samplePdf(`${d.name} v${i + 1} - ${sc.ref}`).length,
            status: vs as any,
            rejectionReason: why as string | null,
            uploadedById: user.id,
            uploadedAt: ago(sc.days - 3 - i),
            verifiedAt: vs === "VERIFIED" ? ago(sc.days - 6) : null,
          },
        });
        audits.push({
          userId: user.id,
          role: "APPLICANT",
          action: "DOCUMENT_UPLOADED",
          entity: "Document",
          entityId: doc.id,
          metadata: { version: i + 1 },
          createdAt: ago(sc.days - 3 - i),
        });
        if (vs === "VERIFIED")
          audits.push({
            userId: officer.id,
            role: "MDA_OFFICER",
            action: "DOCUMENT_VERIFIED",
            entity: "Document",
            entityId: doc.id,
            previousStatus: "UPLOADED",
            newStatus: "VERIFIED",
            createdAt: ago(sc.days - 6),
          });
      }
    }
    await prisma.applicationEvent.createMany({ data: events });
    await prisma.auditLog.createMany({ data: audits });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.notification.createMany({
      data: sc.notes.map(([title, body], i) => ({
        userId: user.id,
        title,
        body,
        link: `/applications/${app.id}`,
        createdAt: ago(i + 1),
      })),
    });
    if (!draft)
      await prisma.conversation.create({
        data: {
          applicationId: app.id,
          subject: "Your application",
          messages: {
            create: [
              {
                isSystem: true,
                body: `${sc.ref} has been received by LASBAG.`,
                createdAt: ago(sc.days),
              },
              {
                senderId: officer.id,
                body: "Good morning. We have started our review and will update you here.",
                createdAt: ago(sc.days - 1),
              },
            ],
          },
        },
      });
  }

  // Seed validation: bytes round-trip from PostgreSQL and every scenario has its expected shape.
  const v = await prisma.documentVersion.findFirstOrThrow({
    where: { status: "VERIFIED" },
  });
  if (
    Buffer.from(v.fileData).subarray(0, 4).toString() !== "%PDF" ||
    v.fileData.length !== v.fileSize
  )
    throw new Error("Document bytes did not round-trip");
  for (const sc of SCENARIOS) {
    const a = await prisma.application.findUniqueOrThrow({
      where: { reference: sc.ref },
    });
    console.log(
      `${sc.username.padEnd(12)} ${a.reference}  ${a.status.padEnd(16)} stage=${a.currentStage.padEnd(14)} progress=${a.progress}%`,
    );
  }
  console.log(
    "Seed OK. Development account credentials are listed at /dev/accounts.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
