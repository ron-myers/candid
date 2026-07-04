# Analysis Commands (candid-init Step 5)

Bash recipes for sections 5.4, 5.7, 5.8, and 5.9 of the candid-init workflow.

### 5.4 Architecture Pattern Detection (Thorough Only)

```bash
# Barrel exports (index.ts files)
find . -name "index.ts" -o -name "index.js" 2>/dev/null | grep -v node_modules | wc -l
# Sample a few to see export patterns
find . -name "index.ts" 2>/dev/null | grep -v node_modules | head -3 | xargs cat 2>/dev/null

# Dependency injection patterns
grep -rh "@Injectable\|@Inject\|constructor.*private\|createContext" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -15

# Middleware/decorator patterns
grep -rh "@.*Middleware\|@Guard\|@Interceptor\|@UseGuards\|@Auth" --include="*.ts" 2>/dev/null | grep -v node_modules | head -10

# Domain boundaries (look for domain-specific directories)
find . -type d -name "billing" -o -name "auth" -o -name "users" -o -name "payments" -o -name "orders" 2>/dev/null | grep -v node_modules | head -10
```

### 5.7 API Patterns (Medium + Thorough, for Node/Backend)

```bash
# Route definitions
grep -rh "router\.\|app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Delete" --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Validation patterns
grep -rh "from 'zod'\|from 'yup'\|from 'joi'\|@IsString\|@IsNumber\|z\.object\|Joi\.object" --include="*.ts" 2>/dev/null | grep -v node_modules | head -10

# Auth middleware
grep -rh "auth.*middleware\|isAuthenticated\|requireAuth\|@Auth\|@UseGuards" --include="*.ts" 2>/dev/null | grep -v node_modules | head -10
```

### 5.8 React Patterns (Medium + Thorough, for React)

```bash
# Hook patterns
find . -name "use*.ts" -o -name "use*.tsx" 2>/dev/null | grep -v node_modules | head -15

# State management
grep -rh "from 'redux'\|from 'zustand'\|from '@tanstack/react-query'\|from 'swr'\|createContext\|useReducer" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10

# Component patterns
grep -rh "React.memo\|forwardRef\|React.lazy\|Suspense" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10

# Event handler naming
grep -rhoE "(handle|on)[A-Z][a-zA-Z]*" --include="*.tsx" 2>/dev/null | grep -v node_modules | sort | uniq -c | sort -rn | head -15
```

### 5.9 TypeScript Analysis (Thorough Only)

```bash
# Strictness
cat tsconfig.json 2>/dev/null | grep -E "strict|noImplicit"

# Any usage (red flag)
grep -rc ": any\|as any" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ":0$" | awk -F: '{sum+=$2} END {print "any/as any count:", sum}'

# Interface vs type preference
grep -rc "^interface \|^export interface " --include="*.ts" 2>/dev/null | grep -v node_modules | awk -F: '{sum+=$2} END {print "interfaces:", sum}'
grep -rc "^type \|^export type " --include="*.ts" 2>/dev/null | grep -v node_modules | awk -F: '{sum+=$2} END {print "types:", sum}'
```
