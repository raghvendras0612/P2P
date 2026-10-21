"""Database seeding script for skills, interests, and career paths."""

import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.catalog import CareerPath, Interest, Skill

SKILLS_DATA = [
    # 1. Programming Languages (15)
    {"name": "Python", "category": "Programming Languages", "aliases": "py, python3"},
    {"name": "Java", "category": "Programming Languages", "aliases": "core java, j2ee, jdk"},
    {"name": "C++", "category": "Programming Languages", "aliases": "cpp, cplusplus, stl"},
    {"name": "C", "category": "Programming Languages", "aliases": "c programming, ansi c"},
    {"name": "JavaScript", "category": "Programming Languages", "aliases": "js, es6, ecmascript"},
    {"name": "TypeScript", "category": "Programming Languages", "aliases": "ts"},
    {"name": "Go (Golang)", "category": "Programming Languages", "aliases": "golang, go"},
    {"name": "Rust", "category": "Programming Languages", "aliases": "rustlang"},
    {"name": "Kotlin", "category": "Programming Languages", "aliases": "android kotlin"},
    {"name": "Swift", "category": "Programming Languages", "aliases": "ios swift"},
    {"name": "C#", "category": "Programming Languages", "aliases": "csharp, .net"},
    {"name": "PHP", "category": "Programming Languages", "aliases": "php7, php8"},
    {"name": "Ruby", "category": "Programming Languages", "aliases": "rb"},
    {"name": "SQL", "category": "Programming Languages", "aliases": "structured query language"},
    {
        "name": "Bash / Shell Scripting",
        "category": "Programming Languages",
        "aliases": "bash, sh, zsh",
    },
    # 2. Web Frontend (15)
    {"name": "React.js", "category": "Web Frontend", "aliases": "react, reactjs"},
    {"name": "Next.js", "category": "Web Frontend", "aliases": "next, nextjs, ssr"},
    {"name": "Vue.js", "category": "Web Frontend", "aliases": "vue, vuejs"},
    {"name": "Angular", "category": "Web Frontend", "aliases": "angularjs, ng"},
    {"name": "HTML5", "category": "Web Frontend", "aliases": "html, semantic html"},
    {"name": "CSS3", "category": "Web Frontend", "aliases": "css, stylesheets"},
    {"name": "Tailwind CSS", "category": "Web Frontend", "aliases": "tailwind, tw"},
    {"name": "Bootstrap", "category": "Web Frontend", "aliases": "getbootstrap"},
    {"name": "Sass / SCSS", "category": "Web Frontend", "aliases": "sass, scss"},
    {"name": "Redux / Redux Toolkit", "category": "Web Frontend", "aliases": "redux, rtk"},
    {"name": "Zustand", "category": "Web Frontend", "aliases": "zustand store"},
    {
        "name": "TanStack Query (React Query)",
        "category": "Web Frontend",
        "aliases": "react-query, rq",
    },
    {"name": "Webpack", "category": "Web Frontend", "aliases": "bundler"},
    {"name": "Vite", "category": "Web Frontend", "aliases": "vitejs"},
    {"name": "Responsive Web Design", "category": "Web Frontend", "aliases": "rwd, mobile-first"},
    # 3. Web Backend (15)
    {"name": "Node.js", "category": "Web Backend", "aliases": "node, nodejs"},
    {"name": "Express.js", "category": "Web Backend", "aliases": "express"},
    {"name": "FastAPI", "category": "Web Backend", "aliases": "fastapi python"},
    {
        "name": "Django",
        "category": "Web Backend",
        "aliases": "django python, djangorestframework, drf",
    },
    {"name": "Flask", "category": "Web Backend", "aliases": "flask python"},
    {"name": "Spring Boot", "category": "Web Backend", "aliases": "spring, java spring"},
    {"name": "NestJS", "category": "Web Backend", "aliases": "nest, nestjs"},
    {"name": ".NET Core / ASP.NET", "category": "Web Backend", "aliases": "dotnet, aspnet"},
    {"name": "RESTful API Design", "category": "Web Backend", "aliases": "rest, rest apis"},
    {"name": "GraphQL", "category": "Web Backend", "aliases": "gql, apollo"},
    {"name": "gRPC", "category": "Web Backend", "aliases": "protobuf, rpc"},
    {"name": "WebSockets", "category": "Web Backend", "aliases": "socket.io, realtime"},
    {"name": "Microservices Architecture", "category": "Web Backend", "aliases": "microservices"},
    {
        "name": "Authentication (JWT / OAuth2)",
        "category": "Web Backend",
        "aliases": "jwt, oauth, auth",
    },
    {
        "name": "Message Queues (RabbitMQ / Kafka)",
        "category": "Web Backend",
        "aliases": "kafka, rabbitmq, amqp",
    },
    # 4. Databases (12)
    {"name": "PostgreSQL", "category": "Databases", "aliases": "postgres, psql"},
    {"name": "MySQL", "category": "Databases", "aliases": "mariadb"},
    {"name": "MongoDB", "category": "Databases", "aliases": "mongo, nosql"},
    {"name": "Redis", "category": "Databases", "aliases": "in-memory cache, key-value"},
    {"name": "SQLite", "category": "Databases", "aliases": "sqlite3"},
    {"name": "Cassandra", "category": "Databases", "aliases": "apache cassandra"},
    {"name": "Elasticsearch", "category": "Databases", "aliases": "elastic, elk, search engine"},
    {
        "name": "Firebase Firestore",
        "category": "Databases",
        "aliases": "firestore, google firebase",
    },
    {"name": "Prisma ORM", "category": "Databases", "aliases": "prisma"},
    {"name": "SQLAlchemy", "category": "Databases", "aliases": "sqlalchemy orm"},
    {
        "name": "Database Indexing & Optimization",
        "category": "Databases",
        "aliases": "query tuning, b-tree",
    },
    {
        "name": "Database Schema Design & Normalization",
        "category": "Databases",
        "aliases": "erd, 3nf, rdbms design",
    },
    # 5. Data & Analytics (12)
    {"name": "Pandas", "category": "Data and analytics", "aliases": "pd, dataframe"},
    {"name": "NumPy", "category": "Data and analytics", "aliases": "numerical python"},
    {"name": "Apache Spark", "category": "Data and analytics", "aliases": "pyspark, spark"},
    {
        "name": "Apache Airflow",
        "category": "Data and analytics",
        "aliases": "airflow, etl orchestration",
    },
    {
        "name": "Data Warehousing (Snowflake / BigQuery)",
        "category": "Data and analytics",
        "aliases": "bigquery, snowflake, dwh",
    },
    {
        "name": "ETL Pipeline Development",
        "category": "Data and analytics",
        "aliases": "extract transform load, data pipelines",
    },
    {"name": "Tableau", "category": "Data and analytics", "aliases": "bi visualization"},
    {"name": "Power BI", "category": "Data and analytics", "aliases": "microsoft power bi"},
    {
        "name": "Data Analysis & EDA",
        "category": "Data and analytics",
        "aliases": "exploratory data analysis",
    },
    {
        "name": "Matplotlib / Seaborn",
        "category": "Data and analytics",
        "aliases": "data viz python",
    },
    {"name": "dbt (data build tool)", "category": "Data and analytics", "aliases": "dbt"},
    {
        "name": "Statistical Modeling",
        "category": "Data and analytics",
        "aliases": "hypothesis testing, statistics",
    },
    # 6. ML / AI (13)
    {"name": "Scikit-Learn", "category": "ML/AI", "aliases": "sklearn, classical ml"},
    {"name": "PyTorch", "category": "ML/AI", "aliases": "torch, deep learning"},
    {"name": "TensorFlow / Keras", "category": "ML/AI", "aliases": "tf, deep neural nets"},
    {"name": "Computer Vision (OpenCV)", "category": "ML/AI", "aliases": "cv, opencv"},
    {
        "name": "Natural Language Processing (NLP)",
        "category": "ML/AI",
        "aliases": "nlp, text processing",
    },
    {
        "name": "Hugging Face Transformers",
        "category": "ML/AI",
        "aliases": "transformers, bert, llms",
    },
    {
        "name": "Large Language Models (LLMs) & Prompting",
        "category": "ML/AI",
        "aliases": "llm, prompt engineering, gemini, gpt",
    },
    {"name": "LangChain / LlamaIndex", "category": "ML/AI", "aliases": "rag, agent frameworks"},
    {
        "name": "Vector Databases (Pinecone / Chroma / Milvus)",
        "category": "ML/AI",
        "aliases": "vector search, embeddings",
    },
    {
        "name": "Model Evaluation & Metrics",
        "category": "ML/AI",
        "aliases": "precision, recall, f1, auc-roc",
    },
    {"name": "MLflow", "category": "ML/AI", "aliases": "experiment tracking, mlops"},
    {
        "name": "Deep Learning Architectures (CNN, RNN, Transformers)",
        "category": "ML/AI",
        "aliases": "neural networks",
    },
    {
        "name": "Feature Engineering",
        "category": "ML/AI",
        "aliases": "feature extraction, normalization",
    },
    # 7. DevOps & Cloud (12)
    {
        "name": "Docker & Containerization",
        "category": "DevOps and cloud",
        "aliases": "dockerfile, containers",
    },
    {
        "name": "Kubernetes",
        "category": "DevOps and cloud",
        "aliases": "k8s, container orchestration",
    },
    {
        "name": "AWS (Amazon Web Services)",
        "category": "DevOps and cloud",
        "aliases": "ec2, s3, lambda, aws cloud",
    },
    {
        "name": "Google Cloud Platform (GCP)",
        "category": "DevOps and cloud",
        "aliases": "gcp, cloud run",
    },
    {"name": "Microsoft Azure", "category": "DevOps and cloud", "aliases": "azure cloud"},
    {
        "name": "CI/CD Pipelines (GitHub Actions / GitLab CI)",
        "category": "DevOps and cloud",
        "aliases": "ci cd, github actions",
    },
    {
        "name": "Terraform (Infrastructure as Code)",
        "category": "DevOps and cloud",
        "aliases": "iac, terraform",
    },
    {
        "name": "Nginx / Reverse Proxies",
        "category": "DevOps and cloud",
        "aliases": "nginx, load balancing",
    },
    {
        "name": "Prometheus & Grafana",
        "category": "DevOps and cloud",
        "aliases": "monitoring, metrics, observability",
    },
    {
        "name": "Linux Server Administration",
        "category": "DevOps and cloud",
        "aliases": "sysadmin, ubuntu, centos",
    },
    {
        "name": "Cloudflare / CDN Management",
        "category": "DevOps and cloud",
        "aliases": "cdn, edge computing",
    },
    {
        "name": "Serverless Computing",
        "category": "DevOps and cloud",
        "aliases": "aws lambda, vercel, edge functions",
    },
    # 8. Security (8)
    {
        "name": "Web Security & OWASP Top 10",
        "category": "Security",
        "aliases": "owasp, xss, csrf, sql injection",
    },
    {"name": "Network Security & Firewalls", "category": "Security", "aliases": "netsec, ids, ips"},
    {
        "name": "Cryptography Basics",
        "category": "Security",
        "aliases": "symmetric, asymmetric, hashing, tls",
    },
    {
        "name": "Penetration Testing Basics",
        "category": "Security",
        "aliases": "ethical hacking, burp suite, nmap",
    },
    {
        "name": "Vulnerability Assessment",
        "category": "Security",
        "aliases": "vulnerability scanning, cve",
    },
    {
        "name": "Identity & Access Management (IAM)",
        "category": "Security",
        "aliases": "rbac, saml, sso, iam",
    },
    {"name": "SIEM & Log Analysis", "category": "Security", "aliases": "splunk, wazuh, soc"},
    {
        "name": "Cloud Security Best Practices",
        "category": "Security",
        "aliases": "aws security, devsecops",
    },
    # 9. Product & Design (8)
    {"name": "Figma", "category": "Product and design", "aliases": "ui design, prototyping"},
    {
        "name": "Wireframing & Prototyping",
        "category": "Product and design",
        "aliases": "mockups, low fidelity",
    },
    {
        "name": "User Research & Usability Testing",
        "category": "Product and design",
        "aliases": "user interviews, ux research",
    },
    {
        "name": "Agile & Scrum Methodologies",
        "category": "Product and design",
        "aliases": "sprints, jira, kanban",
    },
    {
        "name": "Product Requirement Documents (PRD)",
        "category": "Product and design",
        "aliases": "prd, user stories",
    },
    {
        "name": "A/B Testing & Product Metrics",
        "category": "Product and design",
        "aliases": "growth metrics, retention, funnels",
    },
    {
        "name": "Design Systems & Component Libraries",
        "category": "Product and design",
        "aliases": "atomic design, ui tokens",
    },
    {
        "name": "Information Architecture",
        "category": "Product and design",
        "aliases": "sitemaps, user flows",
    },
    # 10. Core CS (DSA, OS, DBMS, CN) (10)
    {
        "name": "Data Structures & Algorithms (DSA)",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "dsa, leetcode, trees, graphs, dp",
    },
    {
        "name": "Object-Oriented Programming (OOP)",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "oops, classes, inheritance, polymorphism",
    },
    {
        "name": "Operating Systems Concepts",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "os, threads, deadlocks, memory management",
    },
    {
        "name": "Database Management Systems (DBMS)",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "dbms, transactions, acid, concurrency",
    },
    {
        "name": "Computer Networks",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "tcp/ip, udp, http, dns, sockets",
    },
    {
        "name": "System Design Basics",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "hld, lld, scalability, caching",
    },
    {
        "name": "Low-Level Design (LLD)",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "solid principles, design patterns",
    },
    {
        "name": "Time & Space Complexity Analysis",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "big o notation",
    },
    {
        "name": "Compilers & Automata Theory",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "toc, lex, parse",
    },
    {
        "name": "Software Engineering Principles",
        "category": "Core CS (DSA, OS, DBMS, CN)",
        "aliases": "dry, kiss, clean code",
    },
    # 11. Tools & Environment (8)
    {"name": "Git & GitHub", "category": "Tools", "aliases": "version control, git branching, prs"},
    {"name": "Linux Command Line", "category": "Tools", "aliases": "cli, unix, terminal"},
    {"name": "Postman / Insomnia", "category": "Tools", "aliases": "api testing, rest client"},
    {"name": "VS Code", "category": "Tools", "aliases": "code editor, extensions"},
    {
        "name": "Virtual Environments & Package Managers",
        "category": "Tools",
        "aliases": "npm, pip, yarn, pnpm",
    },
    {
        "name": "Unit Testing & Pytest / Jest",
        "category": "Tools",
        "aliases": "tdd, automated tests",
    },
    {"name": "Jira / Trello", "category": "Tools", "aliases": "project management, issue tracking"},
    {
        "name": "Markdown & Tech Documentation",
        "category": "Tools",
        "aliases": "readme, documentation",
    },
]

INTERESTS_DATA = [
    {"name": "Building full-stack web applications", "group": "Building web apps"},
    {"name": "Designing beautiful responsive web user interfaces", "group": "Building web apps"},
    {"name": "Architecting high-performance backend microservices", "group": "Building web apps"},
    {
        "name": "Extracting insights from large datasets and dashboards",
        "group": "Working with data",
    },
    {"name": "Building automated ETL data pipelines", "group": "Working with data"},
    {"name": "Database optimization and SQL query tuning", "group": "Working with data"},
    {
        "name": "Training deep learning models for Computer Vision / NLP",
        "group": "AI and ML research",
    },
    {"name": "Building generative AI applications with LLMs & RAG", "group": "AI and ML research"},
    {"name": "Reading AI research papers and implementing models", "group": "AI and ML research"},
    {
        "name": "Containerization and Kubernetes orchestration",
        "group": "Automation and infrastructure",
    },
    {"name": "CI/CD automation and developer experience", "group": "Automation and infrastructure"},
    {"name": "Cloud architecture on AWS, GCP, or Azure", "group": "Automation and infrastructure"},
    {"name": "Ethical hacking, pentesting, and bug bounties", "group": "Securing systems"},
    {"name": "Defending cloud environments and threat detection", "group": "Securing systems"},
    {
        "name": "Solving real user problems and shaping product roadmaps",
        "group": "Product thinking",
    },
    {"name": "Analyzing business metrics, funnels, and retention", "group": "Product thinking"},
    {"name": "User research, wireframing, and interactive prototyping", "group": "Design and UX"},
    {"name": "Building consistent design systems and UI accessibility", "group": "Design and UX"},
    {"name": "Contributing to open source software repositories", "group": "Open source"},
    {"name": "Building products from scratch in fast-paced startups", "group": "Startups"},
    {
        "name": "Pursuing master's / research publications in academia",
        "group": "Research and academia",
    },
    {
        "name": "Competitive programming (LeetCode, Codeforces, CodeChef)",
        "group": "Competitive programming",
    },
    {
        "name": "Mastering advanced algorithms and mathematical problem-solving",
        "group": "Competitive programming",
    },
    {"name": "Developing native Android apps with Kotlin", "group": "Mobile apps"},
    {"name": "Cross-platform mobile apps with Flutter or React Native", "group": "Mobile apps"},
]

