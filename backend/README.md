# Backend - Node.js + Express + TypeORM + SQL Server

│   │   └── database.ts       # TypeORM configuration
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Category.ts
│   │   ├── Transaction.ts
│   │   └── Budget.ts
│   ├── middlewares/
│   │   └── auth.ts           # JWT middleware
│   ├── routes/
│   │   └── auth.ts           # Auth routes
│   └── index.ts              # Express server
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── tsconfig.json
```

## Next Steps
1. Update `.env` with your SQL Server credentials
2. Run the development server
3. Test authentication endpoints with Postman or curl
4. Continue with API implementation for Categories, Transactions, and Budgets