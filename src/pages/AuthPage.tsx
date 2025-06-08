import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 16px;
  margin: 0 0 30px 0;
  line-height: 1.5;
`;

const PhoneInputContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const PhoneInput = styled.input`
  width: 100%;
  padding: 16px;
  font-size: 18px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  background: #f8f9ff;
  color: #333;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #667eea;
    background: white;
  }

  &::placeholder {
    color: #999;
  }
`;

const OtpInput = styled.input`
  width: 100%;
  padding: 16px;
  font-size: 24px;
  text-align: center;
  letter-spacing: 8px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  background: #f8f9ff;
  color: #333;
  outline: none;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:focus {
    border-color: #667eea;
    background: white;
  }

  &::placeholder {
    color: #999;
    letter-spacing: normal;
  }
`;

const SendCodeButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const VerifyButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 15px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(118, 75, 162, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #666;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px;
  background: #ffeaa7;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px;
  background: #d5f4e6;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 40px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: white;
`;

const FeatureIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

const FeatureText = styled.p`
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
`;

export const AuthPage: React.FC = () => {
  const { signIn, verifyOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    // Format phone number with country code
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await signIn(formattedPhone);

    if (error) {
      setError(error.message || 'Failed to send verification code');
      setLoading(false);
      return;
    }

    setSuccess('Verification code sent! Check your messages.');
    setPhoneNumber(formattedPhone);
    setStep('verify');
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await verifyOtp(phoneNumber, otp);

    if (error) {
      setError(error.message || 'Invalid verification code');
      setLoading(false);
      return;
    }

    // Success - AuthContext will handle the redirect
    setLoading(false);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setSuccess('');
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const length = numbers.length;
    
    if (length === 0) return '';
    if (length <= 3) return `(${numbers}`;
    if (length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <Container>
      <Card>
        {step === 'phone' ? (
          <>
            <Title>✨ matching</Title>
            <Subtitle>Find your perfect match with AI-powered compatibility</Subtitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            
            <PhoneInputContainer>
              <PhoneInput
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={loading}
              />
            </PhoneInputContainer>
            
            <SendCodeButton 
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </SendCodeButton>
          </>
        ) : (
          <>
            <Title>🔐 Verify</Title>
            <Subtitle>Enter the 6-digit code sent to {phoneNumber}</Subtitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <OtpInput
              type="text"
              placeholder="123456"
              value={otp}
              onChange={handleOtpChange}
              disabled={loading}
              maxLength={6}
            />
            
            <VerifyButton 
              onClick={handleVerifyCode}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </VerifyButton>
            
            <BackButton onClick={handleBackToPhone}>
              ← Back to Phone Number
            </BackButton>
          </>
        )}
      </Card>

      {step === 'phone' && (
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🤖</FeatureIcon>
            <FeatureText>AI-Powered Matching</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>💫</FeatureIcon>
            <FeatureText>Smart Compatibility</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureText>Secure & Private</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>💝</FeatureIcon>
            <FeatureText>Meaningful Connections</FeatureText>
          </FeatureCard>
        </FeatureGrid>
      )}
    </Container>
  );
}; 