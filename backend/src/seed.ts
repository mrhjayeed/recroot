import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Recroot database...');

  // 1. Categories
  const categoriesData = [
    'Personal Information',
    'Certification',
    'Domain Knowledge',
    'Soft Skills',
  ];

  const categoriesMap: Record<string, string> = {};
  for (const catName of categoriesData) {
    const cat = await prisma.attributeCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
    categoriesMap[catName] = cat.id;
  }

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@recroot.com' },
    update: {},
    create: {
      email: 'admin@recroot.com',
      password: passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      location: 'San Francisco, CA',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@recroot.com' },
    update: {},
    create: {
      email: 'recruiter@recroot.com',
      password: passwordHash,
      firstName: 'Sarah',
      lastName: 'Recruiter',
      role: 'RECRUITER',
      location: 'New York, NY',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@recroot.com' },
    update: {},
    create: {
      email: 'candidate@recroot.com',
      password: passwordHash,
      firstName: 'John',
      lastName: 'Candidate',
      role: 'CANDIDATE',
      location: 'Boston, MA',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    },
  });

  // 3. Attributes
  const attributesData = [
    {
      name: 'IELTS Score',
      category: 'Certification',
      type: 'NUMERIC',
      optionsJson: '[]',
    },
    {
      name: 'English Level',
      category: 'Personal Information',
      type: 'DROPDOWN',
      optionsJson: JSON.stringify(['Beginner', 'Intermediate', 'Advanced', 'Fluent']),
    },
    {
      name: 'Remote Work Availability',
      category: 'Personal Information',
      type: 'BOOLEAN',
      optionsJson: '[]',
    },
    {
      name: 'Presentation Skills',
      category: 'Soft Skills',
      type: 'DROPDOWN',
      optionsJson: JSON.stringify(['Basic', 'Intermediate', 'Advanced']),
    },
    {
      name: 'CAP Certification',
      category: 'Certification',
      type: 'DROPDOWN',
      optionsJson: JSON.stringify(['None', 'Essentials', 'Pro', 'Expert']),
    },
    {
      name: 'GPA',
      category: 'Personal Information',
      type: 'NUMERIC',
      optionsJson: '[]',
    },
    {
      name: 'Python Experience',
      category: 'Domain Knowledge',
      type: 'BOOLEAN',
      optionsJson: '[]',
    },
    {
      name: 'Apache Hadoop',
      category: 'Domain Knowledge',
      type: 'BOOLEAN',
      optionsJson: '[]',
    },
    {
      name: 'Bio / Professional Summary',
      category: 'Personal Information',
      type: 'TEXT',
      optionsJson: '[]',
    },
  ];

  const attributeMap: Record<string, string> = {};
  for (const attr of attributesData) {
    const created = await prisma.attribute.upsert({
      where: { name: attr.name },
      update: {
        type: attr.type,
        optionsJson: attr.optionsJson,
        categoryId: categoriesMap[attr.category],
      },
      create: {
        name: attr.name,
        type: attr.type,
        optionsJson: attr.optionsJson,
        categoryId: categoriesMap[attr.category],
      },
    });
    attributeMap[attr.name] = created.id;
  }

  // Seed initial candidate values
  await prisma.candidateAttributeValue.upsert({
    where: {
      candidateId_attributeId: {
        candidateId: candidate.id,
        attributeId: attributeMap['IELTS Score'],
      },
    },
    update: { value: '7.5' },
    create: {
      candidateId: candidate.id,
      attributeId: attributeMap['IELTS Score'],
      value: '7.5',
    },
  });

  await prisma.candidateAttributeValue.upsert({
    where: {
      candidateId_attributeId: {
        candidateId: candidate.id,
        attributeId: attributeMap['English Level'],
      },
    },
    update: { value: 'Advanced' },
    create: {
      candidateId: candidate.id,
      attributeId: attributeMap['English Level'],
      value: 'Advanced',
    },
  });

  await prisma.candidateAttributeValue.upsert({
    where: {
      candidateId_attributeId: {
        candidateId: candidate.id,
        attributeId: attributeMap['Remote Work Availability'],
      },
    },
    update: { value: 'true' },
    create: {
      candidateId: candidate.id,
      attributeId: attributeMap['Remote Work Availability'],
      value: 'true',
    },
  });

  await prisma.candidateAttributeValue.upsert({
    where: {
      candidateId_attributeId: {
        candidateId: candidate.id,
        attributeId: attributeMap['GPA'],
      },
    },
    update: { value: '3.8' },
    create: {
      candidateId: candidate.id,
      attributeId: attributeMap['GPA'],
      value: '3.8',
    },
  });

  await prisma.candidateAttributeValue.upsert({
    where: {
      candidateId_attributeId: {
        candidateId: candidate.id,
        attributeId: attributeMap['Python Experience'],
      },
    },
    update: { value: 'true' },
    create: {
      candidateId: candidate.id,
      attributeId: attributeMap['Python Experience'],
      value: 'true',
    },
  });

  // Seed sample projects for Candidate
  const existingProjCount = await prisma.candidateProject.count({
    where: { candidateId: candidate.id },
  });
  if (existingProjCount === 0) {
    await prisma.candidateProject.createMany({
      data: [
        {
          candidateId: candidate.id,
          name: 'Distributed Analytics Engine',
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          description: 'Built a real-time data streaming pipeline using **Python**, **Apache Hadoop**, and **Kafka**.',
          tagsJson: JSON.stringify(['Python', 'Hadoop', 'SQL', 'Data Engineering']),
        },
        {
          candidateId: candidate.id,
          name: 'E-commerce Recommendation Service',
          startDate: '2023-05-10',
          endDate: '2023-12-15',
          description: 'Designed ML product recommendation microservice processing millions of daily events.',
          tagsJson: JSON.stringify(['Python', 'Machine Learning', 'API']),
        },
      ],
    });
  }

  // 4. Positions
  const existingPosCount = await prisma.position.count();
  if (existingPosCount === 0) {
    const pos1 = await prisma.position.create({
      data: {
        title: 'Junior Data Engineer @ Acme Corp',
        shortDescription: 'Data engineering role focusing on Python, SQL, and Hadoop pipelines',
        isPublic: true,
        accessRulesJson: JSON.stringify([
          { attributeId: attributeMap['GPA'], operator: '>=', value: '3.0' },
          { attributeId: attributeMap['Remote Work Availability'], operator: '=', value: 'true' },
        ]),
        attributeIdsJson: JSON.stringify([
          attributeMap['English Level'],
          attributeMap['GPA'],
          attributeMap['Python Experience'],
          attributeMap['Apache Hadoop'],
          attributeMap['CAP Certification'],
        ]),
        projectTagsJson: JSON.stringify(['Python', 'Hadoop', 'SQL']),
        maxProjects: 3,
        createdById: recruiter.id,
      },
    });

    const pos2 = await prisma.position.create({
      data: {
        title: 'Business Analyst',
        shortDescription: 'Analyzing business requirements, presentation skills, and stakeholder management',
        isPublic: true,
        accessRulesJson: JSON.stringify([
          { attributeId: attributeMap['English Level'], operator: '=', value: 'Advanced' },
        ]),
        attributeIdsJson: JSON.stringify([
          attributeMap['English Level'],
          attributeMap['Presentation Skills'],
          attributeMap['GPA'],
        ]),
        projectTagsJson: JSON.stringify(['Analytics', 'Agile']),
        maxProjects: 2,
        createdById: recruiter.id,
      },
    });

    await prisma.position.create({
      data: {
        title: 'Senior DevOps Lead',
        shortDescription: 'Cloud infrastructure management, Kubernetes orchestration, and CI/CD automation pipelines',
        isPublic: true,
        accessRulesJson: JSON.stringify([]),
        attributeIdsJson: JSON.stringify([
          attributeMap['English Level'],
          attributeMap['Remote Work Availability'],
        ]),
        projectTagsJson: JSON.stringify(['DevOps', 'Docker', 'AWS']),
        maxProjects: 4,
        createdById: recruiter.id,
      },
    });

    // Create a sample CV for candidate for pos1
    const cv1 = await prisma.cV.create({
      data: {
        candidateId: candidate.id,
        positionId: pos1.id,
        status: 'PUBLISHED',
      },
    });

    // Recruiter likes cv1
    await prisma.cVLike.create({
      data: {
        cvId: cv1.id,
        recruiterId: recruiter.id,
      },
    });

    // Add discussion post to pos1
    await prisma.discussionPost.create({
      data: {
        positionId: pos1.id,
        authorId: recruiter.id,
        content: 'Welcome candidates! Feel free to ask any questions about the **Data Engineer** position.',
      },
    });
  }

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
