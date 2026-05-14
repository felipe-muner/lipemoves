import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens, teachers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user || !user.hashedPassword) {
          return null
        }

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword)

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      if (token?.id) {
        const [dbUser] = await db
          .select({
            id: users.id,
            role: users.role,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)

        let role = dbUser?.role ?? null

        // Auto-link Google login → teacher when emails match
        if (!role && dbUser?.email) {
          const [t] = await db
            .select({ id: teachers.id })
            .from(teachers)
            .where(eq(teachers.email, dbUser.email))
            .limit(1)
          if (t) {
            await db
              .update(users)
              .set({ role: "teacher" })
              .where(eq(users.id, dbUser.id))
            await db
              .update(teachers)
              .set({ userId: dbUser.id })
              .where(eq(teachers.id, t.id))
            role = "teacher"
          }
        }

        token.role = role
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      session.user.role =
        (token.role as "admin" | "manager" | "teacher" | null) ?? null
      return session
    },
  },
})
