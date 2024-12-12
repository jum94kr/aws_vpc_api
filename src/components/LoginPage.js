import React, { useState } from 'react';
import AWS from 'aws-sdk';
import awsConfig from '../aws-exports';

const LoginPage = ({ onLoginSuccess }) => {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    try {
      AWS.config.update({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: awsConfig.region,
      });

      const iam = new AWS.IAM();
      iam.getUser({}, (err, data) => {
        if (err) {
          setError('로그인 실패: 올바른 자격 증명을 입력하세요.');
        } else {
          console.log('로그인 성공:', data);
          onLoginSuccess(); // Dashboard로 이동
        }
      });
    } catch (e) {
      setError('로그인 중 문제가 발생했습니다.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>IAM 계정 로그인</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="text"
          className="input-field"
          placeholder="Access Key"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
        />
        <input
          type="password"
          className="input-field"
          placeholder="Secret Key"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
        <button className="login-button" onClick={handleLogin}>로그인</button>
      </div>
    </div>
  );
};

export default LoginPage;
