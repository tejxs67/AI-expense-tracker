import { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <Login onToggleForm={() => setIsLogin(false)} />
      ) : (
        <Register onToggleForm={() => setIsLogin(true)} />
      )}
    </>
  );
}
