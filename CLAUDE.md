@AGENTS.md

# PROJECT: Multi-Vendor Marketplace

## STACK (DO NOT CHANGE)

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- NextAuth (JWT strategy)
- Cloudinary (image upload)
- Zustand (state)
- Paystack (payments, can swap later)

---

## GOAL

Build a scalable multi-vendor e-commerce platform where:

- Users can register as Buyer or Seller
- Sellers can upload new/used products
- Buyers can purchase products
- Admin manages the platform

---

## ROLES

- buyer
- seller
- admin

---

## CORE FEATURES

- Authentication (role-based)
- Product CRUD
- Image upload
- Cart system
- Orders system
- Reviews
- Dashboards (buyer, seller, admin)
- payment will be made to buyer after 7days of delivery a product sold on the platform

---

## CODE RULES

- Use clean, modular architecture
- Use reusable components
- Use server actions or API routes properly
- No inline business logic in UI
- Use Zod for validation
- Use async/await (no callbacks)
- Use TypeScript strictly

---

## UI RULES

- Tailwind only
- Color theme: Green + Gold
- Minimal, modern UI
- Fully responsive

---

## FILE STRUCTURE

/src
/app
/components
/lib
/models
/hooks
/store
/utils

---

## DATABASE RULES

Collections:

- users
- products
- orders
- reviews
- categories

Include relationships (seller → products, user → orders, etc.)

---

## OUTPUT RULES (VERY IMPORTANT)

- Do NOT explain basics
- Do NOT repeat instructions
- Give direct implementation
- Break into steps only when needed
- Provide working code (not pseudo-code)

---

## WHEN GENERATING CODE

Always:

1. Show file path
2. Write full code
3. Keep it production-ready

---

## AVOID

- Over-explaining
- Dummy placeholders unless necessary
- Repeating previous code

---

## DEFAULT BEHAVIOR

Act like a senior full-stack engineer building a real startup MVP.
