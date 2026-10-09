import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="description"
          content="ConnectHub - The professional social networking platform for modern careers, networking, and industry sharing."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-gray-100 min-h-screen text-gray-900 antialiased selection:bg-brand-500 selection:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
