import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Track Data ───────────────────────────────────────────────────────────────
const tracks = [
    {
        name: 'Software Development',
        slug: 'software-development',
        description: 'Build real-world software applications using industry-standard tools and practices.',
        curriculum: [
            'Introduction to Software Engineering',
            'Version Control with Git',
            'Object-Oriented Programming',
            'Design Patterns',
            'REST API Design',
            'Testing and Debugging',
            'Code Review Practices',
            'Project: Build a CLI Application',
        ],
        durationDays: 30,
    },
    {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Learn to build modern, responsive websites using HTML, CSS, and JavaScript.',
        curriculum: [
            'HTML5 & Semantic Markup',
            'CSS3 & Flexbox/Grid',
            'JavaScript Fundamentals',
            'DOM Manipulation',
            'Responsive Design',
            'Introduction to React',
            'Deploying Web Apps',
            'Project: Build a Portfolio Website',
        ],
        durationDays: 30,
    },
    {
        name: 'Full Stack Development',
        slug: 'full-stack-development',
        description: 'Master both frontend and backend development to build complete web applications.',
        curriculum: [
            'Frontend: React + TypeScript',
            'Backend: Node.js + Express',
            'Databases: PostgreSQL',
            'REST API Development',
            'Authentication & Authorization',
            'Deployment with Docker',
            'CI/CD Pipelines',
            'Project: Full Stack App',
        ],
        durationDays: 30,
    },
    {
        name: 'Machine Learning',
        slug: 'machine-learning',
        description: 'Understand and apply machine learning algorithms to real-world datasets.',
        curriculum: [
            'Python for Data Science',
            'NumPy & Pandas',
            'Supervised Learning',
            'Unsupervised Learning',
            'Model Evaluation & Tuning',
            'Scikit-learn',
            'Introduction to Neural Networks',
            'Project: Predictive Model',
        ],
        durationDays: 30,
    },
    {
        name: 'Data Science',
        slug: 'data-science',
        description: 'Extract insights from data using statistical analysis and visualization techniques.',
        curriculum: [
            'Data Collection & Cleaning',
            'Exploratory Data Analysis',
            'Statistical Foundations',
            'Data Visualization (Matplotlib, Seaborn)',
            'SQL for Data Analysis',
            'Feature Engineering',
            'Storytelling with Data',
            'Project: End-to-End Data Analysis',
        ],
        durationDays: 30,
    },
    {
        name: 'Generative AI',
        slug: 'generative-ai',
        description: 'Explore large language models, prompt engineering, and AI application development.',
        curriculum: [
            'Introduction to Generative AI',
            'How LLMs Work',
            'Prompt Engineering',
            'LangChain & LlamaIndex',
            'RAG (Retrieval Augmented Generation)',
            'Building AI-Powered Apps',
            'AI Ethics & Safety',
            'Project: AI Chatbot Application',
        ],
        durationDays: 30,
    },
    {
        name: 'Software Testing',
        slug: 'software-testing',
        description: 'Learn manual and automated testing techniques to ensure software quality.',
        curriculum: [
            'Testing Fundamentals',
            'Test Case Design',
            'Manual Testing Techniques',
            'Introduction to Automation',
            'Selenium WebDriver',
            'API Testing with Postman',
            'Bug Reporting & Tracking',
            'Project: Test Suite for a Web App',
        ],
        durationDays: 30,
    },
    {
        name: 'Cyber Security',
        slug: 'cyber-security',
        description: 'Understand threats, vulnerabilities, and how to defend systems against attacks.',
        curriculum: [
            'Cybersecurity Fundamentals',
            'Networking Basics',
            'Common Attack Vectors',
            'OWASP Top 10',
            'Web Application Security',
            'Network Security Tools',
            'Ethical Hacking Basics',
            'Project: Security Audit Report',
        ],
        durationDays: 30,
    },
    {
        name: 'Android Development',
        slug: 'android-development',
        description: 'Build native Android applications using Kotlin and Android Studio.',
        curriculum: [
            'Kotlin Fundamentals',
            'Android Studio Setup',
            'UI Layouts & Components',
            'Activities & Fragments',
            'Data Storage (Room DB)',
            'Networking with Retrofit',
            'Publishing to Play Store',
            'Project: Android App',
        ],
        durationDays: 30,
    },
];

// ─── Seed Function ────────────────────────────────────────────────────────────
async function main() {
    console.log('🌱 Starting seed...\n');

    // Seed tracks
    console.log('📚 Seeding internship tracks...');
    for (const track of tracks) {
        await prisma.track.upsert({
            where: { slug: track.slug },
            update: {
                name: track.name,
                description: track.description,
                curriculum: track.curriculum,
                durationDays: track.durationDays,
            },
            create: track,
        });
        console.log(`  ✅ ${track.name}`);
    }

    // Seed super admin
    console.log('\n👤 Seeding admin user...');
    const adminPassword = 'Admin@123'; // Change this after first login!
    const passwordHash = hashSync(adminPassword, 12);

    await prisma.adminUser.upsert({
        where: { email: 'admin@vedgrow.dev' },
        update: {},
        create: {
            email: 'admin@vedgrow.dev',
            passwordHash,
            fullName: 'Super Admin',
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });
    console.log('  ✅ admin@vedgrow.dev (password: Admin@123)');

    console.log('\n✅ Seed complete!');
}

// ─── Run ──────────────────────────────────────────────────────────────────────
main()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });