import './App.css';
import { AppRouter } from './router';
import './i18n/config';
import { defaultTheme, Provider } from '@adobe/react-spectrum';
import { ConfirmationServiceProvider } from './ui/components/ConfirmDialog/provider';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <>
      <ToastContainer transition={Slide} />
      <Provider theme={defaultTheme} colorScheme={'dark'}>
        <ConfirmationServiceProvider>
          <AppRouter />
        </ConfirmationServiceProvider>
      </Provider>
    </>


  );
}
