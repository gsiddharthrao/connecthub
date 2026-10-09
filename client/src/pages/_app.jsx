import { useEffect } from 'react';
import { Provider } from 'react-redux';
import Head from 'next/head';
import store from '../store';
import { useAppDispatch } from '../store/hooks';
import { loadCurrentUser } from '../store/slices/authSlice';
import '../styles/globals.css';

function AuthInitializer({ children }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        dispatch(loadCurrentUser());
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Head>
        <title>ConnectHub - Professional Social Networking</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthInitializer>
        <Component {...pageProps} />
      </AuthInitializer>
    </Provider>
  );
}
