import '../styles/globals.css'; // השורה הזו מזריקה את העיצוב לכל המערכת
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
