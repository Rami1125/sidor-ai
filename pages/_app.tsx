import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* זהות האפליקציה - sabanos */}
        <title>ח.סבן חומרי בנין</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        
        {/* הגדרות PWA להתקנה סלולרית */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ח.סבן חומרי בנין" />
        <link rel="apple-touch-icon" href="https://i.postimg.cc/3wTMxG7W/ai.jpg" />
        <meta name="theme-color" content="#10b981" />
      </Head>
      
      <Component {...pageProps} />
    </>
  );
}
