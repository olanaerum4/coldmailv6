import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { smtp_host, smtp_port, smtp_user, smtp_password, email } = await req.json()

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port,
      secure: smtp_port === 465,
      auth: {
        user: smtp_user,
        pass: smtp_password,
      },
    })

    await transporter.verify()

    return NextResponse.json({ message: 'Tilkobling OK! SMTP fungerer.' })
  } catch (e: any) {
    return NextResponse.json(
      { error: `Tilkobling feilet: ${e.message}` },
      { status: 400 }
    )
  }
}
