import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getMemberByEmail } from '@/lib/airtable'
import { supabaseAdmin } from '@/lib/supabase'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Demo Access',
      credentials: { role: { type: 'text' } },
      async authorize(credentials) {
        const isEmployee = credentials?.role === 'employee'
        return {
          id: isEmployee ? 'demo-emp' : 'demo-admin',
          name: isEmployee ? 'Demo Employee' : 'Demo Admin',
          email: isEmployee ? 'employee@rise-demo.com' : 'admin@rise-demo.com',
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${isEmployee ? 'Employee' : 'Admin'}`,
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true

      if (!user.email) return false
      const member = await getMemberByEmail(user.email)
      if (!member) return '/login?error=unauthorized'

      // Upsert user in Supabase audit log
      await supabaseAdmin.from('audit_log').insert({
        action: 'sign_in',
        actor_email: user.email,
        actor_name: user.name,
        details: { success: true },
      })
      // fire and forget

      return true
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'credentials' || token.email?.endsWith('@rise-demo.com')) {
        const isAdmin = token.email === 'admin@rise-demo.com'
        token.role = isAdmin ? 'Admin' : 'Member'
        token.airtableId = isAdmin ? 'demo-admin-id' : 'demo-emp-id'
        token.department = isAdmin ? 'HR' : 'Engineering'
        token.name = isAdmin ? 'Demo Admin' : 'Demo Employee'
        return token
      }

      if (user?.email) {
        const member = await getMemberByEmail(user.email)
        token.role = member?.role ?? 'Member'
        token.airtableId = member?.id
        token.department = member?.department
        token.name = member?.name ?? user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.airtableId = token.airtableId as string
        session.user.department = token.department as string
      }
      return session
    },
  },
})
