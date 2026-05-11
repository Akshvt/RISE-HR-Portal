const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID!

export interface AirtableMember {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Member'
  department?: string
  dob?: string        // YYYY-MM-DD
  joinDate?: string   // YYYY-MM-DD
  avatarUrl?: string
}

async function airtableFetch(path: string) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    next: { revalidate: 300 }, // cache 5 min
  })
  if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getTeamMembers(): Promise<AirtableMember[]> {
  try {
    const data = await airtableFetch(`${AIRTABLE_TABLE_ID}?fields[]=Name&fields[]=Email&fields[]=Role&fields[]=Department&fields[]=DOB&fields[]=Join+Date`)
    return (data.records || []).map((r: Record<string, unknown>) => {
      const f = r.fields as Record<string, unknown>
      return {
        id: r.id as string,
        name: (f['Name'] as string) || '',
        email: (f['Email'] as string) || '',
        role: ['Admin', 'HR'].includes(f['Role'] as string) ? 'Admin' : 'Member',
        department: f['Department'] as string | undefined,
        dob: f['DOB'] as string | undefined,
        joinDate: f['Join Date'] as string | undefined,
      }
    })
  } catch (e) {
    console.error('Airtable fetch failed:', e)
    return []
  }
}

export async function getMemberByEmail(email: string): Promise<AirtableMember | null> {
  try {
    const formula = encodeURIComponent(`{Email}="${email}"`)
    const data = await airtableFetch(`${AIRTABLE_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`)
    if (!data.records?.length) return null
    const r = data.records[0]
    const f = r.fields as Record<string, unknown>
    return {
      id: r.id,
      name: (f['Name'] as string) || '',
      email: (f['Email'] as string) || '',
      role: ['Admin', 'HR'].includes(f['Role'] as string) ? 'Admin' : 'Member',
      department: f['Department'] as string | undefined,
      dob: f['DOB'] as string | undefined,
      joinDate: f['Join Date'] as string | undefined,
    }
  } catch (e) {
    console.error('Airtable getMemberByEmail failed:', e)
    return null
  }
}
