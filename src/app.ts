import { PropsWithChildren } from 'react';
import './app.scss';
import { BookingProvider } from './store/booking-context';

function App({ children }: PropsWithChildren<any>) {
  return <BookingProvider>{children}</BookingProvider>;
}

export default App;
