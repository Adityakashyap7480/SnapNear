import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position={window.matchMedia('(max-width: 639px)').matches ? 'top-center' : 'bottom-right'}
            toastOptions={{
              duration: 4500,
              style: {
                background: '#0F172A',
                color: '#fff',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid #334155',
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