CAREER_PATHS_DATA = [
    {
        "slug": "full-stack-developer",
        "name": "Full Stack Developer",
        "description": "Build end-to-end web applications bridging intuitive responsive frontends with resilient, scalable backend APIs and databases. Highly in-demand across startups, product enterprises, and MNC placement drives.",
    },
    {
        "slug": "data-engineer",
        "name": "Data Engineer",
        "description": "Design, construct, and manage scalable data pipelines, data warehouses, and streaming platforms that power business analytics and machine learning systems at scale.",
    },
    {
        "slug": "ai-ml-engineer",
        "name": "AI/ML Engineer",
        "description": "Develop and deploy machine learning models, neural networks, and modern Generative AI / LLM solutions into production systems solving complex automation and prediction tasks.",
    },
    {
        "slug": "devops-cloud-engineer",
        "name": "DevOps & Cloud Engineer",
        "description": "Automate deployment infrastructure, maintain robust CI/CD pipelines, containerize applications with Docker/Kubernetes, and architect secure cloud solutions on AWS/GCP/Azure.",
    },
    {
        "slug": "cybersecurity-analyst",
        "name": "Cybersecurity Analyst",
        "description": "Protect digital infrastructure, conduct vulnerability assessments and penetration tests, monitor security incidents, and ensure enterprise compliance and data protection.",
    },
    {
        "slug": "data-analyst-scientist",
        "name": "Data Analyst / Scientist",
        "description": "Transform messy raw data into actionable business intelligence using statistical analysis, predictive modeling, Python/R, SQL, and interactive dashboards.",
    },
    {
        "slug": "product-manager",
        "name": "Associate Product Manager (APM)",
        "description": "Lead cross-functional engineering and design teams to build user-loved tech products by translating business problems into prioritized feature specs and measurable goals.",
    },
    {
        "slug": "ui-ux-designer",
        "name": "UI/UX Designer",
        "description": "Craft intuitive user journeys, conduct usability testing, build accessible design systems in Figma, and design captivating user interfaces for web and mobile applications.",
    },
    {
        "slug": "mobile-app-developer",
        "name": "Mobile App Developer",
        "description": "Build performant native or cross-platform mobile apps (Kotlin/Swift/React Native/Flutter) that reach millions of users on Android and iOS devices.",
    },
]


