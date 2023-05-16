import './globals.css'
// import { Inter } from 'next/font/google'

// const inter = Inter({ subsets: ['latin'] })
// {inter.className}

export const metadata = {
  title: 'News App',
  description: '** Almost AI-Powered **',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body> 
        {children}
      </body>
    </html>
  )
}