def seed_database(db: Session) -> dict:
    """Seed skills, interests, and career paths idempotently."""
    stats = {"skills": 0, "interests": 0, "paths": 0}

    # 1. Seed Skills
    existing_skills = {s.name.lower() for s in db.query(Skill).all()}
    skills_to_add = []
    for item in SKILLS_DATA:
        if item["name"].lower() not in existing_skills:
            skills_to_add.append(
                Skill(
                    name=item["name"],
                    category=item["category"],
                    aliases=item.get("aliases"),
                    is_verified_seed=True,
                )
            )
            existing_skills.add(item["name"].lower())

    if skills_to_add:
        db.add_all(skills_to_add)
        db.commit()
        stats["skills"] = len(skills_to_add)

    # 2. Seed Interests
    existing_interests = {i.name.lower() for i in db.query(Interest).all()}
    interests_to_add = []
    for item in INTERESTS_DATA:
        if item["name"].lower() not in existing_interests:
            interests_to_add.append(
                Interest(
                    name=item["name"],
                    group=item["group"],
                )
            )
            existing_interests.add(item["name"].lower())

    if interests_to_add:
        db.add_all(interests_to_add)
        db.commit()
        stats["interests"] = len(interests_to_add)

    # 3. Seed Career Paths
    existing_paths = {p.slug for p in db.query(CareerPath).all()}
    paths_to_add = []
    for item in CAREER_PATHS_DATA:
        if item["slug"] not in existing_paths:
            paths_to_add.append(
                CareerPath(
                    slug=item["slug"],
                    name=item["name"],
                    description=item["description"],
                )
            )
            existing_paths.add(item["slug"])

    if paths_to_add:
        db.add_all(paths_to_add)
        db.commit()
        stats["paths"] = len(paths_to_add)

    return stats


if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("🌱 Seeding database with initial catalog...")
        results = seed_database(db)
        print(
            f"✅ Seeding complete! Added: {results['skills']} skills, {results['interests']} interests, {results['paths']} career paths."
        )
    finally:
        db.close()
